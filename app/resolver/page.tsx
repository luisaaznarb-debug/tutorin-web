"use client";

import { useState, useEffect } from "react";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useConversationTTS from "@/hooks/useConversationTTS";

type CoachBlock = {
  type: "Pregunta" | "Pista" | "Respuesta" | "Pista extra";
  text: string;
};

export default function Page() {
  const [steps, setSteps] = useState<CoachBlock[]>([]);
  const [loading, setLoading] = useState(false);

  // 🎤 Escuchar al niño siempre
  useSpeechRecognition({
    onResult: async (childSpeech: string) => {
      console.log("Niño dijo:", childSpeech);

      setLoading(true);

      try {
        // 📡 Enviar al backend
        const res = await fetch("http://127.0.0.1:8000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: childSpeech,
            subject: "matematicas",
            grade: "6",
          }),
        });

        const data = await res.json();
        console.log("Respuesta del backend:", data);

        // 👇 Guardar bloques en el estado
        setSteps((prev) => [...prev, ...data.blocks]);
      } catch (err) {
        console.error("Error al llamar backend:", err);
      } finally {
        setLoading(false);
      }
    },
  });

  // 🔊 Tutorín habla los bloques que va recibiendo
  useConversationTTS(steps);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Tutorín 🤖 Resolutor</h1>
      <p className="text-gray-600">Habla y Tutorín te guiará paso a paso</p>

      {loading && <p className="text-gray-500">Pensando...</p>}

      <div className="space-y-3">
        {steps.map((b, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-lg ${
              b.type === "Pregunta"
                ? "bg-blue-100 text-blue-800 self-start"
                : b.type === "Pista"
                ? "bg-yellow-100 text-yellow-800 self-start"
                : b.type === "Respuesta"
                ? "bg-green-100 text-green-800 self-start"
                : "bg-purple-100 text-purple-800 self-start"
            }`}
          >
            <strong>{b.type}: </strong>
            {b.text}
          </div>
        ))}
      </div>
    </div>
  );
}
