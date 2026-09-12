import Link from "next/link";
import { areas } from "@rescore/content/scoring";
import { home, PRICE, RATING_PAGES } from "@rescore/content/landing";
import { ReportReader } from "@/components/ReportReader";
import { Attribution } from "@/components/Attribution";

const howTo = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to improve a food hygiene rating and request a re-visit",
  step: home.whatYouGet.map((text, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    text,
  })),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }}
      />

      <h1>{home.headline}</h1>
      <p style={{ maxWidth: "60ch" }}>{home.sub}</p>

      <ReportReader price={PRICE.r01} />

      <h2>What the officer scores</h2>
      <div className="columns columns-3">
        {home.whatTheOfficerScores.map((column) => (
          <div key={column.label}>
            <h3 className="archivo" style={{ fontSize: 17 }}>
              {column.label}
            </h3>
            <p>{column.body}</p>
          </div>
        ))}
      </div>

      <h2>What you get</h2>
      <ol className="steps">
        {home.whatYouGet.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>

      <h2>What this is and isn&apos;t</h2>
      <p style={{ maxWidth: "65ch" }}>{home.whatThisIsAndIsNot}</p>

      <h2>Your rating</h2>
      <p>
        {RATING_PAGES.map((rating, index) => (
          <span key={rating}>
            {index > 0 ? " " : ""}
            <Link href={`/rating/${rating}`}>Rating {rating}</Link>
          </span>
        ))}
      </p>
      <p>
        {areas.map((area, index) => (
          <span key={area.key}>
            {index > 0 ? " " : ""}
            <Link href={`/fix/${area.key === "confidence" ? "confidence-in-management" : area.key}`}>
              {area.shortLabel}
            </Link>
          </span>
        ))}
      </p>

      <h2>Questions</h2>
      <dl className="faq">
        {home.faq.map((entry) => (
          <div key={entry.q}>
            <dt>{entry.q}</dt>
            <dd>{entry.a}</dd>
          </div>
        ))}
      </dl>

      <Attribution />
    </>
  );
}
