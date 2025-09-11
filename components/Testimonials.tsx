
import React from "react";

export default function Testimonials() {
  const items = [
    { name: "Marta G. (Valencia)", text: "Mi hijo dejó de pedir ‘la respuesta’ y ahora me explica el proceso." },
    { name: "Álvaro R. (Madrid)", text: "Con la voz, parece que tiene un profe paciente en casa." },
  ];
  return (
    <section className="py-16">
      <h2 className="text-2xl font-semibold text-center">Familias que ya usan Tutorín</h2>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        {items.map((t) => (
          <div key={t.name} className="rounded-2xl border p-6">
            <p className="text-gray-700">“{t.text}”</p>
            <p className="mt-3 text-sm text-gray-500">— {t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
