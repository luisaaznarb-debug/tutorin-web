
import React from "react";

export default function HowItWorks() {
  const steps = [
    { title: "1) Envíalo fácil", desc: "Sube una foto del ejercicio o dicta tu duda." },
    { title: "2) Pistas guiadas", desc: "Tutorín te hace preguntas y da pistas paso a paso." },
    { title: "3) Comprueba y refuerza", desc: "Valida tu avance, sin dar la respuesta final." },
  ];
  return (
    <section className="py-12">
      <h2 className="text-2xl font-semibold text-center">¿Cómo funciona?</h2>
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        {steps.map((s) => (
          <div key={s.title} className="rounded-2xl border p-6">
            <h3 className="font-semibold mb-2">{s.title}</h3>
            <p className="text-gray-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
