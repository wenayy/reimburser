package `in`.reimburser.capture

/** Parses Indian bank/UPI debit alerts out of notification text.
 *  Conservative by design: when in doubt, return null — a missed expense is a
 *  minor annoyance, a fake one breaks trust in the "Real spend" badge. */
object TransactionParser {

    data class ParsedTxn(val amount: Double, val rawText: String)

    // "Rs.120", "Rs 1,499.00", "INR 500", "₹349.5"
    private val AMOUNT = Regex(
        """(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)""",
        RegexOption.IGNORE_CASE
    )

    private val DEBIT_WORDS = listOf(
        "debited", "spent", "paid", "sent", "purchase", "payment of", "txn of",
        "dr. from", "dr from", "debit", "successfully paid", "using apay"
    )

    // things that look like money alerts but must never become expenses.
    // NOTE: no "balance is" — real payment SMS often append "Updated Balance
    // is …", and the debit-word requirement already filters pure enquiries.
    private val REJECT_WORDS = listOf(
        "credited to your", "received", "refund", "reversed", "cashback",
        "otp", "one time password", "is due", "due on",
        "requested", "collect request", "has requested", "declined",
        "failed", "insufficient", "offer", "reward", "you won", "loan",
        "emi due", "recharge with"
    )

    fun parse(text: String): ParsedTxn? {
        val t = text.trim()
        if (t.length < 12 || t.length > 500) return null
        val lower = t.lowercase()

        if (REJECT_WORDS.any { lower.contains(it) }) return null
        if (DEBIT_WORDS.none { lower.contains(it) }) return null

        val amountMatch = AMOUNT.find(t) ?: return null
        val amount = amountMatch.groupValues[1].replace(",", "").toDoubleOrNull() ?: return null
        if (amount <= 0 || amount > 5_00_000) return null // sanity ceiling for auto-capture

        // the server's merchant recognizer does the heavy lifting — send it the
        // raw text, trimmed to what it accepts
        return ParsedTxn(amount, t.take(200))
    }
}
