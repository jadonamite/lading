import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lading — a documentary credit, settled by contract",
  description:
    "A letter of credit on BOT Chain. The applicant funds it; the beneficiary is paid the instant conforming documents are presented; the applicant is refunded if they never are. No administrator, no release button, no discretion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
