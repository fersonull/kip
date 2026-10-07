package expo.modules.kipautofill

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Brings closed-app shake back after a reboot or an app update, if it was on. */
class KipBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED && intent.action != Intent.ACTION_MY_PACKAGE_REPLACED) return
    // A refused start just means no shake until the next app launch re-syncs it.
    runCatching { KipShakeService.start(context) }
  }
}
