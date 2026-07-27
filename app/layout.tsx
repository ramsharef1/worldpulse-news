import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universities-Voice | Jordanian University News",
  description: "Your source for news from Jordanian universities - Academic, Student Life, Research, Sports, Careers, and more",
  keywords: ["Jordan", "Universities", "News", "Academic", "Students", "Faculty"],
  authors: [{ name: "Universities-Voice Team" }],
  openGraph: {
    type: "website",
    locale: "ar_JO",
    url: "https://universitiesvoice.com",
    title: "Universities-Voice",
    description: "News from Jordanian Universities",
    images: [
      {
        url: "https://universitiesvoice.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Universities-Voice",
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
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1E40AF" />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors font-sans">
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
