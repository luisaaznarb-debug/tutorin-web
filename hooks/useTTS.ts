"use client";

/**
 * Hook de Text-to-Speech.
 * Uso:
 *   useTTS(texto, enabled)
 * - Si `enabled` es true, leerá en voz alta cada vez que cambie `texto`.
 * - Cancela la lectura anterior antes de hablar.
 */
export default function useTTS(text?: string, enabled: boolean = true) {
  // en SSR no hay window
  if (typeof window === "undefined") return;

  // Cancelamos cualquier lectura previa antes de programar una nueva
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }

  // Si no está habilitado o no hay texto, no hacemos nada
  if (!enabled || !text) return;

  // Programamos la lectura del texto
  const utterance = new SpeechSynthesisUtterance(text);
  try {
    window.speechSynthesis.speak(utterance);
  } catch {
    /* noop */
  }
}
