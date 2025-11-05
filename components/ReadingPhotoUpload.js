import React, { useState, useRef } from 'react';
import { uploadMultipleReadingPhotos } from '../services/tutorinApi';

export default function ReadingPhotoUpload({ onStart, onBack }) {
  const [images, setImages] = useState([]); // Array de {file, preview, id}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  // Generar ID único para cada imagen
  const generateId = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Manejar selección de archivos (múltiples)
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    // Validar número máximo (5 fotos)
    if (images.length + files.length > 5) {
      setError('Máximo 5 fotos. Elimina alguna para agregar más.');
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
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return filtered;
    });
  };

  // Subir todas las fotos
  const handleUpload = async () => {
    if (images.length === 0) {
      setError('Agrega al menos una foto');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convertir todas las imágenes a base64
      const imagesBase64 = await Promise.all(
        images.map(img => fileToBase64(img.file))
      );

      // Llamar al backend con todas las imágenes
      const response = await uploadMultipleReadingPhotos(imagesBase64);

      setResult({
        wordCount: response.word_count || 0,
        questionsCount: response.questions_count || 0
      });

      // Esperar 2 segundos para mostrar resultado
      setTimeout(() => {
        onStart(response.exercise_id, response.exercise);
      }, 2000);

    } catch (err) {
      setError(err.message || 'Error al procesar las fotos');
    } finally {
      setLoading(false);
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
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#6b7280',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        ← Volver
      </button>

      <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>
        📸 Sube fotos de tu libro
      </h3>

      <div style={{
        background: '#f0f9ff',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, color: '#1e40af' }}>
          📚 <strong>Puedes subir hasta 5 fotos</strong> si el ejercicio ocupa varias páginas
        </p>
      </div>

      {/* ZONA DE PREVIEWS */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {images.map((img, index) => (
            <div
              key={img.id}
              style={{
                position: 'relative',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'white'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                background: '#3b82f6',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Foto {index + 1}
              </div>

              <button
                onClick={() => handleRemoveImage(img.id)}
                style={{
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
                  justifyContent: 'center'
                }}
              >
                ×
              </button>

              <img
                src={img.preview}
                alt={`Preview ${index + 1}`}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover'
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* BOTONES DE ACCIÓN */}
      <div style={{
        border: '2px dashed #cbd5e1',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        background: '#f9fafb'
      }}>
        {images.length === 0 ? (
          <>
            <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '24px' }}>
              📷 Toma fotos de las páginas de tu libro
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              capture="camera"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
          </>
        ) : (
          <>
            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '16px' }}>
              {images.length} foto{images.length !== 1 ? 's' : ''} seleccionada{images.length !== 1 ? 's' : ''}
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
          </>
        )}

        {images.length < 5 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '14px 28px',
              background: 'white',
              border: '2px solid #3b82f6',
              color: '#3b82f6',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '12px'
            }}
          >
            {images.length === 0 ? '📷 Tomar/Subir fotos' : '+ Agregar más fotos'}
          </button>
        )}

        {images.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{
              padding: '14px 28px',
              background: loading ? '#94a3b8' : '#3b82f6',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Procesando...' : '✨ Procesar ejercicio'}
          </button>
        )}
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{
          background: '#fef3c7',
          padding: '16px',
          borderRadius: '8px',
          marginTop: '16px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
            🤖 Extrayendo texto de {images.length} foto{images.length !== 1 ? 's' : ''}...
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
            Esto puede tardar {images.length * 3}-{images.length * 5} segundos
          </p>
        </div>
      )}

      {/* RESULTADO */}
      {result && (
        <div style={{
          background: '#dcfce7',
          padding: '16px',
          borderRadius: '8px',
          marginTop: '16px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
            ✅ ¡Listo! Detecté:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Texto: {result.wordCount} palabras</li>
            <li>Preguntas: {result.questionsCount}</li>
          </ul>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div style={{
          background: '#fee2e2',
          padding: '16px',
          borderRadius: '8px',
          marginTop: '16px',
          color: '#991b1b'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* CONSEJOS */}
      <div style={{
        background: '#f0f9ff',
        padding: '16px',
        borderRadius: '8px',
        marginTop: '24px',
        fontSize: '14px'
      }}>
        <strong>💡 Consejos para mejores resultados:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>Toma las fotos con buena iluminación</li>
          <li>Asegúrate de que el texto se vea nítido</li>
          <li>Si son varias páginas, súbelas en orden</li>
          <li>Evita sombras o reflejos en la foto</li>
        </ul>
      </div>
    </div>
  );
}
