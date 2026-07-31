package `in`.reimburser.capture

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/** Polls the server for the creator's pending-verification count and updates
 *  the "N to review" notification / icon badge. Runs periodically (WorkManager)
 *  and once each time the app launches. */
class PendingWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {
    override fun doWork(): Result {
        val key = applicationContext
            .getSharedPreferences("capture_prefs", Context.MODE_PRIVATE)
            .getString("deviceKey", "") ?: ""
        if (key.isEmpty()) return Result.success() // not connected yet

        return try {
            val conn = (URL("https://reimburser.in/api/device/pending").openConnection() as HttpURLConnection).apply {
                setRequestProperty("Authorization", "Bearer $key")
                connectTimeout = 10_000
                readTimeout = 15_000
            }
            if (conn.responseCode in 200..299) {
                val body = conn.inputStream.bufferedReader().readText()
                val count = JSONObject(body).optInt("pending", 0)
                Notifications.showPending(applicationContext, count)
            }
            conn.disconnect()
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}
