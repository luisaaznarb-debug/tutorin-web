"use client";

import { useEffect, useRef } from "react";

interface UseSpeechRecognitionProps {
  onResult: (text: string) => void;
}

export default function useSpeechRecognition({ onResult }: UseSpeechRecognitionProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition no soportado en este navegador");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[event.results.length - 1][0].transcript.trim();
      onResult(text);
    };

 recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
  console.error("Error en reconocimiento de voz:", event.error);
};


    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onResult]);
}
