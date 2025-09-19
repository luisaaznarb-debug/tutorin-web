"use client";

import { useEffect } from "react";

export default function useTTS(text: string, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !text) return;

    const speak = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();

        if (data.audio) {
          const audio = new Audio("data:audio/mp3;base64," + data.audio);
          audio.play();
        } else {
          console.error("Error en TTS:", data.error);
        }
      } catch (err) {
        console.error("Error en TTS:", err);
      }
    };

    speak();
  }, [text, enabled]);
}
