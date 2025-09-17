// hooks/useSpeech.ts

export function useSpeechSynthesis() {
  function speak(text: string, lang = 'es-ES') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.cancel(); // Detiene lo anterior
    window.speechSynthesis.speak(utterance);
  }

  return { speak };
}