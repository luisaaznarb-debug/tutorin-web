import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "../components/ChatBubble";
import { callSolve, playBase64Audio, analyzePrompt } from "../services/tutorinApi";

// Chat educativo conectado a /solve por pasos.
export default function TutorinDialogPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "👋 ¡Hola! Soy Tutorín. Dime un ejercicio y te ayudo paso a paso." },
  ]);

  // Estado del ejercicio
  const [exerciseId, setExerciseId] = useState(null);
  const [question, setQuestion] = useState(null);

  // UI
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("es");
  const [cycle, setCycle] = useState("c2");           // ✅ selector de ciclo: c1|c2|c3
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const chatRef = useRef(null);

  // Scroll al final
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // ====== Voz del navegador (opcional) ======
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "es" ? "es-ES" : "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
      }
      if (finalText) handleSend(finalText.trim());
    };

    recognitionRef.current = recognition;
  }, [lang]);

  const startListening = () => !exerciseId && recognitionRef.current?.start();
  const stopListening  = () => recognitionRef.current?.stop();

  // ====== Envío de mensajes ======
  async function handleSend(contentOverride = "") {
    const override = typeof contentOverride === "string" ? contentOverride.trim() : "";
    const content = override || input.trim();
    if (!content || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: content }]);
    setInput("");
    setLoading(true);

    try {
      if (!exerciseId) {
        // 1) Iniciar ejercicio en /solve (enviamos también cycle)
        const initialQ = content;
        const res = await callSolve({ question: initialQ, last_answer: "", exercise_id: null, cycle });
        setQuestion(initialQ);
        if (res.exercise_id) setExerciseId(res.exercise_id);

        const reply = res.message || "He iniciado el ejercicio.";
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        if (res.audio_b64) playBase64Audio(res.audio_b64);
        if (res.status === "done") { setExerciseId(null); setQuestion(null); }
      } else {
        // 2) Responder paso actual (enviamos también cycle)
        const res = await callSolve({
          question: question || "",
          last_answer: content,
          exercise_id: exerciseId,
          cycle,
        });

        const reply = res.message || "Sigamos.";
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        if (res.audio_b64) playBase64Audio(res.audio_b64);
        if (res.status === "done") { setExerciseId(null); setQuestion(null); }
      }
    } catch (err) {
      console.error("❌ Error en Tutorín:", err);
      setMessages((prev) => [...prev, { role: "assistant", text: "Error al conectar con Tutorín 😕" }]);
    } finally {
      setLoading(false);
    }
  }

  // Analizador (solo si NO hay ejercicio activo)
  async function handleAnalyze() {
    if (exerciseId) return;
    const content = input.trim();
    if (!content) return;
    setMessages((p) => [...p, { role: "user", text: content }]);
    setInput(""); setLoading(true);
    try {
      const data = await analyzePrompt({ prompt: content, step: 0, answer: "", errors: 0, lang });
      const reply = data?.response?.message || data?.message || "¿Probamos paso a paso?";
      setMessages((p) => [...p, { role: "assistant", text: reply }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", text: "No he podido analizarlo. Escribe el ejercicio tal cual (p. ej. 324/2)." }]);
    } finally { setLoading(false); }
  }

  function resetExercise() {
    setExerciseId(null);
    setQuestion(null);
    setMessages([{ role: "assistant", text: "🔄 Nuevo ejercicio: escríbelo y lo resolvemos paso a paso." }]);
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img alt="Tutorín" src="/tutorin.png" width="36" height="36" style={{ borderRadius: 8 }} />
          <h1 style={styles.title}>Tutorín — Diálogo educativo</h1>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#374151" }}>
            Idioma:{" "}
            <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding: "4px 6px" }}>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>

          {/* ✅ Selector de ciclo */}
          <label style={{ fontSize: 13, color: "#374151" }}>
            Ciclo:{" "}
            <select value={cycle} onChange={(e) => setCycle(e.target.value)} style={{ padding: "4px 6px" }}>
              <option value="c1">C1 (1.º–2.º)</option>
              <option value="c2">C2 (3.º–4.º)</option>
              <option value="c3">C3 (5.º–6.º)</option>
            </select>
          </label>

          <button
            type="button"
            onClick={listening ? () => stopListening() : () => startListening()}
            disabled={!!exerciseId}
            title={exerciseId ? "Termina el ejercicio para usar voz" : "Hablar"}
            style={!!exerciseId ? styles.btnDisabled : (listening ? styles.micActive : styles.mic)}
          >
            {listening ? "🛑 Detener" : "🎤 Hablar"}
          </button>

          <a href="/" style={styles.linkBtn}>Inicio</a>
        </div>
      </header>

      <main ref={chatRef} style={styles.chat}>
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role === "assistant" ? "assistant" : "user"} text={m.text} />
        ))}
        {loading && <div style={{ color: "#6b7280", fontSize: 14, margin: "8px 0" }}>Estoy pensando cómo ayudarte…</div>}
      </main>

      <footer style={styles.footer}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={exerciseId ? "Escribe tu respuesta…" : "Escribe tu ejercicio (p. ej. 324/2, 2/3 + 4/8)…"}
          style={styles.input}
        />
        <button type="button" onClick={() => handleSend()} style={styles.sendBtn}>➤</button>
        {!exerciseId && (
          <button type="button" onClick={() => handleAnalyze()} style={styles.secondaryBtn} title="Analizar en lenguaje natural">
            🔎 Analizar
          </button>
        )}
        <button type="button" onClick={() => resetExercise()} style={styles.secondaryBtn}>🔄 Nuevo</button>
      </footer>
    </div>
  );
}

const styles = {
  page: { height: "100vh", display: "grid", gridTemplateRows: "64px 1fr 64px" },
  header: { padding: "8px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" },
  title: { fontSize: 22, margin: 0 },
  chat: { padding: "14px 16px", overflowY: "auto", background: "#fff" },
  footer: { borderTop: "1px solid #e5e7eb", padding: 10, display: "flex", gap: 10, alignItems: "center", background: "#fafafa" },
  input: { flex: 1, border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 12px", fontSize: 16 },
  sendBtn: { background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer" },
  mic: { background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px", cursor: "pointer" },
  micActive: { background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px", cursor: "pointer" },
  btnDisabled: { background: "#cbd5e1", color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px", cursor: "not-allowed" },
  linkBtn: { background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", textDecoration: "none" },
  secondaryBtn: { background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", cursor: "pointer" },
};
