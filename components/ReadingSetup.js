// components/ReadingSetup.js
// ✨ Componente principal para seleccionar modo de lectura

import React, { useState } from 'react';
import ReadingPaster from './ReadingPaster';
import ReadingGenerator from './ReadingGenerator';
import ReadingPhotoUpload from './ReadingPhotoUpload';

export default function ReadingSetup({ onStart }) {
  const [mode, setMode] = useState(null);

  const handleBack = () => {
    setMode(null);
  };

  // Si no hay modo seleccionado, mostrar las 3 opciones
  if (!mode) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>📚 Comprensión Lectora</h2>
        <p style={styles.subtitle}>¿Cómo quieres practicar hoy?</p>

        <div style={styles.optionsGrid}>
          {/* Opción 1: Generar automático */}
          <button
            onClick={() => setMode('generate')}
            style={styles.optionBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            <div style={{ ...styles.optionIcon, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              🎲
            </div>
            <div style={styles.optionTitle}>Generar ejercicio</div>
            <div style={styles.optionDesc}>
              Tutorín crea un texto sobre el tema que elijas
            </div>
          </button>

          {/* Opción 2: Pegar texto */}
          <button
            onClick={() => setMode('paste')}
            style={styles.optionBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            <div style={{ ...styles.optionIcon, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
              📖
            </div>
            <div style={styles.optionTitle}>Traigo mi propio texto</div>
            <div style={styles.optionDesc}>
              Pega el texto de tu libro o ficha
            </div>
          </button>

          {/* Opción 3: Subir foto */}
          <button
            onClick={() => setMode('photo')}
            style={styles.optionBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
            }}
          >
            <div style={{ ...styles.optionIcon, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              📸
            </div>
            <div style={styles.optionTitle}>Subir foto del libro</div>
            <div style={styles.optionDesc}>
              Toma una foto y Tutorín extrae el texto
            </div>
          </button>
        </div>

        <div style={styles.info}>
          💡 <strong>Nuevo:</strong> Ahora Tutorín puede ayudarte con ejercicios de comprensión lectora.
          Elige cómo quieres practicar y te guiaré paso a paso.
        </div>
      </div>
    );
  }

  // Mostrar el componente según el modo seleccionado
  return (
    <div style={styles.container}>
      {mode === 'generate' && (
        <ReadingGenerator onStart={onStart} onBack={handleBack} />
      )}
      {mode === 'paste' && (
        <ReadingPaster onStart={onStart} onBack={handleBack} />
      )}
      {mode === 'photo' && (
        <ReadingPhotoUpload onStart={onStart} onBack={handleBack} />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 12,
    color: '#111827',
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 40,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 20,
    marginBottom: 30,
  },
  optionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 30,
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 16,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 500,
    transition: 'all 0.3s ease',
    minHeight: 220,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  optionIcon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    marginBottom: 16,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
  },
  optionDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  info: {
    background: '#f0f9ff',
    borderLeft: '4px solid #3b82f6',
    padding: 16,
    borderRadius: 8,
    fontSize: 15,
    lineHeight: 1.6,
    color: '#1e40af',
    textAlign: 'center',
  },
};

// Agregar media query para responsive
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @media (max-width: 768px) {
      .reading-options-grid {
        grid-template-columns: 1fr !important;
      }
    }

    @media (hover: hover) {
      .reading-option-btn:hover {
        transform: translateY(-4px);
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
