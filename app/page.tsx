"use client";

import React, { useEffect, useMemo, useState } from "react";
import { InlineMath, BlockMath } from "react-katex";

type Step = { text: string; imageUrl?: string };
type SavedEntry = { q: string; a: string; ts: number };
type Turn = { role: "user" | "assistant"; content: string };

const RECENT_KEY = "tutorin:recent";

// =============== Helpers de render (KaTeX) ===============
function renderWithMath(text: string) {
  const blockParts = text.split(/\$\$([^$]+)\$\$/g);
  const out: React.ReactNode[] = [];
  blockParts.forEach((bp, i) => {
    if (i % 2 === 1) {
      out.push(<BlockMath key={`b${i}`} math={bp.trim()} />);
    } else {
      const inlineParts = bp.split(/\$([^$]+)\$/g);
      inlineParts.forEach((ip, j) => {
        if (j % 2 === 1) out.push(<InlineMath key={`i${i}-${j}`} math={ip.trim()} />);
        else if (ip) out.push(<span key={`t${i}-${j}`}>{ip}</span>);
      });
    }
  });
  return <>{out}</>;
}

// Convierte fracciones simples "a/b" a LaTeX y mejora notación
function autoLatex(text: string) {
  return text
    .replace(
      /(?<!\d)(\d{1,3})\s*\/\s*(\d{1,3})(?!\d)/g,
      (_m, a, b) => `$\\frac{${a}}{${b}}$`
    )
    .replace(/\*/g, " \\times ");
}

// Separa texto con "1) ... 2) ... 3) ..." en pasos
function splitNumbered(text: string): string[] {
  const parts = text.split(/\d\)\s/g).filter(Boolean);
  return parts.length ? parts.map((t, i) => `${i + 1}) ${t.trim()}`) : [text];
}

// =============== Helpers de voz (TTS) ===============
function powWord(n: string) {
  if (n === "2") return "al cuadrado";
  if (n === "3") return "al cubo";
  return `a la potencia de ${n}`;
}

// Convierte LaTeX → frase hablada en español
function latexToSpeech(text: string) {
  // Primero aseguramos LaTeX para fracciones simples
  let t = autoLatex(text);
  // Quitamos delimitadores $...$
  t = t.replace(/\$\$?/g, "");
  // \frac{a}{b} -> "a sobre b"
  t = t.replace(/\\frac\{(\d+)\}\{(\d+)\}/g, (_m, a, b) => `${a} sobre ${b}`);
  // \times -> "por"
  t = t.replace(/\\times/g, " por ");
  // x^{2} / x^2 -> "x al cuadrado/cubo/…"
  t = t.replace(/([A-Za-z])\s*\^\{?(\d+)\}?/g, (_m, x, n) => `${x} ${powWord(String(n))}`);
  // subíndices (muy simple)
  t = t.replace(/_({)?(\d+)(})?/g, (_m, _o, n) => ` sub ${n}`);
  return t;
}

