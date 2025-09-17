'use client';

import React, { useEffect } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { ChatMessage } from '@/types/chat';

export interface SpeechInputProps {
  onCommand: (cmd: string) => void;
  lastAssistantMessage: string;
  inputRef: React.RefObject<HTMLInputElement>;
  setText: (text: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setBusy: (busy: boolean) => void;
  sendMessage: (text?: string) => void;
}

export default function SpeechInput({
  onCommand,
  lastAssistantMessage,
  inputRef,
  setText,
  setMessages,
  setBusy,
  sendMessage,
}: SpeechInputProps) {
  const { startListening } = useSpeechRecognition((finalText) => {
    if (!finalText) return;

    setText(finalText);
    setMessages((prev) => [...prev, { role: 'user', text: finalText }]);
    setBusy(true);

    fetch('/backend/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: finalText }),
    })
      .then((res) => res.json())
      .then((data) => {
        const steps: ChatMessage[] = (data.steps ?? []).map((s: any) => ({
          role: 'assistant',
          text: s?.text ?? '',
          imageUrl: s?.imageUrl ?? null,
        }));

        setMessages((prev) => [...prev, ...steps]);
      })
      .catch((err) => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Error al obtener respuesta: ${err.message}`,
          },
        ]);
      })
      .finally(() => {
        setBusy(false);
        inputRef.current?.focus();
      });
  });

  useEffect(() => {
    if (!lastAssistantMessage) return;

    if (lastAssistantMessage.includes('¿Qué más quieres resolver?')) {
      startListening();
    }
  }, [lastAssistantMessage, startListening]);

  return null;
}
