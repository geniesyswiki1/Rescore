import type { Metadata } from "next";
import Link from "next/link";
import { revisitRules, rightToReplyRules } from "@rescore/content/scoring";
import { Attribution } from "@/components/Attribution";

export const metadata: Metadata = {
  title: "Help",
  description: "How the re-visit works, what a right to reply is for, and what Rescore does with your report.",
};

export default function HelpPage() {
  return (
    <>
      <h1>Help</h1>

      <h2>How the rating is worked out</h2>
      <p style={{ maxWidth: "62ch" }}>
        The officer scores three areas in points, where lower is better. Hygienic food handling and the
        cleanliness and condition of the facilities are each scored 0, 5, 10, 15, 20 or 25. Management of food
        safety is scored 0, 5, 10, 20 or 30. The total decides the band, and then the highest single score
        pulls the rating down to the band where it fits. That is why one bad area can hold a whole rating
        down.
      </p>

      <h2>Asking for a re-visit</h2>
      <p style={{ maxWidth: "62ch" }}>
        You can ask once the work is done. Each authority decides whether to charge and sets its own fee.
      </p>
      <ul>
        <li>
          Where no fee is charged, the visit cannot happen until {revisitRules.noFee.standstillMonths} months
          have passed since the inspection, and should happen within{" "}
          {revisitRules.noFee.visitWithinMonthsOfStandstillEnd} months after that. That is up to{" "}
          {revisitRules.noFee.maximumWaitMonths} months in all, and you get one re-visit for each planned
          inspection.
        </li>
        <li>
          Where a fee is charged, there is no standstill. The visit should happen within{" "}
          {revisitRules.withFee.visitWithinMonthsOfRequestOrPayment} months of your request or your payment,
          whichever is later, and there is no limit on the number of requests.
        </li>
      </ul>
      <p className="small">{revisitRules.basis}</p>

      <h2>Your right to reply</h2>
      <p style={{ maxWidth: "62ch" }}>{rightToReplyRules.purpose}</p>
      <ul>
        <li>Deadline: {rightToReplyRules.deadline}</li>
        <li>It stays published until: {rightToReplyRules.publishedUntil}</li>
        <li>Your council may edit it before publishing, and should show you the edit.</li>
      </ul>
      <p className="small">{rightToReplyRules.houseLimitReason}</p>

      <h2>What Rescore does with your report</h2>
      <p style={{ maxWidth: "62ch" }}>
        Reading it is free and nothing is stored until you start a case. Once you have a case, your uploads
        and documents are kept for 12 months after your outcome so you can keep using your food safety pack,
        then deleted. You can export everything at any time. <Link href="/privacy">Privacy</Link>.
      </p>

      <h2>What Rescore will not do</h2>
      <ul>
        <li>Promise you a rating.</li>
        <li>Write a fact about your business that you have not confirmed.</li>
        <li>Suggest an allergen, or mark a dish free of one.</li>
        <li>Contact your environmental health officer on your behalf.</li>
      </ul>

      <Attribution />
    </>
  );
}
