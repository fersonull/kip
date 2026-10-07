package expo.modules.kipautofill

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BlendMode
import android.graphics.drawable.Icon
import android.os.Build
import android.service.autofill.FillRequest
import android.service.autofill.InlinePresentation
import android.view.inputmethod.InlineSuggestionsRequest
import androidx.annotation.RequiresApi
import androidx.autofill.inline.UiVersions
import androidx.autofill.inline.v1.InlineSuggestionUi

/**
 * Keyboard chips (Android 11+). When the keyboard asks for inline suggestions, Kip's offers show up in
 * its suggestion strip instead of a dropdown that steals focus. Other keyboards keep the dropdown.
 */
@RequiresApi(Build.VERSION_CODES.R)
object Inline {
  const val EXTRA = "kip.inlineRequest"

  /** The unlock screen builds the login chips later, so it needs the keyboard's chip specs too. */
  fun pass(request: FillRequest, intent: Intent) {
    request.inlineSuggestionsRequest?.let { intent.putExtra(EXTRA, it) }
  }

  fun chip(ctx: Context, request: FillRequest, title: String, sub: String?) =
    chip(ctx, request.inlineSuggestionsRequest, 0, title, sub)

  @Suppress("DEPRECATION")
  fun chip(ctx: Context, intent: Intent, n: Int, title: String, sub: String?) =
    chip(ctx, intent.getParcelableExtra<InlineSuggestionsRequest>(EXTRA), n, title, sub)

  /** Chip for the n-th suggestion, or null when this keyboard can't show Kip's chips (or has no room left). */
  private fun chip(ctx: Context, req: InlineSuggestionsRequest?, n: Int, title: String, sub: String?): InlinePresentation? {
    if (req == null || n >= req.maxSuggestionCount) return null
    val specs = req.inlinePresentationSpecs
    val spec = specs.getOrNull(n) ?: specs.lastOrNull() ?: return null
    if (!UiVersions.getVersions(spec.style).contains(UiVersions.INLINE_UI_VERSION_1)) return null

    // Shown when the chip is long-pressed: opens Kip.
    val attribution = PendingIntent.getActivity(
      ctx, 0, ctx.packageManager.getLaunchIntentForPackage(ctx.packageName) ?: Intent(), PendingIntent.FLAG_IMMUTABLE,
    )
    val content = InlineSuggestionUi.newContentBuilder(attribution)
      .setTitle(title)
      .apply { sub?.let { setSubtitle(it) } }
      // Keyboards tint chip icons to their theme; DST keeps the pebble's own colors.
      .setStartIcon(Icon.createWithResource(ctx, R.drawable.kip_chip).setTintBlendMode(BlendMode.DST))
      .setContentDescription(listOfNotNull(title, sub).joinToString(", "))
      .build()
    return InlinePresentation(content.slice, spec, false)
  }
}
