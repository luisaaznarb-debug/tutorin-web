export type ChatMessage = {
  role: string;   // 👈 ahora acepta cualquier string, no solo "Niño" | "Tutorin"
  content: string;
};

export type CoachBlock = {
  type: "Pregunta" | "Pista" | "Respuesta" | "Pista extra";
  text: string;
};

export type CoachResponse = {
  blocks: CoachBlock[];
};
