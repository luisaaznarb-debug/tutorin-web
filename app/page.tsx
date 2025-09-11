"use client";

import React, { useEffect, useState } from "react";
import { InlineMath, BlockMath } from "react-katex";

type Step = { text: string; imageUrl?: string };
type SavedEntry = { q: string; a: string; ts: number };

const STORAGE_KEY = "tutorin:history";

// ---- Helpers UI ----
function speak(text: string) {
  try {
    // quita LaTeX ($...$ y $$...$$) para que la voz no lea comandos
    const withoutBlocks = text.replace(/\$\$[^$]+\$\$/g, "");
    const plain = withoutBlocks.replace(/\$[^$]+\$/g, "");
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

// Convierte $...$ (inline) y $$...$$ (bloque) a componentes KaTeX
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

// Convierte fracciones simples "a/b" a $\frac{a}{b}$ y mejora notación
function autoLatex(text: string) {
  return text
    .replace(
      /(?<!\d)(\d{1,3})\s*\/\s*(\d{1,3})(?!\d)/g,
      (_m, a, b) => `$\\frac{${a}}{${b}}$`
    )
    .replace(/\*/g, " \\times ");
}

// Divide un texto tipo "1) ... 2) ... 3) ..." en pasos
function splitNumbered(text: string): string[] {
  const parts = text.split(/\d\)\s/g).filter(Boolean);
  return parts.length ? parts.map((t, i) => `${i + 1}) ${t.trim()}`) : [text];
}

export default function Home() {
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [history, setHistory] = useState<SavedEntry[]>([]);

  // Carga historial local
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  // Chequeo de salud del backend (vía proxy /api/health)
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setSteps([]);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(), // el backend espera "message"
          grade: "Primaria",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error pidiendo pistas");
      }

      const data = await res.json();

      // Normaliza a steps[] aunque venga {reply:"..."}
      const normalized: Step[] = Array.isArray(data?.steps)
        ? data.steps
        : data?.reply
        ? splitNumbered(String(data.reply)).map((t) => ({ text: t }))
        : [];

      if (!normalized.length) {
        throw new Error("Respuesta vacía del servidor.");
      }

      setSteps(normalized);

      // ---- Guardar historial (máx. 5) ----
      try {
        const joined = normalized.map((s) => s.text).join("\n");
        const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SavedEntry[];
        const next = [{ q: input.trim(), a: joined, ts: Date.now() }, ...prev].slice(0, 5);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setHistory(next);
      } catch {}
    } catch (e: any) {
      setError(e?.message ?? "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
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

        {/* Historial local */}
        {history.length > 0 && (
          <aside className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Últimas consultas</h2>
              <button
                type="button"
                onClick={clearHistory}
                className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                title="Borrar historial"
              >
                🗑️ Borrar
              </button>
            </div>
            <ul className="space-y-2">
              {history.map((h, i) => (
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
