'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// ----------- Tipos -----------
type Role = 'user' | 'assistant';

type ChatMessage = {
  role: Role;
  text: string;
  imageUrl?: string | null;
};

type Step = {
  text: string;
  imageUrl?: string | null;
};

type ChatResponse = {
  steps?: Step[];
  reply?: string | null;
};

// ----------- Util: partir un texto con KaTeX -----------
/**
 * Divide el texto en partes y devuelve elementos React con KaTeX.
 * Soporta:
 *  - $$ ... $$  -> bloque
 *  - $ ... $    -> inline
 */
function renderWithKatexPieces(text: string, keyPrefix = 'p') {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  // 1) separamos por bloques $$...$$
  const chunks = text.split(/(\$\$[^$]+\$\$)/g);

  chunks.forEach((chunk, i) => {
    if (!chunk) return;

    // Bloque
    if (/^\$\$[^$]+\$\$/.test(chunk)) {
      const math = chunk.slice(2, -2).trim();
      // ✅ KaTeX en bloque: usar prop `math` (NO children)
      parts.push(<BlockMath key={`bm-${i}`} math={math} />);
    } else {
      // 2) dentro del texto normal, separamos por inline $...$
      const inlines = chunk.split(/(\$[^$]+\$)/g);
      inlines.forEach((piece, j) => {
        if (!piece) return;

        if (/^\$[^$]+\$/.test(piece)) {
          const math = piece.slice(1, -1).trim();
          // ✅ KaTeX inline: también con prop `math`
          parts.push(<InlineMath key={`${keyPrefix}-im-${i}-${j}`} math={math} />);
        } else {
          parts.push(
            <span key={`${keyPrefix}-tx-${i}-${j}`}>
              {piece}
            </span>
          );
        }
      });
    }
  });

  return <>{parts}</>;
}

// ----------- Componente principal -----------
export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // URL del backend desde variable de entorno pública
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
  const solvePath = process.env.NEXT_PUBLIC_BACKEND_SOLVE_PATH ?? '/chat';
  const endpoint = useMemo(() => `${backend}${solvePath}`, [backend, solvePath]);

  // Enviar
  async function sendMessage(userText?: string) {
    const msg = (userText ?? text).trim();
    if (!msg || busy) return;

    setBusy(true);
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setText('');

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: `Ups… no pude responder ahora mismo. ${err || 'HTTP ' + res.status}` }
        ]);
        return;
      }

      const data: ChatResponse = await res.json();

      if (data.steps && data.steps.length) {
        setMessages(prev => [
          ...prev,
          ...data.steps.map(s => ({ role: 'assistant', text: s.text ?? '', imageUrl: s.imageUrl ?? null }))
        ]);
      } else if (typeof data.reply === 'string') {
        // ✅ Aseguramos siempre string
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: data.reply ?? '' }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: 'No tengo pistas por ahora, ¿me lo repites de otra forma?' }
        ]);
      }
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: `Error de red: ${String(e?.message || e)}` }
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Tutorín</h1>

      <div className="border rounded-lg p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-md px-3 py-2 ${m.role === 'user' ? 'bg-blue-600 text-white ml-auto w-fit' : 'bg-gray-100'}`}
          >
            <div className="prose max-w-none">
              {renderWithKatexPieces(m.text, `m${i}`)}
            </div>
            {m.imageUrl ? (
              <div className="mt-2">
                {/* si te devuelvo imágenes, aquí se muestran */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imageUrl} alt="ilustración" className="max-h-64 rounded" />
              </div>
            ) : null}
          </div>
        ))}
        {!messages.length && (
          <div className="text-sm text-gray-500">
            Escribe tu ejercicio y pulsa Enter. Ej.: <em>¿cuánto es 2/3 + 5/8?</em>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Escribe tu ejercicio y pulsa Enter"
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {busy ? 'Pensando…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
