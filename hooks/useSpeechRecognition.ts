"use client";

import { useRef } from "react";

interface UseSpeechRecognitionProps {
  onResult: (text: string) => void;
  lang?: string; // idioma
}

export default function useSpeechRecognition({
  onResult,
  lang = "es-ES",
}: UseSpeechRecognitionProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const initRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("❌ Tu navegador no soporta reconocimiento de voz.");
      return null;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult =
        event.results[event.results.length - 1][0].transcript.trim();
      console.log("📝 Texto reconocido:", lastResult);
      onResult(lastResult);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("⚠️ Error:", event.error);
    };

    return recognition;
  };

  const startListening = () => {
    if (!recognitionRef.current) recognitionRef.current = initRecognition();
    recognitionRef.current?.start();
    console.log("🎤 Micrófono activado");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    console.log("🛑 Micrófono desactivado");
  };

  return { startListening, stopListening };
}
