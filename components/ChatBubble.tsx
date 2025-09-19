"use client";

import React from "react";

interface ChatBubbleProps {
  role: "Niño" | "Tutorin";
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const isChild = role === "Niño";

  return (
    <div
      className={`flex ${isChild ? "justify-start" : "justify-end"} my-2`}
    >
      <div
        className={`px-4 py-2 rounded-2xl max-w-[75%] shadow
          ${isChild ? "bg-blue-200 text-blue-900" : "bg-green-200 text-green-900"}
        `}
      >
        <p className="text-sm">
          <strong>{role}: </strong>
          {content}
        </p>
      </div>
    </div>
  );
}
