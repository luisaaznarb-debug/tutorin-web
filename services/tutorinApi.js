const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function callSolve(payload) {
  const res = await fetch(`${API_BASE}/solve/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Mantengo analyzePrompt por si lo usas en otra parte (solo cuando no hay ejercicio activo)
export async function analyzePrompt({ prompt, step = 0, answer = "", errors = 0, lang = "es" }) {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("step", String(step));
  form.append("answer", answer);
  form.append("errors", String(errors));
  form.append("lang", lang);

  const res = await fetch(`${API_BASE}/api/analyze_prompt`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function playBase64Audio(b64) {
  try {
    const audio = new Audio(`data:audio/mp3;base64,${b64}`);
    audio.play().catch(() => {});
  } catch {}
}

export { API_BASE };
