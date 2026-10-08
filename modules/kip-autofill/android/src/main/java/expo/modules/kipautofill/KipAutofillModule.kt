package expo.modules.kipautofill

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.AdaptiveIconDrawable
import android.net.Uri
import android.provider.Settings
import android.view.autofill.AutofillManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class KipAutofillModule : Module() {
  private val ctx get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("KipAutofill")

    /** True when Kip is the phone's selected autofill service. */
    Function("isEnabled") {
      ctx.getSystemService(AutofillManager::class.java)?.hasEnabledAutofillServices() == true
    }

    /** JSON array of { title, username, password, url }. Called by the unlocked app after every change. */
    AsyncFunction("writeFillCache") { json: String ->
      KipStore.writeFillCache(ctx, json)
    }

    AsyncFunction("clearFillCache") {
      KipStore.clearFillCache(ctx)
    }

    /** Installed apps with a launcher icon, as { label, pkg }, sorted by name. For linking a login to an app. */
    AsyncFunction("listApps") {
      val pm = ctx.packageManager
      @Suppress("DEPRECATION")
      pm.queryIntentActivities(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0)
        .map { it.activityInfo.packageName to it.loadLabel(pm).toString() }
        .filter { it.first != ctx.packageName }
        .distinctBy { it.first }
        .sortedBy { it.second.lowercase() }
        .map { mapOf("label" to it.second, "pkg" to it.first) }
    }

    /**
     * An installed app's icon as a cached 96px PNG: { uri, full }, or null when it isn't installed.
     * full: an adaptive icon drawn edge to edge without the launcher's mask, for the UI to clip.
     */
    AsyncFunction("appIcon") { pkg: String ->
      runCatching {
        val pm = ctx.packageManager
        val stamp = pm.getPackageInfo(pkg, 0).lastUpdateTime
        val dir = File(ctx.cacheDir, "app-icons").apply { mkdirs() }
        val icon = pm.getApplicationIcon(pkg)
        val full = icon is AdaptiveIconDrawable
        val file = File(dir, "$pkg-$stamp-${if (full) 1 else 0}.png")
        if (!file.exists()) {
          dir.listFiles { f -> f.name.startsWith("$pkg-") }?.forEach { it.delete() }
          val bmp = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888)
          val canvas = Canvas(bmp)
          if (icon is AdaptiveIconDrawable) {
            // Layers are 108dp; launchers show the middle 72. Oversize by half so that middle fills 96px.
            listOfNotNull(icon.background, icon.foreground).forEach { it.setBounds(-24, -24, 120, 120); it.draw(canvas) }
          } else {
            icon.setBounds(0, 0, 96, 96)
            icon.draw(canvas)
          }
          file.outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
        mapOf("uri" to Uri.fromFile(file).toString(), "full" to full)
      }.getOrNull()
    }

    /** Logins Android asked Kip to save, as JSON strings. Empties the queue. */
    AsyncFunction("drainQueue") {
      KipStore.drainQueue(ctx)
    }

    /** Closed-app shake: "Gentle" or "Firm" runs the service, null stops it. */
    Function("setBackgroundShake") { level: String? ->
      KipShakeService.setLevel(ctx, level)
    }

    /** True when Kip may open over other apps, so a closed-app shake skips the notification tap. */
    Function("canOpenOverApps") {
      Settings.canDrawOverlays(ctx)
    }

    OnActivityEntersForeground { KipShakeService.appVisible = true }
    OnActivityEntersBackground { KipShakeService.appVisible = false }
  }
}
