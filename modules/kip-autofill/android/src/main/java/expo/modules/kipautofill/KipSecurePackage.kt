package expo.modules.kipautofill

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.WindowManager
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/**
 * FLAG_SECURE on every Kip activity as it's created: no screenshots, blank in recents.
 * Native so it can't be skipped: with the shake service keeping the process up, the JS runtime outlives the
 * activity, and a JS-side "already prevented" flag would leave a reopened activity unprotected.
 */
class KipSecurePackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context) = listOf(
    object : ReactActivityLifecycleListener {
      override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
        activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
      }
    },
  )
}
