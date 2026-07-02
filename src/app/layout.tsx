import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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

export const metadata: Metadata = {
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
