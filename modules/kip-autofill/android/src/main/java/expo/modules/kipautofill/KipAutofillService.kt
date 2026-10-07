package expo.modules.kipautofill

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.CancellationSignal
import android.service.autofill.AutofillService
import android.service.autofill.FillCallback
import android.service.autofill.FillRequest
import android.service.autofill.FillResponse
import android.service.autofill.SaveCallback
import android.service.autofill.SaveInfo
import android.service.autofill.SaveRequest
import android.widget.RemoteViews
import org.json.JSONObject

/**
 * Runs without the JS runtime. Fill never touches logins here: it only offers "Unlock Kip",
 * and AutofillAuthActivity does the unlocking and matching. Save seals what was typed into the queue.
 */
class KipAutofillService : AutofillService() {
  override fun onFillRequest(request: FillRequest, cancel: CancellationSignal, callback: FillCallback) {
    val form = Form.parse(request.fillContexts.last().structure)
    if (form.pkg == packageName || form.ids.isEmpty()) return callback.onSuccess(null)

    val auth = PendingIntent.getActivity(
      this,
      requestCode++,
      Intent(this, AutofillAuthActivity::class.java),
      // Android adds the screen structure to this intent, so it must stay mutable.
      PendingIntent.FLAG_CANCEL_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0),
    ).intentSender

    val response = FillResponse.Builder()
      .setAuthentication(form.ids, auth, row(this, "Unlock Kip", "to fill this login"))
    saveInfo(form)?.let { response.setSaveInfo(it) }
    callback.onSuccess(response.build())
  }

  override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
    // Multi-step logins spread fields across screens, so take the newest value of each.
    val forms = request.fillContexts.map { Form.parse(it.structure) }.reversed()
    val password = forms.firstNotNullOfOrNull { it.passValue?.takeIf(String::isNotEmpty) } ?: return callback.onSuccess()
    val username = forms.firstNotNullOfOrNull { it.userValue?.takeIf(String::isNotEmpty) } ?: ""
    val form = forms.first()
    val site = form.domain?.let(Form::host)
    val title = site ?: appLabel(form.pkg)

    runCatching {
      KipStore.enqueue(this, JSONObject()
        .put("title", title)
        .put("username", username)
        .put("password", password)
        .put("source", site ?: "$title app")
        .put("createdAt", System.currentTimeMillis())
        .toString())
    }.onFailure { return callback.onFailure("Kip couldn't save this login.") }
    callback.onSuccess()
  }

  private fun appLabel(pkg: String) = runCatching {
    packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
  }.getOrDefault(pkg)

  companion object {
    private var requestCode = 1

    fun saveInfo(form: Form): SaveInfo? {
      val pass = form.pass ?: return null
      val type = SaveInfo.SAVE_DATA_TYPE_PASSWORD or (if (form.user != null) SaveInfo.SAVE_DATA_TYPE_USERNAME else 0)
      return SaveInfo.Builder(type, arrayOf(pass))
        .apply { form.user?.let { setOptionalIds(arrayOf(it)) } }
        .build()
    }

    fun row(ctx: Context, title: String, sub: String) = RemoteViews(ctx.packageName, R.layout.kip_autofill_item).apply {
      setTextViewText(R.id.kip_autofill_title, title)
      setTextViewText(R.id.kip_autofill_sub, sub)
      setImageViewResource(R.id.kip_autofill_icon, ctx.applicationInfo.icon)
    }
  }
}
