package `in`.reimburser.capture

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/** The "N payments to review" notification — its count also drives the app's
 *  launcher-icon badge on launchers that support it (Samsung, etc.). */
object Notifications {
    private const val CHANNEL = "pending_review"
    private const val NOTIF_ID = 1001

    fun createChannel(ctx: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(
                CHANNEL, "Payments to review", NotificationManager.IMPORTANCE_DEFAULT
            ).apply { description = "Reminds you when supporters are waiting for verification." }
            ctx.getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
        }
    }

    fun showPending(ctx: Context, count: Int) {
        val nm = NotificationManagerCompat.from(ctx)
        if (count <= 0) {
            nm.cancel(NOTIF_ID)
            return
        }
        // tap → open the app on the Support page
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://reimburser.in/dashboard/support"))
            .setPackage(ctx.packageName)
        val pi = PendingIntent.getActivity(
            ctx, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val text = if (count == 1) "1 payment waiting for your review"
        else "$count payments waiting for your review"
        val n = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Reimburser")
            .setContentText(text)
            .setNumber(count) // launcher badge count
            .setContentIntent(pi)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .build()
        try {
            nm.notify(NOTIF_ID, n)
        } catch (_: SecurityException) {
            // POST_NOTIFICATIONS not granted yet — nothing to show
        }
    }
}
