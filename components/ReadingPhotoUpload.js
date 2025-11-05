// components/ReadingPhotoUpload.js
// ✨ Componente para subir foto de libro y extraer texto

import React, { useState, useRef } from 'react';
import { uploadReadingPhoto } from '../services/tutorinApi';

export default function ReadingPhotoUpload({ onStart, onBack }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona solo archivos de imagen (jpg, png, etc.)');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 5MB.');
      return;
    }

    setError(null);
    setImageFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!imageFile || !imagePreview) return;

    setError(null);
    setLoading(true);

    try {
      // Convertir a base64 (quitar el prefijo data:image/...;base64,)
      const base64 = imagePreview.split(',')[1];

      const response = await uploadReadingPhoto(base64);

      if (response.exercise_id && response.exercise) {
        // Mostrar resumen antes de iniciar
        setResult({
          wordCount: response.exercise.text?.split(' ').length || 0,
          questionsCount: response.exercise.questions?.length || 0,
        });

        // Iniciar ejercicio después de 1 segundo
        setTimeout(() => {
          onStart(response.exercise_id, response.exercise);
        }, 1500);
      } else {
        throw new Error('La respuesta del servidor no contiene ejercicio.');
      }
    } catch (err) {
      console.error('Error al procesar foto:', err);
      setError(err.message || 'No se pudo leer el texto de la foto. Intenta con mejor iluminación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}>
        ← Volver
      </button>

      <h3 style={styles.title}>📸 Sube foto de tu libro</h3>

      <div style={styles.uploadArea}>
        {!imagePreview ? (
          <>
            <div style={styles.uploadIcon}>📷</div>
            <p style={styles.uploadText}>
              Toma una foto de la página de tu libro
            </p>
            <p style={styles.uploadSubtext}>
              Asegúrate de que el texto se vea claro y con buena iluminación
            </p>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              ref={fileInputRef}
              disabled={loading}
            />

            <div style={styles.uploadButtons}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={styles.cameraBtn}
                disabled={loading}
              >
                📷 Tomar foto
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={styles.fileBtn}
                disabled={loading}
              >
                📁 Subir archivo
              </button>
            </div>
          </>
        ) : (
          <>
            <img
              src={imagePreview}
              alt="Preview"
              style={styles.imagePreview}
            />

            <div style={styles.imageButtons}>
              <button
                onClick={handleRemove}
                style={styles.removeBtn}
                disabled={loading}
              >
                🗑️ Cambiar foto
              </button>
              <button
                onClick={handleUpload}
                disabled={loading}
                style={loading ? styles.processBtnDisabled : styles.processBtn}
              >
                {loading ? '⏳ Procesando...' : '✨ Procesar ejercicio'}
              </button>
            </div>
          </>
        )}
      </div>

      {loading && (
        <div style={styles.loadingInfo}>
          <p>🤖 Extrayendo texto de la foto...</p>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
            Esto puede tardar unos segundos
          </p>
        </div>
      )}

      {result && (
        <div style={styles.success}>
          <div style={styles.successTitle}>✅ ¡Texto detectado!</div>
          <ul style={styles.resultList}>
            <li>Texto: {result.wordCount} palabras</li>
            <li>Preguntas: {result.questionsCount}</li>
          </ul>
          <p style={styles.successSubtext}>
            Iniciando ejercicio...
          </p>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          ❌ {error}
        </div>
      )}

      <div style={styles.hint}>
        💡 <strong>Consejos:</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Usa buena iluminación</li>
          <li>Asegúrate de que el texto esté enfocado</li>
          <li>Evita sombras sobre el texto</li>
          <li>La foto puede incluir texto y preguntas</li>
        </ul>
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
  uploadArea: {
    border: '2px dashed #cbd5e1',
    borderRadius: 12,
    padding: 40,
    textAlign: 'center',
    background: '#f9fafb',
    marginBottom: 20,
  },
  uploadIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  uploadButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  cameraBtn: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    padding: '14px 24px',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
  },
  fileBtn: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    padding: '14px 24px',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
  },
  imagePreview: {
    maxWidth: '100%',
    maxHeight: 400,
    borderRadius: 8,
    marginBottom: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  imageButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  removeBtn: {
    background: '#f3f4f6',
    color: '#111827',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 500,
  },
  processBtn: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)',
  },
  processBtnDisabled: {
    background: '#cbd5e1',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: 'not-allowed',
  },
  loadingInfo: {
    background: '#f0f9ff',
    borderLeft: '4px solid #3b82f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
    color: '#1e40af',
  },
  success: {
    background: '#dcfce7',
    borderLeft: '4px solid #10b981',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#065f46',
    marginBottom: 12,
  },
  resultList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: 16,
    color: '#065f46',
  },
  successSubtext: {
    fontSize: 14,
    color: '#059669',
    marginTop: 12,
    fontStyle: 'italic',
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
