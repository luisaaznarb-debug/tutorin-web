// components/ReadingGenerator.js
// ✨ Componente para generar ejercicios de lectura automáticos

import React, { useState } from 'react';
import { generateReading } from '../services/tutorinApi';

export default function ReadingGenerator({ onStart, onBack }) {
  const [topic, setTopic] = useState(null);
  const [level, setLevel] = useState('3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const topics = [
    { id: 'dinosaurios', label: 'Dinosaurios', emoji: '🦖' },
    { id: 'deportes', label: 'Deportes', emoji: '⚽' },
    { id: 'espacio', label: 'Espacio', emoji: '🚀' },
    { id: 'animales', label: 'Animales', emoji: '🐕' },
    { id: 'naturaleza', label: 'Naturaleza', emoji: '🌍' },
    { id: 'sorpresa', label: 'Sorpréndeme', emoji: '✨' },
  ];

  const handleGenerate = async () => {
    if (!topic) return;

    setError(null);
    setLoading(true);

    try {
      const result = await generateReading(topic, level);

      if (result.exercise_id && result.exercise) {
        onStart(result.exercise_id, result.exercise);
      } else {
        throw new Error('La respuesta del servidor no contiene ejercicio.');
      }
    } catch (err) {
      console.error('Error al generar ejercicio:', err);
      setError(err.message || 'Error al generar el ejercicio. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}>
        ← Volver
      </button>

      <h3 style={styles.title}>🎲 Generar ejercicio automático</h3>

      <p style={styles.subtitle}>
        ¿De qué tema te gustaría leer?
      </p>

      <div style={styles.topicsGrid}>
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => setTopic(t.id)}
            style={topic === t.id ? styles.topicBtnActive : styles.topicBtn}
            disabled={loading}
          >
            <span style={styles.topicEmoji}>{t.emoji}</span>
            <span style={styles.topicLabel}>{t.label}</span>
          </button>
        ))}
      </div>

      {topic && (
        <div style={styles.levelSection}>
          <label style={styles.label}>
            ¿En qué curso estás?
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={styles.select}
            disabled={loading}
          >
            <option value="1">1º Primaria</option>
            <option value="2">2º Primaria</option>
            <option value="3">3º Primaria</option>
            <option value="4">4º Primaria</option>
            <option value="5">5º Primaria</option>
            <option value="6">6º Primaria</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={loading ? styles.generateBtnDisabled : styles.generateBtn}
          >
            {loading ? '⏳ Generando texto...' : '✨ Generar ejercicio'}
          </button>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          ❌ {error}
        </div>
      )}

      {loading && (
        <div style={styles.loadingInfo}>
          <p>🤖 Tutorín está creando un texto interesante para ti...</p>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
            Esto puede tardar unos segundos
          </p>
        </div>
      )}
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
    marginBottom: 12,
    color: '#111827',
  },
  subtitle: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
  topicsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
    marginBottom: 24,
  },
  topicBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '20px 16px',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 500,
    transition: 'all 0.2s',
    minHeight: 100,
  },
  topicBtnActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '20px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: '2px solid #667eea',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    minHeight: 100,
  },
  topicEmoji: {
    fontSize: 32,
  },
  topicLabel: {
    fontSize: 16,
  },
  levelSection: {
    marginTop: 24,
    padding: 20,
    background: '#f9fafb',
    borderRadius: 12,
    border: '2px solid #e5e7eb',
  },
  label: {
    display: 'block',
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: '#374151',
  },
  select: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    marginBottom: 16,
    background: '#fff',
    cursor: 'pointer',
  },
  generateBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    padding: '16px 24px',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.2s',
  },
  generateBtnDisabled: {
    width: '100%',
    background: '#cbd5e1',
    color: '#fff',
    padding: '16px 24px',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 600,
    border: 'none',
    cursor: 'not-allowed',
  },
  error: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeft: '4px solid #dc2626',
  },
  loadingInfo: {
    background: '#f0f9ff',
    borderLeft: '4px solid #3b82f6',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    textAlign: 'center',
    color: '#1e40af',
  },
};

// Agregar media query para responsive
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @media (max-width: 768px) {
      .topics-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
