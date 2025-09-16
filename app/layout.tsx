import Script from 'next/script';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tutorín – Aprende con pistas',
  description: 'Resolución paso a paso con pistas para Primaria y ESO.',
  openGraph: {
    title: 'Tutorín',
    description: 'Aprende con pistas',
    images: ['/tutorin.png'],
  },
  // opcional si activas PWA:
  // manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial' }}>
        {children}

        {/* Plausible (https://tutorintuprofevirtual.netlify.app/) */}
        <Script defer data-domain="https://tutorintuprofevirtual.netlify.app" src="https://plausible.io/js/script.js" />
        {/* Si quieres solo en producción:
        {process.env.NODE_ENV === 'production' && (
          <Script defer data-domain="https://tutorintuprofevirtual.netlify.app" src="https://plausible.io/js/script.js" />
        )} */}
      </body>
    </html>
  );
}
