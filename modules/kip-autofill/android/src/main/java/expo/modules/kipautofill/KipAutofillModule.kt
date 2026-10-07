package expo.modules.kipautofill

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

    /** Logins Android asked Kip to save, as JSON strings. Empties the queue. */
    AsyncFunction("drainQueue") {
      KipStore.drainQueue(ctx)
    }
  }
}
