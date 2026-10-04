import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Mono dipakai hanya untuk metadata teknis (nomor fase, counter, path env).
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlanForge",
  description:
    "Ubah ide menjadi PRD dan daftar task berjenjang yang siap ditempel ke AI coding agent.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: ekstensi browser (mis. penanda "bis_skin_checked")
    // menyuntikkan atribut ke <html>/<body> setelah server render, yang memicu
    // peringatan hydration tanpa kesalahan nyata pada aplikasi.
    <html lang="id" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${mono.variable} min-h-screen bg-void`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
