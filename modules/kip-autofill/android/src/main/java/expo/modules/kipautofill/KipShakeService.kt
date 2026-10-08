package expo.modules.kipautofill

import android.app.KeyguardManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.SystemClock
import android.provider.Settings
import androidx.core.content.ContextCompat
import kotlin.math.sqrt

/**
 * Shake to add while Kip is closed. Opt-in foreground service that listens to the accelerometer
 * only while the phone is unlocked (USER_PRESENT on, SCREEN_OFF off), so a pocket can't trigger it.
 *
 * Android 10+ won't let a service open an activity on its own. With "Display over other apps"
 * granted it opens Add directly; otherwise a shake posts a heads-up "Add a login" to tap.
 */
class KipShakeService : Service(), SensorEventListener {
  companion object {
    private const val PREFS = "kip_shake"
    private const val LEVEL = "level"
    private const val CH_ON = "kip_shake_on"
    private const val CH_SHOOK = "kip_shake_shook"
    private const val ONGOING = 1
    private const val SHOOK = 2

    /** Set by the module while Kip is on screen, where the in-app shake hook already listens. */
    @Volatile var appVisible = false

    /** "Gentle" or "Firm" turns the service on; null turns it off. Saved so it survives reboots. */
    fun setLevel(ctx: Context, level: String?) {
      ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().apply {
        if (level == null) remove(LEVEL) else putString(LEVEL, level)
      }.apply()
      start(ctx)
    }

    /** Runs the service if a level is saved, stops it otherwise. */
    fun start(ctx: Context) {
      val intent = Intent(ctx, KipShakeService::class.java)
      if (level(ctx) == null) ctx.stopService(intent) else ctx.startForegroundService(intent)
    }

    private fun level(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(LEVEL, null)
  }

  private val sensors by lazy { getSystemService(SensorManager::class.java) }
  private val notes by lazy { getSystemService(NotificationManager::class.java) }
  // Same thresholds as src/lib/use-shake.ts, in g.
  private var g = 1.8f
  private var listening = false
  // Shake detection mirrors src/lib/shake.ts (tuning knobs and their reasons live there): 3 separate
  // peaks within 1 s, readings < 100 ms apart are one peak, 1.5 s cooldown, sampled every 20 ms.
  private var above = false
  private val peaks = ArrayDeque<Long>()
  private var last = Long.MIN_VALUE / 2

  private val screen = object : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) = listen(i.action == Intent.ACTION_USER_PRESENT)
  }

  override fun onBind(intent: Intent?) = null

  override fun onCreate() {
    super.onCreate()
    notes.createNotificationChannel(NotificationChannel(CH_ON, getString(R.string.kip_shake_channel_on), NotificationManager.IMPORTANCE_LOW))
    notes.createNotificationChannel(NotificationChannel(CH_SHOOK, getString(R.string.kip_shake_channel_shook), NotificationManager.IMPORTANCE_HIGH))
    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_OFF)
      addAction(Intent.ACTION_USER_PRESENT)
    }
    // Exported: some phones (ColorOS) send USER_PRESENT from SystemUI, not the system uid, and a
    // not-exported receiver silently drops it. Both are protected broadcasts, so no app can fake them.
    ContextCompat.registerReceiver(this, screen, filter, ContextCompat.RECEIVER_EXPORTED)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val level = level(this) ?: run {
      stopSelf()
      return START_NOT_STICKY
    }
    g = if (level == "Firm") 2.6f else 1.8f

    // The ongoing notification Android requires doubles as an "Add login" button.
    val n = Notification.Builder(this, CH_ON)
      .setSmallIcon(R.drawable.kip_tile)
      .setContentTitle(getString(R.string.kip_shake_on))
      .setContentText(getString(R.string.kip_shake_on_sub))
      .setContentIntent(addPending())
      .setOngoing(true)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(ONGOING, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(ONGOING, n)
    }

    listen(unlocked())
    return START_STICKY
  }

  override fun onDestroy() {
    listen(false)
    unregisterReceiver(screen)
    super.onDestroy()
  }

  private fun unlocked() = getSystemService(PowerManager::class.java).isInteractive &&
    !getSystemService(KeyguardManager::class.java).isKeyguardLocked

  private fun listen(on: Boolean) {
    if (on == listening) return
    listening = on
    above = false
    peaks.clear()
    if (on) sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.let { sensors.registerListener(this, it, 20_000) }
    else sensors.unregisterListener(this)
  }

  override fun onSensorChanged(e: SensorEvent) {
    // Some phones (ColorOS) freeze Kip's process despite the foreground service, then deliver the
    // readings in a burst on thaw. Old readings are a shake that already happened: never act on them.
    if (SystemClock.elapsedRealtimeNanos() - e.timestamp > 300_000_000) return
    val (x, y, z) = e.values
    val over = sqrt(x * x + y * y + z * z) / SensorManager.GRAVITY_EARTH >= g
    val rising = over && !above
    above = over
    if (!rising || appVisible) return
    val now = SystemClock.elapsedRealtime()
    if (now - last < 1500) return
    while (peaks.isNotEmpty() && now - peaks.first() >= 1000) peaks.removeFirst()
    if (peaks.isNotEmpty() && now - peaks.last() < 100) return
    peaks.addLast(now)
    if (peaks.size < 3) return
    peaks.clear()
    // SCREEN_OFF can land a second or more after the power button: don't open Add behind the lock screen.
    if (!unlocked()) return listen(false)
    last = now
    if (Settings.canDrawOverlays(this)) startActivity(addLink()) else notifyShook()
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

  private fun addLink() = Intent(Intent.ACTION_VIEW, Uri.parse("kip://add?source=shake"))
    .setPackage(packageName)
    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

  private fun addPending() =
    PendingIntent.getActivity(this, 0, addLink(), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)

  private fun notifyShook() = notes.notify(
    SHOOK,
    Notification.Builder(this, CH_SHOOK)
      .setSmallIcon(R.drawable.kip_tile)
      .setContentTitle(getString(R.string.kip_shake_shook))
      .setContentText(getString(R.string.kip_shake_shook_sub))
      .setContentIntent(addPending())
      .setCategory(Notification.CATEGORY_REMINDER)
      .setAutoCancel(true)
      .setTimeoutAfter(10_000)
      .build(),
  )
}
