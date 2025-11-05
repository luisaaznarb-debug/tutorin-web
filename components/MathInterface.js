// components/MathInterface.js
// Interfaz para ejercicios de matemáticas

import React, { useState, useRef } from 'react';
import { uploadImage } from '../services/tutorinApi';

export default function MathInterface({ onStartExercise, onBack }) {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleSendImage = async () => {
    if (!selectedImage || loading) return;

    setLoading(true);
    try {
      const result = await uploadImage(selectedImage, 'c2');

      if (result.question && result.success) {
        onStartExercise(result.question);
      } else {
        alert('No pude extraer el ejercicio de la imagen. Intenta escribirlo manualmente.');
      }
    } catch (err) {
      console.error('Error al subir imagen:', err);
      alert('Error al procesar la imagen. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onStartExercise(input.trim());
    }
  };

  // Detectar pegado de imágenes (Ctrl+V)
  React.useEffect(() => {
    const handlePaste = (e) => {
      if (loading) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();

          const blob = items[i].getAsFile();
          if (blob) {
            const file = new File([blob], `captura-${Date.now()}.png`, { type: blob.type });
            setSelectedImage(file);

            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [loading]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🔢 Matemáticas</h1>
          <p style={styles.subtitle}>
            Escribe el ejercicio, sube una foto o pega una captura (Ctrl+V)
          </p>
        </div>

        {imagePreview ? (
          <div style={styles.imagePreviewContainer}>
            <img src={imagePreview} alt="Preview" style={styles.imagePreview} />
            <div style={styles.imageActions}>
              <button
                onClick={handleSendImage}
                style={styles.sendImageBtn}
                disabled={loading}
              >
                {loading ? '⏳ Procesando...' : '✅ Analizar imagen'}
              </button>
              <button
                onClick={handleCancelImage}
                style={styles.cancelImageBtn}
                disabled={loading}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ejemplo: 25 + 17, 48 × 6, 144 ÷ 12..."
                style={styles.input}
                autoFocus
              />
              <button
                type="submit"
                style={styles.submitBtn}
                disabled={!input.trim() || loading}
              >
                Empezar ejercicio →
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerText}>o</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              disabled={loading}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              style={styles.uploadBtn}
              disabled={loading}
            >
              📷 Subir foto del ejercicio
            </button>

            <p style={styles.hint}>
              💡 También puedes pegar una captura de pantalla con Ctrl+V
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  content: {
    maxWidth: '600px',
    width: '100%',
    background: 'white',
    borderRadius: '24px',
    padding: '48px 40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  input: {
    padding: '16px 20px',
    fontSize: '18px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  submitBtn: {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: '600',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  divider: {
    textAlign: 'center',
    position: 'relative',
    margin: '24px 0',
  },
  dividerText: {
    background: 'white',
    padding: '0 16px',
    color: '#9ca3af',
    position: 'relative',
    zIndex: 1,
  },
  uploadBtn: {
    width: '100%',
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: '600',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  hint: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '16px',
  },
  imagePreviewContainer: {
    textAlign: 'center',
  },
  imagePreview: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  imageActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  sendImageBtn: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  cancelImageBtn: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
