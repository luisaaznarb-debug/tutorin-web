export type ChatMessage = { role: 'user' | 'assistant'; content: string };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function chatRequest(
  message: string,
  history: ChatMessage[],
  subject: string,
  grade: string = 'Primaria',
  hintMode: boolean = true
) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      subject,
      grade,
      hintMode,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Error HTTP ${res.status}`);
  }

  return (await res.json()) as { steps?: { text: string; imageUrl?: string | null }[], reply?: string };
}
