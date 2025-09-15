'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// ---------------- Tipos ----------------
type Role = 'user' | 'assistant';

type ChatMessage = {
  role: Role;
  text: string;
  imageUrl?: string;
};

type Step = {
  text: string;
  imageUrl?: string | null;
};

type ChatResponse = {
  steps?: Step[];
  reply?: string | null;
};

// Para evitar errores de tipos durante build en Netlify
// (el tipo real lo suministra el navegador en runtime)
type SpeechRecognitionLike = any;

// -------------- Helpers KaTeX --------------
// Convierte texto con $...$ (inline) y $$...$$ (block) a nodos con KaTeX
function renderWithMath(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  // Primero troceamos por bloques $$...$$
  const blockSplit = text.split(/(\$\$[^$]+\$\$)/g);

  blockSplit.forEach((chunk, i) => {
    if (/^\$\$[^$]+\$\$/.test(chunk)) {
      const math = chunk.slice(2, -2).trim();
      parts.push(<BlockMath key={`bm-${i}`}>{math}</BlockMath>);
    } else {
      // Dentro de cada trozo normal, troceamos por inline $...$
      const inlines = chunk.split(/(\$[^$]+\$)/g);
      inlines.forEach((p, j) => {
        if (/^\$[^$]+\$/.test(p)) {
          const math = p.slice(1, -1).trim();
          parts.push(<InlineMath key={`im-${i}-${j}`}>{math}</InlineMath>);
        } else if (p) {
          parts.push(<span key={`t-${i}-${j}`}>{p}</span>);
        }
      });
    }
  });

  return <>{parts}</>;
}

// -------------- Componente --------------
export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Voz automática y micrófono
  const [voiceAuto, setVoiceAuto] = useState(true);
  const [micOn, setMicOn] = useState(false);

  const speakingRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const startedMicOnce = useRef(false);

  // --------- Inicializar reconocimiento de voz (solo en navegador) ----------
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) return;

    const rec: SpeechRecognitionLike = new SR();
    rec.lang = 'es-ES';
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (ev: any) => {
      if (speakingRef.current) return; // ignoramos mientras habla
      const last = ev.results[ev.results.length - 1];
      const heard = last && last[0]?.transcript ? String(last[0].transcript).trim() : '';
      if (heard) {
        // Para evitar eco/loops, mandamos el texto, pero el micro se pausa mientras hablamos
        handleSend(heard);
      }
    };

    rec.onerror = () => {
      // errores de micro no deben romper la app
    };

    recognitionRef.current = rec;
  }, []);

  // Encender/apagar micro según toggle y estado de "speaking"
  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec) return;

    const safeStart = () => {
      try { rec.start(); } catch { /* noop */ }
    };
    const safeStop = () => {
      try { rec.stop(); } catch { /* noop */ }
    };

    if (micOn && !speakingRef.current) {
      // En algunos navegadores hay que llamar a start tras un gesto
      // La primera vez, esperamos a que el usuario pulse Enviar/hable
      // Para simplificar, si micOn true, intentamos start siempre.
      safeStart();
    } else {
      safeStop();
    }
  }, [micOn, speakingRef.current]);

  // --------- TTS (hablar) ----------
  function speak(text: string): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    const synth = window.speechSynthesis;
    if (!synth) return Promise.resolve();

    // Quitamos el contenido matemático en voz (opcional)
    const readable = text.replace(/\$\$[^$]+\$\$|\$[^$]+\$/g, '');

    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(readable);
      u.lang = 'es-ES';
      u.rate = 1;
      u.onstart = () => {
        speakingRef.current = true;
        // Al empezar a hablar, paramos el micro para evitar bucles
        const rec = recognitionRef.current;
        if (rec) { try { rec.stop(); } catch { /* noop */ } }
      };
      u.onend = () => {
        speakingRef.current = false;
        // Si el micro estaba activo, lo retomamos
        if (micOn) {
          const rec = recognitionRef.current;
          if (rec) { try { rec.start(); } catch { /* noop */ } }
        }
        resolve();
      };
      synth.speak(u);
    });
  }

  // Hablar último mensaje si es del asistente y la voz auto está activa
  useEffect(() => {
    if (!voiceAuto || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === 'assistant' && last.text.trim()) {
      void speak(last.text);
    }
  }, [messages, voiceAuto]);

  // --------- Enviar ---------
  async function handleSend(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text) return;
    setInput('');

    // Añadimos el mensaje del usuario
    setMessages((prev) => [...prev, { role: 'user', text }]);

    setLoading(true);
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          grade: 'Primaria',
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: ChatResponse = await res.json();

      // Normalizamos steps a mensajes de asistente y forzamos texto seguro (string)
      const fromSteps: ChatMessage[] = (data.steps ?? [])
        .map((s) => ({
          role: 'assistant' as Role,
          text: String(s?.text ?? ''),
          imageUrl: s?.imageUrl ?? undefined,
        }))
        .filter((m) => m.text.trim().length > 0);

      if (fromSteps.length > 0) {
        setMessages((prev) => [...prev, ...fromSteps]);
      } else if (typeof data.reply === 'string' && data.reply.trim().length > 0) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.reply.trim() },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'No pude generar pistas esta vez.',
          },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Ups… no pude responder ahora mismo. ${e?.message ?? ''}`.trim(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Enviar con Enter
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSend();
    }
  }

  // --------- UI ---------
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-4xl font-bold mb-4">Tutorín</h1>

      <div className="text-sm mb-4 flex items-center gap-4">
        <span>
          Estado API: <span className="text-green-600 font-semibold">OK</span> ✅
        </span>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={voiceAuto}
            onChange={(e) => setVoiceAuto(e.target.checked)}
          />
          Voz auto
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={micOn}
            onChange={(e) => {
              setMicOn(e.target.checked);
              startedMicOnce.current = true;
            }}
          />
          Micrófono
        </label>
      </div>

      <section
        className="border rounded-xl p-4 h-[64vh] overflow-y-auto bg-white"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p className="text-gray-500">
            Escribe un ejercicio o dile a Tutorín qué necesitas. Ej.:{' '}
            <em>“¿Cuáles son los múltiplos comunes de 4 y 6?”</em>
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`my-3 flex ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}
            >
              <div className="prose prose-sm max-w-none">
                {renderWithMath(m.text)}
              </div>
              {m.imageUrl && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.imageUrl}
                    alt="Ilustración del paso"
                    className="rounded-lg max-h-64"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-gray-500 text-sm mt-2">Pensando…</div>
        )}
      </section>

      <form
        className="mt-4 flex gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <input
          className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Habla con el micro o escribe aquí y pulsa Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-blue-700 transition"
          disabled={loading}
        >
          Enviar
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-2">
        • La voz se pausa mientras Tutorín habla para evitar bucles. • Comandos
        de voz (libres): puedes decir tu respuesta o pedir más pistas.
      </p>
    </main>
  );
}
