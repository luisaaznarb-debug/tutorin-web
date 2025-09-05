'use client';

import { useEffect, useRef, useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { chatRequest, ChatMessage } from '@/lib/api';

type Bubble = { role: 'user' | 'tutorin'; text: string };

export default function Home() {
  const [status, setStatus] = useState('Comprobando API…');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Bubble[]>([
    { role: 'tutorin', text: '¡Hola! Soy Tutorín. Escríbeme un ejercicio de cualquier asignatura y te doy pistas 😊' },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Verificar si la API está viva
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API_BASE}/ping`);
        const j = await r.json();
        setStatus(j?.message ?? 'API activa');
      } catch {
        setStatus('No puedo conectar con la API 😕');
      }
    };
    check();
  }, [API_BASE]);

  // Autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Renderizado con soporte para LaTeX
  const renderWithLatex = (text: string) => {
    const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g).filter(Boolean);
    return parts.map((p, i) => {
      if (p.startsWith('$$') && p.endsWith('$$')) {
        return <div key={i} className="my-2"><BlockMath math={p.slice(2, -2)} /></div>;
      }
      if (p.startsWith('$') && p.endsWith('$')) {
        return <InlineMath key={i} math={p.slice(1, -1)} />;
      }
      return <span key={i}>{p}</span>;
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setSending(true);

    try {
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      const data = await chatRequest(text, history);
      setMessages(prev => [...prev, { role: 'tutorin', text: data.reply }]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { role: 'tutorin', text: 'Uy… no pude pensar ahora mismo. ¿Probamos otra vez?' },
        { role: 'tutorin', text: `Detalle técnico: ${e?.message ?? e}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-1">Tutorín</h1>
      <p className="text-sm text-gray-600 mb-6">Estado API: {status}</p>

      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`rounded-lg p-3 leading-relaxed ${m.role === 'user' ? 'bg-blue-100 ml-12' : 'bg-white border mr-12'}`}>
            <div className="text-xs text-gray-500 mb-1">{m.role === 'user' ? 'Tú' : 'Tutorín'}</div>
            <div className="prose prose-sm max-w-none">{renderWithLatex(m.text)}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribe tu ejercicio aquí… (mates, lengua, ciencias, sociales, inglés)"
          className="flex-1 rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button onClick={handleSend} disabled={sending} className="rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
          {sending ? 'Pensando…' : 'Enviar'}
        </button>
      </div>
    </main>
  );
}

