export type ChatMessage = {
  role: "Niño" | "Tutorin" | "system";
  content: string;
};

export type CoachBlock = {
  type: "Pregunta" | "Pista" | "Respuesta" | "Pista extra";
  text: string;
};

export type CoachResponse = {
  blocks: CoachBlock[];
};
