import "katex/dist/katex.min.css";
import React from "react";

export default function App({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        /* === Estilo general del modo cuaderno/pizarra === */
        pre {
          background: repeating-linear-gradient(
              0deg,
              #ffffff,
              #ffffff 22px,
              #f0f4f8 23px
            );
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 14px 16px;
          font-family: "Courier New", monospace;
          font-size: 18px;
          line-height: 1.35;
          color: #111827;
          margin: 10px 0;
          white-space: pre;
          overflow-x: auto;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        pre b {
          color: #1d4ed8;
        }

        strong {
          color: #1e3a8a;
        }

        .math {
          font-family: "KaTeX_Main", serif;
        }
      `}</style>

      <Component {...pageProps} />
    </>
  );
}
