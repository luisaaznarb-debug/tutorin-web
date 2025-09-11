// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import "katex/dist/katex.min.css"; // KaTeX CSS para renderizar fórmulas

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tutorín",
  description: "Asistente educativo para primaria (6-12 años)",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
