'use client';

import { useEffect } from 'react';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import { ChatMessage } from '@/types/chat';

interface SpeechInputProps {
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
  const { start, stop, isRecording } = useSpeechRecognition({
    onResult: (finalText: string) => {
      const trimmed = finalText.trim().toLowerCase();
      if (!trimmed) return;

      const commandPrefixes = ['escribe', 'resolver', 'pregunta', 'calcula'];
      const found = commandPrefixes.find((prefix) =>
        trimmed.startsWith(prefix)
      );

      if (found) {
        const command = trimmed.slice(found.length).trim();
        if (command) {
          onCommand(command);
        }
      }
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        if (isRecording) {
          stop();
        } else {
          start();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, start, stop]);

  return null;
}