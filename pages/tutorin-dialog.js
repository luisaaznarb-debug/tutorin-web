// pages/tutorin-dialog.js
// ✅ VERSIÓN CON SELECTOR DE MATERIAS AL INICIO

import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "../components/ChatBubble";
import SubjectSelector from "../components/SubjectSelector";
import MathInterface from "../components/MathInterface";
import ReadingSetup from "../components/ReadingSetup";
import { callSolve, playBase64Audio } from "../services/tutorinApi";

export default function TutorinDialogPage() {
  // Estados de navegación
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [inExercise, setInExercise] = useState(false);

  // Estados del chat
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado del ejercicio
  const [exerciseId, setExerciseId] = useState(null);
  const [question, setQuestion] = useState(null);

  const chatRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Scroll al final del chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // ═══════════════════════════════════════════════════════════
  // FUNCIONES DE NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════

  const handleSelectSubject = (subjectId) => {
    console.log('Materia seleccionada:', subjectId);
    setSelectedSubject(subjectId);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setInExercise(false);
    setMessages([]);
    setExerciseId(null);
    setQuestion(null);
    setUserInput("");
  };

  const handleStartMathExercise = async (input) => {
    setInExercise(true);

    // Llamar al backend
    try {
      const newExerciseId = `math-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log("🔹 Iniciando ejercicio de matemáticas:", newExerciseId);

      const result = await callSolve({
        question: input,
        last_answer: "",
        exercise_id: newExerciseId,
        cycle: 'c2',
      });

      setQuestion(input);
      setExerciseId(result.exercise_id || newExerciseId);

      const reply = result.message || "¡Perfecto! Empecemos con este ejercicio.";
      setMessages([{ role: 'assistant', text: reply }]);

      if (result.audio_b64) playBase64Audio(result.audio_b64);

      if (result.status === "done") {
        setExerciseId(null);
        setQuestion(null);
      }
    } catch (error) {
      console.error('Error al iniciar ejercicio de matemáticas:', error);
      setMessages([
        { role: 'assistant', text: 'Error al iniciar el ejercicio. Intenta de nuevo.' }
      ]);
    }
  };

  const handleStartReading = async (exerciseId, exercise) => {
    setInExercise(true);

    const exerciseJson = JSON.stringify(exercise);

    try {
      console.log("🔹 Iniciando ejercicio de lectura:", exerciseId);

      const result = await callSolve({
        question: exerciseJson,
        last_answer: "",
        exercise_id: exerciseId,
        cycle: 'c2',
      });

      setQuestion(exerciseJson);
      setExerciseId(exerciseId);

      const reply = result.message || "He preparado el ejercicio de lectura. ¡Empecemos!";
      setMessages([{ role: 'assistant', text: reply }]);

      if (result.audio_b64) playBase64Audio(result.audio_b64);

      if (result.status === "done") {
        setExerciseId(null);
        setQuestion(null);
      }
    } catch (error) {
      console.error('Error al iniciar ejercicio de lectura:', error);
      setMessages([
        { role: 'assistant', text: 'Error al iniciar el ejercicio de lectura. Intenta de nuevo.' }
      ]);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // FUNCIONES DEL CHAT
  // ═══════════════════════════════════════════════════════════

  const handleSendMessage = async () => {
    if (!userInput.trim() || loading || isProcessingRef.current) return;

    const content = userInput.trim();
    setUserInput("");
    isProcessingRef.current = true;
    setLoading(true);

    try {
      setMessages((prev) => [...prev, { role: "user", text: content }]);

      if (!exerciseId) {
        // Nuevo ejercicio
        const newExerciseId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log("🔹 Nuevo ejercicio:", newExerciseId);

        const result = await callSolve({
          question: content,
          last_answer: "",
          exercise_id: newExerciseId,
          cycle: 'c2',
        });

        setQuestion(content);
        if (result.exercise_id) {
          setExerciseId(result.exercise_id);
        }

        const reply = result.message || "He iniciado el ejercicio.";
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);

        if (result.audio_b64) playBase64Audio(result.audio_b64);

        if (result.status === "done") {
          setExerciseId(null);
          setQuestion(null);
        }
      } else {
        // Continuando ejercicio
        console.log("🔹 Continuando ejercicio:", exerciseId);

        const result = await callSolve({
          question: question || "",
          last_answer: content,
          exercise_id: exerciseId,
          cycle: 'c2',
        });

        const reply = result.message || "Sigamos.";
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);

        if (result.audio_b64) playBase64Audio(result.audio_b64);

        if (result.status === "done") {
          setExerciseId(null);
          setQuestion(null);
        }
      }
    } catch (error) {
      console.error("❌ Error en Tutorín:", error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: error.message || 'Error al conectar con Tutorín 😕' }
      ]);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header siempre visible */}
      <div style={{
        background: '#3b82f6',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🎓</span>
          <h1 style={{ margin: 0, fontSize: '20px' }}>Tutorín — Diálogo educativo</h1>
        </div>

        {(selectedSubject || inExercise) && (
          <button
            onClick={handleBackToSubjects}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid white',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Volver al inicio
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1 }}>
        {/* PASO 1: Selector de materias (solo si no hay materia seleccionada ni ejercicio activo) */}
        {!selectedSubject && !inExercise && (
          <SubjectSelector onSelectSubject={handleSelectSubject} />
        )}

        {/* PASO 2: Interfaz de Matemáticas */}
        {selectedSubject === 'matematicas' && !inExercise && (
          <MathInterface
            onStartExercise={handleStartMathExercise}
            onBack={handleBackToSubjects}
          />
        )}

        {/* PASO 3: Interfaz de Lengua */}
        {selectedSubject === 'lengua' && !inExercise && (
          <ReadingSetup
            onStart={handleStartReading}
            onBack={handleBackToSubjects}
          />
        )}

        {/* PASO 4: Otras materias (Próximamente) */}
        {selectedSubject && !inExercise &&
          !['matematicas', 'lengua'].includes(selectedSubject) && (
            <div style={{
              maxWidth: '600px',
              margin: '80px auto',
              padding: '40px',
              textAlign: 'center',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>
                {selectedSubject === 'sociales' && '🌍 Ciencias Sociales'}
                {selectedSubject === 'naturales' && '🔬 Ciencias de la Naturaleza'}
                {selectedSubject === 'ingles' && '🌐 Inglés'}
                {selectedSubject === 'valenciano' && '📖 Valencià'}
              </h2>
              <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '24px' }}>
                Próximamente...
              </p>
              <button
                onClick={handleBackToSubjects}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                ← Volver a materias
              </button>
            </div>
          )}

        {/* PASO 5: Chat del ejercicio activo */}
        {inExercise && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 80px)'
          }}>
            {/* Mensajes */}
            <div ref={chatRef} style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '20px'
            }}>
              {messages.map((msg, idx) => (
                <ChatBubble key={idx} role={msg.role === "assistant" ? "assistant" : "user"} text={msg.text} />
              ))}
              {loading && (
                <div style={{ color: "#6b7280", fontSize: 14, margin: "8px 0" }}>
                  Estoy pensando cómo ayudarte…
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              display: 'flex',
              gap: '12px',
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
            }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleSendMessage();
                  }
                }}
                placeholder="Escribe tu respuesta..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !userInput.trim()}
                style={{
                  padding: '12px 24px',
                  background: loading ? '#94a3b8' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                {loading ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
