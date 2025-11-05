// components/ReadingPaster.js
// ✨ Componente para pegar texto de lectura manualmente

import React, { useState } from 'react';
import { setupReading } from '../services/tutorinApi';

export default function ReadingPaster({ onStart, onBack }) {
  const [text, setText] = useState('');
  const [hasQuestions, setHasQuestions] = useState(false);
  const [questionsText, setQuestionsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);

    // Validaciones
    if (!text.trim()) {
      setError('Por favor, pega el texto para leer.');
      return;
    }

    if (text.trim().length < 50) {
      setError('El texto es muy corto. Pega al menos 50 caracteres.');
      return;
    }

    if (hasQuestions && questionsText.trim() && !questionsText.includes('?')) {
      setError('No se pudieron detectar preguntas. Verifica el formato.');
      return;
    }

    setLoading(true);

    try {
      const result = await setupReading(
        text.trim(),
        hasQuestions && questionsText.trim() ? questionsText.trim() : null,
        "3" // Nivel por defecto: 3º primaria
      );

      if (result.exercise_id && result.exercise) {
        onStart(result.exercise_id, result.exercise);
      } else {
        throw new Error('La respuesta del servidor no contiene ejercicio.');
      }
    } catch (err) {
      console.error('Error al preparar ejercicio:', err);
      setError(err.message || 'Error al generar el ejercicio. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const charCount = text.trim().length;
  const isValidText = charCount >= 50;

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}>
        ← Volver
      </button>

      <h3 style={styles.title}>📖 Pega tu ejercicio de lectura</h3>

      {/* PASO 1: Texto */}
      <div style={styles.section}>
        <label style={styles.label}>
          📝 Paso 1: Pega el TEXTO para leer
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pega aquí el texto de tu libro o ficha...&#10;&#10;Por ejemplo:&#10;Los dinosaurios vivieron hace millones de años. Eran reptiles de diferentes tamaños..."
          rows={10}
          style={styles.textarea}
          disabled={loading}
        />
        <div style={styles.charCount}>
          {charCount} caracteres
          {charCount > 0 && charCount < 50 && (
            <span style={{ color: '#ef4444', marginLeft: 8 }}>
              (mínimo 50)
            </span>
          )}
          {charCount >= 50 && (
            <span style={{ color: '#10b981', marginLeft: 8 }}>
              ✓
            </span>
          )}
        </div>
      </div>

      {/* PASO 2: Preguntas opcionales */}
      <div style={styles.section}>
        <label style={styles.label}>
          📝 Paso 2 (OPCIONAL): ¿Tu libro trae preguntas?
        </label>

        <div style={styles.radioGroup}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              checked={!hasQuestions}
              onChange={() => setHasQuestions(false)}
              disabled={loading}
              style={styles.radio}
            />
            <span>No, que Tutorín las cree por mí 🤖</span>
          </label>

          <label style={styles.radioLabel}>
            <input
              type="radio"
              checked={hasQuestions}
              onChange={() => setHasQuestions(true)}
              disabled={loading}
              style={styles.radio}
            />
            <span>Sí, voy a pegar las preguntas del libro 📚</span>
          </label>
        </div>

        {hasQuestions && (
          <textarea
            value={questionsText}
            onChange={(e) => setQuestionsText(e.target.value)}
            placeholder={'Pega las preguntas aquí:\n1. ¿Primera pregunta?\n2. ¿Segunda pregunta?\n\nO simplemente:\n¿Pregunta 1?\n¿Pregunta 2?'}
            rows={6}
            style={{ ...styles.textarea, marginTop: 12 }}
            disabled={loading}
          />
        )}
      </div>

      {/* Botón de submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !isValidText}
        style={loading || !isValidText ? styles.submitBtnDisabled : styles.submitBtn}
      >
        {loading ? '⏳ Preparando ejercicio...' : '✨ Empezar ejercicio'}
      </button>

      {/* Error */}
      {error && (
        <div style={styles.error}>
          ❌ {error}
        </div>
      )}

      {/* Consejo */}
      <div style={styles.hint}>
        💡 <strong>Consejo:</strong> Puedes pegar texto de tu libro, ficha, o cualquier texto que quieras practicar.
        Si no pegas preguntas, Tutorín las generará automáticamente según el texto.
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 700,
    margin: '0 auto',
    padding: 20,
  },
  backBtn: {
    background: '#f3f4f6',
    color: '#111827',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: 16,
    marginBottom: 20,
    fontWeight: 500,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    display: 'block',
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
    color: '#374151',
  },
  textarea: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    fontFamily: 'inherit',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    resize: 'vertical',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  },
  charCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'right',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 16,
    cursor: 'pointer',
    padding: '12px 16px',
    background: '#f9fafb',
    borderRadius: 8,
    border: '2px solid #e5e7eb',
    transition: 'all 0.2s',
  },
  radio: {
    marginRight: 10,
    width: 18,
    height: 18,
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '16px 24px',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
    marginBottom: 16,
  },
  submitBtnDisabled: {
    width: '100%',
    background: '#cbd5e1',
    color: '#fff',
    padding: '16px 24px',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 600,
    border: 'none',
    cursor: 'not-allowed',
    marginBottom: 16,
  },
  error: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeft: '4px solid #dc2626',
  },
  hint: {
    background: '#f0f9ff',
    borderLeft: '4px solid #3b82f6',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1.6,
    color: '#1e40af',
  },
};
