import type { Metadata, Viewport } from "next";
import { Cinzel, EB_Garamond } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Warriors on the Way",
    template: "%s | Warriors on the Way",
  },
  description:
    "A gathering of lightbringers committed to reclaiming sovereignty from institutional control and supporting the evolution of consciousness.",
  applicationName: "Warriors on the Way",
  openGraph: {
    siteName: "Warriors on the Way",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Warriors on the Way",
  },
  formatDetection: { telephone: false },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a1610" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1610" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${garamond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col w-full max-w-[100vw] overflow-x-hidden">
        {children}
        <Toaster richColors position="bottom-center" />
        <PwaRegister />
      </body>
    </html>
  );
}
