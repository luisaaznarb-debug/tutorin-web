import React from "react";

function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";
  let safe = html.replace(/<\s*script[^>]*>.*?<\s*\/\s*script\s*>/gis, "");
  safe = safe.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  safe = safe.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:.*?\2/gi, "");
  return safe;
}

export default function ChatBubble({ role, text }) {
  const isUser = role === "user";
  const bubbleStyle = {
    maxWidth: "85%",
    padding: "12px 14px",
    borderRadius: 14,
    background: isUser ? "#2563eb" : "#f3f4f6",
    color: isUser ? "#fff" : "#111827",
    whiteSpace: "pre-wrap",
    lineHeight: 1.35,
    overflowWrap: "anywhere",
    fontSize: "16px",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
      }}
    >
      <div style={bubbleStyle}>
        {isUser ? (
          text
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
            style={{ display: "block" }}
          />
        )}
      </div>
    </div>
  );
}
