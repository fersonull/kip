package expo.modules.kipautofill

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

/**
 * Quick Settings tile: the closed-app version of shake to add. Opens kip://add, and the app
 * unlocks first if it has to. Lives in this module because it's the app's only other native piece.
 */
class KipTileService : TileService() {
  override fun onStartListening() {
    qsTile?.apply {
      state = Tile.STATE_ACTIVE
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) subtitle = getString(R.string.kip_tile_subtitle)
      updateTile()
    }
  }

  override fun onClick() {
    // On the lock screen, Android asks for the screen lock before opening the app.
    if (isLocked) unlockAndRun { openAdd() } else openAdd()
  }

  @SuppressLint("StartActivityAndCollapseDeprecated")
  private fun openAdd() {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("kip://add?source=tile"))
      .setPackage(packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startActivityAndCollapse(PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT))
    } else {
      @Suppress("DEPRECATION")
      startActivityAndCollapse(intent)
    }
  }
}
