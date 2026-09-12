import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms", description: "What you are buying, and what you are not." };

export default function TermsPage() {
  return (
    <>
      <h1>Terms</h1>
      <p className="small">Last updated 12 September 2026.</p>

      <h2>What you are buying</h2>
      <p style={{ maxWidth: "62ch" }}>
        A pack for one premises: your report read item by item, an action plan, a food safety management
        system built from the facts you confirm, evidence capture, a readiness check, your right to reply,
        your re-visit request and an evidence pack for the delivery platforms. You may re-run any part of it
        free until your outcome is recorded.
      </p>

      <h2>What you are not buying</h2>
      <p style={{ maxWidth: "62ch" }}>
        An inspection, a rating, or any promise about a rating. Rescore is not a consultancy and does not
        speak to your council on your behalf. The documents describe your kitchen only if your kitchen
        matches them, and keeping that true is yours to do.
      </p>

      <h2>Accuracy</h2>
      <p style={{ maxWidth: "62ch" }}>
        Rescore generates documents only from facts you confirm. Where you have not confirmed something, the
        document says so rather than filling it in. Allergen information is only ever built from ingredients
        you confirm dish by dish.
      </p>

      <h2>Refunds</h2>
      <p style={{ maxWidth: "62ch" }}>
        Full refund if you do not have your pack within 24 hours of paying, or if we misread your report
        before your plan was built. Write to desk@rescore.app.
      </p>

      <h2>Hard stops</h2>
      <p style={{ maxWidth: "62ch" }}>
        Where your report records a prohibition, a closure, unsafe food, an active infestation or a failure of
        water, drainage or hand washing, Rescore will tell you what has to happen first and point you to your
        council&apos;s own guidance and to an environmental health consultant. We will not sell you a pack in
        place of that.
      </p>
    </>
  );
}
