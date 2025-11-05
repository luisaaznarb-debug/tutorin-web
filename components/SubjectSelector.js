// components/SubjectSelector.js
// Selector de materias para Tutorín

import React from 'react';

export default function SubjectSelector({ onSelectSubject }) {
  const subjects = [
    { id: 'matematicas', name: 'Matemáticas', emoji: '🔢', color: '#3b82f6' },
    { id: 'lengua', name: 'Lengua', emoji: '📖', color: '#8b5cf6' },
    { id: 'sociales', name: 'Ciencias Sociales', emoji: '🌍', color: '#10b981' },
    { id: 'naturales', name: 'Ciencias de la Naturaleza', emoji: '🔬', color: '#f59e0b' },
    { id: 'ingles', name: 'Inglés', emoji: '🌐', color: '#ef4444' },
    { id: 'valenciano', name: 'Valencià', emoji: '📚', color: '#ec4899' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>¿Qué quieres estudiar hoy?</h1>
          <p style={styles.subtitle}>Selecciona una materia para comenzar</p>
        </div>

        <div style={styles.grid}>
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              style={{
                ...styles.card,
                borderColor: subject.color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${subject.color}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                {subject.emoji}
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>
                {subject.name}
              </h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  content: {
    maxWidth: '1000px',
    width: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  title: {
    fontSize: '48px',
    fontWeight: '700',
    color: 'white',
    margin: '0 0 16px 0',
  },
  subtitle: {
    fontSize: '20px',
    color: 'rgba(255,255,255,0.9)',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  },
  card: {
    background: 'white',
    border: '3px solid',
    borderRadius: '16px',
    padding: '32px 24px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    outline: 'none',
  },
};
