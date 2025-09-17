export type Step = {
text: string;
imageUrl?: string | null;
};

export type SkillFn = (input: string) => Step[];
export type TutorEngine = Map<string, SkillFn>;

export const engine: TutorEngine = new Map<string, SkillFn>();

// =======================================
// 🧠 DETECCIÓN AUTOMÁTICA DE SKILLS
// =======================================

export function detectSkill(input: string): string | null {
const text = input.toLowerCase();

if (/\b(suma|sumar|\+|más)\b/.test(text)) return 'mates:suma';
if (/\b(resta|restar|menos|\-)\b/.test(text)) return 'mates:resta';
if (/\b(multiplicar|multiplicación|x|\*)\b/.test(text)) return 'mates:multiplicacion';
if (/\b(dividir|división|entre|\/)\b/.test(text)) return 'mates:division';
if (/fracci(ón|ones)|numerador|denominador/.test(text)) return 'mates:fracciones';
if (/porcentaje|%/.test(text)) return 'mates:porcentajes';
if (/per[ií]metro/.test(text)) return 'mates:geometria:perimetro';
if (/área|superficie/.test(text)) return 'mates:geometria:area';
if (/figuras? geom[eé]tricas?/.test(text)) return 'mates:geometria:figuras';
if (/metros|litros|gramos|medidas/.test(text)) return 'mates:medidas';
if (/gráfica|tabla|media/.test(text)) return 'mates:datos';

if (/sustantivo/.test(text)) return 'lengua:sustantivos';
if (/verbo/.test(text)) return 'lengua:verbos';
if (/adjetivo/.test(text)) return 'lengua:adjetivos';
if (/determinante/.test(text)) return 'lengua:determinantes';
if (/oraci[oó]n/.test(text)) return 'lengua:oracion';
if (/comprensi[oó]n lectora/.test(text)) return 'lengua:comprension';
if (/ortograf[ií]a|tilde|acent[ou]/.test(text)) return 'lengua:ortografia';

if (/cuerpo humano|pulmones|coraz[oó]n|sistema/.test(text)) return 'ciencias:cuerpohumano';
if (/planta|ra[ií]z|tallo|hojas/.test(text)) return 'ciencias:plantas';
if (/agua|evaporaci[oó]n|condensaci[oó]n|ciclo/.test(text)) return 'ciencias:agua';
if (/mapa|provincia|comunidad/.test(text)) return 'sociales:mapas';
if (/prehistoria|edad (media|moderna|contempor[áa]nea|antigua)/.test(text)) return 'historia:epocas';

if (/color|colores en ingl[eé]s/.test(text)) return 'ingles:vocabulario';
if (/saludos|valenci[aà]n/.test(text)) return 'valenciano:saludos';

return null;
}

// =======================================
// 🧮 MATEMÁTICAS (1º a 6º PRIMARIA)
// =======================================

engine.set('mates:suma', () => [
  { text: 'Paso 1: Coloca los números en columnas: unidades, decenas, centenas.' },
  { text: 'Paso 2: Suma de derecha a izquierda. ¿Tienes que llevar?' },
]);

engine.set('mates:resta', () => [
  { text: 'Paso 1: Coloca los números en columnas.' },
  { text: 'Paso 2: Resta de derecha a izquierda. ¿Tienes que pedir prestado?' },
]);

engine.set('mates:multiplicacion', () => [
  { text: 'Paso 1: Multiplica cifra a cifra la parte inferior por cada cifra superior.' },
  { text: 'Paso 2: Suma los resultados parciales correctamente alineados.' },
]);

engine.set('mates:division', () => [
  { text: 'Paso 1: ¿Cuántas veces cabe el divisor en el primer número del dividendo?' },
  { text: 'Paso 2: Baja cifras y repite. No olvides comprobar el resto.' },
]);

engine.set('mates:fracciones', () => [
  { text: 'Paso 1: Identifica numerador y denominador.', imageUrl: '/images/fraccion.png' },
  { text: 'Paso 2: Aplica la operación: suma, resta, multiplicación o división.' },
]);

engine.set('mates:porcentajes', () => [
  { text: 'Paso 1: Convierte el porcentaje a fracción o decimal.' },
  { text: 'Paso 2: Aplica al número. Por ejemplo, 25% de 80 es 0.25 × 80.' },
]);

engine.set('mates:geometria:figuras', () => [
  { text: 'Paso 1: Observa los lados y ángulos. ¿Es triángulo, cuadrado, rectángulo…?', imageUrl: '/images/figuras.png' },
  { text: 'Paso 2: Revisa la definición de la figura para comprobar.' },
]);

