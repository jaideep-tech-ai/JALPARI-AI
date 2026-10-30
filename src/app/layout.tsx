import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "JALGUARD — Predict the Risk. Choose the Right Intervention. Prevent the Damage.",
  description:
    "AI Intervention Intelligence for Urban Water Resilience. Turn weather signals, geographic intelligence and field observations into clear priorities and preventive action.",
  keywords: ["water risk", "urban flooding", "intervention intelligence", "civic tech", "resilience"],
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/logo.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060A13" },
    { media: "(prefers-color-scheme: light)", color: "#F5F8FB" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
