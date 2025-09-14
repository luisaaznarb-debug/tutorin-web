'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Role = 'user' | 'assistant';
type Msg = { role: Role; content: string; imageUrl?: string | null };

type Step = { text: string; imageUrl?: string | null };
type SolveResponse = { steps: Step[]; reply?: string };

const hasWindow = typeof window !== 'undefined';
const synth = hasWindow ? window.speechSynthesis : undefined;

// ---- Utilidades de texto para TTS ----
function cleanForTTS(raw: string): string {
  let t = raw || '';
  t = t.replace(/\u2063/g, '');           // separadores invisibles
  t = t.replace(/```[\s\S]*?```/g, ' ');  // bloques de código
  t = t.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  t = t.replace(/\$([\s\S]*?)\$/g, '$1');
  t = t.replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1 partido por $2');
  t = t.replace(/\\times/g, ' por ');
  t = t.replace(/×/g, ' por ');
  t = t.replace(/÷|\\div/g, ' entre ');
  t = t.replace(/\^(\d+)/g, ' elevado a $1');
  t = t.replace(/\\begin\{.*?\}|\\end\{.*?\}/g, ' ');
  t = t.replace(/\\[a-zA-Z]+/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function speak(text: string, voiceLang = 'es-ES', onStart?: () => void, onEnd?: () => void) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(cleanForTTS(text));
  u.lang = voiceLang;
  u.rate = 1;
  u.pitch = 1;
  u.volume = 1;
  if (onStart) u.onstart = onStart;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}

// ---- Reconocimiento de voz ----
type SR = SpeechRecognition & { _restarts?: number } | null;

function getSpeechRecognition(): SR {
  if (!hasWindow) return null;
  const SRCls: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SRCls) return null;
  const rec: any = new SRCls();
  rec.lang = 'es-ES';
  rec.interimResults = true;
  rec.continuous = true;
  rec.maxAlternatives = 1;
  rec._restarts = 0;
  return rec as SR;
}

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [started, setStarted] = useState(false);
  const [autoVoice, setAutoVoice] = useState<boolean>(() => {
    if (!hasWindow) return false;
    const saved = localStorage.getItem('tutorin-autovoice');
    return saved ? saved === '1' : false;
  });
  const [micOn, setMicOn] = useState<boolean>(() => {
    if (!hasWindow) return false;
    const saved = localStorage.getItem('tutorin-mic');
    return saved ? saved === '1' : false;
  });

  useEffect(() => {
    if (!hasWindow) return;
    localStorage.setItem('tutorin-autovoice', autoVoice ? '1' : '0');
  }, [autoVoice]);

  useEffect(() => {
    if (!hasWindow) return;
    localStorage.setItem('tutorin-mic', micOn ? '1' : '0');
  }, [micOn]);

  // visor de imágenes
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // refs voz/mic
  const recRef = useRef<SR>(null);
  const supportsSR = useMemo(() => !!getSpeechRecognition(), []);
  const speakingRef = useRef(false);
  const micOnRef = useRef(micOn);
  useEffect(() => { micOnRef.current = micOn; }, [micOn]);

  const history = useMemo(
    () => messages.map((m) => ({ role: m.role, content: m.content })),
    [messages]
  );

  // leer automáticamente la última respuesta
  const lastAssistantRef = useRef<string>('');
  useEffect(() => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!last) return;
    if (last.content === lastAssistantRef.current) return;
    lastAssistantRef.current = last.content;

    if (autoVoice) {
      const stopMic = () => {
        speakingRef.current = true;
        try { recRef.current?.stop(); } catch {}
      };
      const resumeMic = () => {
        speakingRef.current = false;
        if (micOnRef.current) {
          try { recRef.current?.start(); } catch {}
        }
      };
      speak(last.content, 'es-ES', stopMic, resumeMic);
    }
  }, [messages, autoVoice]);

  // --- Llamada al backend ---
  async function askTutorin(userText: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          grade: 'Primaria',
          history,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data: SolveResponse = await res.json();
      const botText = data.steps?.[0]?.text || data.reply || '...';
      const botImg = data.steps?.[0]?.imageUrl || null;
      setMessages((prev) => [...prev, { role: 'assistant', content: botText, imageUrl: botImg }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Ups… no pude responder ahora mismo. ${e?.message || ''}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // --- Envío manual ---
  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    if (!autoVoice) setAutoVoice(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    await askTutorin(text);
  };

  // --- Comandos de voz ---
  const handleVoiceCommand = async (finalText: string) => {
    const text = finalText.trim();
    if (!text) return;

    const low = text.toLowerCase();
    if (/(siguiente|otra pista|siguiente pista)/i.test(low)) {
      setMessages((prev) => [...prev, { role: 'user', content: 'siguiente' }]);
      await askTutorin('siguiente');
      return;
    }
    if (/(repite|repíteme|repitelo|repítelo)/i.test(low)) {
      const last = [...messages].reverse().find((m) => m.role === 'assistant');
      if (last && autoVoice) speak(last.content);
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    await askTutorin(text);
  };

  // --- SR control ---
  const startSR = () => {
    if (!supportsSR) return;
    if (!recRef.current) recRef.current = getSpeechRecognition();

    const rec = recRef.current as any;
    if (!rec) return;

    rec.onresult = (e: any) => {
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalTranscript += r[0].transcript;
      }
      if (finalTranscript.trim()) {
        handleVoiceCommand(finalTranscript);
      }
    };

    rec.onerror = () => {
      if (micOnRef.current && !speakingRef.current) {
        try { rec.start(); } catch {}
      }
    };

    rec.onend = () => {
      if (micOnRef.current && !speakingRef.current) {
        try { rec.start(); } catch {}
      }
    };

    try { rec.start(); } catch {}
  };

  const stopSR = () => {
    try { recRef.current?.stop(); } catch {}
  };

  const onStartClick = async () => {
    setStarted(true);
    setAutoVoice(true);
    setMicOn(true);
    if (supportsSR) startSR();
    setMessages([{ role: 'user', content: 'hola' }]);
    await askTutorin('hola');
  };

  useEffect(() => {
    if (!supportsSR) return;
    if (micOn) startSR(); else stopSR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micOn]);

  useEffect(() => {
    return () => {
      try { recRef.current?.stop(); } catch {}
      if (synth) synth.cancel();
    };
  }, []);

  const nextHint = async () => {
    if (!autoVoice) setAutoVoice(true);
    setMessages((prev) => [...prev, { role: 'user', content: 'siguiente' }]);
    await askTutorin('siguiente');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-3xl mx-auto p-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tutorín</h1>

          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoVoice}
                onChange={(e) => setAutoVoice(e.target.checked)}
              />
              Voz auto
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={micOn}
                onChange={(e) => setMicOn(e.target.checked)}
                disabled={!supportsSR}
              />
              Micrófono {supportsSR ? '' : '(no soportado)'}
            </label>
          </div>
        </header>

        {!started && (
          <div className="mb-6 rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="mb-3">
              Pulsa <strong>Empezar</strong> para que Tutorín te salude, hable y escuche por el micrófono.
            </p>
            <button
              onClick={onStartClick}
              className="rounded-lg bg-blue-600 px-4 py-3 text-white font-medium"
            >
              Empezar
            </button>
          </div>
        )}

        <div className="text-sm text-emerald-700 mb-4">
          Estado API: <span className="font-semibold">OK ✅</span>
        </div>

        {/* Conversación */}
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-2xl p-4 shadow-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white ml-auto max-w-[80%]'
                  : 'bg-slate-50 text-slate-900 mr-auto max-w-[90%]'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

              {m.imageUrl && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.imageUrl}
                    alt="Ilustración de la explicación"
                    className="max-w-full rounded-lg border border-slate-200 cursor-zoom-in"
                    onClick={() => setPreviewUrl(m.imageUrl || null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Controles de texto */}
        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Habla con el micro o escribe aquí y pulsa Enter"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-3 text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Pensando…' : 'Enviar'}
          </button>
          <button
            type="button"
            onClick={nextHint}
            disabled={loading}
            className="rounded-lg bg-slate-200 px-4 py-3 font-medium disabled:opacity-50"
            title="Pide la siguiente pista sin escribir"
          >
            Siguiente
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-500">
          • La voz se activa tras tu primer gesto. El micro se pausa mientras Tutorín habla.  
          • Comandos de voz: <em>“siguiente / otra pista / repite”</em>.
        </p>
      </div>

      {/* Visor de imagen a pantalla completa */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 cursor-zoom-out"
          onClick={() => setPreviewUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Ilustración ampliada"
            className="max-h-[90vh] max-w-[95vw] rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
