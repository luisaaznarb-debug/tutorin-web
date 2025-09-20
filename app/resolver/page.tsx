"use client";

import { useState } from "react";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

export default function Page() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [started, setStarted] = useState(false);

  const [input, setInput] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // 🎙️ Escucha lo que dice el niño
  useSpeechRecognition({
    onResult: async (text: string) => {
      if (!started || !text) return;
      await sendMessage(text);
    },
  });

  // 📩 Función para enviar mensaje
  const sendMessage = async (text: string) => {
    setMessages((prev) => [...prev, { role: "Niño", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: text }],
          subject,
          grade,
        }),
      });

      if (!res.ok) throw new Error("Error en la API");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "Tutorín", content: data.reply }]);

      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.play();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✍️ Enviar mensaje desde el input
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <main className="flex flex-col h-screen max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Tutorín 👩‍🏫</h1>

      {/* Chat box */}
      <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`my-2 p-2 rounded-xl max-w-[80%] ${
              msg.role === "Niño"
                ? "bg-blue-500 text-white self-end ml-auto"
                : "bg-gray-200 text-black self-start mr-auto"
            }`}
          >
            <p className="text-sm font-semibold">{msg.role}</p>
            <p>{msg.content}</p>
          </div>
        ))}
        {loading && <p className="text-gray-500">⏳ Tutorín está pensando...</p>}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-lg p-2"
          placeholder="Escribe algo..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}
