import type { Metadata } from "next";
import Link from "next/link";
import { PRICE } from "@rescore/content/landing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "One payment per case. No subscription. Free re-runs until your re-visit.",
};

const tiers = [
  { name: "Rating 0 or 1 pack", price: PRICE.r01, note: "The full pack." },
  { name: "Rating 2 pack", price: PRICE.r2, note: "The same pack." },
  { name: "Rating 3 or 4, get to 5", price: PRICE.r34, note: "The same pack, lighter action plan." },
  { name: "Second premises", price: PRICE.premises, note: "Any rating, from an existing case." },
];

const includes = [
  "Your report read, item by item",
  "The action plan with the evidence each item needs",
  "Your food safety management system, written for your kitchen",
  "Evidence capture against every item",
  "The readiness check before you request a re-visit",
  "Your right to reply",
  "The re-visit request for your council",
  "The evidence pack for Deliveroo, Uber Eats and Just Eat",
  "Free re-runs until your outcome is recorded",
];

export default function PricingPage() {
  return (
    <>
      <h1>One payment per case</h1>
      <p style={{ maxWidth: "60ch" }}>
        Reading your report is free. You pay once, when you build the pack, and the price depends on the
        rating you are starting from. There is no subscription.
      </p>

      {tiers.map((tier) => (
        <div className="panel" key={tier.name} style={{ marginBottom: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>
            {tier.name}: GBP {tier.price}
          </h2>
          <p className="small" style={{ margin: 0 }}>
            {tier.note}
          </p>
        </div>
      ))}

      <h2>What every pack includes</h2>
      <ul>
        {includes.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h2>Refunds</h2>
      <p style={{ maxWidth: "60ch" }}>
        Refund in full if you do not have your pack within 24 hours, or if we misread your report before the
        plan was built. <Link href="/terms">Terms</Link>.
      </p>

      <h2>What it does not buy</h2>
      <p style={{ maxWidth: "60ch" }}>
        A rating. Rescore builds the paperwork and the evidence. The cleaning, the repairs and the training
        are yours to do, and the officer scores what they find on the day.
      </p>

      <p>
        <Link className="button" href="/">
          Read my report
        </Link>
      </p>
    </>
  );
}
