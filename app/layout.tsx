import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bingo Quial - 50 años",
  description: "Registro gamificado de familias para el Bingo Quial 50 años"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <main className="min-h-screen flex items-center justify-center px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
