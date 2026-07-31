package `in`.reimburser.capture

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/** Watches incoming notifications for bank/UPI debit alerts and forwards
 *  parsed transactions to the Reimburser capture API. Everything is parsed
 *  on-device; only { rawText, amount } of recognized debits ever leaves. */
class BankAlertListener : NotificationListenerService() {

    private val TAG = "ReimburserListener"

    // Sources of transaction alerts. In India most banks and payment apps
    // (slice, Amazon Pay, etc.) alert via SMS, so the default messaging apps are
    // the primary channel; UPI/bank apps that push their own notifications are
    // also watched. Non-transaction notifications are discarded on-device by
    // TransactionParser and never leave the phone.
    private val WATCHED_PREFIXES = listOf(
        "com.google.android.apps.messaging", // Google Messages (SMS)
        "com.samsung.android.messaging",     // Samsung Messages (SMS)
        "com.google.android.apps.nbu.paisa", // Google Pay
        "com.phonepe.app",
        "net.one97.paytm",                   // Paytm
        "in.org.npci.upiapp",                // BHIM
        "com.dreamplug.androidapp",          // CRED
        "com.mobikwik_new",                  // MobiKwik
        "in.amazon.mShop.android.shopping",  // Amazon Pay (inside Amazon app)
        "com.sbi.", "com.icicibank.", "com.hdfc", "com.axis.", "com.kotak",
        "com.csam.icici", "com.msf.kbank", "com.bankofbaroda", "com.canarabank",
    )

    // small in-memory dedupe: identical alert text within a short window is
    // the same transaction resurfacing (grouped/updated notifications)
    private val recent = ArrayDeque<Pair<String, Long>>()

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val pkg = sbn.packageName ?: return
        if (WATCHED_PREFIXES.none { pkg.startsWith(it) }) return

        val extras = sbn.notification?.extras ?: return
        val title = extras.getCharSequence("android.title")?.toString() ?: ""
        val text = extras.getCharSequence("android.text")?.toString()
            ?: extras.getCharSequence("android.bigText")?.toString() ?: ""
        val combined = listOf(title, text).filter { it.isNotBlank() }.joinToString(" — ")
        if (combined.isBlank()) return

        val parsed = TransactionParser.parse(combined) ?: return

        val now = System.currentTimeMillis()
        synchronized(recent) {
            recent.removeAll { now - it.second > 10 * 60_000 }
            if (recent.any { it.first == parsed.rawText }) {
                Log.i(TAG, "duplicate alert skipped")
                return
            }
            recent.addLast(parsed.rawText to now)
            while (recent.size > 50) recent.removeFirst()
        }

        Log.i(TAG, "captured from $pkg: ₹${parsed.amount}")
        Uploader.send(applicationContext, parsed.rawText, parsed.amount)
    }
}
