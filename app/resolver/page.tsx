"use client";

import { useState } from "react";
import { ChatMessage, CoachBlock } from "@/types/chat";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useConversationTTS from "@/hooks/useConversationTTS";
import CoachTurn from "@/components/CoachTurn";

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [steps, setSteps] = useState<CoachBlock[]>([]);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Tutorín habla en voz alta
  const lastTutorinMessage =
    messages.length && messages[messages.length - 1].role === "Tutorin"
      ? messages[messages.length - 1].content
      : "";

  useConversationTTS([{ type: "Pregunta", text: lastTutorinMessage }]);

  // Procesar entrada del niño
  const handleChildInput = async (text: string) => {
    setMessages((prev) => [...prev, { role: "Niño", content: text }]);

    if (currentStep === null) {
      // 🆕 Nuevo ejercicio
      setLoading(true);
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          subject: "matemáticas",
          grade: "3º",
        }),
      });

      const data = await res.json();
      setSteps(data.blocks);
      setCurrentStep(0);

      setMessages((prev) => [
        ...prev,
        { role: "Tutorin", content: data.blocks[0].text },
      ]);
      setLoading(false);
    } else {
      // ✅ Verificar respuesta
      const expected = steps[currentStep].text.toLowerCase();
      if (text.toLowerCase().includes(expected)) {
        const nextStep = currentStep + 1;
        if (nextStep < steps.length) {
          setCurrentStep(nextStep);
          setMessages((prev) => [
            ...prev,
            { role: "Tutorin", content: steps[nextStep].text },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "Tutorin", content: "¡Muy bien! Ejercicio terminado 🎉" },
          ]);
          setCurrentStep(null);
        }
      } else {
        // ❌ Dar pista
        setMessages((prev) => [
          ...prev,
          { role: "Tutorin", content: "Piensa otra vez... aquí va una pista 🔍" },
        ]);
      }
    }
  };

  useSpeechRecognition({ onResult: handleChildInput });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tutorin – Resolutor</h1>
      <p className="text-gray-600">Habla y Tutorín te guiará paso a paso</p>

      {loading && <p className="text-gray-500">Pensando...</p>}

      <div className="border p-4 rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Conversación</h2>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 p-2 rounded ${
              m.role === "Tutorin" ? "bg-blue-200 text-left" : "bg-green-200 text-right"
            }`}
          >
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      {steps.length > 0 && (
        <div className="border p-4 rounded bg-white shadow">
          <h2 className="font-semibold mb-2">Pasos del ejercicio</h2>
          <CoachTurn blocks={steps} />
        </div>
      )}
    </div>
  );
}
