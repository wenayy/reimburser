import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Pricing — Reimburser" };

export default function Pricing() {
  return (
    <LegalPage title="Pricing" updated="26 July 2026">
      <p>
        Reimburser is a software platform for content creators. Creators publish their day-to-day
        expenses on a public page and receive support directly from their audience. The core
        platform is free; a paid <strong>Creator Pro</strong> plan unlocks extra tools. All prices
        are in Indian Rupees (INR) and are inclusive of applicable taxes.
      </p>

      <h2>Free — ₹0</h2>
      <ul>
        <li>A public page to share your daily expenses</li>
        <li>Receive support directly from supporters (UPI, PayPal, Wise, gift cards, bank)</li>
        <li>Add and manage expenses manually</li>
        <li>Supporter leaderboard and basic profile</li>
      </ul>

      <h2>Creator Pro — ₹149 / month</h2>
      <p>
        A monthly subscription for creators who want to automate and personalise their page.
        Billed monthly in INR through our payment provider.
      </p>
      <ul>
        <li>The Reimburser Android app with automatic expense capture</li>
        <li>A customisable profile page (custom avatar, layout, and links)</li>
        <li>Priority support</li>
        <li>Early access to new features</li>
      </ul>
      <p>
        Creator Pro is billed <strong>monthly at ₹149</strong>. You can cancel anytime from your
        dashboard settings — see our{" "}
        <Link href="/refunds" className="font-medium text-indigo-600 hover:text-indigo-800">
          Refund &amp; Cancellation Policy
        </Link>{" "}
        for refund and cancellation details.
      </p>

      <h2>Note on supporter payments</h2>
      <p>
        Support that a supporter sends to a creator is a separate, voluntary payment made{" "}
        <strong>directly to that creator</strong> — it is not a purchase, and Reimburser charges no
        fee on it. Only the optional Creator Pro subscription above is billed by Reimburser.
      </p>
    </LegalPage>
  );
}
