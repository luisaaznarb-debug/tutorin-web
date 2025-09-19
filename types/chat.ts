// types/chat.ts

export type ChatMessage = {
  role: "Niño" | "Tutorin";  // Cambiado a roles que usas en tu UI
  text: string;              // Cambiado "content" → "text" para coincidir con tu frontend
};

export type CoachBlock = {
  type: "Pregunta" | "Pista" | "Respuesta" | "Pista extra"; // En español, como lo usas en la UI
  text: string;
};

export type CoachResponse = {
  blocks: CoachBlock[];
};
