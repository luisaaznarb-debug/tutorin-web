"use client";

import { CoachBlock } from "@/types/chat";

export default function CoachTurn({ blocks }: { blocks: CoachBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <div
          key={i}
          className={`p-3 rounded-lg ${
            b.type === "Pregunta"
              ? "bg-blue-100 text-blue-800"
              : b.type === "Pista"
              ? "bg-yellow-100 text-yellow-800"
              : b.type === "Pista extra"
              ? "bg-orange-100 text-orange-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          <strong>{b.type}:</strong> {b.text}
        </div>
      ))}
    </div>
  );
}
