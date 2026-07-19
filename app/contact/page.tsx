import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Contact — Reimburser" };

export default function Contact() {
  return (
    <LegalPage title="Contact Us" updated="19 July 2026">
      <p>
        Reimburser is operated by Vinay Joshi (sole proprietor), India. We read and answer
        everything — most messages get a reply within 24 hours.
      </p>

      <h2>Support &amp; feedback</h2>
      <p>
        The fastest route is the in-app form on our{" "}
        <Link href="/help" className="font-medium text-indigo-600 hover:text-indigo-800">
          Help &amp; support page
        </Link>{" "}
        — questions, bug reports, and feedback all land directly with us.
      </p>

      <h2>Email</h2>
      <p>
        <a
          href="mailto:vinaycjoshi310@gmail.com"
          className="font-medium text-indigo-600 hover:text-indigo-800"
        >
          vinaycjoshi310@gmail.com
        </a>{" "}
        — for support, privacy or account-deletion requests, partnership enquiries, and anything
        else.
      </p>

      <h2>For creators</h2>
      <p>
        Early creators get personal onboarding help — email us or use the help form and
        we&rsquo;ll usually respond the same day.
      </p>
    </LegalPage>
  );
}
