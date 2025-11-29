import type { Metadata } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoNastaliq = Noto_Nastaliq_Urdu({ 
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-urdu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shakir Super League - Pakistan Ka Apna Cricket League Platform",
  description:
    "Lahore Qalandars se le kar gali cricket tak — SSL sab manage karta hai. Pakistan's #1 cricket tournament management platform.",
  keywords: [
    "cricket",
    "tournament",
    "league",
    "Pakistan",
    "scoring",
    "cricket management",
    "sports platform",
    "cricket league",
    "cricket scoring",
    "tournament management",
  ],
  authors: [{ name: "Malik Tech", url: "https://maliktech.com" }],
  creator: "Muhammad Kashif",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ssl.cricket",
    siteName: "Shakir Super League",
    title: "Shakir Super League - Pakistan Ka Apna Cricket League Platform",
    description:
      "Lahore Qalandars se le kar gali cricket tak — SSL sab manage karta hai.",
    images: [
      {
        url: "https://ssl.cricket/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Shakir Super League",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shakir Super League - Pakistan Ka Apna Cricket League Platform",
    description:
      "Lahore Qalandars se le kar gali cricket tak — SSL sab manage karta hai.",
    creator: "@ShakirSuperL",
    site: "@ShakirSuperL",
  },
  metadataBase: new URL("https://ssl.cricket"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Shakir Super League",
              url: "https://ssl.cricket",
              logo: "https://ssl.cricket/logo.png",
              description: "Pakistan's #1 Cricket Tournament & League Management Platform",
              sameAs: [
                "https://twitter.com/ShakirSuperL",
                "https://github.com/maliktech/shakir-super-league",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Shakir Super League",
              url: "https://ssl.cricket",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://ssl.cricket/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Shakir Super League",
              applicationCategory: "SportsApplication",
              operatingSystem: "Web, iOS, Android",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "PKR",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1250",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${notoNastaliq.variable} font-sans`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

