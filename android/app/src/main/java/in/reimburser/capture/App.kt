package `in`.reimburser.capture

import android.app.Application
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/** Runs when the app process starts: sets up the notification channel and
 *  schedules the pending-count check (periodic + one immediate run). */
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        Notifications.createChannel(this)

        val wm = WorkManager.getInstance(this)
        val net = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()

        // every 15 minutes (WorkManager minimum) while the app exists
        wm.enqueueUniquePeriodicWork(
            "pending-check",
            ExistingPeriodicWorkPolicy.KEEP,
            PeriodicWorkRequestBuilder<PendingWorker>(15, TimeUnit.MINUTES)
                .setConstraints(net)
                .build()
        )
        // and once right now, so opening the app refreshes the badge
        wm.enqueue(OneTimeWorkRequestBuilder<PendingWorker>().setConstraints(net).build())
    }
}
