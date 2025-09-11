
import React from "react";

export default function FAQ() {
  const faqs = [
    { q: "¿Da la respuesta final?", a: "No. Tutorín guía con pistas para que el niño llegue por sí mismo." },
    { q: "¿Qué edades?", a: "Primaria (6–12). También ayuda a 1º–2º ESO en básicos." },
    { q: "¿Privacidad?", a: "Cumplimos GDPR. Puedes borrar los datos desde tu perfil." },
  ];
  return (
    <section className="py-16">
      <h2 className="text-2xl font-semibold text-center">Preguntas frecuentes</h2>
      <div className="mt-8 space-y-4">
        {faqs.map((f) => (
          <details key={f.q} className="rounded-2xl border p-4">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-2 text-gray-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
