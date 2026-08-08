import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Universities-Voice | صوت الجامعات",
  description:
    "منصة أخبار شاملة لجميع الجامعات الأردنية - Academic, Student Life, Research, Sports, Careers, and more",
  keywords: [
    "Jordan",
    "Universities",
    "News",
    "Academic",
    "Students",
    "Faculty",
    "أردن",
    "جامعات",
  ],
  authors: [{ name: "Universities-Voice Team" }],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "ar_JO",
    url: "https://universitiesvoice.com",
    title: "Universities-Voice | صوت الجامعات",
    description: "منصة أخبار شاملة لجميع الجامعات الأردنية",
    images: [
      {
        url: "https://universitiesvoice.com/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Universities-Voice - صوت الجامعات",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`scroll-smooth ${inter.variable} ${cairo.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#4f8fff" />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
        <AuthProvider>
          <LanguageProvider>
            <div className="flex flex-col min-h-screen">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
