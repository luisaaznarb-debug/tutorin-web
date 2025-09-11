"use client";

import React, { useEffect, useState } from "react";

type Step = { text: string; imageUrl?: string };

export default function Home() {
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

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
    setLoading(true);
    setError(null);
    setSteps([]);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(), // <-- el backend espera "message"
          grade: "Primaria",
        }),
      });

      if (!res.ok) {
        // muestra detalle del backend (FastAPI validation, etc.)
        const text = await res.text();
        throw new Error(text || "Error pidiendo pistas");
      }

      const data = await res.json();
      // Compatibilidad: {steps:[{text,...}]} o {reply:"..."}
      const normalized: Step[] = Array.isArray(data?.steps)
        ? data.steps
        : data?.reply
        ? [{ text: String(data.reply) }]
        : [];

      if (!normalized.length) {
        throw new Error("Respuesta vacía del servidor.");
      }

      setSteps(normalized);
    } catch (e: any) {
      setError(e?.message ?? "Algo salió mal");
    } finally {
      setLoading(false);
    }
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
            placeholder="Escribe tu ejercicio (ej.: ¿cuánto es 2/3 + 3/8?)"
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
                <div className="text-sm text-gray-500 mb-1">Tutorín</div>
                <p className="leading-relaxed">{s.text}</p>
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
      </div>
    </main>
  );
}
