'use client';
import { useState } from 'react';

type Step = { title: string; detail?: string };

export default function Home() {
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          text: input,       // ← lo que escribió el usuario
          grade: "Primaria"  // ← opcional; tu backend lo acepta
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Error pidiendo pistas");
      }

      const data = await res.json(); // { steps: [...] }
      setSteps(data.steps || []);
    } catch (e: any) {
      setError(e.message || "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Tutorín</h1>
      <p className="text-gray-600 mb-6">Estado API: (usa tu indicador si lo tienes)</p>

      <form onSubmit={onSubmit} className="flex gap-2 mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu ejercicio…"
          className="flex-1 rounded-xl border px-4 py-3"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-blue-600 text-white disabled:opacity-50"
        >
          {loading ? "Pensando…" : "Pedir pistas"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {steps.length > 0 && (
        <ol className="list-decimal ml-5 space-y-3">
          {steps.map((s, i) => (
            <li key={i}>
              <p className="font-medium">{s.title}</p>
              {s.detail && <p className="text-gray-700">{s.detail}</p>}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}