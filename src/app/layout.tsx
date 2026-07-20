import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/auth-provider";
import { GlobalUpsellPopup } from "@/components/dashboard/global-upsell-popup";
import ProfileCompletionModal from "@/components/auth/profile-completion-modal";
import { ErrorTracker } from "@/components/observability/error-tracker";
import { ImpersonationBanner } from "@/components/security/impersonation-banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
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
  openGraph: {
    title: "Sariro — AI & Technology Education",
    description: "Teaching the future. We teach thinking, not just coding.",
    siteName: "Sariro",
    type: "website",
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
          {/* Client-side error tracker — captures window.onerror +
              unhandledrejection, forwards to /api/errors. */}
          <ErrorTracker />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
