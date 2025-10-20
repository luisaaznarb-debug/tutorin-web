import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <img
          src="/tutorin.png"
          alt="Tutorín"
          width="60"
          height="60"
          style={{ borderRadius: "50%" }}
        />
        <h1 style={styles.title}>Tutorín — Tu profesor virtual de Primaria</h1>
      </header>

      <main style={styles.main}>
        <p style={styles.text}>
          👋 ¡Bienvenido a <strong>Tutorín</strong>!  
          Este asistente está diseñado para ayudar a los niños de Primaria a
          resolver ejercicios de Matemáticas, Lengua y otras materias, según el currículo LOMLOE.
        </p>

        <p style={styles.text}>
          Los alumnos pueden hablarle o escribirle a Tutorín, y él les orientará paso a paso con
          pistas, explicaciones y ejemplos adecuados a su nivel educativo.
        </p>

        <Link href="/tutorin-dialog" style={styles.button}>
          Ir al chat educativo →
        </Link>
      </main>

      <footer style={styles.footer}>
        <p>© 2025 Tutorín — Proyecto educativo alineado con LOMLOE</p>
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
    fontFamily: "sans-serif",
    background: "#f9fafb",
    color: "#111827",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "30px 0 10px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
  },
  main: {
    maxWidth: "700px",
    textAlign: "center",
    lineHeight: "1.6",
    padding: "0 20px",
  },
  text: {
    fontSize: "18px",
    marginBottom: "20px",
  },
  button: {
    display: "inline-block",
    background: "#2563eb",
    color: "#fff",
    padding: "14px 26px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "18px",
    fontWeight: "600",
  },
  footer: {
    fontSize: "14px",
    color: "#6b7280",
    padding: "20px 0",
  },
};
