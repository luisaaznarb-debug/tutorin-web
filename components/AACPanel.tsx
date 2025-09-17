'use client';

import React, { RefObject } from 'react';
import SpeechInput from './SpeechInput';
import { ChatMessage } from '@/types/chat';

interface AACPanelProps {
  onCommand: (cmd: string) => void;
  lastAssistantMessage: string;
  grade: string;
  setGrade: (grade: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setBusy: (busy: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement>; // ✅ Corregido
  setText: (text: string) => void;
  sendMessage: (text?: string) => void;
}

export default function AACPanel({
  onCommand,
  lastAssistantMessage,
  grade,
  setGrade,
  setMessages,
  setBusy,
  inputRef,
  setText,
  sendMessage,
}: AACPanelProps) {
  return (
    <div className="mt-6 space-y-2">
      <div>
        <label htmlFor="grade" className="text-sm font-medium text-gray-700">
          Nivel:
        </label>
        <select
          id="grade"
          className="ml-2 border rounded px-2 py-1"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option value="1º">1º</option>
          <option value="2º">2º</option>
          <option value="3º">3º</option>
          <option value="4º">4º</option>
          <option value="5º">5º</option>
          <option value="6º">6º</option>
        </select>
      </div>

      <SpeechInput
        onCommand={onCommand}
        lastAssistantMessage={lastAssistantMessage}
        inputRef={inputRef}
        setText={setText}
        setMessages={setMessages}
        setBusy={setBusy}
        sendMessage={sendMessage}
      />
    </div>
  );
}
