"use client";

import { useRef, useState } from "react";
import AACPanel from "@/components/AACPanel";
import { useSearchParams } from "next/navigation";

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export default function Page() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState("1º");

  // 👇 El ref inicia en null
  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchParams = useSearchParams();
  const subject = searchParams?.get("subject") ?? "general";

  const lastAssistantMessage =
    messages[messages.length - 1]?.role === "assistant"
      ? messages[messages.length - 1].content
      : "";

  const sendMessage = async (forcedText?: string) => {
    const payload = (forcedText ?? text).trim();
    if (!payload) return;

    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", content: payload }]);
    setText("");

    try {
      // TODO: reemplazar por tu fetch real al backend en Railway
      const reply = `Recibí tu mensaje sobre "${subject}" (grado ${grade}): ${payload}`;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ups, hubo un problema al contactar con el servidor.",
        },
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const onCommand = (cmd: string) => {
    if (cmd === "limpiar") setText("");
    else if (cmd === "enviar") sendMessage();
    else if (cmd) {
      setText(cmd);
      sendMessage(cmd);
    }
  };

  return (
    <main className="container mx-auto space-y-6 py-6">
      <header className="mb-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Tutorin – Resolutor</h1>
        <p className="text-slate-600 mt-1">Resuelve dudas con un panel accesible para niños</p>
      </header>

      <section className="rounded-2xl border bg-white shadow-soft">
        <div className="p-5 md:p-6 grid gap-5 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold">Tema</h2>
            <p className="text-slate-600 mt-1 capitalize">{subject}</p>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold mb-2">Mensaje</h2>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Escribe tu duda…"
                disabled={busy}
              />
              <button
                onClick={() => sendMessage()}
                disabled={busy}
                className="rounded-xl px-4 py-2 border bg-black text-white disabled:opacity-60"
              >
                {busy ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white shadow-soft">
        <div className="p-5 md:p-6">
          <h2 className="text-lg font-semibold mb-3">Conversación</h2>
          <ul className="space-y-3">
            {messages.map((m, i) => (
              <li key={i} className="rounded-xl border p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">{m.role}</div>
                <div className="mt-1">{m.content}</div>
              </li>
            ))}
            {messages.length === 0 && (
              <li className="text-slate-600">
                Aún no hay mensajes. ¡Escribe tu primera pregunta! 😊
              </li>
            )}
          </ul>
        </div>
      </section>

      <AACPanel
        onCommand={onCommand}
        lastAssistantMessage={lastAssistantMessage}
        grade={grade}
        setGrade={setGrade}
        setMessages={setMessages}
        setBusy={setBusy}
        inputRef={inputRef}
        setText={setText}
        sendMessage={sendMessage}
      />
    </main>
  );
}
