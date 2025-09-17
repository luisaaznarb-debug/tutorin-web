import { useEffect, useRef, useState } from 'react';

interface Transcript {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void;
}

export default function useSpeechRecognition({ onResult }: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results: Transcript[] = [];

      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i][0];
        results.push({
          transcript: res.transcript,
          confidence: res.confidence,
          isFinal: event.results[i].isFinal,
        });
      }

      const final = results.find((r) => r.isFinal);
      if (final) {
        onResult(final.transcript.trim());
      }
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  const start = () => {
    if (recognitionRef.current && !isRecording) {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stop = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return { start, stop, isRecording };
}
