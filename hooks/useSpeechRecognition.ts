import { useEffect } from 'react';

export type OnResultCallback = (finalText: string) => void;

export function useSpeechRecognition(onResult: OnResultCallback, lang = 'es-ES', autoStart = false) {
  const recognitionRef = typeof window !== 'undefined' ? (window as any).webkitSpeechRecognition
    ? new (window as any).webkitSpeechRecognition()
    : null
    : null;

  useEffect(() => {
    if (!recognitionRef) return;

    const recognition: SpeechRecognition = recognitionRef;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    const results: { transcript: string; confidence: number; isFinal: boolean }[] = [];

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
    };

    if (autoStart) {
      recognition.start();
    }

    return () => {
      recognition.stop();
    };
  }, [lang, onResult, autoStart]);

  return {
    startListening: () => recognitionRef?.start?.(),
    stop: () => recognitionRef?.stop?.(),
  };
}
