import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy — Reimburser" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="19 July 2026">
      <p>
        This policy describes what Reimburser (reimburser.in) collects, why, and what we
        deliberately avoid collecting. The short version: we collect very little, we never see
        payment credentials, and money never passes through us.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Creators:</strong> your Google account email and name (via Google sign-in — we
          never see or store a password), the profile you set up (display name, bio,
          photo/emoji), the expenses you choose to publish, and the payment details you choose to
          display (e.g. a UPI ID or PayPal link).
        </li>
        <li>
          <strong>Supporters:</strong> no account is required. We store the name you type with a
          contribution (any nickname works), the amount, and an optional message. If you attach a
          payment reference or screenshot, it is visible only to the creator you supported and is
          deleted once they resolve the claim.
        </li>
        <li>
          <strong>Anti-abuse signals:</strong> we store a salted, one-way fingerprint derived from
          a submission&rsquo;s network address to recognise repeat senders and enable blocking.
          Raw IP addresses are not stored with contributions.
        </li>
      </ul>

      <h2>2. The Reimburser Android app &amp; notification access</h2>
      <p>
        The optional Reimburser Android app can automatically turn your own payment activity into
        expense drafts. To do this, with your explicit permission, it uses Android&rsquo;s
        notification-access feature to read <strong>bank and payment alerts on your device</strong> —
        including the SMS that banks and payment apps (such as UPI apps) send when you make a payment,
        which are the primary way these alerts are delivered in India.
      </p>
      <ul>
        <li>
          The app acts <strong>only on payment and transaction alerts.</strong> Personal messages,
          chats, and one-time passwords (OTPs) are ignored on your device and are never uploaded or
          stored.
        </li>
        <li>
          Alerts are <strong>parsed on your device.</strong> Only the amount and a short,
          cleaned description of a debit are sent to your Reimburser account — the raw message,
          your other notifications, and your account balances are never transmitted.
        </li>
        <li>
          Every captured item is a <strong>draft you review</strong> before it appears publicly.
        </li>
        <li>
          The feature is entirely optional and off until you enable it, and you can revoke
          notification access at any time in your phone&rsquo;s settings, or by uninstalling the app.
        </li>
      </ul>

      <h2>3. What we never collect</h2>
      <p>
        Bank passwords, card numbers, CVVs, OTPs, or wallet private keys — never. Payments happen
        in your own payment app, directly with the creator; payment credentials never touch our
        systems.
      </p>

      <h2>4. How information is used</h2>
      <p>
        To operate the platform: showing creator pages, recording and verifying contribution
        claims, preventing spam and abuse, and contacting you about your account. We do not sell
        personal data, run advertising, or share data with third parties except the service
        providers below.
      </p>

      <h2>5. Service providers</h2>
      <p>
        We use Vercel (hosting), Neon (database), Google (sign-in), and Vercel Blob (image
        storage). Each processes data only as needed to run the platform.
      </p>

      <h2>6. Public information</h2>
      <p>
        A creator&rsquo;s public page shows what they chose to publish: display name, bio,
        published expenses, enabled payment options, and verified supporter names/amounts.
        Unpublished drafts and hidden expenses are visible only to the creator.
      </p>

      <h2>7. Retention and deletion</h2>
      <ul>
        <li>Payment screenshots are deleted automatically once a claim is verified or rejected.</li>
        <li>Rejected contribution records are purged automatically after a short period.</li>
        <li>
          Creators can delete expenses and payment methods anytime, and can request full account
          deletion via the contact page — we honour such requests within 30 days.
        </li>
      </ul>

      <h2>8. Contact</h2>
      <p>
        Privacy questions or deletion requests: see the contact page at reimburser.in/contact.
      </p>
    </LegalPage>
  );
}
