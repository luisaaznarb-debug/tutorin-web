// lib/tutorinSkills.ts

/** Tipos compartidos con el front */
export type Step = {
  text: string;
  imageUrl?: string | null;
};

export type SkillFn = (input: string) => Step[];

export type TutorEngine = Map<string, SkillFn>;

/**
 * Motor de skills:
 *  - clave: id de la skill (ej. 'frac:add', 'mul', 'div', etc.)
 *  - valor: función que recibe el enunciado del usuario y devuelve pasos (hints)
 *
 * Lo dejamos inicializado con un par de ejemplos triviales para que compile
 * y para que puedas ver cómo meter más adelante tus skills reales.
 */
export const engine: TutorEngine = new Map<string, SkillFn>();

// ====== EJEMPLOS (inocuos, puedes borrarlos o ampliarlos) ======

engine.set('hello', (input) => {
  return [
    { text: '¡Hola! Voy a darte pistas poco a poco. ¿Qué números aparecen en tu ejercicio?' }
  ];
});

engine.set('frac:add', (input) => {
  // ejemplo de primeros pasos muy generales
  return [
    { text: 'Pista 1: Busca el **MCM** de los denominadores.' },
    { text: 'Pista 2: Convierte las fracciones al denominador común.' },
    { text: 'Pista 3: Suma los numeradores y **simplifica** el resultado.' },
  ];
});

// ====== Utilidades opcionales ======

/** Detección muy simple de si el enunciado parece “de mates” */
export function looksLikeMath(s: string): boolean {
  return /[\d/+\-*=]/.test(s);
}

/** Normaliza espacios y comillas “raras” */
export function cleanText(s: string): string {
  return s
    .replace(/\u00A0/g, ' ')   // NBSP -> space
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
