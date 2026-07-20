package `in`.reimburser.capture

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/** Posts parsed transactions to the Reimburser capture API using the key from
 *  the "Connect this phone" pairing. Fire-and-forget; the server validates and
 *  dedupes on its side too. */
object Uploader {
    private const val TAG = "ReimburserUploader"
    private const val SERVER = "https://reimburser.in"
    private val executor = Executors.newSingleThreadExecutor()

    fun prefs(ctx: Context) = ctx.getSharedPreferences("capture_prefs", Context.MODE_PRIVATE)

    fun send(ctx: Context, rawText: String, amount: Double) {
        val key = prefs(ctx).getString("deviceKey", "") ?: ""
        if (key.isEmpty()) {
            Log.i(TAG, "not connected — skipping capture")
            return
        }
        executor.execute {
            try {
                val conn = (URL("$SERVER/api/device/expenses").openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 10_000
                    readTimeout = 15_000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Authorization", "Bearer $key")
                }
                val body = JSONObject().put("rawText", rawText).put("amount", amount).toString()
                conn.outputStream.use { it.write(body.toByteArray()) }
                Log.i(TAG, "POST ${conn.responseCode}")
                conn.disconnect()
            } catch (e: Exception) {
                Log.w(TAG, "upload failed", e)
            }
        }
    }
}
