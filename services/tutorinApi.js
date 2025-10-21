/**
 * tutorinApi.js
 * Cliente de API para Tutorín
 * ✅ Manejo robusto de errores de red
 * ✅ Mensajes de error amigables para el usuario
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000").replace(/\/+$/, "");

/**
 * Llama al endpoint /solve para resolver ejercicios paso a paso
 * @param {Object} payload - { question, last_answer, exercise_id, cycle }
 * @returns {Promise<Object>} Respuesta del servidor
 * @throws {Error} Error descriptivo si falla la petición
 */
export async function callSolve(payload) {
  try {
    const res = await fetch(`${API_BASE}/solve/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Si la respuesta no es OK, intentar leer el mensaje de error del servidor
    if (!res.ok) {
      let errorMessage = `Error HTTP ${res.status}`;
      
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Si no se puede parsear el JSON, usar el mensaje genérico
      }
      
      throw new Error(errorMessage);
    }

    return await res.json();
    
  } catch (err) {
    // Detectar errores de red (sin conexión, timeout, etc.)
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("❌ No se pudo conectar con Tutorín. Revisa tu conexión a internet o intenta más tarde.");
    }
    
    // Si es un error del servidor, relanzarlo con el mensaje original
    throw err;
  }
}

/**
 * Analiza un prompt en lenguaje natural (solo si NO hay ejercicio activo)
 * @param {Object} params - { prompt, step, answer, errors, lang }
 * @returns {Promise<Object>} Respuesta del servidor
 * @throws {Error} Error descriptivo si falla la petición
 */
export async function analyzePrompt({ prompt, step = 0, answer = "", errors = 0, lang = "es" }) {
  try {
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("step", String(step));
    form.append("answer", answer);
    form.append("errors", String(errors));
    form.append("lang", lang);

    const res = await fetch(`${API_BASE}/api/analyze_prompt`, { 
      method: "POST", 
      body: form 
    });

    if (!res.ok) {
      let errorMessage = `Error HTTP ${res.status}`;
      
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Si no se puede parsear el JSON, usar el mensaje genérico
      }
      
      throw new Error(errorMessage);
    }

    return await res.json();
    
  } catch (err) {
    // Detectar errores de red
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("❌ No se pudo conectar con Tutorín. Revisa tu conexión a internet.");
    }
    
    throw err;
  }
}

/**
 * Reproduce audio en formato base64
 * @param {string} b64 - Audio codificado en base64
 */
export function playBase64Audio(b64) {
  try {
    const audio = new Audio(`data:audio/mp3;base64,${b64}`);
    audio.play().catch(() => {});
  } catch (err) {
    console.warn("⚠️ No se pudo reproducir el audio:", err);
  }
}

export { API_BASE };