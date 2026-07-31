package `in`.reimburser.capture

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationManagerCompat

/** Catches reimburser://pair?key=… from the site's "Connect this phone" page.
 *  Stores the capture key, then shows a PROMINENT DISCLOSURE (required by
 *  Google Play before accessing notifications) explaining exactly what is read
 *  and why, before sending the user to grant access. */
class PairActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val key = intent?.data?.getQueryParameter("key")?.trim()
        if (key.isNullOrEmpty()) {
            Toast.makeText(this, "Couldn't connect — try again", Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        Uploader.prefs(this).edit().putString("deviceKey", key).apply()
        showDisclosure()
    }

    private fun showDisclosure() {
        AlertDialog.Builder(this)
            .setTitle("Turn on automatic expense capture")
            .setMessage(
                "To add your expenses automatically, Reimburser reads bank and payment " +
                    "alerts on this device — including the SMS your bank and payment apps send " +
                    "when you spend.\n\n" +
                    "•  It looks only for payment and transaction alerts. Personal messages, " +
                    "chats and OTPs are ignored on your phone and never sent anywhere.\n\n" +
                    "•  Alerts are read and processed on your phone. Only the amount and a short " +
                    "description of a payment are sent to your Reimburser page.\n\n" +
                    "•  Every captured expense is a draft you review before it appears publicly, " +
                    "and you can turn this off anytime in your phone's settings.\n\n" +
                    "Continue to grant notification access?"
            )
            .setPositiveButton("Turn on") { _, _ -> requestPermissionsAndOpen() }
            .setNegativeButton("Not now") { _, _ -> finish() }
            .setCancelable(false)
            .show()
    }

    private fun requestPermissionsAndOpen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
            return
        }
        openListenerSettingsAndFinish()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        openListenerSettingsAndFinish()
    }

    private fun openListenerSettingsAndFinish() {
        val hasListener = NotificationManagerCompat.getEnabledListenerPackages(this).contains(packageName)
        if (!hasListener) {
            Toast.makeText(this, "Now switch on “Reimburser expense capture”.", Toast.LENGTH_LONG).show()
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
        finish()
    }
}
