package expo.modules.kipautofill

import android.app.assist.AssistStructure
import android.app.assist.AssistStructure.ViewNode
import android.text.InputType
import android.view.View
import android.view.autofill.AutofillId

/** The login fields on a screen, plus where the screen came from. */
data class Form(
  val user: AutofillId?,
  val pass: AutofillId?,
  val userValue: String?,
  val passValue: String?,
  /** Website for browser pages, when the browser reports it. */
  val domain: String?,
  /** App package that owns the screen (the browser, for web pages). */
  val pkg: String,
  /** Sign-up or change-password form: nothing to fill, only something to save. */
  val signup: Boolean,
) {
  val ids get() = listOfNotNull(user, pass).toTypedArray()

  companion object {
    fun parse(structure: AssistStructure): Form {
      var user: ViewNode? = null
      var pass: ViewNode? = null
      var lastText: ViewNode? = null
      var domain: String? = null
      var passwords = 0
      var newPassword = false

      fun visit(n: ViewNode) {
        n.webDomain?.takeIf { it.isNotBlank() }?.let { domain = it }
        if (n.autofillId != null && n.autofillType == View.AUTOFILL_TYPE_TEXT) {
          when {
            isPassword(n) -> {
              passwords++
              newPassword = newPassword || isNewPassword(n)
              if (pass == null) {
                pass = n
                if (user == null) user = lastText // The text field just before the password is the username.
              }
            }
            isUsername(n) -> if (user == null) user = n
            pass == null -> lastText = n
          }
        }
        for (i in 0 until n.childCount) visit(n.getChildAt(i))
      }
      for (i in 0 until structure.windowNodeCount) visit(structure.getWindowNodeAt(i).rootViewNode)

      return Form(
        user = user?.autofillId,
        pass = pass?.autofillId,
        userValue = user?.autofillValue?.takeIf { it.isText }?.textValue?.toString(),
        passValue = pass?.autofillValue?.takeIf { it.isText }?.textValue?.toString(),
        domain = domain,
        pkg = structure.activityComponent.packageName,
        // A "new password" hint, or password + confirm-password fields.
        signup = newPassword || passwords >= 2,
      )
    }

    private fun hints(n: ViewNode) = n.autofillHints.orEmpty().map { it.lowercase() }
    private fun html(n: ViewNode) = n.htmlInfo?.attributes.orEmpty().associate { it.first.lowercase() to it.second.lowercase() }

    private fun isPassword(n: ViewNode): Boolean {
      if (hints(n).any { "password" in it }) return true
      if (html(n)["type"] == "password") return true
      val cls = n.inputType and InputType.TYPE_MASK_CLASS
      val v = n.inputType and InputType.TYPE_MASK_VARIATION
      return (cls == InputType.TYPE_CLASS_TEXT &&
        (v == InputType.TYPE_TEXT_VARIATION_PASSWORD || v == InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD || v == InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD)) ||
        (cls == InputType.TYPE_CLASS_NUMBER && v == InputType.TYPE_NUMBER_VARIATION_PASSWORD)
    }

    private fun isNewPassword(n: ViewNode) =
      hints(n).any { it == "newpassword" || it == "new-password" } || html(n)["autocomplete"]?.contains("new-password") == true

    private fun isUsername(n: ViewNode): Boolean {
      if (hints(n).any { it == "username" || "email" in it }) return true
      val a = html(n)
      if (a["autocomplete"]?.let { "username" in it || "email" in it } == true || a["type"] == "email") return true
      val v = n.inputType and InputType.TYPE_MASK_VARIATION
      return v == InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS || v == InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS
    }

    /** "https://www.Ember.app/login" -> "ember.app" */
    fun host(s: String) = s.trim().lowercase()
      .substringAfter("://").substringBefore('/').substringBefore(':').removePrefix("www.")

    /** Does a saved login (its url field: a site or an app package) belong on this form? */
    fun matches(savedUrl: String, form: Form): Boolean {
      val saved = host(savedUrl)
      if (saved.isEmpty()) return false
      form.domain?.let {
        val d = host(it)
        return d == saved || d.endsWith(".$saved") || saved.endsWith(".$d")
      }
      val pkg = form.pkg.lowercase()
      if (saved == pkg) return true
      // ponytail: app <-> site by a shared name ("emberbank.app" ~ com.emberbank.android).
      // Digital Asset Links verification is the proper upgrade.
      val name = saved.substringBeforeLast('.').substringAfterLast('.')
      return name.length >= 4 && name in pkg.split('.')
    }
  }
}
