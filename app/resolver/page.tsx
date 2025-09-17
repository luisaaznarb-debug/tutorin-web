"use client";

import { useRef, useState } from "react";
import AACPanel from "@/components/AACPanel";
import { useSearchParams } from "next/navigation";
import type { ChatMessage, CoachResponse } from "@/types/chat";
import CoachTurn from "@/components/CoachTurn";
import { chatCoach } from "@/lib/api";

type Turn =
  | { role: "user"; text: string }
  | { role: "assistant"; coach: CoachResponse };

export default function Page() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState("1º");
  const [thread, setThread] = useState<Turn[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // historial “clásico” para el backend

  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();
  const subject = searchParams?.get("subject") ?? "general";

  const lastAssistantMessage =
    thread.length && thread[thread.length - 1].role === "assistant"
      ? (thread[thread.length - 1] as any).coach.blocks
          .map((b: any) => b.text)
          .join(" ")
      : "";

  const sendMessage = async (forced?: string) => {
    const payload = (forced ?? text).trim();
    if (!payload) return;

    setBusy(true);
    setText("");
    setThread((t) => [...t, { role: "user", text: payload }]);
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: payload },
    ];
    setMessages(nextMessages);

    try {
      const coach = await chatCoach({
        messages: nextMessages,
        subject,
        grade,
        maxHints: 2,
      });
      setThread((t) => [...t, { role: "assistant", coach }]);
      // guardamos un mensaje “plano” solo por historial
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: coach.blocks.map((b) => b.text).join("\n") },
      ]);
    } catch (e: any) {
      setThread((t) => [
        ...t,
        {
          role: "assistant",
          coach: { blocks: [{ type: "answer", text: "Ups, hubo un problema con el servidor." }] },
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
        <div className="p-5 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold">Conversación</h2>
          {thread.length === 0 && (
            <p className="text-slate-600">Aún no hay mensajes. ¡Escribe tu primera pregunta! 😊</p>
          )}
          <div className="space-y-6">
            {thread.map((t, i) =>
              t.role === "user" ? (
                <div key={i} className="rounded-xl border p-3 bg-slate-50">
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">User</div>
                  <div>{t.text}</div>
                </div>
              ) : (
                <div key={i} className="rounded-xl border p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Tutorin</div>
                  <CoachTurn blocks={t.coach.blocks} />
                </div>
              )
            )}
          </div>
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
