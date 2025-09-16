'use client';

import React, { useRef, useState } from 'react';
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

// ---------- KaTeX render ----------
function renderText(t: string) {
  const parts: React.ReactNode[] = [];
  const blocks = t.split(/(\$\$[^$]+\$\$)/g);

  blocks.forEach((chunk, i) => {
    if (/^\$\$[^$]+\$\$/.test(chunk)) {
      const math = chunk.slice(2, -2).trim();
      parts.push(<BlockMath key={`bm-${i}`} math={math} />);
    } else {
      const inlines = chunk.split(/(\$[^$]+\$)/g);
      inlines.forEach((c, j) => {
        if (/^\$[^$]+\$/.test(c)) {
          parts.push(<InlineMath key={`im-${i}-${j}`} math={c.slice(1, -1).trim()} />);
        } else if (c) {
          parts.push(<span key={`t-${i}-${j}`}>{c}</span>);
        }
      });
    }
  });

  return parts;
}

// ---------- UI ----------
export default function Page() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function sendMessage(userText?: string) {
    const msg = (userText ?? text).trim();
    if (!msg) return;

    setBusy(true);
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setText('');

    try {
      // IMPORTANTE: llamar al proxy local de Netlify
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: `Ups… no pude responder ahora mismo. ${errTxt || `HTTP ${res.status}`}` },
        ]);
        return;
      }

      const data = (await res.json()) as ChatResponse;

      const stepMsgs: ChatMessage[] =
        (data.steps ?? []).map(s => ({ role: 'assistant', text: s.text, imageUrl: s.imageUrl ?? null }));

      if (stepMsgs.length) {
        setMessages(prev => [...prev, ...stepMsgs]);
      } else if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: 'No hay respuesta del servidor.' }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Error de red: ${e?.message ?? e}` }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Tutorín</h1>

      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-4 py-3 ${
              m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            <div className="prose max-w-none">{renderText(m.text)}</div>
            {m.imageUrl && <img className="mt-3 max-w-full" src={m.imageUrl} alt="" />}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Escribe tu ejercicio y pulsa Enter"
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={busy}
        />
        <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={busy} type="submit">
          {busy ? 'Pensando…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
