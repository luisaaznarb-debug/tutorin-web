"use client";

import { useState } from "react";
import { ChatMessage, CoachBlock } from "@/types/chat";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useConversationTTS from "@/hooks/useConversationTTS";

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [steps, setSteps] = useState<CoachBlock[]>([]);
  const [currentStep, setCurrentStep] = useState<CoachBlock | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔊 Último mensaje de Tutorin para leerlo en voz alta
  const lastTutorinMessage =
    messages.length && messages[messages.length - 1].role === "Tutorin"
      ? messages[messages.length - 1].text
      : "";

  useConversationTTS([
    { type: "Pista", text: lastTutorinMessage }, // siempre entra como bloque válido
  ]);

  // 🎤 Procesar entrada del niño con reconocimiento de voz
  useSpeechRecognition({
    onResult: async (text: string) => {
      setMessages((prev) => [...prev, { role: "Niño", text }]);

      try {
        // 1️⃣ Si no hay problema en curso → generar uno nuevo
        if (currentStep === null) {
          setLoading(true);
          const res = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages,
              subject: "matematicas",
              grade: "6",
            }),
          });

          const data = await res.json();
          setSteps(data.blocks);
          setCurrentStep(data.blocks[0]);

          setMessages((prev) => [
            ...prev,
            {
              role: "Tutorin",
              text: `Problema: ${data.blocks[0].text}. Pista: ${data.blocks[1]?.text || ""}`,
            },
          ]);
        } else {
          // 2️⃣ Si ya hay un problema en curso → comprobar respuesta
          if (text.toLowerCase().includes(currentStep.text.toLowerCase())) {
            // ✅ Respuesta correcta → pasar al siguiente paso
            const nextIndex = steps.indexOf(currentStep) + 1;
            if (nextIndex < steps.length) {
              setCurrentStep(steps[nextIndex]);
              setMessages((prev) => [
                ...prev,
                { role: "Tutorin", text: `¡Bien! ${steps[nextIndex].text}` },
              ]);
            } else {
              // 🏁 Ejercicio terminado
              setMessages((prev) => [
                ...prev,
                { role: "Tutorin", text: "¡Genial! Hemos terminado este ejercicio. 🎉" },
              ]);
              setCurrentStep(null);
              setSteps([]);
            }
          } else {
            // ❌ Respuesta incorrecta → dar otra pista
            setMessages((prev) => [
              ...prev,
              { role: "Tutorin", text: `No exactamente. Pista: ${currentStep.text}` },
            ]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Tutorin 🧩 Resolutor</h1>
      <p className="text-gray-600">Habla y Tutorin te guiará paso a paso</p>

      {loading && <p className="text-gray-500">Pensando...</p>}

      <div className="space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-xs ${
              m.role === "Niño"
                ? "bg-blue-200 text-left ml-auto"
                : "bg-green-200 text-left"
            }`}
          >
            <strong>{m.role}:</strong> {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}
