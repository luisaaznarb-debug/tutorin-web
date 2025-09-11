
'use client';
import React, { useEffect, useState } from "react";

export default function ApiStatus() {
  const [status, setStatus] = useState<"checking"|"up"|"down">("checking");

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        setStatus(r.ok ? "up" : "down");
      } catch {
        setStatus("down");
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <p aria-live="polite" className="text-sm text-gray-600 mt-4">
      Estado API:{" "}
      {status === "checking" ? "Comprobando…" : status === "up" ? "✅ Operativa" : "❌ Sin conexión"}
    </p>
  );
}
