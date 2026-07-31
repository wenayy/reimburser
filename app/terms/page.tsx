import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms & Conditions — Reimburser" };

export default function Terms() {
  return (
    <LegalPage title="Terms & Conditions" updated="26 July 2026">
      <p>
        Welcome to Reimburser (&ldquo;the platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;),
        available at reimburser.in. By creating an account or using this website, you agree to
        these terms.
      </p>
      <p>
        This website is owned and operated by <strong>Vinay Joshi</strong> (sole proprietor),
        trading as <strong>Reimburser</strong>, registered at Geti Gada, Jhulaghat, Pithoragarh,
        Uttarakhand, India. You can reach us at{" "}
        <a href="mailto:help@reimburser.in" className="font-medium text-indigo-600 hover:text-indigo-800">
          help@reimburser.in
        </a>
        .
      </p>

      <h2>1. What Reimburser is</h2>
      <p>
        Reimburser lets content creators publish their day-to-day expenses on a public page, and
        lets supporters voluntarily cover those expenses in part or in full. Payments are made{" "}
        <strong>directly between the supporter and the creator</strong> using the creator&rsquo;s
        own payment details (such as UPI, PayPal, Wise, gift cards, or bank transfer).{" "}
        <strong>
          For this support, Reimburser does not process, collect, hold, or route any payment, and
          charges no fees.
        </strong>{" "}
        The platform displays payment information provided by creators and records
        contribution claims that creators verify themselves.
      </p>

      <h2>2. Creator Pro subscription</h2>
      <p>
        Separately from the direct support above, Reimburser offers an optional paid{" "}
        <strong>Creator Pro</strong> subscription for creators, billed at <strong>₹149 per
        month</strong> through our payment provider. It unlocks additional tools (the Reimburser
        mobile app with automatic expense capture, a customisable page, and priority support).
        Creator Pro is entirely optional — the core platform is free. Billing, refund, and
        cancellation terms are described on our{" "}
        <Link href="/pricing" className="font-medium text-indigo-600 hover:text-indigo-800">
          Pricing
        </Link>{" "}
        and{" "}
        <Link href="/refunds" className="font-medium text-indigo-600 hover:text-indigo-800">
          Refund &amp; Cancellation
        </Link>{" "}
        pages.
      </p>

      <h2>3. Voluntary support — not a purchase</h2>
      <p>
        Contributions are voluntary gestures of support. They are not payment for goods or
        services, do not create any entitlement or obligation on the creator&rsquo;s part, and are
        not investments, loans, or charitable donations. Supporters decide freely whether, whom,
        and how much to support.
      </p>

      <h2>4. Creator accounts and responsibilities</h2>
      <ul>
        <li>You must be at least 18 years old and sign in with a valid Google account.</li>
        <li>
          You are solely responsible for the accuracy of the payment details you publish. Money
          sent to the details you list goes directly to those details — double-check them
          before publishing, as payments cannot be recovered if the details are wrong.
        </li>
        <li>
          You are responsible for the content you publish. The following are prohibited:
          unlawful content or activity, adult or sexually explicit services, gambling, sale of
          regulated goods, content that infringes others&rsquo; rights, and misleading or
          fraudulent expense claims.
        </li>
        <li>
          You are responsible for your own tax obligations on support you receive.
        </li>
      </ul>

      <h2>5. Supporter responsibilities</h2>
      <ul>
        <li>Only mark a contribution as sent if you actually sent the payment.</li>
        <li>
          False payment claims, spam, or attempts to abuse the platform may result in your
          submissions being rejected and your access being blocked.
        </li>
      </ul>

      <h2>6. Verification and moderation</h2>
      <p>
        Creators verify every claimed contribution against their own account before it is counted.
        We may use automated safeguards to limit abuse, and we may suspend or remove accounts or
        content that violate these terms. Creators can reject claims and block senders at their
        discretion.
      </p>

      <h2>7. No warranties; limitation of liability</h2>
      <p>
        The platform is provided &ldquo;as is&rdquo;. Because payments occur directly between
        supporters and creators outside our systems, we are not a party to those transactions and
        are not liable for lost, misdirected, or disputed payments, or for the conduct of any
        creator or supporter. To the maximum extent permitted by law, our aggregate liability for
        any claim relating to the platform is limited to ₹1,000.
      </p>

      <h2>8. Changes and termination</h2>
      <p>
        We may update these terms from time to time; continued use after an update constitutes
        acceptance. You may stop using the platform and request account deletion at any time via
        the contact page.
      </p>

      <h2>9. Governing law</h2>
      <p>These terms are governed by the laws of India.</p>
    </LegalPage>
  );
}
