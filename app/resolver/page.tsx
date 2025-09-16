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

// ---------- Util: KaTeX ----------
function renderWithKatex(text: string) {
  const out: React.ReactNode[] = [];
  let i = 0;

  // $$ ... $$ -> bloque
  const parts = text.split(/(\$\$[^$]+\$\$)/g);
  for (const chunk of parts) {
    if (!chunk) continue;

    if (/^\$\$[^$]+\$\$$/.test(chunk)) {
      const math = chunk.slice(2, -2).trim();
      out.push(<BlockMath key={`bm-${i++}`} math={math} />);
    } else {
      // $ ... $ -> inline
      const inlines = chunk.split(/(\$[^$]+\$)/g);
      for (const piece of inlines) {
        if (!piece) continue;
        if (/^\$[^$]+\$/.test(piece)) {
          const math = piece.slice(1, -1).trim();
          out.push(<InlineMath key={`im-${i++}`} math={math} />);
        } else {
          out.push(<span key={`t-${i++}`}>{piece}</span>);
        }
      }
    }
  }
  return out;
}

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function sendMessage(userText?: string) {
    const msg = (userText ?? text).trim();
    if (!msg) return;

    // pinta el mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setText('');
    setBusy(true);

    try {
      const res = await fetch('/backend/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: msg }),
});

      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: `Ups… no pude responder ahora mismo. ${errTxt || 'HTTP ' + res.status}` },
        ]);
        return;
        }

      const data: ChatResponse = await res.json();

      // normaliza tipos aquí
      const stepMsgs: ChatMessage[] = (data.steps ?? []).map(s => ({
        role: 'assistant',
        text: s?.text ?? '',           // <- string garantizado
        imageUrl: s?.imageUrl ?? null, // <- null permitido
      }));

      if (stepMsgs.length) {
        setMessages(prev => [...prev, ...stepMsgs]);
      } else if (typeof data.reply === 'string') {
       setMessages(prev => [...prev, { role: 'assistant', text: data.reply ?? '' }]);
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Tutorín</h1>

      {/* Mensajes */}
      <div className="flex flex-col gap-3 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'self-end bg-blue-600 text-white rounded px-3 py-2'
                : 'self-start bg-gray-100 text-black rounded px-3 py-2'
            }
          >
            <div>{renderWithKatex(m.text)}</div>
            {m.imageUrl ? (
              <img src={m.imageUrl} alt="" className="mt-2 max-w-xs rounded" />
            ) : null}
          </div>
        ))}
      </div>

      {/* Formulario */}
      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}
        className="mt-4 flex gap-2"
      >
        <input
          ref={inputRef}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Escribe tu ejercicio y pulsa Enter. Ej.: ¿cuánto es 2/3 + 5/8?"
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={busy}
        />
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={busy}>
          {busy ? 'Pensando…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}