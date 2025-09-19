"use client";

import { useEffect, useState } from "react";

interface CoachBlock {
  type: "Pregunta" | "Pista" | "Respuesta" | "Pista extra";
  text: string;
}

/**
 * Reproduce automáticamente los bloques de conversación
 * usando el backend `/tts` (con ElevenLabs protegido).
 */
export default function useConversationTTS(blocks: CoachBlock[], pauseMs = 4000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!blocks.length) return;

    let cancelled = false;

    const speakBlock = async (text: string) => {
      try {
        const response = await fetch("http://127.0.0.1:8000/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();

        if (data.audio) {
          const audio = new Audio("data:audio/mp3;base64," + data.audio);
          await new Promise<void>((resolve) => {
            audio.onended = () => resolve();
            audio.play();
          });
        } else {
          console.error("Error en TTS:", data.error);
        }
      } catch (err) {
        console.error("Error al reproducir bloque:", err);
      }
    };

    const playSequence = async () => {
      for (let i = 0; i < blocks.length; i++) {
        if (cancelled) break;
        await speakBlock(blocks[i].text);
        if (pauseMs > 0) {
          await new Promise((r) => setTimeout(r, pauseMs));
        }
        setIndex(i + 1);
      }
    };

    playSequence();

    return () => {
      cancelled = true;
    };
  }, [blocks, pauseMs]);

  return index; // devuelve el índice del bloque que se está reproduciendo
}
