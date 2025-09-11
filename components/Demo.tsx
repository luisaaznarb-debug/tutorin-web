
'use client';
import React, { useRef, useState } from "react";

type Step = { title: string; detail?: string };

export default function Demo() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Flag: activar TTS ElevenLabs desde el backend si lo tienes implementado
  const useElevenLabs = false;

  const onSubmit = async () => {
    setError(null);
    if (!text && !fileRef.current?.files?.length) {
      setError("Escribe una duda o sube una imagen del ejercicio.");
      return;
    }
    const formData = new FormData();
    formData.append("text", text);
    if (fileRef.current?.files?.[0]) {
      formData.append("image", fileRef.current.files[0]);
    }
    setLoading(true);
    setSteps([]);
    setAudioUrl(null);
    try {
      const r = await fetch("/api/solve", { method: "POST", body: formData });
      if (!r.ok) throw new Error("Backend no disponible");
      const data = await r.json();
      // Esperamos { steps: [{title, detail}], audioUrl? }
      setSteps(data.steps || []);
      if (useElevenLabs && data.audioUrl) setAudioUrl(data.audioUrl);
    } catch (e: any) {
      setError(e.message || "Algo salió mal");
    } finally {
      setLoading(false);
    }
  };

  // Voz sin claves: Web Speech API (si existe)
  const speak = () => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return alert("La voz no está disponible en este navegador.");
    const textToSpeak =
      steps.map((s, i) => `Paso ${i + 1}: ${s.title}. ${s.detail || ""}`).join(" ");
    const utter = new SpeechSynthesisUtterance(textToSpeak || "No hay pasos todavía.");
    synth.speak(utter);
  };

  return (
    <section id="demo" className="py-16">
      <h2 className="text-2xl font-semibold text-center">Prueba la demo</h2>
      <div className="mt-6 rounded-2xl border p-6 max-w-2xl mx-auto">
        <div className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe aquí tu ejercicio…"
            className="min-h-[100px] rounded-xl border px-4 py-3"
          />
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" />
            <button onClick={onSubmit} className="px-5 py-3 rounded-xl bg-green-600 text-white">
              {loading ? "Pensando…" : "Pedir pistas"}
            </button>
            <button onClick={speak} className="px-5 py-3 rounded-xl border">Leer con voz</button>
            {audioUrl && (
              <audio controls src={audioUrl} className="ml-auto">
                Tu navegador no soporta audio.
              </audio>
            )}
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {steps.length > 0 && (
            <ol className="mt-6 space-y-3">
              {steps.map((s, i) => (
                <li key={i} className="rounded-xl border p-4">
                  <p className="font-medium">Paso {i + 1}: {s.title}</p>
                  {s.detail && <p className="text-gray-600 mt-1">{s.detail}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
