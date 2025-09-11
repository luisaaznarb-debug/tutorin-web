
import React from "react";

export default function Footer() {
  return (
    <footer className="py-12 text-sm text-gray-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3">
        <p>© {new Date().getFullYear()} Tutorín</p>
        <nav className="flex gap-4">
          <a href="/privacidad" className="hover:underline">Privacidad</a>
          <a href="/terminos" className="hover:underline">Términos</a>
          <a href="/contacto" className="hover:underline">Contacto</a>
        </nav>
      </div>
    </footer>
  );
}