function speak(text: string) {
  try {
    const plain = latexToSpeech(text);
    const u = new SpeechSynthesisUtterance(plain);
    u.lang = "es-ES";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
}

// =============== Componente principal ===============
export default function Home() {
  // Entrada actual
  const [input, setInput] = useState("");
  // Pasos que muestra Tutorín para el turno corriente
  const [steps, setSteps] = useState<Step[]>([]);
  // Diálogo acumulado de la sesión (para enviar como history al backend)
  const [dialog, setDialog] = useState<Turn[]>([]);
  // Respuesta del niño a la última pregunta
  const [reply, setReply] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  // Últimas consultas guardadas localmente (no conversación)
  const [recent, setRecent] = useState<SavedEntry[]>([]);

  // Cargar recientes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  // Chequeo de salud del backend
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        if (!cancel) setApiOk(r.ok);
      } catch {
        if (!cancel) setApiOk(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // Detecta si el último paso contiene una pregunta
  const lastQuestion: string | null = useMemo(() => {
    for (let i = steps.length - 1; i >= 0; i--) {
      const t = steps[i].text;
      if (t.includes("?")) {
        // devuelve la última frase con "?"
        const parts = t.split(/(?<=\?)/);
        const last = parts.filter(Boolean).pop();
        if (last && last.trim().endsWith("?")) return last.trim();
        return t.trim();
      }
    }
    return null;
  }, [steps]);

  // ---- Enviar ejercicio inicial ----
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setSteps([]);
    setDialog([]); // resetea conversación de esta sesión

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          grade: "Primaria",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error pidiendo pistas");
      }

      const data = await res.json();
      const normalized: Step[] = Array.isArray(data?.steps)
        ? data.steps
        : data?.reply
        ? splitNumbered(String(data.reply)).map((t) => ({ text: t }))
        : [];
      if (!normalized.length) throw new Error("Respuesta vacía del servidor.");

      setSteps(normalized);

      // Actualiza diálogo: turno del alumno + respuesta del tutor
      const assistantJoined = normalized.map((s) => s.text).join("\n");
      setDialog([
        { role: "user", content: input.trim() },
        { role: "assistant", content: assistantJoined },
      ]);

      // Guardar en recientes (máx. 5)
      try {
        const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as SavedEntry[];
        const next = [
          { q: input.trim(), a: assistantJoined, ts: Date.now() },
          ...prev,
        ].slice(0, 5);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        setRecent(next);
      } catch {}
    } catch (e: any) {
      setError(e?.message ?? "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  // ---- Responder a la pregunta de Tutorín (turno del niño) ----
  async function onReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: reply.trim(),
          grade: "Primaria",
          history: dialog, // ← contexto acumulado
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error enviando respuesta del niño");
      }

      const data = await res.json();
      const normalized: Step[] = Array.isArray(data?.steps)
        ? data.steps
        : data?.reply
        ? splitNumbered(String(data.reply)).map((t) => ({ text: t }))
        : [];
      if (!normalized.length) throw new Error("Respuesta vacía del servidor.");

      setSteps(normalized);

      // Añade turnos: niño y nuevo turno del tutor
      const assistantJoined = normalized.map((s) => s.text).join("\n");
      setDialog((prev) => [
        ...prev,
        { role: "user", content: reply.trim() },
        { role: "assistant", content: assistantJoined },
      ]);

      setReply("");
    } catch (e: any) {
      setError(e?.message ?? "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  // Borrar recientes (no borra la conversación en curso)
  function clearRecent() {
    try {
      localStorage.removeItem(RECENT_KEY);
      setRecent([]);
    } catch {}
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-4xl font-bold mb-2">Tutorín</h1>

        <p className="text-sm mb-6">
          Estado API:{" "}
          {apiOk === null ? (
            <span>comprobando…</span>
          ) : apiOk ? (
            <span className="text-emerald-600 font-medium">OK ✅</span>
          ) : (
            <span className="text-rose-600 font-medium">
              No puedo conectar con la API 😬
            </span>
          )}
        </p>

        {/* Formulario de ejercicio inicial */}
        <form onSubmit={onSubmit} className="flex gap-3 mb-6">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu ejercicio (ej.: ¿cuánto es 2/3 + 5/7?)"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Pensando…" : "Pedir pistas"}
          </button>
        </form>

        {error && (
          <pre className="whitespace-pre-wrap text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3 mb-6">
            {error}
          </pre>
        )}

        {/* Pasos actuales */}
        {steps.length > 0 && (
          <section className="space-y-4">
            {steps.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-gray-500">Tutorín</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => speak(s.text)}
                      className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                      title="Leer con voz"
                    >
                      🔊 Leer
                    </button>
                    <button
                      type="button"
                      onClick={() => copy(s.text)}
                      className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                      title="Copiar paso"
                    >
                      📋 Copiar
                    </button>
                  </div>
                </div>

                <div className="leading-relaxed">
                  {renderWithMath(autoLatex(s.text))}
                </div>

                {s.imageUrl && (
                  <img
                    src={s.imageUrl}
                    alt={`Paso ${i + 1}`}
                    className="mt-3 rounded-lg border"
                  />
                )}
              </div>
            ))}
          </section>
        )}

        {/* Respuesta del niño si hay pregunta */}
        {steps.length > 0 && lastQuestion && (
          <form onSubmit={onReply} className="mt-5 rounded-xl border p-3">
            <div className="text-sm text-gray-600 mb-2">
              🧩 Pregunta de Tutorín:{" "}
              <span className="font-medium">{lastQuestion}</span>
            </div>
            <div className="flex gap-3">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Escribe tu respuesta aquí"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !reply.trim()}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                Responder
              </button>
            </div>
          </form>
        )}

        {/* Últimas consultas (recientes) */}
        {recent.length > 0 && (
          <aside className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Últimas consultas</h2>
              <button
                type="button"
                onClick={clearRecent}
                className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                title="Borrar historial"
              >
                🗑️ Borrar
              </button>
            </div>
            <ul className="space-y-2">
              {recent.map((h, i) => (
                <li key={h.ts} className="flex items-center justify-between rounded-lg border p-3">
                  <button
                    className="text-left truncate mr-3 hover:underline"
                    title={h.q}
                    onClick={() => setInput(h.q)}
                  >
                    {i + 1}. {h.q}
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                      onClick={() => speak(h.a)}
                      title="Leer respuesta"
                    >
                      🔊
                    </button>
                    <button
                      className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                      onClick={() => copy(h.a)}
                      title="Copiar respuesta"
                    >
                      📋
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </main>
  );
}
