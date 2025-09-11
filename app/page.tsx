"use client";

import React, { useEffect, useRef, useState } from "react";
import { InlineMath, BlockMath } from "react-katex";

// =============== KaTeX helpers ===============
function renderWithMath(text: string) {
  const blockParts = text.split(/\$\$([^$]+)\$\$/g);
  const out: React.ReactNode[] = [];
  blockParts.forEach((bp, i) => {
    if (i % 2 === 1) out.push(<BlockMath key={`b${i}`} math={bp.trim()} />);
    else {
      const inline = bp.split(/\$([^$]+)\$/g);
      inline.forEach((ip, j) => {
        if (j % 2 === 1) out.push(<InlineMath key={`i${i}-${j}`} math={ip.trim()} />);
        else if (ip) out.push(<span key={`t${i}-${j}`}>{ip}</span>);
      });
    }
  });
  return <>{out}</>;
}

// Convierte a/b → LaTeX y asegura ×/÷ en modo matemático sin romper **negritas**
function autoLatex(text: string) {
  let t = text;

  // Fracciones simples "a/b" (no URLs)
  t = t.replace(/(?<!\d)(\d{1,3})\s*\/\s*(\d{1,3})(?!\d)/g, (_m, a, b) => `$\\frac{${a}}{${b}}$`);

  // * como multiplicación (pero NO **negritas**)
  t = t.replace(/(?<!\*)\*(?!\*)/g, " $\\times$ ");

  // \times suelto -> modo matemático
  t = t.replace(/\\times/g, "$\\times$");

  // ÷ -> LaTeX
  t = t.replace(/÷/g, " $\\div$ ");

  return t;
}

// =============== Render enriquecido (KaTeX + bloques monoespaciados) ===============
function renderRich(text: string) {
  // Soporta ```bloques``` monoespaciados + KaTeX en el resto
  const parts = text.split(/```([\s\S]*?)```/g);
  const nodes: React.ReactNode[] = [];
  parts.forEach((p, i) => {
    if (i % 2 === 1) {
      nodes.push(
        <pre
          key={`code-${i}`}
          className="font-mono text-[14px] leading-5 bg-gray-900 text-green-100 rounded-lg p-3 overflow-auto"
        >
{p}
        </pre>
      );
    } else {
      nodes.push(<span key={`rich-${i}`}>{renderWithMath(p)}</span>);
    }
  });
  return <>{nodes}</>;
}

// =============== TTS (no leer “1), 2) …” y LaTeX → habla natural) ===============
function powWord(n: string) {
  if (n === "2") return "al cuadrado";
  if (n === "3") return "al cubo";
  return `a la potencia de ${n}`;
}
function latexToSpeech(text: string) {
  let t = text.replace(/^\s*\d+\)\s*/gm, ""); // quita numeración
  t = t.replace(/(?<!\d)(\d{1,3})\s*\/\s*(\d{1,3})(?!\d)/g, (_m, a, b) => `$\\frac{${a}}{${b}}$`);
  t = t.replace(/\$\$?/g, "");
  t = t.replace(/\\frac\{(\d+)\}\{(\d+)\}/g, (_m, a, b) => `${a} sobre ${b}`);
  t = t.replace(/\\times/g, " por ");
  t = t.replace(/([A-Za-z])\s*\^\{?(\d+)\}?/g, (_m, x, n) => `${x} ${powWord(String(n))}`);
  return t;
}
function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(latexToSpeech(text));
    u.lang = "es-ES";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}
async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); } catch {}
}

// =============== Chat UI ===============
type Turn = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Health check
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
    return () => { cancel = true; };
  }, []);

  // Autoscroll bottom
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMsgs((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          grade: "Primaria",
          history: msgs, // historial tipo chat
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const assistant =
        Array.isArray(data?.steps) && data.steps.length
          ? data.steps.map((s: any) => s.text).join("\n\n")
          : String(data?.reply ?? "");
      setMsgs((m) => [...m, { role: "assistant", content: assistant }]);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-8 flex flex-col h-screen">
        <header className="mb-3">
          <h1 className="text-3xl font-bold">Tutorín</h1>
          <p className="text-sm">
            Estado API:{" "}
            {apiOk === null ? "comprobando…" : apiOk ? "OK ✅" : "No puedo conectar con la API 😬"}
          </p>
        </header>

        <div
          ref={listRef}
          className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white p-4 space-y-4"
        >
          {msgs.length === 0 && (
            <div className="text-gray-500 text-sm">
              Escribe tu ejercicio (p. ej.: <em>456 + 789</em>, <em>602 − 458</em>, <em>38 × 7</em>,{" "}
              <em>72341 ÷ 68</em>, <em>2/3 + 5/7</em>, <em>25% de 200</em>…).
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-50 text-gray-900 rounded-bl-sm"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <button
                      onClick={() => speak(m.content)}
                      className="text-xs rounded-md border px-2 py-1 bg-white/60 hover:bg-white"
                      title="Leer"
                    >
                      🔊
                    </button>
                    <button
                      onClick={() => copyText(m.content)}
                      className="text-xs rounded-md border px-2 py-1 bg-white/60 hover:bg-white"
                      title="Copiar"
                    >
                      📋
                    </button>
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  {m.role === "assistant"
                    ? renderRich(autoLatex(m.content))
                    : <span>{m.content}</span>}
                </div>
              </div>
            </div>
          ))}

          {error && (
            <pre className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </pre>
          )}

          {loading && <div className="text-gray-500 text-sm">Pensando…</div>}
        </div>

        <form onSubmit={sendMessage} className="mt-3 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe aquí y pulsa Enter"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </main>
  );
}
