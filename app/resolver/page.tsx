"use client";

import { useEffect, useState } from "react";
import ChatBubble from "@/components/ChatBubble";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { startListening, stopListening } = useSpeechRecognition({
    onResult: (text) => handleUserMessage(text),
  });

  // 📌 Detectar materia desde la URL
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const subject = searchParams.get("subject") || "matemáticas";

  // 📌 Saludo inicial personalizado
  useEffect(() => {
    const saludo = `¡Hola! Soy Tutorín, tu profe virtual de ${subject}. ¿Quieres que empecemos con un reto de ${subject}?`;
    setMessages([{ role: "assistant", content: saludo }]);

    // 🔹 También generamos el audio con el backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "assistant", content: saludo }],
        subject,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.audio) {
          const audio = new Audio("data:audio/mp3;base64," + data.audio);
          audio.play();
        }
      });
  }, [subject]);

  const handleUserMessage = async (text: string) => {
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, { role: "user", content: text }],
        subject,
      }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    setLoading(false);

    if (data.audio) {
      const audio = new Audio("data:audio/mp3;base64," + data.audio);
      audio.play();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-4">Tutorín 🧑‍🏫</h1>

      <div className="border rounded-xl p-4 h-[70vh] overflow-y-auto bg-white shadow">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && <p className="text-gray-500">Tutorín está pensando...</p>}
      </div>

      <div className="flex gap-2 mt-4 justify-center">
        <button
          onClick={startListening}
          className="bg-green-500 text-white px-4 py-2 rounded-lg shadow"
        >
          🎤 Activar micrófono
        </button>
        <button
          onClick={stopListening}
          className="bg-red-500 text-white px-4 py-2 rounded-lg shadow"
        >
          🛑 Detener micrófono
        </button>
      </div>
    </div>
  );
}
