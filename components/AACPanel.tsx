"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/app/resolver/page";
import useTTS from "@/hooks/useTTS";

interface AACPanelProps {
  onCommand: (cmd: string) => void;
  lastAssistantMessage: string;
  grade: string;
  setGrade: (g: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setBusy: (busy: boolean) => void;
  /** 👇 Acepta null porque el ref arranca en null */
  inputRef: React.RefObject<HTMLInputElement | null>;
  setText: (text: string) => void;
  sendMessage: (text?: string) => void;
}

const grades = ["1º", "2º", "3º", "4º", "5º", "6º"];

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
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Lectura automática del último mensaje del asistente
  useTTS(lastAssistantMessage, voiceEnabled);

  const pictos = [
    { label: "Sumar", command: "¿Cuánto es 3 + 4?" },
    { label: "Fracciones", command: "¿Cuánto es 1/2 + 3/4?" },
    { label: "Verbos", command: "¿Cómo se conjuga el verbo comer en presente?" },
    { label: "Mapa", command: "¿Dónde está el norte en un mapa?" },
  ];

  return (
    <section className="rounded-2xl border bg-white shadow-soft">
      <div className="p-5 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">Panel AAC</h2>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">Nivel:</span>
          {grades.map((g) => (
            <Button
              key={g}
              variant={g === grade ? "default" : "outline"}
              onClick={() => setGrade(g)}
              className={g === grade ? "bg-black text-white" : ""}
            >
              {g}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {pictos.map((p) => (
            <Button
              key={p.label}
              onClick={() => onCommand(p.command)}
              variant="secondary"
              className="bg-white border hover:bg-gray-50"
            >
              {p.label}
            </Button>
          ))}
          <Button onClick={() => onCommand("limpiar")} variant="outline">
            Limpiar
          </Button>
          <Button onClick={() => onCommand("enviar")} className="bg-black text-white">
            Enviar ahora
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="tts-toggle" className="text-sm">
            Lectura en voz alta
          </label>
          <input
            id="tts-toggle"
            type="checkbox"
            checked={voiceEnabled}
            onChange={() => setVoiceEnabled(!voiceEnabled)}
          />
        </div>
      </div>
    </section>
  );
}
