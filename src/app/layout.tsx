import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Kreatim — Tim Kreatif AI untuk Brand yang Baru Tumbuh", template: "%s · Kreatim" },
  description: "Copywriting dan desain konten konsisten dengan brand kamu, mulai Rp 99.000/bulan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} font-sans`}>{children}</body>
    </html>
  );
}
