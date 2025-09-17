export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type CoachBlock = {
  type: "question" | "hint" | "answer";
  text: string;
};

export type CoachResponse = {
  blocks: CoachBlock[];
};
