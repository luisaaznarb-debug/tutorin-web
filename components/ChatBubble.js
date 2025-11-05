// components/ChatBubble.js
// ✨ VERSIÓN MEJORADA: Burbujas grandes, coloridas con feedback visual
// ✅ CORREGIDO: Respeta colores del banner de fracciones en todas las burbujas

import React from "react";

function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";
  let safe = html.replace(/<\s*script[^>]*>.*?<\s*\/\s*script\s*>/gis, "");
  safe = safe.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  safe = safe.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:.*?\2/gi, "");
  return safe;
}

export default function ChatBubble({ role, text }) {
  const isUser = role === "user";
  
  // Detectar tipo de mensaje para dar estilo específico
  const isCorrect = text.includes("✅") || text.includes("Correcto");
  const isIncorrect = text.includes("❌");
  const isHint = text.includes("💡");
  const isCompleted = text.includes("🎉") || text.includes("completado");
  
  // Determinar si es una burbuja colorida (para ajustar contraste del texto)
  const isColoredBubble = !isUser && (isCorrect || isIncorrect || isHint || isCompleted);

  const getBubbleStyle = () => {
    if (isUser) {
      return {
        ...bubbleBase,
        background: "linear-gradient(135deg, #5B9BD5 0%, #7CB9E8 100%)",
        color: "#fff",
        alignSelf: "flex-end",
        boxShadow: "0 4px 12px rgba(91, 155, 213, 0.3)",
      };
    }

    // Mensaje de Tutorin con estilo según contenido
    if (isCorrect) {
      return {
        ...bubbleBase,
        background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
        color: "#fff",
        boxShadow: "0 4px 12px rgba(17, 153, 142, 0.3)",
        animation: "slideIn 0.3s ease-out",
      };
    }

    if (isIncorrect) {
      return {
        ...bubbleBase,
        background: "linear-gradient(135deg, #FFD93D 0%, #FFA559 100%)",
        color: "#333",
        boxShadow: "0 4px 12px rgba(255, 217, 61, 0.3)",
      };
    }

    if (isHint) {
      return {
        ...bubbleBase,
        background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        color: "#fff",
        boxShadow: "0 4px 12px rgba(79, 172, 254, 0.3)",
        borderLeft: "6px solid #0099ff",
      };
    }

    if (isCompleted) {
      return {
        ...bubbleBase,
        background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        color: "#fff",
        boxShadow: "0 4px 12px rgba(250, 112, 154, 0.3)",
        animation: "celebrate 0.5s ease-out",
      };
    }

    // Mensaje normal de Tutorin
    return {
      ...bubbleBase,
      background: "#fff",
      color: "#111",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      border: "2px solid #e5e7eb",
    };
  };

  const bubbleBase = {
    maxWidth: "85%",
    padding: "18px 22px",
    borderRadius: "20px",
    fontSize: "20px",
    lineHeight: "1.6",
    wordWrap: "break-word",
    overflowWrap: "anywhere",
    fontWeight: "500",
    transition: "all 0.3s ease",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "16px",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div 
        style={getBubbleStyle()}
        className={isColoredBubble ? "chat-bubble chat-bubble-colored" : "chat-bubble chat-bubble-white"}
      >
        {isUser ? (
          <span style={{ fontSize: "20px" }}>{text}</span>
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
            style={{ 
              fontSize: "20px",
              lineHeight: "1.6",
            }}
          />
        )}
      </div>
    </div>
  );
}

