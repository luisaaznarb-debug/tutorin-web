
import Image from "next/image";
import React from "react";

export default function Hero() {
  const ejemplo = "Explícame paso a paso cómo resolver 3/4 + 2/3 sin darme el resultado final.";
  return (
    <section className="py-16 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          El asistente que enseña a <span className="text-green-600">pensar</span>, no a copiar.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Sube una foto o descríbele el ejercicio. Tutorín te guía con pistas y voz.
        </p>

        <div className="mt-8 flex flex-col md:flex-row gap-3 justify-center">
          <a href="#demo" className="px-6 py-3 rounded-2xl shadow bg-green-600 text-white">Probar demo</a>
          <a href="#precios" className="px-6 py-3 rounded-2xl border">Ver planes</a>
        </div>

        <div className="mt-8 max-w-3xl mx-auto">
          <label htmlFor="entrada" className="sr-only">Describe el ejercicio</label>
          <div className="flex gap-2">
            <input
              id="entrada"
              className="flex-1 rounded-2xl border px-4 py-3"
              placeholder="Describe tu ejercicio o pega el enunciado…"
            />
            <button
              className="px-5 py-3 rounded-2xl bg-black text-white"
              onClick={() => {
                const el = document.getElementById("entrada") as HTMLInputElement | null;
                if (el) el.value = ejemplo;
              }}
            >
              Usar ejemplo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
