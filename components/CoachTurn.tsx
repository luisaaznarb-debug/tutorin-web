"use client";

import { CoachBlock } from "@/types/chat";

export default function CoachTurn({ blocks }: { blocks: CoachBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        let label = "";
        switch (b.type) {
          case "Pregunta":
            label = "Pregunta";
            break;
          case "Pista":
            label = "Pista";
            break;
          case "Pista extra":
            label = "Pista extra";
            break;
          case "Respuesta":
            label = "Respuesta";
            break;
        }

        return (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              b.type === "Pregunta"
                ? "bg-blue-100"
                : b.type === "Pista"
                ? "bg-yellow-100"
                : b.type === "Pista extra"
                ? "bg-orange-100"
                : "bg-green-100"
            }`}
          >
            <strong>{label}:</strong> {b.text}
          </div>
        );
      })}
    </div>
  );
}
