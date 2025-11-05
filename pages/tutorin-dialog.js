// pages/tutorin-dialog.js
// ✅ VERSIÓN CORREGIDA: Sin mensajes molestos + detección mejorada

import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "../components/ChatBubble";
import ReadingSetup from "../components/ReadingSetup";
import { callSolve, playBase64Audio, analyzePrompt, uploadImage } from "../services/tutorinApi";

export default function TutorinDialogPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "👋 ¡Hola! Soy Tutorín. Dime un ejercicio, súbeme una foto o pega una captura (Ctrl+V), y te ayudo paso a paso." },
  ]);

  // Estado del ejercicio
  const [exerciseId, setExerciseId] = useState(null);
  const [question, setQuestion] = useState(null);

  // UI
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("es");
  const [cycle, setCycle] = useState("c2");
  const [listening, setListening] = useState(false);

  // Estados para imágenes
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Estados para comprensión lectora
  const [readingMode, setReadingMode] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);

  const recognitionRef = useRef(null);
  const chatRef = useRef(null);
  const isProcessingRef = useRef(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll al final
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus en el input
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, messages]);

  // Detectar pegado de imágenes (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (exerciseId || loading) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          
          const blob = items[i].getAsFile();
          if (blob) {
            const file = new File([blob], `captura-${Date.now()}.png`, { type: blob.type });
            handleImageFromClipboard(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [exerciseId, loading]);

  // ✅ CORREGIDO: Manejar imagen desde portapapeles SIN mensaje molesto
  const handleImageFromClipboard = (file) => {
    setSelectedImage(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Voz del navegador
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
  const stopListening = () => recognitionRef.current?.stop();

  // Manejar selección de imagen desde archivo
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona solo archivos de imagen (jpg, png, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Por favor, sube una imagen menor a 5MB.');
      return;
    }

    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Enviar imagen al backend
  const handleSendImage = async () => {
    if (!selectedImage || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setLoading(true);

    try {
      setMessages((prev) => [
        ...prev, 
        { 
          role: "user", 
          text: `📸 Imagen enviada: ${selectedImage.name || 'ejercicio.jpg'}` 
        }
      ]);

      const result = await uploadImage(selectedImage, cycle);
      
      const reply = result.message || "He analizado tu imagen. ¿Quieres que resolvamos este ejercicio?";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      if (result.question && result.success) {
        setInput(result.question);
      }

      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      console.error("❌ Error al subir imagen:", err);
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        text: err.message || "No pude analizar la imagen. Intenta subirla de nuevo o escribe el ejercicio." 
      }]);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  function isNewExercise(text) {
    const trimmed = text.trim();
    const patterns = [
      /^\d+\s*[+\-×x*÷/:]\s*\d+/,
      /^\d+[\.,]\d+\s*[×x*÷/:]\s*\d+/,
      /^\d+\/\d+\s*[+\-×x*÷/:]\s*\d+\/\d+/,
    ];
    return patterns.some(p => p.test(trimmed));
  }

  async function handleSend(contentOverride = "") {
    if (isProcessingRef.current) {
      console.log("⚠️ Ya hay una petición en curso, ignorando duplicado");
      return;
    }

    const override = typeof contentOverride === "string" ? contentOverride.trim() : "";
    const content = override || input.trim();

    if (!content || loading) return;

    // Detectar si el usuario quiere hacer ejercicios de lectura
    const userTextLower = content.toLowerCase();
    if (!exerciseId && (
      userTextLower.includes('lectura') ||
      userTextLower.includes('leer') ||
      userTextLower.includes('comprensión') ||
      userTextLower.includes('comprension') ||
      userTextLower.includes('texto')
    )) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: content },
        { role: "assistant", text: "📚 ¡Perfecto! Voy a preparar el modo de comprensión lectora para ti..." }
      ]);
      setInput("");
      setReadingMode(true);
      return;
    }

    if (exerciseId && isNewExercise(content)) {
      console.log("🔄 Detectado nuevo ejercicio, reseteando estado...");
      setExerciseId(null);
      setQuestion(null);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    isProcessingRef.current = true;
    setInput("");
    setLoading(true);

    try {
      setMessages((prev) => [...prev, { role: "user", text: content }]);

      if (!exerciseId) {
        const newExerciseId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log("🔹 Nuevo ejercicio con ID único:", newExerciseId);
        
        const res = await callSolve({ 
          question: content, 
          last_answer: "", 
          exercise_id: newExerciseId,
          cycle,
        });
        
        setQuestion(content);
        if (res.exercise_id) {
          setExerciseId(res.exercise_id);
        }

        const reply = res.message || "He iniciado el ejercicio.";
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        
        if (res.audio_b64) playBase64Audio(res.audio_b64);
        
        if (res.status === "done") { 
          setExerciseId(null); 
          setQuestion(null);
        }
      } else {
        console.log("🔹 Continuando ejercicio:", exerciseId, "| respuesta:", content);
        
        const res = await callSolve({
          question: question || "",
          last_answer: content,
          exercise_id: exerciseId,
          cycle,
        });

        const reply = res.message || "Sigamos.";
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

        if (res.audio_b64) playBase64Audio(res.audio_b64);
        
        if (res.status === "done") { 
          setExerciseId(null); 
          setQuestion(null);
        }
      }
    } catch (err) {
      console.error("❌ Error en Tutorín:", err);
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        text: err.message || "Error al conectar con Tutorín 😕" 
      }]);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }

  async function handleHint() {
    if (!exerciseId || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setLoading(true);

    try {
      setMessages((prev) => [...prev, { role: "user", text: "💡 Pista solicitada" }]);

      const res = await callSolve({
        question: question || "",
        last_answer: "no se",
        exercise_id: exerciseId,
        cycle,
      });

      const reply = res.message || "💡 Piensa paso a paso...";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      if (res.audio_b64) playBase64Audio(res.audio_b64);
    } catch (err) {
      console.error("❌ Error al pedir pista:", err);
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        text: "No pude generar una pista ahora 😕" 
      }]);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }

  async function handleAnalyze() {
    if (exerciseId || isProcessingRef.current) return;

    const content = input.trim();
    if (!content) return;

    isProcessingRef.current = true;
    setMessages((p) => [...p, { role: "user", text: content }]);
    setInput("");
    setLoading(true);

    try {
      const data = await analyzePrompt({
        prompt: content,
        step: 0,
        answer: "",
        errors: 0,
        lang
      });
      const reply = data?.response?.message || data?.message || "¿Probamos paso a paso?";
      setMessages((p) => [...p, { role: "assistant", text: reply }]);
    } catch {
      setMessages((p) => [...p, {
        role: "assistant",
        text: "No he podido analizarlo. Escribe el ejercicio tal cual (p. ej. 32+45)."
      }]);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }

  // Función para iniciar ejercicio de lectura
  async function handleStartReading(exerciseId, exercise) {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setReadingMode(false);
    setCurrentExercise(exercise);
    setLoading(true);

    try {
      console.log("🔹 Iniciando ejercicio de lectura:", exerciseId);

      // Formatear ejercicio para el motor
      const exerciseJson = JSON.stringify(exercise);

      // Llamar a callSolve con el ejercicio de lectura
      const res = await callSolve({
        question: exerciseJson,
        last_answer: "",
        exercise_id: exerciseId,
        cycle,
      });

      setQuestion(exerciseJson);
      setExerciseId(exerciseId);

      const reply = res.message || "He preparado el ejercicio de lectura. ¡Empecemos!";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      if (res.audio_b64) playBase64Audio(res.audio_b64);

      if (res.status === "done") {
        setExerciseId(null);
        setQuestion(null);
        setCurrentExercise(null);
      }
    } catch (err) {
      console.error("❌ Error al iniciar ejercicio de lectura:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: err.message || "Error al iniciar el ejercicio de lectura 😕"
        }
      ]);
      setReadingMode(true); // Volver al modo de configuración
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }

  function resetExercise() {
    if (isProcessingRef.current) return;

    setExerciseId(null);
    setQuestion(null);
    setSelectedImage(null);
    setImagePreview(null);
    setReadingMode(false);
    setCurrentExercise(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setMessages([{
      role: "assistant",
      text: "🔄 Nuevo ejercicio: escríbelo, súbelo en foto o pega una captura (Ctrl+V)."
    }]);
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isProcessingRef.current) {
      e.preventDefault();
      handleSend();
    }
  };

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
            onClick={listening ? stopListening : startListening}
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
        {readingMode ? (
          <ReadingSetup onStart={handleStartReading} />
        ) : (
          <>
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role === "assistant" ? "assistant" : "user"} text={m.text} />
            ))}
            {loading && (
              <div style={{ color: "#6b7280", fontSize: 14, margin: "8px 0" }}>
                Estoy pensando cómo ayudarte…
              </div>
            )}
          </>
        )}
      </main>

      {!readingMode && (
        <footer style={styles.footer}>
          {imagePreview && (
            <div style={styles.imagePreviewContainer}>
              <img src={imagePreview} alt="Preview" style={styles.imagePreview} />
              <div style={styles.imageActions}>
                <button onClick={handleSendImage} style={styles.sendImageBtn} disabled={loading}>
                  ✅ Enviar foto
                </button>
                <button onClick={handleCancelImage} style={styles.cancelImageBtn} disabled={loading}>
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={styles.inputRow}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={exerciseId ? "Escribe tu respuesta…" : "Escribe, pega (Ctrl+V) o sube una foto…"}
            style={styles.input}
            disabled={loading}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
            disabled={loading}
          />

          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            style={styles.imageBtn}
            disabled={loading || !!exerciseId}
            title={exerciseId ? "Termina el ejercicio para subir fotos" : "Subir foto del ejercicio"}
          >
            📷
          </button>

          <button 
            type="button" 
            onClick={() => handleSend()} 
            style={styles.sendBtn}
            disabled={loading || !input.trim()}
            title="Enviar mensaje (Enter)"
          >
            ➤
          </button>
          
          {exerciseId && (
            <button 
              type="button" 
              onClick={handleHint} 
              style={styles.hintBtn}
              title="Pedir una pista para este paso"
              disabled={loading}
            >
              💡 Pista
            </button>
          )}

          {!exerciseId && (
            <button 
              type="button" 
              onClick={handleAnalyze} 
              style={styles.secondaryBtn} 
              title="Analizar el ejercicio en lenguaje natural antes de resolverlo"
              disabled={loading || !input.trim()}
            >
              🔎 Analizar
            </button>
          )}
          
          <button 
            type="button" 
            onClick={resetExercise} 
            style={styles.secondaryBtn}
            disabled={loading}
            title="Cancelar ejercicio y empezar de nuevo"
          >
            🔄 Nuevo
          </button>
        </div>

          <div style={styles.helpText}>
            {exerciseId ? (
              <span>💡 <strong>Pista disponible</strong> - Si necesitas ayuda, pulsa el botón 💡</span>
            ) : (
              <span>💭 Escribe un ejercicio, sube una foto 📷 o pega una captura (Ctrl+V)</span>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

const styles = {
  page: { height: "100vh", display: "grid", gridTemplateRows: "64px 1fr auto" },
  header: { 
    padding: "8px 16px", 
    borderBottom: "1px solid #e5e7eb", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "space-between", 
    background: "#fff" 
  },
  title: { fontSize: 22, margin: 0 },
  chat: { padding: "14px 16px", overflowY: "auto", background: "#fff" },
  footer: { 
    borderTop: "1px solid #e5e7eb", 
    padding: 10, 
    background: "#fafafa" 
  },
  inputRow: {
    display: "flex", 
    gap: 10, 
    alignItems: "center"
  },
  input: { 
    flex: 1, 
    border: "1px solid #d1d5db", 
    borderRadius: 10, 
    padding: "10px 12px", 
    fontSize: 16 
  },
  sendBtn: { 
    background: "#1d4ed8", 
    color: "#fff", 
    border: "none", 
    borderRadius: 10, 
    padding: "10px 14px", 
    cursor: "pointer",
    fontSize: 18,
  },
  imageBtn: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 18
  },
  hintBtn: { 
    background: "linear-gradient(135deg, #FFB84D 0%, #FF6B4A 100%)",
    color: "#fff", 
    border: "none", 
    borderRadius: 10, 
    padding: "10px 14px", 
    cursor: "pointer",
    fontWeight: "600",
    fontSize: 16,
    boxShadow: "0 4px 12px rgba(255, 184, 77, 0.3)",
  },
  mic: { 
    background: "#2563eb", 
    color: "#fff", 
    border: "none", 
    borderRadius: 10, 
    padding: "8px 12px", 
    cursor: "pointer" 
  },
  micActive: { 
    background: "#dc2626", 
    color: "#fff", 
    border: "none", 
    borderRadius: 10, 
    padding: "8px 12px", 
    cursor: "pointer" 
  },
  btnDisabled: { 
    background: "#cbd5e1", 
    color: "#fff", 
    border: "none", 
    borderRadius: 10, 
    padding: "8px 12px", 
    cursor: "not-allowed" 
  },
  linkBtn: { 
    background: "#f3f4f6", 
    color: "#111827", 
    border: "1px solid #e5e7eb", 
    borderRadius: 10, 
    padding: "8px 10px", 
    textDecoration: "none" 
  },
  secondaryBtn: { 
    background: "#f3f4f6", 
    color: "#111827", 
    border: "1px solid #e5e7eb", 
    borderRadius: 10, 
    padding: "8px 10px", 
    cursor: "pointer" 
  },
  imagePreviewContainer: {
    marginBottom: 10,
    padding: 10,
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e5e7eb"
  },
  imagePreview: {
    maxWidth: "100%",
    maxHeight: 200,
    borderRadius: 8,
    display: "block",
    marginBottom: 10
  },
  imageActions: {
    display: "flex",
    gap: 10,
    justifyContent: "center"
  },
  sendImageBtn: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600
  },
  cancelImageBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600
  },
  helpText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center"
  }
};