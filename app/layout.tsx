import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutorin",
  description: "Profesor virtual para niños de primaria",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

