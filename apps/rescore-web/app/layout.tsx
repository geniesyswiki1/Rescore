import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, Public_Sans } from "next/font/google";
import { Logo } from "@/components/Logo";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-archivo",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://rescore.app"),
  title: {
    default: "Rescore: fix, prove and re-rate your food hygiene rating",
    template: "%s | Rescore",
  },
  description:
    "Rated 0, 1 or 2? Upload your inspection report and get the action plan, the food safety paperwork and the evidence pack.",
  openGraph: { type: "website", siteName: "Rescore", locale: "en_GB" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${archivo.variable} ${publicSans.variable}`}>
      <body>
        <header className="site-header">
          <div className="shell">
            <Link href="/" aria-label="Rescore home" style={{ textDecoration: "none" }}>
              <Logo />
            </Link>
            <nav className="nav">
              <Link href="/fix/confidence-in-management">What the officer scores</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/help">Help</Link>
            </nav>
          </div>
        </header>

        <main>
          <div className="shell">{children}</div>
        </main>

        <footer className="site-footer">
          <div className="shell">
            <p>
              Rescore helps you prepare your own food safety records and re-rating request. It is not an
              inspection, it is not a guarantee of a rating, and the records are only true if your kitchen
              matches them.
            </p>
            <p>
              <Link href="/privacy">Privacy</Link> {" | "} <Link href="/terms">Terms</Link> {" | "}{" "}
              <Link href="/help">Help</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
