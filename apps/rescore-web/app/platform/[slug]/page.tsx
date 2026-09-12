import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { platformClaim, platformDisclaimer, platforms } from "@rescore/content/platforms";
import { platformPage } from "@rescore/content/landing";
import { Attribution } from "@/components/Attribution";

export function generateStaticParams() {
  return platforms.map((platform) => ({ slug: platform.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const platform = platforms.find((p) => p.slug === slug);
  if (!platform) return {};
  const page = platformPage(slug);
  return { title: page.title, description: page.description };
}

export default async function PlatformLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!platforms.some((p) => p.slug === slug)) notFound();
  const { platform, title } = platformPage(slug);

  return (
    <>
      <h1>{title}</h1>

      <h2>What their policy says</h2>
      <p style={{ maxWidth: "62ch" }}>{platformClaim(platform)}</p>
      <p style={{ maxWidth: "62ch" }}>{platform.statedPosition}</p>
      {platform.sourceUrl ? (
        <p className="small">
          Source: <a href={platform.sourceUrl}>{platform.policyName ?? platform.name}</a>, read on{" "}
          {platform.checkedOn}.
        </p>
      ) : (
        <p className="small">
          We could not read a first-party policy page on {platform.checkedOn}. We will not repeat a figure we
          cannot source.
        </p>
      )}

      <h2>If your rating is below their minimum</h2>
      <p style={{ maxWidth: "62ch" }}>{platform.belowMinimum}</p>

      <h2>What to send them</h2>
      <p style={{ maxWidth: "62ch" }}>{platform.whatToSend}</p>
      <p className="small">Send it to: {platform.partnerContact}</p>
      <p style={{ maxWidth: "62ch" }}>{platformDisclaimer}</p>

      <p>
        <Link className="button" href="/">
          Read my report
        </Link>
      </p>

      <Attribution />
    </>
  );
}
