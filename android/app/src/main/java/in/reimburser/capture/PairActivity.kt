package `in`.reimburser.capture

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.core.app.NotificationManagerCompat

/** Catches reimburser://pair?key=… from the site's "Connect this phone" page:
 *  stores the capture key, then sends the user to grant notification access if
 *  they haven't already (that's what lets us read bank alerts). */
class PairActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val key = intent?.data?.getQueryParameter("key")?.trim()
        if (key.isNullOrEmpty()) {
            Toast.makeText(this, "Couldn't connect — try again", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        Uploader.prefs(this).edit().putString("deviceKey", key).apply()

        val hasAccess = NotificationManagerCompat.getEnabledListenerPackages(this).contains(packageName)
        if (hasAccess) {
            Toast.makeText(this, "Auto-capture is on ✓", Toast.LENGTH_LONG).show()
        } else {
            Toast.makeText(
                this,
                "Phone connected ✓  Now switch on “Reimburser expense capture”.",
                Toast.LENGTH_LONG
            ).show()
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
        finish()
    }
}