engine.set('mates:geometria:perimetro', () => [
  { text: 'Paso 1: Suma todos los lados de la figura.', imageUrl: '/images/perimetro.png' },
]);

engine.set('mates:geometria:area', () => [
  { text: 'Paso 1: Usa la fórmula correcta. Por ejemplo: área = base × altura para rectángulo.', imageUrl: '/images/area.png' },
]);

engine.set('mates:medidas', () => [
  { text: 'Paso 1: Identifica la unidad. ¿Es metro, litro, gramo, etc.?' },
  { text: 'Paso 2: Convierte si es necesario: 1 m = 100 cm, 1 L = 1000 ml…' },
]);

engine.set('mates:datos', () => [
  { text: 'Paso 1: Observa el gráfico o tabla. ¿Qué te muestra?' },
  { text: 'Paso 2: Lee los valores y responde con cuidado.' },
]);

// =======================================
// ✍️ LENGUA CASTELLANA
// =======================================

engine.set('lengua:sustantivos', () => [
  { text: 'Paso 1: Busca palabras que nombran personas, animales o cosas.' },
  { text: 'Paso 2: ¿Es un sustantivo común o propio?' },
]);

engine.set('lengua:verbos', () => [
  { text: 'Paso 1: Identifica la acción en la oración.' },
  { text: 'Paso 2: ¿Está en presente, pasado o futuro?' },
]);

engine.set('lengua:adjetivos', () => [
  { text: 'Paso 1: ¿Qué palabra acompaña al sustantivo y lo describe?' },
]);

engine.set('lengua:determinantes', () => [
  { text: 'Paso 1: Busca palabras que van delante del sustantivo y lo concretan.' },
]);

engine.set('lengua:oracion', () => [
  { text: 'Paso 1: ¿Dónde está el sujeto? ¿Quién hace la acción?' },
  { text: 'Paso 2: ¿Dónde está el predicado? ¿Qué hace el sujeto?' },
]);

engine.set('lengua:comprension', () => [
  { text: 'Paso 1: Lee el texto con atención. Subraya palabras clave.' },
  { text: 'Paso 2: Busca en el texto pistas para responder.' },
]);

engine.set('lengua:ortografia', () => [
  { text: 'Paso 1: Revisa si hay tildes. ¿La palabra es aguda, llana o esdrújula?' },
  { text: 'Paso 2: Cuidado con la b/v, g/j, ll/y…' },
]);

// =======================================
// 🔬 CIENCIAS NATURALES y SOCIALES
// =======================================

engine.set('ciencias:cuerpohumano', () => [
  { text: 'Paso 1: ¿Qué sistema estás estudiando? (digestivo, respiratorio...)', imageUrl: '/images/cuerpohumano.png' },
  { text: 'Paso 2: ¿Qué órganos forman parte de él y qué hacen?' },
]);

engine.set('ciencias:plantas', () => [
  { text: 'Paso 1: Identifica partes de la planta: raíz, tallo, hojas, flor.', imageUrl: '/images/planta.png' },
  { text: 'Paso 2: ¿Qué función tiene cada parte?' },
]);

engine.set('ciencias:agua', () => [
  { text: 'Paso 1: ¿Qué estados tiene el agua?', imageUrl: '/images/cicloagua.png' },
  { text: 'Paso 2: ¿Cómo pasa de uno a otro? (evaporación, condensación...)' },
]);

engine.set('sociales:mapas', () => [
  { text: 'Paso 1: ¿Qué tipo de mapa es? (físico, político, etc.)', imageUrl: '/images/mapa.png' },
  { text: 'Paso 2: Busca el lugar que te piden. ¿En qué comunidad está?' },
]);

engine.set('historia:epocas', () => [
  { text: 'Paso 1: ¿En qué época estamos? Prehistoria, Edad Antigua, Edad Media...', imageUrl: '/images/epocas.png' },
  { text: 'Paso 2: ¿Qué pasó en esa época?' },
]);

// =======================================
// 🌍 IDIOMAS: INGLÉS y VALENCIANO
// =======================================

engine.set('ingles:vocabulario', () => [
  { text: 'Paso 1: ¿Qué significa esa palabra? Consulta si no estás seguro.' },
  { text: 'Paso 2: ¿Puedes usarla en una frase simple?' },
]);

engine.set('valenciano:saludos', () => [
  { text: 'Paso 1: ¿Cómo se dice "hola", "buenos días" o "adiós" en valencià?' },
]);

// Puedes añadir más idiomas o dialectos aquí.
