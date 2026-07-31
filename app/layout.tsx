import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import { AstroGlyphDefs } from "@/components/AstroGlyphs";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ptolemy — Traditional Astrology",
  description:
    "Your natal chart read through the methods of Claudius Ptolemy and Vettius Valens — not pop astrology. The real tradition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${cinzel.variable}`}>
      <body className="antialiased bg-parchment text-ink">
        <AstroGlyphDefs />
        {children}
      </body>
    </html>
  );
}
