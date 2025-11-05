/**
 * MultiPhotoUpload.js
 * ✨ Componente reutilizable para subir múltiples fotos
 *
 * Características:
 * - Subir hasta 5 fotos
 * - Preview de cada foto con número
 * - Eliminar fotos individuales
 * - Validación de tamaño (5MB por foto)
 * - Diseño responsive
 *
 * Uso:
 * <MultiPhotoUpload
 *   onUpload={(imagesBase64) => { ... }}
 *   maxPhotos={5}
 *   loading={false}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';

export default function MultiPhotoUpload({
  onUpload,           // Callback que recibe array de base64
  maxPhotos = 5,      // Número máximo de fotos
  loading = false,    // Estado de carga externo
  title = "📸 Sube fotos",
  subtitle = "Puedes subir hasta {max} fotos si el ejercicio ocupa varias páginas"
}) {
  const [images, setImages] = useState([]); // Array de {file, preview, id}
  const [error, setError] = useState(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Limpiar previews al desmontar
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [images]);

  // Handler para detectar Ctrl+V
  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      // Buscar imágenes en el clipboard
      const imageItems = Array.from(items).filter(item =>
        item.type.startsWith('image/')
      );

      if (imageItems.length === 0) return;

      event.preventDefault();

      // Validar que no exceda el límite
      if (images.length + imageItems.length > maxPhotos) {
        setError(`Máximo ${maxPhotos} fotos. Elimina alguna para pegar más.`);
        return;
      }

      // Procesar cada imagen pegada
      imageItems.forEach(item => {
        const file = item.getAsFile();
        if (!file) return;

        // Validar tamaño
        if (file.size > 5 * 1024 * 1024) {
          setError('La imagen pegada es muy grande (máximo 5MB)');
          return;
        }

        // Crear preview
        const newImage = {
          id: generateId(),
          file: file,
          preview: URL.createObjectURL(file)
        };

        setImages(prev => [...prev, newImage]);
        setError(null);
      });

      // Mostrar feedback visual
      setPasteSuccess(true);
      setTimeout(() => setPasteSuccess(false), 2000);
    };

    // Agregar listener
    window.addEventListener('paste', handlePaste);

    // Cleanup
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [images, maxPhotos]); // Dependencias: images y maxPhotos para validar límite

  // Generar ID único para cada imagen
  const generateId = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Manejar selección de archivos (múltiples)
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    // Validar número máximo
    if (images.length + files.length > maxPhotos) {
      setError(`Máximo ${maxPhotos} fotos. Elimina alguna para agregar más.`);
      return;
    }

    // Validar tipo de archivo
    const invalidTypes = files.filter(f => !f.type.startsWith('image/'));
    if (invalidTypes.length > 0) {
      setError('Solo se permiten archivos de imagen (JPG, PNG, etc.)');
      return;
    }

    // Validar tamaño (5MB por foto)
    const invalidFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('Algunas imágenes son muy grandes (máximo 5MB cada una)');
      return;
    }

    // Crear previews
    const newImages = files.map(file => ({
      id: generateId(),
      file: file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
    setError(null);

    // Resetear input
    event.target.value = '';
  };

  // Eliminar una imagen específica
  const handleRemoveImage = (imageId) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      // Liberar URL del preview
      const removed = prev.find(img => img.id === imageId);
      if (removed && removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return filtered;
    });
    setError(null);
  };

  // Procesar y subir todas las fotos
  const handleUpload = async () => {
    if (images.length === 0) {
      setError('Agrega al menos una foto');
      return;
    }

    try {
      // Convertir todas las imágenes a base64
      const imagesBase64 = await Promise.all(
        images.map(img => fileToBase64(img.file))
      );

      // Llamar al callback con las imágenes
      onUpload(imagesBase64);

    } catch (err) {
      setError('Error al procesar las imágenes');
      console.error('Error al convertir imágenes:', err);
    }
  };

  // Convertir File a Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div style={styles.container}>
      {/* TÍTULO Y SUBTÍTULO */}
      <h3 style={styles.title}>{title}</h3>

      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          📚 <strong>{subtitle.replace('{max}', maxPhotos)}</strong>
        </p>
      </div>

      {/* ZONA DE PREVIEWS */}
      {images.length > 0 && (
        <div style={styles.previewGrid}>
          {images.map((img, index) => (
            <div key={img.id} style={styles.previewCard}>
              <div style={styles.photoLabel}>
                Foto {index + 1}
              </div>

              <button
                onClick={() => handleRemoveImage(img.id)}
                style={styles.removeBtn}
                disabled={loading}
              >
                ×
              </button>

              <img
                src={img.preview}
                alt={`Preview ${index + 1}`}
                style={styles.previewImage}
              />
            </div>
          ))}
        </div>
      )}

      {/* FEEDBACK DE PASTE */}
      {pasteSuccess && (
        <div style={{
          background: '#dcfce7',
          color: '#166534',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          textAlign: 'center',
          animation: 'fadeIn 0.3s'
        }}>
          ✅ Imagen pegada correctamente
        </div>
      )}

      {/* BOTONES DE ACCIÓN */}
      <div style={styles.uploadArea}>
        {images.length === 0 ? (
          <>
            <p style={styles.uploadText}>
              📷 Toma fotos de las páginas
            </p>
            <p style={{
              fontSize: '14px',
              color: '#94a3b8',
              marginBottom: '16px',
              background: '#fff',
              padding: '8px 16px',
              borderRadius: '6px',
              display: 'inline-block'
            }}>
              💡 También puedes pegar con <kbd style={{
                background: '#e5e7eb',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}>Ctrl+V</kbd>
            </p>
          </>
        ) : (
          <>
            <p style={{...styles.selectedText, marginBottom: '8px'}}>
              {images.length} foto{images.length !== 1 ? 's' : ''} seleccionada{images.length !== 1 ? 's' : ''}
            </p>
            <p style={{
              fontSize: '13px',
              color: '#94a3b8',
              marginBottom: '16px'
            }}>
              💡 Puedes pegar más con Ctrl+V
            </p>
          </>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          capture={images.length === 0 ? "environment" : undefined}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          ref={fileInputRef}
          disabled={loading}
        />

        <div style={styles.buttonGroup}>
          {images.length < maxPhotos && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={loading ? styles.addBtnDisabled : styles.addBtn}
            >
              {images.length === 0 ? '📷 Tomar/Subir fotos' : '+ Agregar más fotos'}
            </button>
          )}

          {images.length > 0 && (
            <button
              onClick={handleUpload}
              disabled={loading}
              style={loading ? styles.processBtnDisabled : styles.processBtn}
            >
              {loading ? '⏳ Procesando...' : '✨ Procesar fotos'}
            </button>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
        </div>
      )}

      {/* CONSEJOS */}
      <div style={styles.hintBox}>
        <strong>💡 Consejos para mejores resultados:</strong>
        <ul style={styles.hintList}>
          <li>Toma las fotos con buena iluminación</li>
          <li>Asegúrate de que el texto se vea nítido</li>
          <li>Si son varias páginas, súbelas en orden</li>
          <li>Evita sombras o reflejos en la foto</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    textAlign: 'center',
    marginBottom: '16px',
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
  },
  infoBox: {
    background: '#f0f9ff',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  infoText: {
    margin: 0,
    color: '#1e40af',
    fontSize: '15px',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  previewCard: {
    position: 'relative',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'white',
  },
  photoLabel: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: '#3b82f6',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  previewImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  uploadArea: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    background: '#f9fafb',
  },
  uploadText: {
    fontSize: '18px',
    color: '#64748b',
    marginBottom: '24px',
  },
  selectedText: {
    fontSize: '16px',
    color: '#64748b',
    marginBottom: '16px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  addBtn: {
    padding: '14px 28px',
    background: 'white',
    border: '2px solid #3b82f6',
    color: '#3b82f6',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  addBtnDisabled: {
    padding: '14px 28px',
    background: '#f3f4f6',
    border: '2px solid #d1d5db',
    color: '#9ca3af',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  processBtn: {
    padding: '14px 28px',
    background: '#3b82f6',
    border: 'none',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  processBtnDisabled: {
    padding: '14px 28px',
    background: '#94a3b8',
    border: 'none',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  errorBox: {
    background: '#fee2e2',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '16px',
    color: '#991b1b',
    fontSize: '15px',
  },
  hintBox: {
    background: '#f0f9ff',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '24px',
    fontSize: '14px',
    color: '#1e40af',
  },
  hintList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
  },
};
