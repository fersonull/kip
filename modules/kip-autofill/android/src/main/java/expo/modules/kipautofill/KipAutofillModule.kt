package expo.modules.kipautofill

import android.content.Intent
import android.provider.Settings
import android.view.autofill.AutofillManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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
