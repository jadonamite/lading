import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lading — Documentary Credit Settled by Contract",
  description:
    "A letter of credit on BOT Chain. The applicant funds it; the beneficiary is paid the instant conforming documents are presented; the applicant is refunded if they never are. No administrator, no release button, no discretion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        <Providers>
          <Header />
          <main className="flex-1 mx-auto w-full max-w-6xl px-5 pt-8 pb-16">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

