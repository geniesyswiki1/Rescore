import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", description: "What Rescore holds, for how long, and why." };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy</h1>
      <p className="small">Last updated 12 September 2026.</p>

      <h2>Reading a report</h2>
      <p style={{ maxWidth: "62ch" }}>
        When you paste or upload a report to read it for free, the text is sent to our reader and the result
        is returned to your browser. Nothing is stored until you start a case.
      </p>

      <h2>When you start a case</h2>
      <p style={{ maxWidth: "62ch" }}>
        We hold the report and letter you upload, the answers you confirm for your food safety management
        system, the evidence you upload, the documents we generate, your email address for the case link, and
        the outcome you record. Files are held in private storage in the United Kingdom.
      </p>

      <h2>How long</h2>
      <p style={{ maxWidth: "62ch" }}>
        Uploads and documents are deleted 12 months after your outcome is recorded. That is longer than you
        might expect, because your food safety pack is a live document you keep using. You can export
        everything at any time, and you can ask us to delete your case sooner.
      </p>

      <h2>Who else sees it</h2>
      <p style={{ maxWidth: "62ch" }}>
        Our model provider processes the text and images to produce your plan and documents. Our payment
        provider handles your payment; we never see your card details. We do not sell anything to anyone and
        we do not use your case to advertise.
      </p>

      <h2>Your rights</h2>
      <p style={{ maxWidth: "62ch" }}>
        You can ask for a copy of what we hold, ask us to correct it, or ask us to delete it. Write to
        desk@rescore.app.
      </p>
    </>
  );
}
