import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/auth-provider";
import { GlobalUpsellPopup } from "@/components/dashboard/global-upsell-popup";
import ProfileCompletionModal from "@/components/auth/profile-completion-modal";
import { ErrorTracker } from "@/components/observability/error-tracker";
import { ImpersonationBanner } from "@/components/security/impersonation-banner";
import WelcomePopup from "@/components/welcome/welcome-popup";

// Font weights trimmed to what the UI actually leans on (measured: 700 and
// 800 dominate; 400/500/900 are rare). Fewer weight files = less to download
// before first paint on throttled mobile. A rare unused weight just gets
// browser-synthesized, which is visually near-identical.
//   Inter (body):      400 base + 600/700 emphasis
//   Jakarta (display): 700/800 (all headings)
//   Grotesk (labels):  600/700 (uppercase eyebrows/labels)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

/**
 * Absolute base for metadata URLs (og:image, twitter:image, canonical).
 *
 * These MUST be absolute and publicly reachable — a social crawler
 * (WhatsApp/LinkedIn/X/Facebook) fetches them from its own machine. This
 * previously fell back to http://localhost:3000 whenever NEXT_PUBLIC_SITE_URL
 * was unset, which is exactly what happened in production: the live site was
 * serving `og:image = http://localhost:3000/opengraph-image`, so every shared
 * link rendered with no preview image at all.
 *
 * The production domain is known and stable, so it's now the default and
 * localhost is only used during local development. NEXT_PUBLIC_SITE_URL still
 * wins when set (useful for staging/preview deploys).
 */
const PRODUCTION_URL = 'https://sariro.com';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return PRODUCTION_URL;
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: "Sariro — AI & Technology Education | Mimo Patra",
  description:
    "Teaching the future. We teach thinking, not just coding. Cohort-based AI courses, school workshops, and free learning resources by educator Mimo Patra.",
  keywords: [
    "Sariro",
    "AI education",
    "Mimo Patra",
    "AI courses",
    "school workshops",
    "coding bootcamp",
    "technology education",
  ],
  authors: [{ name: "Mimo Patra" }],
  icons: { icon: "/logo.svg" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sariro — AI & Technology Education",
    description: "Teaching the future. We teach thinking, not just coding.",
    siteName: "Sariro",
    type: "website",
    url: getBaseUrl(),
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sariro — AI & Technology Education",
    description: "Teaching the future. We teach thinking, not just coding.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakarta.variable} ${grotesk.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          {/* Profile completion modal — lives in root so it works on EVERY page
              (public + dashboard). Auto-shows when user is logged in but
              profile_completed = false (e.g. GitHub login missing phone). */}
          <ProfileCompletionModal />
          {/* Global upsell popup — shows on ANY page when a logged-in user
              has a completed enrollment whose completion_shown_at is NULL. */}
          <GlobalUpsellPopup />
          {/* Impersonation banner — shows when admin is signed in as another user */}
          <ImpersonationBanner />
          {/* Welcome popup — invites visitors to book a free demo class.
              Shows after 6s on every page. Hidden for logged-in users.
              X = hide this session only (shows again on reload).
              "Maybe later" = never show again. "Yes" = converted. */}
          <WelcomePopup />
          {/* Client-side error tracker — captures window.onerror +
              unhandledrejection, forwards to /api/errors. */}
          <ErrorTracker />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
