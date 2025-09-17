'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const HERO_IMAGE = '/tutorin.png';

/* Helpers color */
const clamp = (n: number, min = 0, max = 255) => Math.max(min, Math.min(max, n));
const toHex = (n: number) => n.toString(16).padStart(2, '0');
const rgbToHex = (r: number, g: number, b: number) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;
const hexToRgb = (hex: string) => {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
};
const luminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};
const pickText = (r: number, g: number, b: number) => (luminance(r, g, b) > 0.5 ? '#111827' : '#ffffff');
const mix = (hex1: string, hex2: string, t: number) => {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  const r = clamp(Math.round(a.r * (1 - t) + b.r * t));
  const g = clamp(Math.round(a.g * (1 - t) + b.g * t));
  const b2 = clamp(Math.round(a.b * (1 - t) + b.b * t));
  return rgbToHex(r, g, b2);
};
async function getDominantColorFromImage(src: string): Promise<{ hex: string; rgb: [number, number, number] } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      try {
        const w = 64, h = 64;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let r = 0, g = 0, b = 0, c = 0;
        for (let i = 0; i < data.length; i += 4) {
          const R = data[i], G = data[i + 1], B = data[i + 2], A = data[i + 3];
          if (A < 200) continue;
          if (R > 240 && G > 240 && B > 240) continue;
          r += R; g += G; b += B; c++;
        }
        if (c === 0) return resolve(null);
        r = Math.round(r / c); g = Math.round(g / c); b = Math.round(b / c);
        resolve({ hex: rgbToHex(r, g, b), rgb: [r, g, b] });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
}

type Palette = { brand: string; contrast: string; surface: string; surfaceStrong: string; shadow: string; gradTop: string; };
const DEFAULT: Palette = {
  brand: '#2563eb', contrast: '#fff', surface: '#eef2ff', surfaceStrong: '#e0e7ff', shadow: 'rgba(0,0,0,.18)', gradTop: '#f8fafc',
};

export default function Home() {
  const [p, setP] = useState<Palette>(DEFAULT);
  const [subject, setSubject] = useState('matematicas');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    getDominantColorFromImage(HERO_IMAGE).then((res) => {
      if (!res) return;
      const [r, g, b] = res.rgb;
      const brand = res.hex;
      const contrast = pickText(r, g, b);
      const surface = mix(brand, '#ffffff', 0.88);
      const surfaceStrong = mix(brand, '#ffffff', 0.82);
      const shadow = 'rgba(0,0,0,.18)';
      const gradTop = mix(brand, '#ffffff', 0.94);
      setP({ brand, contrast, surface, surfaceStrong, shadow, gradTop });
    });
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${p.gradTop}, #fff)` }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', border: `1px solid ${p.surfaceStrong}`, boxShadow: `0 6px 14px ${p.shadow}` }}>
              <Image src={HERO_IMAGE} alt="Tutorín" width={44} height={44} style={{ objectFit: 'cover' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#111827' }}>Tutorín</h1>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Link href={`/resolver?subject=${subject}`} style={{ textDecoration: 'none' }}>
              <button style={{ padding: '10px 14px', borderRadius: 12, background: p.brand, color: p.contrast, border: 'none', fontWeight: 800, boxShadow: `0 6px 16px ${p.shadow}` }}>
                Abrir el chat
              </button>
            </Link>
          </div>
        </header>

        <section style={{
          display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 18, alignItems: 'center',
          border: `1px solid ${p.surfaceStrong}`, background: p.surface, borderRadius: 16, padding: 18
        }}>
          <div style={{ lineHeight: 1.25 }}>
            <h2 style={{ margin: '0 0 8px 0' }}>Aprende paso a paso con pistas</h2>
            <p style={{ margin: 0, color: '#374151' }}>
              Matemáticas, Lengua, Ciencias e Historia/Geografía. Una pista por turno, valida tu respuesta y avanza.
            </p>

            {/* ✅ Selector de materia */}
            <div style={{ marginTop: 16, marginBottom: 12 }}>
              <label htmlFor="subject" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Elige una asignatura:</label>
              <select
                id="subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                style={{ padding: 8, borderRadius: 8, width: '100%', maxWidth: 240 }}
              >
                <option value="matematicas">Matemáticas</option>
                <option value="lengua">Lengua</option>
                <option value="ciencias">Ciencias</option>
                <option value="historia">Historia y Geografía</option>
                <option value="valenciano">Valenciano/Catalán</option>
                <option value="ingles">Inglés</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/resolver?subject=${subject}`} style={{ textDecoration: 'none' }}>
                <button style={{ padding: '10px 14px', borderRadius: 12, background: p.brand, color: p.contrast, border: 'none', fontWeight: 800 }}>Empezar ahora</button>
              </Link>
              <a href="#como-funciona" style={{ textDecoration: 'none' }}>
                <button style={{ padding: '10px 14px', borderRadius: 12, background: '#fff', color: '#111', border: `1px solid ${p.surfaceStrong}` }}>Cómo funciona</button>
              </a>
            </div>
          </div>
          <div style={{ justifySelf: 'center', width: 160, height: 160, borderRadius: 24, overflow: 'hidden', border: `1px solid ${p.surfaceStrong}`, boxShadow: `0 8px 18px ${p.shadow}` }}>
            <Image src={HERO_IMAGE} alt="Tutorín" width={160} height={160} style={{ objectFit: 'cover' }} />
          </div>
        </section>

        <section id="como-funciona" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            ['🎯', 'Una pista cada vez', 'No suelta todo de golpe: pregunta, espera tu respuesta y avanza.'],
            ['🧠', 'Valida y explica', 'Comprueba el paso y da feedback claro (o una micro-pista).'],
            ['🌈', 'Tonos del logo', 'La web hereda los colores de tu imagen de Tutorín.']
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ border: `1px solid ${p.surfaceStrong}`, borderRadius: 14, padding: 14, background: '#fff' }}>
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div style={{ fontWeight: 800 }}>{title}</div>
              <div style={{ color: '#374151', fontSize: 14 }}>{desc}</div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