// Inyectar animaciones CSS
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes celebrate {
      0%, 100% { transform: scale(1); }
      25% { transform: scale(1.05) rotate(2deg); }
      75% { transform: scale(1.05) rotate(-2deg); }
    }
    
    /* Estilos para elementos HTML dentro de burbujas */
    .chat-bubble pre {
      background: rgba(0,0,0,0.1);
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 18px !important;
      line-height: 1.4;
      margin: 8px 0;
    }
    
    /* ✅ NUEVO: Tableros de operaciones dentro de burbujas coloridas */
    /* Forzar que los números y símbolos sean oscuros para buen contraste */
    .chat-bubble-colored pre,
    .chat-bubble-colored pre * {
      color: #1e3a8a !important;
    }
    
    /* Resaltados amarillos dentro de pre (para multiplicación) */
    .chat-bubble-colored pre span[style*="background-color:#fff59d"],
    .chat-bubble-colored pre span[style*="background:#fff59d"],
    .chat-bubble-colored pre span[style*="background-color:#ffcc80"],
    .chat-bubble-colored pre span[style*="background:#ffcc80"] {
      color: #1e3a8a !important;
      font-weight: bold !important;
    }
    
    /* Spans con colores específicos dentro de pre deben usar colores oscuros */
    .chat-bubble-colored pre span[style*="color:#1976d2"],
    .chat-bubble-colored pre span[style*="color: #1976d2"] {
      color: #0d47a1 !important; /* Azul más oscuro */
    }
    
    .chat-bubble-colored pre span[style*="color:#388e3c"],
    .chat-bubble-colored pre span[style*="color: #388e3c"] {
      color: #1b5e20 !important; /* Verde más oscuro */
    }
    
    .chat-bubble-colored pre span[style*="color:#d32f2f"],
    .chat-bubble-colored pre span[style*="color: #d32f2f"] {
      color: #b71c1c !important; /* Rojo más oscuro */
    }
    
    /* ✅ CORREGIDO: Sistema inteligente de contraste automático */
    
    /* Por defecto: burbujas coloridas usan texto blanco */
    .chat-bubble-colored {
      color: #fff;
    }
    
    .chat-bubble-colored b, 
    .chat-bubble-colored strong {
      font-weight: 700;
      font-size: 22px;
      color: #fff;
    }
    
    /* ✅ NUEVO: Elementos con fondos CLAROS dentro de burbujas coloridas usan texto OSCURO */
    /* Esto se aplica automáticamente a TODOS los engines sin necesidad de modificarlos */
    
    /* Fondos blancos o casi blancos */
    .chat-bubble-colored div[style*="background:#fff"],
    .chat-bubble-colored div[style*="background: #fff"],
    .chat-bubble-colored div[style*="background-color:#fff"],
    .chat-bubble-colored div[style*="background-color: #fff"],
    .chat-bubble-colored div[style*="background:white"],
    .chat-bubble-colored div[style*="background: white"],
    .chat-bubble-colored div[style*="background-color:white"],
    .chat-bubble-colored div[style*="background-color: white"],
    .chat-bubble-colored div[style*="background:#f"],
    .chat-bubble-colored div[style*="background: #f"] {
      color: #1e3a8a !important;
    }
    
    /* Fondos amarillos claros */
    .chat-bubble-colored div[style*="background:#fff3"],
    .chat-bubble-colored div[style*="background: #fff3"],
    .chat-bubble-colored div[style*="background-color:#fff3"],
    .chat-bubble-colored div[style*="background-color: #fff3"],
    .chat-bubble-colored div[style*="background:#fff9"],
    .chat-bubble-colored div[style*="background: #fff9"],
    .chat-bubble-colored div[style*="background-color:#fff9"],
    .chat-bubble-colored div[style*="background-color: #fff9"],
    .chat-bubble-colored div[style*="background:#ffe"],
    .chat-bubble-colored div[style*="background: #ffe"],
    .chat-bubble-colored div[style*="background-color:#ffe"],
    .chat-bubble-colored div[style*="background-color: #ffe"],
    .chat-bubble-colored div[style*="background:#ffec"],
    .chat-bubble-colored div[style*="background: #ffec"],
    .chat-bubble-colored div[style*="background-color:#ffec"],
    .chat-bubble-colored div[style*="background-color: #ffec"] {
      color: #1e3a8a !important;
    }
    
    /* Fondos azules claros */
    .chat-bubble-colored div[style*="background:#e3f2fd"],
    .chat-bubble-colored div[style*="background: #e3f2fd"],
    .chat-bubble-colored div[style*="background-color:#e3f2fd"],
    .chat-bubble-colored div[style*="background-color: #e3f2fd"],
    .chat-bubble-colored div[style*="background:#f0f9ff"],
    .chat-bubble-colored div[style*="background: #f0f9ff"],
    .chat-bubble-colored div[style*="background-color:#f0f9ff"],
    .chat-bubble-colored div[style*="background-color: #f0f9ff"],
    .chat-bubble-colored div[style*="background:#e8f4f8"],
    .chat-bubble-colored div[style*="background: #e8f4f8"],
    .chat-bubble-colored div[style*="background-color:#e8f4f8"],
    .chat-bubble-colored div[style*="background-color: #e8f4f8"] {
      color: #1e3a8a !important;
    }
    
    /* Fondos crema / beige / gris claros */
    .chat-bubble-colored div[style*="background:#f9fafb"],
    .chat-bubble-colored div[style*="background: #f9fafb"],
    .chat-bubble-colored div[style*="background-color:#f9fafb"],
    .chat-bubble-colored div[style*="background-color: #f9fafb"],
    .chat-bubble-colored div[style*="background:#fef7cd"],
    .chat-bubble-colored div[style*="background: #fef7cd"],
    .chat-bubble-colored div[style*="background-color:#fef7cd"],
    .chat-bubble-colored div[style*="background-color: #fef7cd"],
    .chat-bubble-colored div[style*="background:#f5f5f5"],
    .chat-bubble-colored div[style*="background: #f5f5f5"],
    .chat-bubble-colored div[style*="background-color:#f5f5f5"],
    .chat-bubble-colored div[style*="background-color: #f5f5f5"] {
      color: #1e3a8a !important;
    }
    
    /* Aplicar texto oscuro a TODOS los elementos dentro de esos divs de fondo claro */
    .chat-bubble-colored div[style*="background:#fff"] *,
    .chat-bubble-colored div[style*="background: #fff"] *,
    .chat-bubble-colored div[style*="background-color:#fff"] *,
    .chat-bubble-colored div[style*="background-color: #fff"] *,
    .chat-bubble-colored div[style*="background:#f"] *,
    .chat-bubble-colored div[style*="background: #f"] *,
    .chat-bubble-colored div[style*="background:white"] *,
    .chat-bubble-colored div[style*="background: white"] *,
    .chat-bubble-colored div[style*="background:#fff3"] *,
    .chat-bubble-colored div[style*="background: #fff3"] *,
    .chat-bubble-colored div[style*="background-color:#fff3"] *,
    .chat-bubble-colored div[style*="background-color: #fff3"] *,
    .chat-bubble-colored div[style*="background:#fff9"] *,
    .chat-bubble-colored div[style*="background: #fff9"] *,
    .chat-bubble-colored div[style*="background-color:#fff9"] *,
    .chat-bubble-colored div[style*="background-color: #fff9"] *,
    .chat-bubble-colored div[style*="background:#ffe"] *,
    .chat-bubble-colored div[style*="background: #ffe"] *,
    .chat-bubble-colored div[style*="background-color:#ffe"] *,
    .chat-bubble-colored div[style*="background-color: #ffe"] *,
    .chat-bubble-colored div[style*="background:#e3f2fd"] *,
    .chat-bubble-colored div[style*="background: #e3f2fd"] *,
    .chat-bubble-colored div[style*="background-color:#e3f2fd"] *,
    .chat-bubble-colored div[style*="background-color: #e3f2fd"] *,
    .chat-bubble-colored div[style*="background:#f0f9ff"] *,
    .chat-bubble-colored div[style*="background: #f0f9ff"] *,
    .chat-bubble-colored div[style*="background-color:#f0f9ff"] *,
    .chat-bubble-colored div[style*="background-color: #f0f9ff"] *,
    .chat-bubble-colored div[style*="background:#f9fafb"] *,
    .chat-bubble-colored div[style*="background: #f9fafb"] *,
    .chat-bubble-colored div[style*="background-color:#f9fafb"] *,
    .chat-bubble-colored div[style*="background-color: #f9fafb"] *,
    .chat-bubble-colored div[style*="background:#f5f5f5"] *,
    .chat-bubble-colored div[style*="background: #f5f5f5"] *,
    .chat-bubble-colored div[style*="background-color:#f5f5f5"] *,
    .chat-bubble-colored div[style*="background-color: #f5f5f5"] * {
      color: #1e3a8a !important;
    }
    
    /* Negritas y textos importantes en fondos claros */
    .chat-bubble-colored div[style*="background:#fff"] b,
    .chat-bubble-colored div[style*="background:#fff"] strong,
    .chat-bubble-colored div[style*="background-color:#fff"] b,
    .chat-bubble-colored div[style*="background-color:#fff"] strong,
    .chat-bubble-colored div[style*="background:#f"] b,
    .chat-bubble-colored div[style*="background:#f"] strong,
    .chat-bubble-colored div[style*="background:white"] b,
    .chat-bubble-colored div[style*="background:white"] strong,
    .chat-bubble-colored div[style*="background:#fff3"] b,
    .chat-bubble-colored div[style*="background:#fff3"] strong,
    .chat-bubble-colored div[style*="background-color:#fff3"] b,
    .chat-bubble-colored div[style*="background-color:#fff3"] strong {
      color: #1e3a8a !important;
      font-weight: 700 !important;
    }
    
    /* ✅ ESPECIAL: Banner de fracciones (protección adicional) */
    .chat-bubble .fraction-progress-banner,
    .chat-bubble-colored .fraction-progress-banner,
    .chat-bubble-white .fraction-progress-banner {
      color: #1e3a8a !important;
    }
    
    .chat-bubble .fraction-progress-banner *,
    .chat-bubble-colored .fraction-progress-banner *,
    .chat-bubble-white .fraction-progress-banner * {
      color: #1e3a8a !important;
    }
    
    /* Excepciones: colores específicos que deben mantenerse */
    .chat-bubble-colored [style*="color: #2e7d32"] {
      color: #2e7d32 !important;  /* Verde para resultados correctos */
    }
    
    .chat-bubble-colored [style*="color: #5B9BD5"] {
      color: #5B9BD5 !important;  /* Azul medio para resaltados */
    }
    
    .chat-bubble-colored [style*="color: #d32f2f"] {
      color: #d32f2f !important;  /* Rojo para resultados finales */
    }
    
    .chat-bubble-colored [style*="color: #1976d2"] {
      color: #1976d2 !important;  /* Azul para números destacados */
    }
    
    .chat-bubble-colored [style*="color: #388e3c"] {
      color: #388e3c !important;  /* Verde para líneas parciales */
    }
    
    /* Para burbujas blancas normales de Tutorín */
    .chat-bubble-white b,
    .chat-bubble-white strong {
      font-weight: 700;
      font-size: 22px;
      color: #5B9BD5 !important;
    }
    
    .chat-bubble code {
      background: rgba(0,0,0,0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }
    
    /* CORREGIDO: Estilos para fracciones */
    .chat-bubble sup {
      vertical-align: super;
      font-size: 0.8em;
      line-height: 0;
    }
    
    .chat-bubble sub {
      vertical-align: sub;
      font-size: 0.8em;
      line-height: 0;
    }
    
    /* Fracciones con barra horizontal - FORMATO MEJORADO */
    .chat-bubble .fraction {
      display: inline-flex;
      flex-direction: column;
      vertical-align: middle;
      text-align: center;
      margin: 0 0.3em;
      font-size: 1.1em;
      line-height: 1;
    }
    
    .chat-bubble .fraction-numerator {
      padding: 0 0.2em 0.1em;
      border-bottom: 2px solid currentColor;
      line-height: 1;
    }
    
    .chat-bubble .fraction-denominator {
      padding: 0.1em 0.2em 0;
      line-height: 1;
    }
    
    /* ✅ CORREGIDO: Las fracciones dentro del banner mantienen su color azul oscuro */
    .chat-bubble .fraction-progress-banner .fraction,
    .chat-bubble .fraction-progress-banner .fraction * {
      color: #1e3a8a !important;
    }
    
    /* Fracciones fuera del banner en burbujas coloridas son blancas */
    .chat-bubble-colored .fraction:not(.fraction-progress-banner .fraction),
    .chat-bubble-colored .fraction:not(.fraction-progress-banner .fraction) * {
      color: #fff !important;
    }
    
    /* Fracciones en burbujas blancas son azules */
    .chat-bubble-white .fraction,
    .chat-bubble-white .fraction * {
      color: #5B9BD5 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}