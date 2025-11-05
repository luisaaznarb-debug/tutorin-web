// pages/index.js
// ✨ VERSIÓN MEJORADA: Página de inicio moderna y colorida

import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div style={styles.container}>
      {/* Fondo animado */}
      <div style={styles.backgroundShapes}>
        <div style={{...styles.shape, ...styles.shape1}}></div>
        <div style={{...styles.shape, ...styles.shape2}}></div>
        <div style={{...styles.shape, ...styles.shape3}}></div>
      </div>

      <header style={styles.header}>
        <div style={styles.avatarLarge}>
          <img 
            src="/tutorin.png" 
            alt="Tutorín" 
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        </div>
        <h1 style={styles.title}>Tutorín</h1>
        <p style={styles.titleSub}>Tu profesor virtual de Primaria</p>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>¡Hola! 👋</h2>
          <p style={styles.text}>
            Soy <strong style={styles.highlight}>Tutorín</strong>, tu asistente educativo.
            Puedo ayudarte con:
          </p>

          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>➕</div>
              <div>
                <h3 style={styles.featureTitle}>Matemáticas</h3>
                <p style={styles.featureText}>Sumas, restas, multiplicaciones, divisiones, fracciones</p>
              </div>
            </div>

            <div style={styles.feature}>
              <div style={styles.featureIcon}>🎤</div>
              <div>
                <h3 style={styles.featureTitle}>Habla o escribe</h3>
                <p style={styles.featureText}>Puedes escribir o usar tu voz para hacer ejercicios</p>
              </div>
            </div>

            <div style={styles.feature}>
              <div style={styles.featureIcon}>💡</div>
              <div>
                <h3 style={styles.featureTitle}>Pistas paso a paso</h3>
                <p style={styles.featureText}>Te ayudo sin darte la respuesta directamente</p>
              </div>
            </div>

            <div style={styles.feature}>
              <div style={styles.featureIcon}>🎯</div>
              <div>
                <h3 style={styles.featureTitle}>Para todos los niveles</h3>
                <p style={styles.featureText}>Desde 1º hasta 6º de Primaria</p>
              </div>
            </div>
          </div>

          <Link href="/tutorin-dialog" style={styles.button}>
            🚀 ¡Empezar a aprender!
          </Link>
        </div>

        <div style={styles.infoCard}>
          <p style={styles.infoText}>
            📚 <strong>Alineado con LOMLOE</strong> - Currículo oficial español
          </p>
          <p style={styles.infoText}>
            ✨ <strong>Aprende jugando</strong> - Diseño pensado para niños
          </p>
        </div>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2025 Tutorín - Proyecto educativo</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: "linear-gradient(135deg, #5B9BD5 0%, #7CB9E8 100%)",
    position: "relative",
    overflow: "hidden",
  },

  // Formas de fondo animadas
  backgroundShapes: {
    position: "absolute",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    zIndex: 0,
  },
  shape: {
    position: "absolute",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.1)",
    animation: "float 20s infinite ease-in-out",
  },
  shape1: {
    width: "300px",
    height: "300px",
    top: "10%",
    left: "-5%",
  },
  shape2: {
    width: "200px",
    height: "200px",
    top: "60%",
    right: "-5%",
    animationDelay: "5s",
  },
  shape3: {
    width: "150px",
    height: "150px",
    bottom: "10%",
    left: "50%",
    animationDelay: "10s",
  },

  // Header
  header: {
    textAlign: "center",
    padding: "40px 20px 20px",
    zIndex: 1,
  },
  avatarLarge: {
    width: "140px",
    height: "140px",
    margin: "0 auto 20px",
    borderRadius: "50%",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
    animation: "bounce 2s infinite",
    padding: "8px",
  },
  title: {
    fontSize: "48px",
    fontWeight: "bold",
    margin: "0 0 8px",
    color: "#fff",
    textShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  titleSub: {
    fontSize: "22px",
    margin: 0,
    color: "rgba(255, 255, 255, 0.9)",
  },

  // Main
  main: {
    maxWidth: "900px",
    width: "100%",
    padding: "0 20px 40px",
    zIndex: 1,
  },
  card: {
    background: "#fff",
    borderRadius: "24px",
    padding: "36px",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "36px",
    margin: "0 0 20px",
    color: "#5B9BD5",
    textAlign: "center",
  },
  text: {
    fontSize: "20px",
    lineHeight: "1.7",
    color: "#333",
    marginBottom: "32px",
    textAlign: "center",
  },
  highlight: {
    background: "linear-gradient(135deg, #5B9BD5 0%, #FFB84D 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontWeight: "bold",
  },

  // Features
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "36px",
  },
  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    borderRadius: "16px",
  },
  featureIcon: {
    fontSize: "36px",
    minWidth: "48px",
    textAlign: "center",
  },
  featureTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    margin: "0 0 6px",
    color: "#5B9BD5",
  },
  featureText: {
    fontSize: "16px",
    margin: 0,
    color: "#555",
    lineHeight: "1.4",
  },

  // Button
  button: {
    display: "block",
    width: "100%",
    background: "linear-gradient(135deg, #FFB84D 0%, #FF6B4A 100%)",
    color: "#fff",
    padding: "20px 32px",
    borderRadius: "16px",
    textDecoration: "none",
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center",
    boxShadow: "0 8px 20px rgba(255, 184, 77, 0.4)",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
  },

  // Info card
  infoCard: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "16px",
    padding: "20px 28px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
  },
  infoText: {
    fontSize: "18px",
    margin: "8px 0",
    color: "#333",
  },

  // Footer
  footer: {
    padding: "24px",
    zIndex: 1,
  },
  footerText: {
    fontSize: "16px",
    color: "rgba(255, 255, 255, 0.8)",
    margin: 0,
  },
};

// Inyectar animaciones
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0) translateX(0); }
      50% { transform: translateY(-30px) translateX(30px); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    a[style*="button"]:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(255, 184, 77, 0.5) !important;
    }
  `;
  document.head.appendChild(styleSheet);
}