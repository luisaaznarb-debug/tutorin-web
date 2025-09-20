import React from "react";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  return (
    <div
      className={`flex items-start gap-2 my-2 ${
        role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {role === "assistant" && (
        <img
          src="/tutorin.png" // 📌 pon aquí la imagen en /public/tutorin.png
          alt="Tutorín"
          className="w-10 h-10 rounded-full border shadow"
        />
      )}
      <div
        className={`p-3 max-w-md rounded-xl ${
          role === "user"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-900"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
