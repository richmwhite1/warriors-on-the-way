import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

// Used for the Gothic Mystic Noir sections (Sean portal, Consciousness Map)
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Warriors on the Way",
    template: "%s | Warriors on the Way",
  },
  description:
    "A gathering place for devotional non-duality — intimate communities, sacred events, and the path walked together.",
  applicationName: "Warriors on the Way",
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
    { media: "(prefers-color-scheme: light)", color: "#c4704a" },
    { media: "(prefers-color-scheme: dark)", color: "#2b1f18" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="bottom-center" />
        <PwaRegister />
      </body>
    </html>
  );
}
