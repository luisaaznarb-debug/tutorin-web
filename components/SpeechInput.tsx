"use client";

import { useState } from "react";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

interface SpeechInputProps {
  sendMessage: (text: string) => void;
}

export default function SpeechInput({ sendMessage }: SpeechInputProps) {
  const [transcript, setTranscript] = useState("");

  // Usamos el hook personalizado
  const { start, stop, isRecording } = useSpeechRecognition({
    onResult: (finalText: string) => {
      const trimmed = finalText.trim().toLowerCase();
      if (!trimmed) return;

      setTranscript(trimmed);
      sendMessage(trimmed);
    },
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={isRecording ? stop : start}
        className={`px-4 py-2 rounded-lg font-semibold shadow-md transition ${
          isRecording ? "bg-red-500 text-white" : "bg-blue-500 text-white"
        }`}
      >
        {isRecording ? "Detener 🎙️" : "Hablar ahora 🎤"}
      </button>

      {transcript && (
        <p className="text-gray-700 italic">
          Último mensaje: <span className="font-bold">{transcript}</span>
        </p>
      )}
    </div>
  );
}
