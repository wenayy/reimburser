import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Refund & Cancellation Policy — Reimburser" };

export default function Refunds() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="19 July 2026">
      <h2>1. Nothing is sold on Reimburser</h2>
      <p>
        Reimburser is a platform where supporters make voluntary contributions to content
        creators. Contributions are not purchases of goods or services, and Reimburser charges
        supporters and creators no fees of any kind.
      </p>

      <h2>2. Payments never pass through Reimburser</h2>
      <p>
        Every payment travels directly from the supporter to the creator&rsquo;s own payment
        account (UPI, PayPal, Wise, gift card, crypto, or bank). Reimburser never collects,
        holds, or routes funds — which also means{" "}
        <strong>we are technically unable to reverse or refund a payment</strong>, because the
        money was never in our possession.
      </p>

      <h2>3. Requesting a refund</h2>
      <p>
        Refunds of a voluntary contribution are at the discretion of the creator who received it.
        If you believe you paid in error (wrong amount, duplicate payment, unintended recipient),
        contact the creator; many will happily return an accidental payment. Reimburser can
        assist by confirming what was recorded on the platform — reach us via
        reimburser.in/contact.
      </p>

      <h2>4. Cancellations</h2>
      <p>
        A contribution claim on the platform can effectively be cancelled any time before the
        creator verifies it — simply contact us or the creator, and unverified claims are
        removed. There are no subscriptions or recurring charges on Reimburser.
      </p>

      <h2>5. Fraudulent claims</h2>
      <p>
        Claims of payment that were never actually made are rejected by creators during
        verification and may result in the sender being blocked from the platform.
      </p>
    </LegalPage>
  );
}
