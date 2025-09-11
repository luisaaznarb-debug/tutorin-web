
import React from "react";

export default function Pricing() {
  return (
    <section id="precios" className="py-16">
      <h2 className="text-2xl font-semibold text-center">Planes y precios</h2>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-6">
          <h3 className="text-xl font-semibold">Gratis</h3>
          <p className="text-gray-600 mt-2">Hasta 10 dudas/semana</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>• Pistas paso a paso</li>
            <li>• Entrada por texto e imagen</li>
            <li>• Modo demo de voz</li>
          </ul>
          <button className="mt-6 w-full rounded-2xl border py-3">Empezar</button>
        </div>
        <div className="rounded-2xl border p-6 bg-green-50">
          <h3 className="text-xl font-semibold">Familia</h3>
          <p className="text-gray-600 mt-2">Ilimitado + voz premium</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>• Todo lo del plan Gratis</li>
            <li>• Voz ElevenLabs</li>
            <li>• Informes semanales</li>
            <li>• Soporte prioritario</li>
          </ul>
          <button className="mt-6 w-full rounded-2xl bg-green-600 text-white py-3">Probar 7 días</button>
        </div>
      </div>
    </section>
  );
}
