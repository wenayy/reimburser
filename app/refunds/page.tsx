import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Refund & Cancellation Policy — Reimburser" };

export default function Refunds() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="26 July 2026">
      <p>
        This policy covers the two kinds of payment on Reimburser: the paid{" "}
        <strong>Creator Pro subscription</strong> that Reimburser bills, and{" "}
        <strong>voluntary support</strong> that supporters send directly to creators. See our{" "}
        <Link href="/pricing" className="font-medium text-indigo-600 hover:text-indigo-800">
          Pricing page
        </Link>{" "}
        for what each includes.
      </p>

      <h2>1. Creator Pro subscription — refunds</h2>
      <p>
        Creator Pro is billed monthly at ₹149. If you are not satisfied, you may request a refund{" "}
        <strong>within 7 days of a charge</strong> by writing to{" "}
        <a href="mailto:help@reimburser.in" className="font-medium text-indigo-600 hover:text-indigo-800">
          help@reimburser.in
        </a>
        . Approved refunds are returned to your{" "}
        <strong>original payment method within 5–7 business days</strong>. Refunds are not available
        for charges older than 7 days.
      </p>

      <h2>2. Creator Pro subscription — cancellation</h2>
      <p>
        You can cancel Creator Pro at any time from your dashboard settings, or by emailing us.
        When you cancel, your subscription stops renewing and{" "}
        <strong>your Pro access continues until the end of the current billing month</strong> — you
        are not charged again after that. There are no cancellation fees.
      </p>

      <h2>3. Voluntary support sent to creators</h2>
      <p>
        Support that a supporter sends to a creator is a voluntary payment made{" "}
        <strong>directly to the creator&rsquo;s own payment account</strong> (UPI, PayPal, Wise,
        gift card, or bank). Reimburser never collects, holds, or routes this money, so we are
        unable to reverse it. If you paid a creator in error (wrong amount, duplicate, or wrong
        recipient), contact that creator — many will happily return an accidental payment. We can
        help by confirming what the platform recorded; reach us via{" "}
        <Link href="/contact" className="font-medium text-indigo-600 hover:text-indigo-800">
          reimburser.in/contact
        </Link>
        .
      </p>

      <h2>4. Fraudulent claims</h2>
      <p>
        Claims of a payment that was never actually made are rejected by creators during
        verification and may result in the sender being blocked from the platform.
      </p>

      <h2>5. Contact</h2>
      <p>
        For any refund, cancellation, or billing question, email{" "}
        <a href="mailto:help@reimburser.in" className="font-medium text-indigo-600 hover:text-indigo-800">
          help@reimburser.in
        </a>{" "}
        — we respond within 24 hours.
      </p>
    </LegalPage>
  );
}
