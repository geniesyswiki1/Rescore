import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Rating } from "@rescore/content/scoring";
import { RATING_PAGES, ratingPage } from "@rescore/content/landing";
import { Attribution } from "@/components/Attribution";

export function generateStaticParams() {
  return RATING_PAGES.map((rating) => ({ rating: String(rating) }));
}

function parse(value: string): Rating | null {
  const rating = Number.parseInt(value, 10);
  return RATING_PAGES.includes(rating as Rating) ? (rating as Rating) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rating: string }>;
}): Promise<Metadata> {
  const { rating } = await params;
  const value = parse(rating);
  if (!value && value !== 0) return {};
  const page = ratingPage(value);
  return { title: page.title, description: page.description };
}

export default async function RatingLandingPage({ params }: { params: Promise<{ rating: string }> }) {
  const { rating } = await params;
  const value = parse(rating);
  if (value === null) notFound();
  const page = ratingPage(value);

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What does a food hygiene rating of ${value} mean?`,
        acceptedAnswer: { "@type": "Answer", text: page.meansBody },
      },
      {
        "@type": "Question",
        name: `How do I improve a rating of ${value}?`,
        acceptedAnswer: { "@type": "Answer", text: page.movesBody },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <h1>{page.title}</h1>
      <p className="muted">{page.descriptor}</p>
      <p style={{ maxWidth: "62ch" }}>{page.meansBody}</p>

      <h2>What moves it</h2>
      <p style={{ maxWidth: "62ch" }}>{page.movesBody}</p>

      <h2>The items behind a rating like this</h2>
      <ul>
        {page.commonItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="small">
        These are the items officers record most often. Your own report is the only list that matters, which
        is why Rescore starts by reading it.
      </p>

      <h2>Getting a re-visit</h2>
      <p style={{ maxWidth: "62ch" }}>
        You can ask your council to come back once the work is done. Where no fee is charged there is a 3
        month standstill from the inspection and then up to 3 months more. Where a fee is charged there is no
        standstill and the visit should happen within 3 months of your request or your payment. Your council
        sets the fee and the form. <Link href="/help">How the re-visit works</Link>.
      </p>

      <p>
        <Link className="button" href="/">
          Read my report
        </Link>{" "}
        <span className="small">Free. You pay GBP {page.price} only when you build the pack.</span>
      </p>

      <Attribution />
    </>
  );
}
