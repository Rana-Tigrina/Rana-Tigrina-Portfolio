import type { Metadata } from "next";
import { IM_Fell_English, IBM_Plex_Mono, Tiro_Devanagari_Hindi, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const fell = IM_Fell_English({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-fell" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });
const deva = Tiro_Devanagari_Hindi({ weight: "400", subsets: ["devanagari"], variable: "--font-deva" });
const urdu = Noto_Nastaliq_Urdu({ weight: "400", subsets: ["arabic"], variable: "--font-urdu" });

export const metadata: Metadata = {
  title: "Kuan — the well that answers | Mohammad Munawwar Malook",
  description:
    "Drop a question into the well. An interactive folk tale and the portfolio of Mohammad Munawwar Malook, AI & GenAI systems engineer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fell.variable} ${mono.variable} ${deva.variable} ${urdu.variable}`}>
      <body>{children}</body>
    </html>
  );
}
