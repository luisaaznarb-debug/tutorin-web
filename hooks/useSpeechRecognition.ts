import { useEffect, useRef, useState } from "react";

type UseSpeechRecognitionOptions = {
  onResult: (text: string) => void;
};

export default function useSpeechRecognition({
  onResult,
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Compatibilidad con diferentes navegadores
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("⚠️ SpeechRecognition no está soportado en este navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES"; // Reconocimiento en español
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const final = results.find((r) => r.isFinal);
      if (final) {
        onResult(final[0].transcript.trim());
      }
    };

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onResult]);

  const start = () => {
    try {
      recognitionRef.current?.start();
    } catch (err) {
      console.error("Error al iniciar reconocimiento de voz:", err);
    }
  };

  const stop = () => {
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.error("Error al detener reconocimiento de voz:", err);
    }
  };

  return { start, stop, isRecording };
}
