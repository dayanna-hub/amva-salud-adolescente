import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { headers } from "next/headers";

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
      <html lang="es">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="es">
      <body>
        <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
          <Sidebar />
          <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
