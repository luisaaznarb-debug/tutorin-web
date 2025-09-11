
# Tutorín – Snippets de Landing (Next.js + Tailwind)

Este paquete contiene **componentes listos**, **rutas API proxy** (para evitar CORS) y un **paso a paso** para integrar en tu proyecto actual en Vercel.

Funciona tanto con **App Router** (`/app`) como con **Pages Router** (`/pages`). Usa el que tenga tu repo.

---

## 0) Requisitos
- Node 18+ (recomendado 20)
- Next.js 13+
- Tailwind CSS (si no lo tienes, sigue las instrucciones de Tailwind para Next)
- Vercel conectado a tu repo
- Backend en Railway con un endpoint `/health` y `/solve` (ajustable)

Variables de entorno en **Vercel** (Project Settings → Environment Variables) y también en `.env.local` en desarrollo:
```
NEXT_PUBLIC_BACKEND_URL=https://TU_BACKEND_RAILWAY.com
ELEVENLABS_API_KEY=opcional_si_vas_a_usar_tts
```

---

## 1) Copiar archivos
Copia la carpeta `components/` y `hooks/` a la raíz de tu proyecto (o a `src/` si así lo usas).
Elige **una** de estas opciones para las API:
- Si tu proyecto usa **App Router**: copia `app/api/health/route.ts` y `app/api/solve/route.ts` a tu repo.
- Si tu proyecto usa **Pages Router**: copia `pages/api/health.ts` y `pages/api/solve.ts` a tu repo.

También puedes copiar `/public/favicon.svg` y ajustar tu `app/layout.tsx` o `_document.tsx` para usarlo.

---

## 2) Insertar en la home
En tu `app/page.tsx` (App Router) o `pages/index.tsx` (Pages Router), importa y usa estos componentes:

```tsx
import Hero from "@/components/Hero";
import ApiStatus from "@/components/ApiStatus";
import HowItWorks from "@/components/HowItWorks";
import Demo from "@/components/Demo";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <ApiStatus />
        <Hero />
        <HowItWorks />
        <Demo />
        <Pricing />
        <Testimonials />
        <FAQ />
        <Footer />
      </div>
    </main>
  );
}
```

Si tu proyecto no usa `@` alias, ajusta las rutas de import a `../components/...` o similares.

---

## 3) Conectar con tu backend
- Ajusta `process.env.NEXT_PUBLIC_BACKEND_URL` en Vercel y `.env.local`.
- El componente `Demo` llama a `/api/solve` (proxy) que a su vez reenvía la petición al backend de Railway.
- El componente `ApiStatus` verifica `/api/health` → Railway.

Si tus endpoints se llaman distinto, cambia las rutas en `api/*` y/o en `components/Demo.tsx`.

---

## 4) Voz (rápida y opcional)
- Por defecto `Demo` usa la **Web Speech API** cuando está disponible (Chrome/Edge). No requiere claves.
- Si prefieres ElevenLabs, crea una ruta API `pages/api/tts.ts` o `app/api/tts/route.ts` que reciba `text` y devuelva `audio/mpeg` usando tu `ELEVENLABS_API_KEY`. Luego activa `useElevenLabs = true` en `Demo` (flag documentada en el archivo).

---

## 5) Despliegue
1. Crea rama `improve-landing`.
2. `git add . && git commit -m "feat: nueva landing Tutorín (hero + demo + precios + faq)" && git push origin improve-landing`
3. Abre el **Preview** en Vercel, prueba el flujo (texto, imagen, voz) y la salud de la API.
4. Haz **merge** a `main` cuando esté OK.

---

## 6) SEO/OG rápido
- Ajusta `<title>` y `<meta name="description">` en `app/layout.tsx` (o `_document.tsx` si Pages Router).
- Añade OG tags con `metadata` en App Router (o `next/head` en Pages).
- Sube una imagen `og.png` a `/public` y referencia en metadata.

---

## 7) Checklist final
- [ ] Hero claro, con ejemplo de prompt
- [ ] Demo: texto + imagen + botón hablar (si procede)
- [ ] Estado API ✅/❌
- [ ] Sección “Cómo funciona”
- [ ] Precios simples
- [ ] Testimonios + FAQ
- [ ] Lighthouse > 90 móvil
- [ ] Analytics (Vercel Analytics o GA4)
- [ ] Privacidad/GDPR link en Footer

¡Listo!
