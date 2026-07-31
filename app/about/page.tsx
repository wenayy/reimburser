import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "About Us — Reimburser" };

export default function About() {
  return (
    <LegalPage title="About Us" updated="20 July 2026">
      <p>
        Reimburser (reimburser.in) is a technology platform for independent content creators.
        Our software gives each creator a clean public page to share the everyday costs behind
        their work, and a simple way for their audience to contribute toward those costs.
      </p>

      <h2>What we do</h2>
      <p>
        We build software. Reimburser provides creators with a hosted page, tools to add and
        manage their expenses, an automatic expense-capture app for Android, and a straightforward
        interface for their supporters. We are a software product — nothing more, nothing less.
      </p>

      <h2>How payments work</h2>
      <p>
        Payments are made <strong>directly between a supporter and a creator</strong>, using the
        creator&rsquo;s own payment details (such as UPI, PayPal, Wise, gift cards, or bank
        transfer). Reimburser is <strong>not a payment gateway, wallet, marketplace, or financial
        institution.</strong> We do not collect, hold, process, or route any funds — money moves
        directly to the creator&rsquo;s account, and the platform never touches it. We charge
        creators and supporters no fees.
      </p>

      <h2>Our mission</h2>
      <p>
        Creators spend real money to make the things people enjoy — coffee during a late edit, a
        subscription for their tools, the commute to a shoot. Reimburser makes those costs visible
        and lets a creator&rsquo;s audience back them transparently, with the money going straight
        to the creator. Simple, honest, and fee-free.
      </p>

      <h2>Who we are</h2>
      <p>
        Reimburser is built and operated by <strong>Vinay Joshi</strong> (sole proprietor), based
        in India. It started as an independent software project and is run with a focus on
        transparency, privacy, and putting creators in full control of their own pages and
        payments.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, partnerships, or support: email us at{" "}
        <a
          href="mailto:help@reimburser.in"
          className="font-medium text-indigo-600 hover:text-indigo-800"
        >
          help@reimburser.in
        </a>{" "}
        or use the contact page at reimburser.in/contact. We reply to everything, usually within
        a day.
      </p>
    </LegalPage>
  );
}
