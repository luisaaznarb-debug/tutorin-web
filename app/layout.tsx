// app/layout.tsx
import type { Metadata } from "next";

// Tu CSS global (si lo usas)
import "./globals.css";

// 👇 IMPORTA EL CSS DE KATEX (clave)
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Tutorín",
  description: "Asistente paso a paso para 6º de primaria",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head />
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
