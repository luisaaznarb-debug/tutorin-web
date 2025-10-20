import React, { useState, useRef, useEffect } from "react";

type ChatMsg = { role: "user" | "tutorin"; text: string };
type SolveResponse = {
  exercise_id?: string;
  status: "ask" | "feedback" | "done";
  step: number;
  error_count: number;
  message: string;
  expected_answer?: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000").replace(/\/+$/, "");

export default function SolveDebugPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "tutorin", text: "👋 ¡Hola! Soy Tutorín. Dime un ejercicio y te ayudo paso a paso." },
  ]);
  const [input, setInput] = useState("");
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cycle, setCycle] = useState<"c1" | "c2" | "c3">("c2"); // ✅ ciclo

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function callSolve(body: { question: string; last_answer: string; exercise_id: string | null }) {
    const res = await fetch(`${API_BASE}/api/solve/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, cycle }),
    });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    const data: SolveResponse = await res.json();
    return data;
  }

  async function onSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);

    try {
      if (!exerciseId) {
        // Primer turno: nueva consigna
        const initialQ = text;
        const data = await callSolve({ question: initialQ, last_answer: "", exercise_id: null });
        setQuestion(initialQ);
        if (data.exercise_id) setExerciseId(data.exercise_id);
        setMessages((m) => [...m, { role: "tutorin", text: data.message }]);
        if (data.status === "done") {
          setExerciseId(null);
          setQuestion(null);
        }
      } else {
        // Turnos siguientes: respuestas del alumno
        const data = await callSolve({
          question: question || "",
          last_answer: text,
          exercise_id: exerciseId,
        });
        setMessages((m) => [...m, { role: "tutorin", text: data.message }]);
        if (data.status === "done") {
          setExerciseId(null);
          setQuestion(null);
        }
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "tutorin", text: `⚠️ Problema con la API: ${err.message || err}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function resetExercise() {
    setExerciseId(null);
    setQuestion(null);
    setMessages([
      { role: "tutorin", text: "🔄 Nuevo ejercicio: escribe tu problema y lo resolvemos juntos." },
    ]);
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "20px auto",
        padding: "0 16px",
        fontFamily: "system-ui, Arial",
      }}
    >
      <h1>Tutorín — Prueba directa de /solve</h1>
      <div style={{ margin: "12px 0", fontSize: 14, opacity: 0.7 }}>
        API: <code>{API_BASE}/solve/</code>{" "}
        {exerciseId ? ` | ejercicio: ${exerciseId}` : ""}
      </div>

      {/* ✅ selector de ciclo */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <label>Ciclo:</label>
        <select value={cycle} onChange={(e) => setCycle(e.target.value as any)}>
          <option value="c1">C1 (1.º–2.º Primaria)</option>
          <option value="c2">C2 (3.º–4.º Primaria)</option>
          <option value="c3">C3 (5.º–6.º Primaria)</option>
        </select>
      </div>

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          minHeight: 240,
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "8px 0" }}>
            {m.role === "user" ? (
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "#2f6feb",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 16,
                    maxWidth: "80%",
                  }}
                >
                  {m.text}
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "inline-block",
                  background: "#f3f6fb",
                  color: "#111",
                  padding: "10px 12px",
                  borderRadius: 12,
                  maxWidth: "80%",
                }}
                dangerouslySetInnerHTML={{ __html: m.text }}
              />
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder={
            exerciseId
              ? "Escribe tu respuesta…"
              : "Escribe tu ejercicio (p. ej. 324/2, 2/3 + 4/8)…"
          }
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #ddd",
            outline: "none",
          }}
          disabled={busy}
        />
        <button
          onClick={onSend}
          disabled={busy}
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            border: "none",
            background: busy ? "#9bb7ff" : "#2f6feb",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {busy ? "Enviando…" : "Enviar"}
        </button>
        <button
          onClick={resetExercise}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Nuevo ejercicio
        </button>
      </div>
    </div>
  );
}
