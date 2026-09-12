import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { launchCouncils, revisitFacts } from "@rescore/content/councils";
import { councilPage } from "@rescore/content/landing";
import { Attribution } from "@/components/Attribution";

export function generateStaticParams() {
  return launchCouncils.map((council) => ({ slug: council.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = councilPage(slug);
  if (!page) return {};
  return { title: page.title, description: page.description };
}

export default async function CouncilLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = councilPage(slug);
  if (!page) notFound();
  const { council } = page;
  const facts = revisitFacts(council);

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Does ${council.name} charge for a food hygiene re-visit?`,
        acceptedAnswer: { "@type": "Answer", text: facts.fee },
      },
      {
        "@type": "Question",
        name: `How long is the wait for a re-visit in ${council.name}?`,
        acceptedAnswer: { "@type": "Answer", text: facts.wait },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <h1>{page.title}</h1>
      <p className="muted">
        {council.name} publishes ratings for {council.establishmentCount.toLocaleString("en-GB")}{" "}
        establishments.
      </p>

      <h2>The fee</h2>
      <p style={{ maxWidth: "62ch" }}>{facts.fee}</p>

      <h2>The form</h2>
      <p style={{ maxWidth: "62ch" }}>{facts.route}</p>
      {council.url ? (
        <p className="small">
          {council.name}: <a href={council.url}>{council.url}</a>
          {council.email ? ` | ${council.email}` : ""}
        </p>
      ) : null}

      <h2>The wait</h2>
      <p style={{ maxWidth: "62ch" }}>{facts.wait}</p>

      <p className="small">
        {facts.checkWith}
        {facts.sourceUrl ? (
          <>
            {" "}
            Read from <a href={facts.sourceUrl}>this page</a> on {facts.checkedOn}.
          </>
        ) : null}
      </p>

      <h2>Before you request</h2>
      <p style={{ maxWidth: "62ch" }}>
        Ask for the re-visit once the work is done, not before. The officer scores what they find on the day,
        so an early visit can cost you more than the wait. Rescore runs the officer&apos;s own list against
        your evidence first.
      </p>

      <p>
        <Link className="button" href="/">
          Read my report
        </Link>
      </p>

      <Attribution />
    </>
  );
}
