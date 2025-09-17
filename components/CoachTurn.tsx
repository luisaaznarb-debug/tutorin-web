"use client";

import { CoachBlock } from "@/types/chat";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

export default function CoachTurn({ blocks }: { blocks: CoachBlock[] }) {
  const label = (t: CoachBlock["type"]) =>
    t === "question" ? "Pregunta" : t === "hint" ? "Pista" : "Respuesta";

  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-xl border p-3 bg-white">
          <div className="mb-1">
            <Badge>{label(b.type)}</Badge>
          </div>
          <p>{b.text}</p>
        </div>
      ))}
    </div>
  );
}
