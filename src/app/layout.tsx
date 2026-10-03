import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { headers } from "next/headers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AMVA Salud Adolescente",
  description: "Gestión y análisis de morbilidad y mortalidad adolescente",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const isLogin = pathname === "/login" || pathname.startsWith("/login");

  if (isLogin) {
    return (
      <html lang="es" className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable}`}>
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="es" className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <body>
        <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
          <Sidebar />
          <div className="flex min-h-screen flex-col">
            <Topbar />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
