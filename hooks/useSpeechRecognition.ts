"use client";

import { useEffect } from "react";

interface UseSpeechRecognitionOptions {
  onResult: (text: string) => void;
}

export default function useSpeechRecognition({
  onResult,
}: UseSpeechRecognitionOptions) {
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API no soportada en este navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-ES";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const final = Array.from(results).find((r) => r.isFinal);
      if (final) {
        onResult(final[0].transcript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("SpeechRecognition error:", event.error);
    };

    recognition.start();

    return () => recognition.stop();
  }, [onResult]);
}
