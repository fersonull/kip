package expo.modules.kipautofill

import android.app.Activity
import android.app.assist.AssistStructure
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.service.autofill.Dataset
import android.service.autofill.FillResponse
import android.view.WindowManager
import android.view.autofill.AutofillManager
import android.view.autofill.AutofillValue
import android.widget.Toast
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import org.json.JSONArray

/** Shown when "Unlock Kip" is tapped: fingerprint, then hand the matching logins back to Android. */
class AutofillAuthActivity : FragmentActivity() {
  private lateinit var form: Form

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)

    @Suppress("DEPRECATION")
    val structure = intent.getParcelableExtra<AssistStructure>(AutofillManager.EXTRA_ASSIST_STRUCTURE) ?: return cancel()
    form = Form.parse(structure)
    if (!KipStore.hasFillCache(this)) return cancel("Open Kip once so autofill can find your logins.")

    val cipher = try {
      KipStore.unwrapCipher(KipStore.FILL)
    } catch (e: Exception) {
      // New fingerprint enrolled or screen lock removed: Android destroyed the key. The app makes a new one on next unlock.
      runCatching { KipStore.deleteKey(KipStore.FILL) }
      KipStore.clearFillCache(this)
      return cancel("Open Kip once to turn autofill back on.")
    }

    val where = form.domain?.let(Form::host) ?: appLabel()
    val prompt = BiometricPrompt.PromptInfo.Builder()
      .setTitle("Unlock Kip")
      .setSubtitle("Fill your $where login")
      .apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
        else setAllowedAuthenticators(BIOMETRIC_STRONG).setNegativeButtonText("Cancel")
      }
      .build()

    BiometricPrompt(this, ContextCompat.getMainExecutor(this), object : BiometricPrompt.AuthenticationCallback() {
      override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
        val unlocked = result.cryptoObject?.cipher ?: return cancel()
        val json = runCatching { KipStore.readFillCache(this@AutofillAuthActivity, unlocked) }.getOrNull()
          ?: return cancel("Open Kip once so autofill can find your logins.")
        fill(json, where)
      }

      override fun onAuthenticationError(code: Int, msg: CharSequence) = cancel()
    }).authenticate(prompt, BiometricPrompt.CryptoObject(cipher))
  }

  private fun fill(json: String, where: String) {
    val all = JSONArray(json)
    val response = FillResponse.Builder()
    var n = 0
    for (i in 0 until all.length()) {
      val c = all.getJSONObject(i)
      if (!Form.matches(c.optString("url"), form)) continue
      val user = c.optString("username")
      val dataset = Dataset.Builder(KipAutofillService.row(this, c.optString("title"), user.ifEmpty { "••••••••" }))
      @Suppress("DEPRECATION")
      form.user?.let { dataset.setValue(it, AutofillValue.forText(user)) }
      @Suppress("DEPRECATION")
      form.pass?.let { dataset.setValue(it, AutofillValue.forText(c.optString("password"))) }
      response.addDataset(dataset.build())
      if (++n == 20) break
    }
    // ponytail: no match = nothing to fill. A "pick any login" fallback would go here.
    if (n == 0) return cancel("No Kip login for $where yet.")
    KipAutofillService.saveInfo(form)?.let { response.setSaveInfo(it) }
    setResult(Activity.RESULT_OK, Intent().putExtra(AutofillManager.EXTRA_AUTHENTICATION_RESULT, response.build()))
    finish()
  }

  private fun appLabel() = runCatching {
    packageManager.getApplicationLabel(packageManager.getApplicationInfo(form.pkg, 0)).toString()
  }.getOrDefault("this app")

  private fun cancel(message: String? = null) {
    message?.let { Toast.makeText(applicationContext, it, Toast.LENGTH_LONG).show() }
    setResult(Activity.RESULT_CANCELED)
    finish()
  }
}
