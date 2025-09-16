'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// ---------- Tipos ----------
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

// ---------- Render KaTeX ----------
function renderWithKatexPieces(text: string, keyPrefix = 'p') {
  if (!text) return null;

  const nodes: React.ReactNode[] = [];
  const chunks = text.split(/(\$\$[^$]+\$\$)/g);

  chunks.forEach((chunk, i) => {
    if (!chunk) return;

    // $$ ... $$ -> bloque
    if (/^\$\$[^$]+\$\$/.test(chunk)) {
      const math = chunk.slice(2, -2).trim();
      nodes.push(<BlockMath key={`bm-${i}`} math={math} />);
    } else {
      // dentro, $ ... $ -> inline
      const inlines = chunk.split(/(\$[^$]+\$)/g);
      inlines.forEach((piece, j) => {
        if (!piece) return;

        if (/^\$[^$]+\$/.test(piece)) {
          const math = piece.slice(1, -1).trim();
          nodes.push(<InlineMath key={`${keyPrefix}-im-${i}-${j}`} math={math} />);
        } else {
          nodes.push(<span key={`${keyPrefix}-tx-${i}-${j}`}>{piece}</span>);
        }
      });
    }
  });

  return <>{nodes}</>;
}

// ---------- Página ----------
export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Usamos el proxy local /api/solve (Next.js)
  async function sendMessage(userText?: string) {
    const msg = (userText ?? text).trim();
    if (!msg || busy) return;

    setBusy(true);

    const userMsg: ChatMessage = { role: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setText('');

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        const errMsg: ChatMessage = {
          role: 'assistant',
          text: `Ups… no pude responder ahora mismo. ${errTxt || 'HTTP ' + res.status}`,
        };
        setMessages(prev => [...prev, errMsg]);
        return;
        }

      const data: ChatResponse = await res.json();

      // 1) Pasos (si hay)
      if (Array.isArray(data.steps) && data.steps.length > 0) {
        const mapped: ChatMessage[] = data.steps.map((s): ChatMessage => ({
          role: 'assistant',
          text: s?.text ?? '',
          imageUrl: s?.imageUrl ?? null,
        }));
        setMessages(prev => [...prev, ...mapped]);
      }

      // 2) Respuesta final (si hay)
      if (typeof data.reply === 'string') {
        const botMsg: ChatMessage = {
          role: 'assistant',
          text: data.reply ?? '',
        };
        setMessages(prev => [...prev, botMsg]);
      }

      // 3) Si no hubo nada, ponemos un fallback
      if ((!data.steps || data.steps.length === 0) && !data.reply) {
        const fallback: ChatMessage = {
          role: 'assistant',
          text: 'No tengo pistas por ahora, ¿puedes repetirlo de otra forma?',
        };
        setMessages(prev => [...prev, fallback]);
      }
    } catch (e: any) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        text: `Error de red: ${String(e?.message || e)}`,
      };
      setMessages(prev => [...prev, errMsg]);
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
            className={`rounded-md px-3 py-2 ${
              m.role === 'user'
                ? 'bg-blue-600 text-white ml-auto w-fit'
                : 'bg-gray-100'
            }`}
          >
            <div className="prose max-w-none">
              {renderWithKatexPieces(m.text, `m${i}`)}
            </div>
            {m.imageUrl ? (
              <div className="mt-2">
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
