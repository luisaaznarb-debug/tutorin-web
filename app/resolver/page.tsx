"use client";

import { useState, useEffect } from "react";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useConversationTTS from "@/hooks/useConversationTTS";
import ChatBubble from "@/components/ChatBubble";

interface ChatMessage {
  role: "Niño" | "Tutorin";
  content: string;
}

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // 🎤 Escucha siempre lo que dice el niño
  useSpeechRecognition({
    onResult: async (text: string) => {
      if (!text) return;

      setMessages((prev) => [...prev, { role: "Niño", content: text }]);

      setLoading(true);
      try {
        const res = await fetch("/backend/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...messages, { role: "Niño", content: text }] }),
        });

        const data = await res.json();
        if (data.reply) {
          setMessages((prev) => [...prev, { role: "Tutorin", content: data.reply }]);
        }
      } catch (err) {
        console.error("Error al enviar mensaje:", err);
      }
      setLoading(false);
    },
  });

  // 🗣️ Tutorin lee en voz alta su último mensaje
  const lastTutorinMessage =
    messages.length && messages[messages.length - 1].role === "Tutorin"
      ? messages[messages.length - 1].content
      : "";
  useConversationTTS([{ type: "Pista", text: lastTutorinMessage }]);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Tutorín – Resolutor</h1>
      <p className="text-gray-600">Habla y Tutorín te guiará paso a paso</p>

      <div className="border p-4 rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Conversación</h2>
        <div className="space-y-2">
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && <p className="text-sm text-gray-500">Tutorín está pensando...</p>}
        </div>
      </div>
    </main>
  );
}
