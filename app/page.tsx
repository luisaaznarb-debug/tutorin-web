'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Step = { type: 'text' | 'latex' | string; content: string };
type SolveResponse = { steps: Step[]; audioUrl?: string };

export default function Page() {
  // ---- estado UI ----
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'tutorin'; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [apiOk, setApiOk] = useState<'checking' | 'ok' | 'down'>('checking');

  // ---- TTS ----
  const synth = useMemo(() => (typeof window !== 'undefined' ? window.speechSynthesis : null), []);
  const speakingRef = useRef(false);

  const speak = useCallback((text: string) => {
    if (!synth) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES';
      u.rate = 1.0;
      speakingRef.current = true;
      u.onend = () => (speakingRef.current = false);
      u.onerror = () => (speakingRef.current = false);
      synth.speak(u);
    } catch {
      // silencio si falla TTS
    }
  }, [synth]);

  // ---- STT (Web Speech API) ----
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) {
        alert('Tu navegador aún no soporta reconocimiento de voz.');
        return;
      }
      if (listening) return;
      const rec = new SR();
      rec.lang = 'es-ES';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onresult = (e: any) => {
        const said = e.results?.[0]?.[0]?.transcript ?? '';
        setInput(said);
        // auto-enviar
        setTimeout(() => handleSend(), 80);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);

      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop?.(); } catch {}
    setListening(false);
  }, []);

  // ---- comprobar salud del backend (opcional) ----
  useEffect(() => {
  const check = async () => {
    try {
      const r = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
      setApiOk(r.ok ? 'ok' : 'down');
    } catch {
      setApiOk('down');
    }
  };
  check();
}, []);

  // ---- enviar ejercicio ----
  const handleSend = useCallback(async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages(m => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      });

      if (!res.ok) throw new Error('Error en la respuesta');

      const data: SolveResponse = await res.json();

      // pintar pasos en un bloque
      const text = (data.steps ?? [])
        .map(s => s.content)
        .join('\n\n');

      setMessages(m => [...m, { role: 'tutorin', text }]);

      // leer en voz alta (TTS nativo)
      if (text) speak(text);

    } catch (e) {
      setMessages(m => [
        ...m,
        { role: 'tutorin', text: 'Ups, hoy estoy un poco dormido 😴. ¿Puedes repetir la pregunta?' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, speak]);

  // ---- UI ----
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tutorín</h1>
          <div
            className={`rounded-full px-3 py-1 text-sm ${
              apiOk === 'ok'
                ? 'bg-green-100 text-green-700'
                : apiOk === 'checking'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
            title="Estado API"
          >
            {apiOk === 'ok' ? 'API: OK' : apiOk === 'checking' ? 'API: comprobando…' : 'API: caída'}
          </div>
        </header>

        <section
          className="mb-4 h-[60vh] w-full overflow-y-auto rounded-xl border p-4"
          aria-label="historial del chat"
        >
          {!messages.length && (
            <p className="text-gray-500">
              Escribe un ejercicio o pulsa el micro. Recuerda: Tutorín te dará <b>pistas</b> y siempre
              terminará con una <b>pregunta</b>. 💪
            </p>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-2 ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-left">
              <span className="inline-block rounded-2xl bg-gray-100 px-4 py-2 text-gray-700">
                Pensando…
              </span>
            </div>
          )}
        </section>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu ejercicio y pulsa Enter"
            className="flex-1 rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="button"
            onClick={() => (listening ? stopListening() : startListening())}
            className={`rounded-xl border px-4 py-3 ${listening ? 'bg-red-100' : 'bg-white'} hover:bg-gray-50`}
            title="Hablar con Tutorín"
          >
            {listening ? '🎙️ Grabando…' : '🎤 Hablar'}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>

        <div className="mt-3 text-sm text-gray-500">
          Consejo: si Tutorín habla y no quieres que siga, pulsa <b>Esc</b> o interrumpe con el botón del micro.
        </div>
      </div>
    </main>
  );
}
