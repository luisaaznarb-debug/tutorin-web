const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const CHAT_PATH = process.env.NEXT_PUBLIC_BACKEND_CHAT_PATH ?? "/chat";

import type { ChatMessage, CoachResponse } from "@/types/chat";

export async function chatCoach(opts: {
  messages: ChatMessage[];
  subject: string;
  grade: string;
  maxHints?: number;
}) {
  const res = await fetch(`${BASE}${CHAT_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: opts.messages,
      subject: opts.subject,
      grade: opts.grade,
      mode: "coach",
      max_hints: opts.maxHints ?? 2,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status} – ${txt}`);
  }
  const data = (await res.json()) as CoachResponse;
  return data;
}
