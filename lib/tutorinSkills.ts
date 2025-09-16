/* Tutorín – Motor multi-materia con guiado paso a paso (Primaria completa y 1.º ESO)
   Una pista por turno → espera → valida → avanza o repregunta.
   No requiere ficheros externos (bancos de datos integrados).
*/

/* ─────────────────────────── Tipos y motor ─────────────────────────── */

export type GradeBand = "1-2" | "3-4" | "5-6" | "ESO";
export type Subject = "mates" | "lengua" | "ciencias" | "historia" | "geo" | "general";

export type ProblemCtx = { raw: string; data: any; grade?: GradeBand; subject?: Subject };
export type CheckResult = { ok: boolean; feedback?: string; nextHint?: string };
export type Step = { id: string; ask: (ctx: ProblemCtx) => string; check: (ctx: ProblemCtx, answer: string) => CheckResult; };
export type Skill = {
  id: string; title: string; subject: Subject;
  matchAndParse: (raw: string, grade?: GradeBand) => ProblemCtx | null;
  steps: (ctx: ProblemCtx) => Step[];
  finalAnswer: (ctx: ProblemCtx) => string;
};

export type Turn =
  | { type: "ask"; text: string; stepId: string; skillId: string; state: any }
  | { type: "tell"; text: string; done?: boolean; state?: any };

export class TutorEngine {
  constructor(private skills: Skill[]) {}

  /** Primer turno: intenta reconocer y preparar el plan */
  route(rawUserText: string, opts?: { grade?: GradeBand; subjectHint?: Subject }): Turn | null {
    const normalized = normalize(rawUserText);
    for (const sk of this.skills) {
      if (opts?.subjectHint && sk.subject !== opts.subjectHint) continue;
      const ctx = sk.matchAndParse(normalized, opts?.grade);
      if (ctx) {
        const plan = sk.steps(ctx);
        const state = { skillId: sk.id, stepIndex: 0, ctx };
        return { type: "ask", text: plan[0].ask(ctx), stepId: plan[0].id, skillId: sk.id, state };
      }
    }
    return null;
  }

  /** Turnos siguientes: valida y avanza */
  continue(state: any, userText: string): Turn {
    const sk = this.skills.find(s => s.id === state.skillId);
    if (!sk) return { type: "tell", text: "He perdido el hilo. Repíteme el ejercicio." };

    const plan = sk.steps(state.ctx);
    const step = plan[state.stepIndex];

    if (isIDontKnow(userText)) {
      return { type: "ask", text: extraHelp(step, state.ctx), stepId: step.id, skillId: sk.id, state };
    }

    const res = step.check(state.ctx, userText);
    if (!res.ok) {
      const msg = (res.feedback ?? "Casi. Revisa y dime el resultado.") + (res.nextHint ? "\nPista extra: " + res.nextHint : "");
      return { type: "ask", text: msg, stepId: step.id, skillId: sk.id, state };
    }

    // correcto → siguiente paso o cierre
    state.stepIndex++;
    if (state.stepIndex >= plan.length) {
      const ans = sk.finalAnswer(state.ctx);
      return { type: "tell", text: `¡Bien! Resultado final: ${ans}.`, done: true };
    }
    const next = plan[state.stepIndex];
    return { type: "ask", text: next.ask(state.ctx), stepId: next.id, skillId: sk.id, state };
  }
}

/* ─────────────────────────── Utilidades comunes ─────────────────────────── */

const EMOJI_DK = /(\bno\s*s[ée]\b|ni idea|ayuda|help|ns)|[\u{1F615}\u{1F914}\u{1F974}\u{1F4A4}]/iu;
export const normalize = (s: string) =>
  (s || "").toLowerCase().replaceAll(",", ".").replace(/[¿?]/g, "").replace(/\s+/g, " ").trim();
const isIDontKnow = (s: string) => EMOJI_DK.test(s || "");
const extraHelp = (step: Step, ctx: ProblemCtx) => "No pasa nada. Intenta una parte y lo vemos. " + step.ask(ctx);

const gcd = (a: number, b: number) => { a=Math.abs(a); b=Math.abs(b); while(b){[a,b]=[b,a%b];} return a||1; };
const lcm = (a: number, b: number) => Math.abs(a*b)/gcd(a,b);
const parseNumber = (t: string) => {
  const s = normalize(t);
  if (!/^-?\d*(?:\.\d+)?$/.test(s)) return null;
  if (s==="" || s==="." || s==="-.") return null;
  return Number(s);
};

/* Fracciones */
type Frac = { n:number; d:number };
const simp = (f: Frac): Frac => { const g=gcd(f.n,f.d); let n=f.n/g,d=f.d/g; if(d<0){d=-d;n=-n;} return {n,d}; };
const eqF  = (a: Frac,b: Frac) => { const A=simp(a),B=simp(b); return A.n===B.n && A.d===B.d; };
const addF = (a: Frac,b: Frac)=>simp({n:a.n*b.d+b.n*a.d,d:a.d*b.d});
const subF = (a: Frac,b: Frac)=>simp({n:a.n*b.d-b.n*a.d,d:a.d*b.d});
const mulF = (a: Frac,b: Frac)=>simp({n:a.n*b.n,d:a.d*b.d});
const divF = (a: Frac,b: Frac)=>simp({n:a.n*b.d,d:a.d*b.n});

const denomWords: Record<string, number> = {
  medio:2, medios:2, tercio:3, tercios:3, cuarto:4, cuartos:4, quinto:5, quintos:5,
  sexto:6, sextos:6, septimo:7, séptimo:7, septimos:7, séptimos:7, octavo:8, octavos:8,
  noveno:9, novenos:9, decimo:10, décimo:10, decimos:10, décimos:10
};
const parseFracFlexible = (s: string): Frac|null => {
  const t = normalize(s);
  let m = t.match(/^\s*(-?\d+)\s*\/\s*(\d+)\s*$/);
  if (m) return simp({n:+m[1],d:+m[2]});
  m = t.match(/^\s*(-?\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/);
  if (m) { const sgn=+m[1]<0?-1:1, A=Math.abs(+m[1]); const n=A*+m[3]+(+m[2]); return simp({n:sgn*n,d:+m[3]}); }
  m = t.match(/^(-?\d+)\s+([a-záéíóúñ]+)$/i);
  if (m && denomWords[m[2]]) return simp({n:+m[1],d:denomWords[m[2]]});
  if (/^-?\d+(?:\.\d+)?$/.test(t)) { // decimal a fracción exacta
    if (!t.includes(".")) return {n:+t,d:1};
    const k=t.split(".")[1].length, d=10**k, n=Math.round(+t*d); return simp({n,d});
  }
  return null;
};
const formatF = (f: Frac) => { const s=simp(f); return s.d===1?`${s.n}`:`${s.n}/${s.d}`; };

/* ─────────────────────────── Skills – Matemáticas ─────────────────────────── */

/** 1) Fracciones ± (distinto denom.) */
const skillFracAddSubDiff: any = {
  id:"frac-addsub-diff", title:"Fracciones ± (distinto denominador)", subject:"mates",
  matchAndParse(raw: string){ const m=raw.match(/(.+)\s*([+\-])\s*(.+)/); if(!m) return null;
    const A=parseFracFlexible(m[1]), B=parseFracFlexible(m[3]); if(!A||!B||A.d===B.d) return null;
    return {raw, data:{A,B,op:m[2] as ("+"|"-")}}; },
  steps(ctx: any){ const {A,B,op}=ctx.data; const L=lcm(A.d,B.d); const Aeq={n:A.n*(L/A.d),d:L}; const Beq={n:B.n*(L/B.d),d:L};
    const num= op==="+"?Aeq.n+Beq.n:Aeq.n-Beq.n; const U={n:num,d:L}, S=simp(U);
    return [
      { id:"mcm", ask:()=>`Pista 1: m.c.m. de ${A.d} y ${B.d}. ¿Cuál es?`,
        check:(_: any,t: string)=>({ok:parseNumber(t)===L, feedback:`Es ${L}.`}) },
      { id:"conv", ask:()=>`Pista 2: Convierte al denominador ${L}. ¿Qué numeradores quedan? (“${Aeq.n} y ${Beq.n}”).`,
        check:(_: any,t: string)=>{ const u=normalize(t); const mm=u.match(/(-?\d+)\s*y\s*(-?\d+)/); if(mm) return {ok:+mm[1]===Aeq.n && +mm[2]===Beq.n, feedback:`Deberían ser ${Aeq.n} y ${Beq.n}.`};
          const parts=u.split(/\s*y\s*/); if(parts.length===2){ const f1=parseFracFlexible(parts[0]), f2=parseFracFlexible(parts[1]); return {ok:!!f1&&!!f2&&(f1.n===Aeq.n&&f1.d===Aeq.d)&&(f2.n===Beq.n&&f2.d===Beq.d), feedback:`Comprueba equivalencias.`};}
          return {ok:false, feedback:"Dímelo como “a y b” o como dos fracciones equivalentes."}; } },
      { id:"op", ask:()=>`Pista 3: ${Aeq.n} ${op} ${Beq.n}. ¿Resultado sin simplificar?`,
        check:(_: any,t: string)=>{ const f=parseFracFlexible(t); return f&&f.n===U.n&&f.d===U.d?{ok:true}:{ok:false,feedback:`Debería ser ${U.n}/${U.d}.`}; } },
      { id:"simp", ask:()=>`Pista 4: Simplifica si puedes. ¿Resultado final?`,
        check:(_: any,t: string)=>{ const f=parseFracFlexible(t); return f&&f.n===simp(U).n&&f.d===simp(U).d?{ok:true}:{ok:false,feedback:`Queda ${formatF(S)}.`}; } }
    ]; },
  finalAnswer(ctx: any){ const {A,B,op}=ctx.data; const R= op==="+"?addF(A,B):subF(A,B); return formatF(R); }
};

/** 2) Fracciones ± (mismo denom.) */
const skillFracAddSubSame: any = {
  id:"frac-addsub-same", title:"Fracciones ± (mismo denominador)", subject:"mates",
  matchAndParse(raw: string){ const m=raw.match(/(.+)\s*([+\-])\s*(.+)/); if(!m) return null;
    const A=parseFracFlexible(m[1]), B=parseFracFlexible(m[3]); if(!A||!B||A.d!==B.d) return null;
    return {raw, data:{A,B,op:m[2] as ("+"|"-")}}; },
  steps(ctx: any){ const {A,B,op}=ctx.data; const num=op==="+"?A.n+B.n:A.n-B.n; const U={n:num,d:A.d}, S=simp(U);
    return [
      {id:"nums", ask:()=>`Pista 1: Suma/resta numeradores: ${A.n} ${op} ${B.n} = ?`,
       check:(_: any,t: string)=>({ok:parseNumber(t)===num, feedback:`Es ${num}.`})},
      {id:"write", ask:()=>`Pista 2: Escribe ${num}/${A.d} (sin simplificar).`,
       check:(_: any,t: string)=>{ const f=parseFracFlexible(t); return f&&f.n===U.n&&f.d===U.d?{ok:true}:{ok:false,feedback:`Es ${num}/${A.d}.`}; }},
      {id:"simp", ask:()=>`Pista 3: Simplifica si procede. ¿Resultado final?`,
       check:(_: any,t: string)=>{ const f=parseFracFlexible(t); return f&&f.n===S.n&&f.d===S.d?{ok:true}:{ok:false,feedback:`Queda ${formatF(S)}.`}; }}
    ]; },
  finalAnswer(ctx: any){ const {A,B,op}=ctx.data; const R= op==="+"?addF(A,B):subF(A,B); return formatF(R); }
};

/** 3) Fracciones × y ÷ */
const skillFracMul: any = {
  id:"frac-mul", title:"Multiplicación de fracciones", subject:"mates",
  matchAndParse(raw: string){ const m=raw.match(/(.+)\s*[x×*]\s*(.+)/); if(!m) return null;
    const A=parseFracFlexible(m[1]), B=parseFracFlexible(m[2]); if(!A||!B) return null; return {raw,data:{A,B}}; },
  steps(ctx: any){ const {A,B}=ctx.data; const U={n:A.n*B.n,d:A.d*B.d}, S=simp(U);
    return [
      {id:"n", ask:()=>`Pista 1: Numeradores: ${A.n} × ${B.n} = ?`, check:(_: any,t: string)=>({ok:parseNumber(t)===A.n*B.n, feedback:`${A.n*B.n}.`})},
      {id:"d", ask:()=>`Pista 2: Denominadores: ${A.d} × ${B.d} = ?`, check:(_: any,t: string)=>({ok:parseNumber(t)===A.d*B.d, feedback:`${A.d*B.d}.`})},
      {id:"r", ask:()=>`Pista 3: Escribe ${U.n}/${U.d} y simplifica.`, check:(_: any,t: string)=>{ const f=parseFracFlexible(t); return f&&f.n===S.n&&f.d===S.d?{ok:true}:{ok:false,feedback:`Queda ${formatF(S)}.`};}}
    ]; },
  finalAnswer(ctx: any){ const {A,B}=ctx.data; const R= mulF(A,B); return formatF(R); }
};
const skillFracDiv: any = {
  id:"frac-div", title:"División de fracciones", subject:"mates",
  matchAndParse(raw: string){ const m=raw.match(/(.+)\s*[/:÷]\s*(.+)/); if(!m) return null;
    const A=parseFracFlexible(m[1]), B=parseFracFlexible(m[2]); if(!A||!B) return null; return {raw,data:{A,B}}; },
  steps(ctx: any){ const {A,B}=ctx.data; const inv={n:B.d,d:B.n}, M=mulF(A,inv);
    return [
      {id:"inv", ask:()=>`Pista 1: Inversa de ${formatF(B)} = ?`, check:(_: any,t: string)=>{ const f=parseFracFlexible(t); return f&&f.n===inv.n&&f.d===inv.d?{ok:true}:{ok:false,feedback:`Es ${formatF(inv)}.`};}},
      {id:"mul", ask:()=>`Pista 2: Multiplica ${formatF(A)} × ${formatF(inv)} y simplifica.`, check:(_: any,t: string)=>{ const f=parseFracFlexible(t); return f&&f.n===M.n&&f.d===M.d?{ok:true}:{ok:false,feedback:`Debería quedar ${formatF(M)}.`};}}
    ]; },
  finalAnswer(ctx: any){ const {A,B}=ctx.data; const R= divF(A,B); return formatF(R); }
};

/** 4) Decimales */
const skillDecimals: any = {
  id:"decimals", title:"Decimales (+ − × ÷)", subject:"mates",
  matchAndParse(raw: string){ const m=raw.match(/(-?\d+(?:[.,]\d+)?)\s*([+\-*x×\/:÷])\s*(-?\d+(?:[.,]\d+)?)/);
    if(!m) return null; const a=+m[1].replace(",", "."), b=+m[3].replace(",", "."); const op=m[2].replace("x","*").replace("×","*").replace(":","/").replace("÷","/");
    return {raw,data:{a,b,op}}; },
  steps(ctx: any){ const {a,b,op}=ctx.data; const calc = op==="+"?a+b:op==="-"?a-b:op==="*"?a*b:a/b;
    return [{id:"res", ask:()=>`Pista: alinea comas / cuenta decimales. ¿Resultado?`, check:(_: any,t: string)=>({ok:parseNumber(t)!==null && Math.abs(+t-+calc)<1e-9, feedback:`A mí me da ${+calc.toFixed(10)}.`})}]; },
  finalAnswer(ctx: any){ const {a,b,op}=ctx.data; const r=op==="+"?a+b:op==="-"?a-b:op==="*"?a*b:a/b; return `${+r.toFixed(10)}`; }
};

/** 5) Enteros */
const skillIntegers: any = {
  id:"integers", title:"Enteros (+ − × ÷)", subject:"mates",
  matchAndParse(raw: string){ const m=raw.match(/(-?\d+)\s*([+\-*x×\/:÷])\s*(-?\d+)/); if(!m) return null; const a=+m[1], b=+m[3];
    const op=m[2].replace("x","*").replace("×","*").replace(":","/").replace("÷","/"); return {raw,data:{a,b,op}}; },
  steps(ctx: any){ const {a,b,op}=ctx.data; const r=op==="+"?a+b:op==="-"?a-b:op==="*"?a*b:Math.trunc(a/b);
    return [{id:"calc", ask:()=>`Pista: recuerda la regla de signos. ¿Resultado?`, check:(_: any,t: string)=>({ok:parseNumber(t)===r, feedback:`Es ${r}.`})}]; },
  finalAnswer(ctx: any){ const {a,b,op}=ctx.data; const r=op==="+"?a+b:op==="-"?a-b:op==="*"?a*b:Math.trunc(a/b); return `${r}`; }
};

/** 6) m.c.m. / m.c.d. */
const skillMcmMcd: any = {
  id:"mcm-mcd", title:"m.c.m. / m.c.d.", subject:"mates",
  matchAndParse(raw: string){ const mcm=raw.match(/m\.?c\.?m\.?.*?(\d+).*?(?:y|,)\s*(\d+)/); if(mcm) return {raw,data:{k:"mcm",a:+mcm[1],b:+mcm[2]}};
    const mcd=raw.match(/m\.?c\.?d\.?.*?(\d+).*?(?:y|,)\s*(\d+)/); if(mcd) return {raw,data:{k:"mcd",a:+mcd[1],b:+mcd[2]}}; return null; },
  steps(ctx: any){ const {k,a,b}=ctx.data; const ans=k==="mcm"?lcm(a,b):gcd(a,b);
    return [{id:"res", ask:()=>`Pista: usa múltiplos/factores (o descomposición en primos). ¿${k.toUpperCase()} de ${a} y ${b}?`, check:(_: any,t: string)=>({ok:parseNumber(t)===ans, feedback:`Es ${ans}.`})}]; },
  finalAnswer(ctx: any){ const {k,a,b}=ctx.data; return `${k.toUpperCase()}(${a},${b})=${k==="mcm"?lcm(a,b):gcd(a,b)}`; }
};

/** 7) Potencias */
const skillPowers: any = {
  id:"powers", title:"Potencias (cuadrado/cubo/^)", subject:"mates",
  matchAndParse(raw: string){ const m1=raw.match(/(\d+)\s*\^\s*(\d+)/); if(m1) return {raw,data:{a:+m1[1],p:+m1[2]}};
    const q1=raw.match(/cuadrad[oa]\s+de\s+(\d+)/); if(q1) return {raw,data:{a:+q1[1],p:2}};
    const q2=raw.match(/cub[oa]\s+de\s+(\d+)/); if(q2) return {raw,data:{a:+q2[1],p:3}}; return null; },
  steps(ctx: any){ const {a,p}=ctx.data; const r=a**p; return [{id:"p", ask:()=>`Pista: multiplica ${a} por sí mismo ${p} veces. ¿Resultado?`, check:(_: any,t: string)=>({ok:parseNumber(t)===r, feedback:`${r}.`})}]; },
  finalAnswer(ctx: any){ const {a,p}=ctx.data; return `${a}^${p}=${a**p}`; }
};

/** 8) Jerarquía de operaciones (con paréntesis) */
const skillOrderOps: any = {
  id:"order-ops", title:"Jerarquía de operaciones", subject:"mates",
  matchAndParse(raw: string){ if(!/[()]/.test(raw) || !/[+\-*/x×:÷]/.test(raw)) return null; return {raw, data:{expr:raw}}; },
  steps(ctx: any){ const expr = (ctx.data as any).expr.replaceAll("×","*").replaceAll("x","*").replaceAll("÷","/").replaceAll(":","/");
    let result: number; try{ if(!/^[0-9+\-*/().\s]+$/.test(expr)) throw 0; result = Function(`"use strict"; return (${expr});`)(); }catch{ result=NaN; }
    return [{id:"jer", ask:()=>`Pista: primero paréntesis, luego × y ÷, por último + y −. ¿Resultado final?`,
      check:(_: any,t: string)=>{ const n=parseNumber(t); return n!==null && Math.abs(n-result)<1e-9 ? {ok:true}:{ok:false,feedback:`A mí me da ${result}.`}; }}]; },
  finalAnswer(){ return "Hecho"; }
};

/** 9) Unidades */
const skillUnits: any = {
  id:"units", title:"Unidades (longitud/masa/capacidad/tiempo)", subject:"mates",
  matchAndParse(raw: string){ const m=raw.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m|km|mg|g|kg|t|ml|l|s|min|h)\s*(?:a|en)\s*(mm|cm|m|km|mg|g|kg|t|ml|l|s|min|h)/i);
    if(!m) return null; return {raw,data:{v:+m[1].replace(",","."), from:m[2].toLowerCase(), to:m[3].toLowerCase()}}; },
  steps(ctx: any){ const {v,from,to}=ctx.data; const f=unitFactor(from,to); if(f==null) return [{id:"x", ask:()=>`Pista: esa conversión no está mapeada. Prueba con cm↔m, g↔kg, L↔mL, s/min/h.`, check:()=>({ok:true})}];
    const res=v*f; return [{id:"a", ask:()=>`Pista: multiplica por el factor (${from}→${to}). ¿Resultado?`, check:(_: any,t: string)=>({ok:parseNumber(t)===res, feedback:`Factor ${f}. Sale ${res}.`})}]; },
  finalAnswer(ctx: any){ const {v,from,to}=ctx.data; const f=unitFactor(from,to)??1; return `${v*f} ${to}`; }
};
function unitFactor(from:string,to:string){ const T:Record<string,number>={mm:1e-3,cm:1e-2,m:1,km:1e3,mg:1e-3,g:1,kg:1e3,t:1e6,ml:1e-3,l:1};
  if(from in T && to in T) return T[from]/T[to]; const time:{[k:string]:number}={s:1,min:60,h:3600};
  if(from in time && to in time) return time[from]/time[to]; return null;
}

/** 10) Área/Perímetro/Volumen (formas básicas) */
const skillGeometry: any = {
  id:"geometry", title:"Área, perímetro y volumen", subject:"mates",
  matchAndParse(raw: string){
    const t = normalize(raw);
    if (t.match(/(área|area|per[ií]metro|perimetro).*rect[aá]ngul/)) {
      const m = t.match(/(\d+(?:\.\d+)?)\s*(?:x|×|\*)\s*(\d+(?:\.\d+)?)/);
      if (m) return { raw, data:{ kind: t.includes("per")?"prec":"arec", a:+m[1], b:+m[2] } };
    }
    if (t.match(/(área|area).*tri[aá]ngul/) && t.match(/b[ah]=?(\d+(?:\.\d+)?)/)) {
      const b = +(t.match(/b=?(\d+(?:\.\d+)?)/)![1]), h = +(t.match(/h=?(\d+(?:\.\d+)?)/)![1]);
      return { raw, data:{ kind:"atri", b, h } };
    }
    if (t.match(/(área|area|per[ií]metro|perimetro).*c[íi]rcul/)) {
      const r = +(t.match(/r=?(\d+(?:\.\d+)?)/)?.[1] ?? "0");
      return { raw, data:{ kind: t.includes("per")?"pcirc":"acirc", r } };
    }
    if (t.match(/vol[uú]men.*cubo.*(\d+(?:\.\d+)?)/)) return { raw, data:{ kind:"vcubo", a:+t.match(/(\d+(?:\.\d+)?)/)![1] } };
    if (t.match(/vol[uú]men.*prisma|paralelep[ií]pedo/) && t.match(/(\d+(?:\.\d+)?).*(\d+(?:\.\d+)?).*(\d+(?:\.\d+)?)/))
      { const m=t.match(/(\d+(?:\.\d+)?).*(\d+(?:\.\d+)?).*(\d+(?:\.\d+)?)/)!; return { raw, data:{ kind:"vprisma", a:+m[1], b:+m[2], c:+m[3] } }; }
    if (t.match(/vol[uú]men.*cilindro/) && t.match(/r=?(\d+(?:\.\d+)?).*h=?(\d+(?:\.\d+)?)/))
      { const m=t.match(/r=?(\d+(?:\.\d+)?).*h=?(\d+(?:\.\d+)?)/)!; return { raw, data:{ kind:"vcil", r:+m[1], h:+m[2] } }; }
    return null;
  },
  steps(ctx: any){
    const d = ctx.data;
    if (d.kind==="arec"){ const res=d.a*d.b; return [{id:"f", ask:()=>`Pista: área rectángulo = base × altura. ¿Resultado?`, check:(_: any,t: string)=>({ok:parseNumber(t)===res, feedback:`Sale ${res}.`})]}; 
    if (d.kind==="prec"){ const res=2*(d.a+d.b); return [{id:"f", ask:()=>`Pista: perímetro rectángulo = 2·(a+b). ¿Resultado?`, check:(_: any,t: string)=>({ok:parseNumber(t)===res, feedback:`Sale ${res}.`})]}; 
    if (d.kind==="atri"){ const res=0.5*d.b*d.h; return [{id:"f", ask:()=>`Pista: área triángulo = (b·h)/2. ¿Resultado?`, check:(_: any,t: string)=>({ok:parseNumber(t)===res, feedback:`Sale ${res}.`})]}; 
    if (d.kind==="acirc"){ const res=Math.PI*d.r*d.r; return [{id:"f", ask:()=>`Pista: área círculo = π·r² (usa π≈3.1416). ¿Resultado?`, check:(_: any,t: string)=>{ const n=parseNumber(t); return n!==null && Math.abs(n-res)<1e-3?{ok:true}:{ok:false,feedback:`Aprox. ${res.toFixed(3)}.`}; } ]}; 
    if (d.kind==="pcirc"){ const res=2*Math.PI*d.r; return [{id:"f", ask:()=>`Pista: perímetro círculo = 2·π·r. ¿Resultado?`, check:(_: any,t: string)=>{ const n=parseNumber(t); return n!==null && Math.abs(n-res)<1e-3?{ok:true}:{ok:false,feedback:`Aprox. ${res.toFixed(3)}.`}; } ]}; 
    if (d.kind==="vcubo"){ const res=d.a**3; return [{id:"f", ask:()=>`Pista: volumen cubo = a³. ¿Resultado?`, check:(_: any,t: string)=>({ok:parseNumber(t)===res, feedback:`Sale ${res}.`})]}; 
    if (d.kind==="vprisma"){ const res=d.a*d.b*d.c; return [{id:"f", ask:()=>`Pista: volumen prisma rectangular = a·b·c. ¿Resultado?`, check:(_: any,t: string)=>({ok:parseNumber(t)===res, feedback:`Sale ${res}.`})]}; 
    if (d.kind==="vcil"){ const res=Math.PI*d.r*d.r*d.h; return [{id:"f", ask:()=>`Pista: volumen cilindro = π·r²·h. ¿Resultado?`, check:(_: any,t: string)=>{ const n=parseNumber(t); return n!==null && Math.abs(n-res)<1e-3?{ok:true}:{ok:false,feedback:`Aprox. ${res.toFixed(3)}.`}; } ]}; 
    return [{id:"x", ask:()=>`Cuéntame la figura y los datos (p. ej.: “área rectángulo 5x7”).`, check:()=>({ok:true})}];
  },
  finalAnswer(){ return "Correcto"; }
};

/** 11) Media / Mediana / Moda / Rango */
const skillStats: any = {
  id:"stats", title:"Medidas de tendencia central", subject:"mates",
  matchAndParse(raw: string){ const t=normalize(raw);
    const nums = t.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (nums.length<2) return null;
    const kind = t.includes("media")?"media":t.includes("mediana")?"mediana":t.includes("moda")?"moda":t.includes("rango")?"rango":null;
    if (!kind) return null;
    return { raw, data:{ nums, kind } };
  },
  steps(ctx: any){
    const { nums, kind } = ctx.data;
    const sorted = [...nums].sort((a,b)=>a-b);
    const media = nums.reduce((s:number,n:number)=>s+n,0)/nums.length;
    const mediana = sorted.length%2? sorted[(sorted.length-1)/2] : (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
    const moda = (()=>{ const m=new Map<number,number>(); nums.forEach((n:number)=>m.set(n,(m.get(n)||0)+1)); let best=nums[0], f=0; m.forEach((v,k)=>{if(v>f){f=v;best=k;}}); return best;})();
    const rango = sorted[sorted.length-1]-sorted[0];
    const ans = kind==="media"?media:kind==="mediana"?mediana:kind==="moda"?moda:rango;
    return [{ id:"s", ask:()=>`Pista: ${kind} de [${nums.join(", ")}]. ¿Resultado?`,
      check:(_: any,t: string)=>{ const n=parseNumber(t); return n!==null && Math.abs(n-ans)<1e-9?{ok:true}:{ok:false,feedback:`Es ${ans}.`}; } }];
  },
  finalAnswer(ctx: any){ const { nums, kind } = ctx.data;
    const sorted = [...nums].sort((a,b)=>a-b);
    const media = nums.reduce((s:number,n:number)=>s+n,0)/nums.length;
    const mediana = sorted.length%2? sorted[(sorted.length-1)/2] : (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
    const moda = (()=>{ const m=new Map<number,number>(); nums.forEach((n:number)=>m.set(n,(m.get(n)||0)+1)); let best=nums[0], f=0; m.forEach((v,k)=>{if(v>f){f=v;best=k;}}); return best;})();
    const rango = sorted[sorted.length-1]-sorted[0];
    const ans = kind==="media"?media:kind==="mediana"?mediana:kind==="moda"?moda:rango;
    return `${ans}`;
  }
};

/** 12) Redondeo / Valor posicional (básico) */
const skillRounding: any = {
  id:"round", title:"Redondeo / valor posicional", subject:"mates",
  matchAndParse(raw: string){ const t=normalize(raw);
    const m=t.match(/redondea\s+(\d+(?:\.\d+)?)\s+a\s+(\d+)\s*decimales?/) || t.match(/redondea\s+(\d+(?:\.\d+)?)/);
    if(!m) return null;
    const num=+(m[1]||m[0].match(/\d+(?:\.\d+)?/)![0]); const k = m[2]? +m[2]: 0;
    return {raw, data:{num, k}};
  },
  steps(ctx: any){
    const { num, k } = ctx.data;
    const res = +num.toFixed(k);
    return [{ id:"r", ask:()=>`Pista: observa la cifra siguiente a la que quieres mantener. ¿Redondeo de ${num} a ${k} decimales?`,
      check:(_: any,t: string)=>({ok:parseNumber(t)===res, feedback:`Es ${res}.`}) }];
  },
  finalAnswer(ctx: any){ return `${(+ctx.data.num).toFixed(ctx.data.k)}`; }
};

/* ───────────── Lengua ───────────── */

const skillAcentuacion: any = {
  id:"acentuacion", title:"Acentuación (aguda/llana/esdrújula)", subject:"lengua",
  matchAndParse(raw: string){ const m=raw.match(/^(?:que\s+tipo\s+de\s+palabra\s+es\s+)?([a-záéíóúüñ]+)\s*$/i);
    if(!m) return null; return {raw, data:{w:m[1].toLowerCase()}}; },
  steps(ctx: any){ const {w}=ctx.data; const tipo = clasificaPalabra(w);
    return [{ id:"t", ask:()=>`Pista: marca la sílaba tónica de “${w}” y aplica la regla general (termina en vocal, -n, -s). ¿Aguda, llana o esdrújula?`,
      check:(_: any,t: string)=>{ const ans=normalize(t); const ok=ans===tipo; return ok?{ok:true}:{ok:false,feedback:`Es ${tipo}.`}; } }];
  },
  finalAnswer(ctx: any){ return clasificaPalabra(ctx.data.w); }
};
function clasificaPalabra(w:string):"aguda"|"llana"|"esdrújula"{
  const accentIndex = w.search(/[áéíóú]/);
  if (accentIndex>=0){
    if (accentIndex < w.length-2) return "esdrújula";
    return /[n|s|aeiou]$/.test(w) ? "aguda" : "llana";
  }
  return /[n|s|aeiou]$/.test(w) ? "llana" : "aguda";
}

const skillSujPred: any = {
  id:"suj-pred", title:"Sujeto y predicado (simple)", subject:"lengua",
  matchAndParse(raw: string){ if(!/ (come|es|son|juega|corre|tiene|quiere|hace|vive|est[aá]) /.test(raw)) return null; return {raw, data:{sentence:raw}}; },
  steps(ctx: any){ const s=ctx.data.sentence;
    return [
      { id:"suj", ask:()=>`Pista 1: En “${s}”, dime el **sujeto**.`,
        check:(_: any,t: string)=>({ok:/[a-záéíóúüñ ]+/.test(t), feedback:"Di quién realiza la acción."}) },
      { id:"pred", ask:()=>`Pista 2: Dime ahora el **predicado** (verbo + lo que se dice del sujeto).`,
        check:(_: any,t: string)=>({ok:/[a-záéíóúüñ ]+/.test(t), feedback:"Empieza por el verbo."}) }
    ];
  },
  finalAnswer(){ return "Identificados sujeto y predicado."; }
};

const SYN: Record<string,string[]> = {
  feliz:["contento","alegre"], triste:["infeliz","apenado"],
  grande:["enorme","gigante"], pequeño:["chico","menudo"], rápido:["veloz","ligero"],
  lento:["pausado","tardo"], bonito:["hermoso","bello"], feo:["horrendo","desagradable"]
};
const ANT: Record<string,string[]> = {
  feliz:["triste"], grande:["pequeño","chico"], alto:["bajo"], rápido:["lento"],
  bonito:["feo"], encender:["apagar"], entrar:["salir"], frío:["calor","caliente"]
};

const skillLexico: any = {
  id:"lexico", title:"Sinónimos y antónimos", subject:"lengua",
  matchAndParse(raw: string){ const m=raw.match(/(sin[oó]nimo|ant[oó]nimo)\s+de\s+([a-záéíóúñ]+)/);
    if(!m) return null; return {raw, data:{kind: normalize(m[1])==="sinónimo"?"sin":"ant", w:m[2].toLowerCase()}}; },
  steps(ctx: any){ const {kind,w}=ctx.data; const bank = kind==="sin"?SYN:ANT; const set=new Set((bank[w]||[]).map(normalize));
    return [{id:"a", ask:()=>`Pista: dime **un** ${kind==="sin"?"sinónimo":"antónimo"} de “${w}”.`,
      check:(_: any,t: string)=>({ok:set.has(normalize(t)), feedback: (bank[w]&&bank[w][0])?`Por ejemplo: ${bank[w][0]}.`:"No lo tengo en mi lista; prueba con otra palabra."})}]; },
  finalAnswer(){ return "Perfecto"; }
};

/* ───────────── Ciencias ───────────── */

const skillMatter: any = {
  id:"matter", title:"Estados de la materia", subject:"ciencias",
  matchAndParse(raw: string){ if(!/(estado|s[óo]lido|l[ií]quido|gaseoso|gas|agua|hielo|vapor)/.test(raw)) return null; return {raw,data:{}}; },
  steps(){ return [{ id:"e", ask:()=>`Pista: sólido (forma y volumen fijos), líquido (volumen fijo, forma del recipiente), gas (ni forma ni volumen fijos). ¿Cuál es?`,
    check:(_: any,t: string)=>({ok: /(s[óo]lido|l[ií]quido|gas|gaseoso)/.test(normalize(t)), feedback:"Responde: sólido, líquido o gas."}) }]; },
  finalAnswer(){ return "Clasificación correcta."; }
};

const skillCircuit: any = {
  id:"circuit", title:"Circuito eléctrico (cerrado/abierto)", subject:"ciencias",
  matchAndParse(raw: string){ if(!/(circuito|bombilla|pila|cable)/.test(raw)) return null; return {raw,data:{}}; },
  steps(){ return [{ id:"c", ask:()=>`Pista: circuito **cerrado** → la corriente fluye; **abierto** → no. ¿Cómo está?`,
    check:(_: any,t: string)=>({ok:/cerrado|abierto/.test(normalize(t)), feedback:"Di “cerrado” o “abierto”."}) }]; },
  finalAnswer(){ return "Correcto"; }
};

const PLANETS = ["mercurio","venus","tierra","marte","júpiter","jupiter","saturno","urano","neptuno"];
const skillPlanets: any = {
  id:"planets", title:"Orden de los planetas", subject:"ciencias",
  matchAndParse(raw: string){ if(!/planetas|orden.*planetas/.test(raw)) return null; return {raw,data:{}}; },
  steps(){ return [{ id:"p", ask:()=>`Pista: desde el Sol hacia afuera. Escríbelos separados por comas.`,
    check:(_: any,t: string)=>{ const ans=normalize(t).split(",").map(s=>s.trim()); const ok = ans.length===9 && ans.slice(0,9).every((p,i)=>p===PLANETS[i]);
      return ok?{ok:true}:{ok:false,feedback:`Orden: ${PLANETS.join(", ")}.`}; } }]; },
  finalAnswer(){ return PLANETS.join(", "); }
};

const BODY_SYSTEMS = new Set(["circulatorio","respiratorio","digestivo","nervioso","óseo","oseo","muscular"]);
const skillBioBasics: any = {
  id:"bio", title:"Sistemas del cuerpo y cadenas tróficas", subject:"ciencias",
  matchAndParse(raw: string){ if(/sistema/.test(raw)||/productor|consumidor|depredador/.test(raw)) return {raw,data:{q:raw}}; return null; },
  steps(ctx: any){ const t=normalize(ctx.data.q);
    if (t.includes("sistema")) return [{id:"s", ask:()=>`Pista: ejemplos: circulatorio, respiratorio, digestivo, nervioso, óseo, muscular. Dime el sistema implicado.`,
      check:(_: any,x: string)=>({ok:BODY_SYSTEMS.has(normalize(x)), feedback:"Di uno de: circulatorio, respiratorio, digestivo, nervioso, óseo, muscular."}) }];
    if (/productor|consumidor/.test(t)) return [{id:"t", ask:()=>`Pista: productor fabrica su alimento (fotosíntesis); consumidor se alimenta de otros. Dime si el ejemplo es productor o consumidor.`,
      check:(_: any,x: string)=>({ok:/productor|consumidor/.test(normalize(x)), feedback:"Responde “productor” o “consumidor”."}) }];
    return [{id:"x", ask:()=>`Dime si es productor o consumidor; o el sistema del cuerpo implicado.`, check:()=>({ok:true})}];
  },
  finalAnswer(){ return "Clasificado."; }
};

/* ───────────── Historia / Geografía ───────────── */

const skillCentury: any = {
  id:"century", title:"¿En qué siglo está este año?", subject:"historia",
  matchAndParse(raw: string){ const m=raw.match(/\b(1?\d{1,3}|20\d{2})\b/); if(!m) return null; const year=+m[1]; if(year<1) return null; return {raw,data:{year}}; },
  steps(ctx: any){ const y=ctx.data.year; const c=Math.floor((y-1)/100)+1;
    return [{id:"s", ask:()=>`Pista: siglo = ⌊(año−1)/100⌋ + 1. ¿Siglo de ${y}?`, check:(_: any,t: string)=>({ok:parseNumber(t)===c, feedback:`Es siglo ${c}.`})}]; },
  finalAnswer(ctx: any){ const y=ctx.data.year; const c=Math.floor((y-1)/100)+1; return `Siglo ${c}`; }
};

const ROM: [number,string][] = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
function toRoman(n:number){ let s=""; for(const [v,r] of ROM){ while(n>=v){ s+=r; n-=v; } } return s; }

const skillRoman: any = {
  id:"roman", title:"Convertir a números romanos", subject:"historia",
  matchAndParse(raw: string){ const m=raw.match(/convierte\s+(\d+)\s+a\s+romanos|romanos\s+de\s+(\d+)/); if(!m) return null;
    const n= +(m[1]||m[2]); return {raw,data:{n}}; },
  steps(ctx: any){ const n=ctx.data.n; const r=toRoman(n);
    return [{id:"r", ask:()=>`Pista: usa M D C L X V I y restas (CM, IX, IV...). ¿Cómo escribes ${n}?`, check:(_: any,t: string)=>({ok: normalize(t)===normalize(r), feedback:`Se escribe ${r}.`})}]; },
  finalAnswer(ctx: any){ return toRoman(ctx.data.n); }
};

const skillTimeline: any = {
  id:"timeline", title:"Ordenar fechas (línea temporal)", subject:"historia",
  matchAndParse(raw: string){ const years = raw.match(/\b-?\d{1,4}\b/g); if(!years || years.length<3) return null; const ys = years.map(Number); return {raw, data:{ys}}; },
  steps(ctx: any){ const ys=ctx.data.ys.slice(); const sorted=[...ys].sort((a,b)=>a-b);
    return [{id:"ord", ask:()=>`Pista: ordena de menor a mayor. Escríbelo separado por comas.`, check:(_: any,t: string)=>{ const nums=t.split(",").map(s=>+s.trim()); return {ok: nums.length===ys.length && nums.every((v,i)=>v===sorted[i]), feedback:`Orden correcto: ${sorted.join(", ")}.`}; }}]; },
  finalAnswer(ctx: any){ const sorted=[...ctx.data.ys].sort((a,b)=>a-b); return sorted.join(", "); }
};

/** Países, capitales y continentes */
type CC = { country: string; capital: string; continent: string; altCapitals?: string[] };
const WORLD: CC[] = [
  { country:"españa", capital:"madrid", continent:"europa" },
  { country:"francia", capital:"parís", continent:"europa", altCapitals:["paris"] },
  { country:"alemania", capital:"berlín", continent:"europa", altCapitals:["berlin"] },
  { country:"italia", capital:"roma", continent:"europa" },
  { country:"portugal", capital:"lisboa", continent:"europa" },
  { country:"reino unido", capital:"londres", continent:"europa" },
  { country:"irlanda", capital:"dublín", continent:"europa", altCapitals:["dublin"] },
  { country:"bélgica", capital:"bruselas", continent:"europa", altCapitals:["belgica"] },
  { country:"países bajos", capital:"amsterdam", continent:"europa", altCapitals:["paises bajos","países bajos","paises-bajos","holanda"] },
  { country:"suiza", capital:"berna", continent:"europa" },
  { country:"austria", capital:"viena", continent:"europa" },
  { country:"polonia", capital:"varsovia", continent:"europa" },
  { country:"grecia", capital:"atenas", continent:"europa" },
  { country:"rusia", capital:"moscú", continent:"europa", altCapitals:["moscu"] },
  { country:"ucrania", capital:"kiev", continent:"europa", altCapitals:["kyiv"] },
  { country:"turquía", capital:"ankara", continent:"asia", altCapitals:["turquia"] },
  { country:"estados unidos", capital:"washington", continent:"américa" },
  { country:"canadá", capital:"ottawa", continent:"américa", altCapitals:["canada"] },
  { country:"méxico", capital:"ciudad de méxico", continent:"américa", altCapitals:["mexico df","mexico","cdmx"] },
  { country:"brasil", capital:"brasilia", continent:"américa" },
  { country:"argentina", capital:"buenos aires", continent:"américa" },
  { country:"chile", capital:"santiago", continent:"américa" },
  { country:"colombia", capital:"bogotá", continent:"américa", altCapitals:["bogota"] },
  { country:"perú", capital:"lima", continent:"américa", altCapitals:["peru"] },
  { country:"uruguay", capital:"montevideo", continent:"américa" },
  { country:"paraguay", capital:"asunción", continent:"américa", altCapitals:["asuncion"] },
  { country:"cuba", capital:"la habana", continent:"américa", altCapitals:["habana"] },
  { country:"república dominicana", capital:"santo domingo", continent:"américa", altCapitals:["republica dominicana"] },
  { country:"costa rica", capital:"san josé", continent:"américa", altCapitals:["san jose"] },
  { country:"panamá", capital:"ciudad de panamá", continent:"américa", altCapitals:["panama"] },
  { country:"guatemala", capital:"ciudad de guatemala", continent:"américa" },
  { country:"honduras", capital:"tegucigalpa", continent:"américa" },
  { country:"nicaragua", capital:"managua", continent:"américa" },
  { country:"el salvador", capital:"san salvador", continent:"américa" },
  { country:"china", capital:"pekin", continent:"asia", altCapitals:["beijing","pekín"] },
  { country:"japón", capital:"tokio", continent:"asia", altCapitals:["japon","tokyo"] },
  { country:"corea del sur", capital:"seúl", continent:"asia", altCapitals:["seul"] },
  { country:"india", capital:"nueva delhi", continent:"asia", altCapitals:["delhi"] },
  { country:"indonesia", capital:"yakarta", continent:"asia" },
  { country:"tailandia", capital:"bangkok", continent:"asia" },
  { country:"vietnam", capital:"hanói", continent:"asia", altCapitals:["hanoi"] },
  { country:"malasia", capital:"kuala lumpur", continent:"asia" },
  { country:"filipinas", capital:"manila", continent:"asia" },
  { country:"singapur", capital:"singapur", continent:"asia" },
  { country:"jordania", capital:"ammán", continent:"asia", altCapitals:["amman"] },
  { country:"arabia saudí", capital:"riad", continent:"asia", altCapitals:["arabia saudi","riyadh"] },
  { country:"irán", capital:"teherán", continent:"asia", altCapitals:["iran","teheran"] },
  { country:"irak", capital:"bagdad", continent:"asia" },
  { country:"emiratos árabes unidos", capital:"abu dabi", continent:"asia", altCapitals:["abu dhabi"] },
  { country:"qatar", capital:"doha", continent:"asia" },
  { country:"kuwait", capital:"kuwait", continent:"asia" },
  { country:"egipto", capital:"el cairo", continent:"áfrica", altCapitals:["cairo"] },
  { country:"sudáfrica", capital:"pretoria", continent:"áfrica", altCapitals:["sudafrica"] },
  { country:"nigeria", capital:"abuya", continent:"áfrica", altCapitals:["abuja"] },
  { country:"kenia", capital:"nairobi", continent:"áfrica" },
  { country:"etiopía", capital:"addis abeba", continent:"áfrica", altCapitals:["etiopia"] },
  { country:"marruecos", capital:"rabat", continent:"áfrica" },
  { country:"argelia", capital:"argel", continent:"áfrica" },
  { country:"túnez", capital:"túnez", continent:"áfrica", altCapitals:["tunez"] },
  { country:"ghana", capital:"acra", continent:"áfrica", altCapitals:["accra"] },
  { country:"australia", capital:"canberra", continent:"oceanía", altCapitals:["oceania"] },
  { country:"nueva zelanda", capital:"wellington", continent:"oceanía" }
];

const COUNTRIES = new Map(WORLD.map(c => [c.country, c]));
const CAPITALS  = new Map(WORLD.flatMap(c => [[c.capital, c.country], ...(c.altCapitals||[]).map(a=>[a,c.country])]));
const CONTINENT_BY_COUNTRY = new Map(WORLD.map(c => [c.country, c.continent]));

const skillCapitals: any = {
  id:"capitals", title:"Países, capitales y continentes", subject:"geo",
  matchAndParse(raw: string){
    const t=normalize(raw);
    let m=t.match(/capital\s+de\s+(.+)/); if(m){ const country=m[1].trim(); return COUNTRIES.has(country)?{raw,data:{kind:"cap-de", country }}:null; }
    m=t.match(/de\s+qu[eé]\s+pa[ií]s\s+es\s+(.+)/); if(m){ const cap=m[1].trim(); return CAPITALS.has(cap)?{raw,data:{kind:"pais-de", capital:cap }}:null; }
    m=t.match(/en\s+qu[eé]\s+continente\s+est[aá]\s+(.+)/); if(m){ const country=m[1].trim(); return CONTINENT_BY_COUNTRY.has(country)?{raw,data:{kind:"cont-de", country }}:null; }
    return null;
  },
  steps(ctx: any){
    const d=ctx.data;
    if(d.kind==="cap-de"){ const cap = COUNTRIES.get(d.country)!.capital;
      return [{id:"a", ask:()=>`Pista: piensa en Europa si es un país europeo, América si es americano... ¿Capital de ${d.country}?`, check:(_: any,t: string)=>({ok: normalize(t)===normalize(cap), feedback:`Es ${cap}.`})}]; }
    if(d.kind==="pais-de"){ const pais = CAPITALS.get(d.capital)!;
      return [{id:"b", ask:()=>`Pista: esa ciudad pertenece a… ¿De qué país es ${d.capital}?`, check:(_: any,t: string)=>({ok: normalize(t)===normalize(pais), feedback:`Es ${pais}.`})}]; }
    const cont = CONTINENT_BY_COUNTRY.get(d.country)!;
    return [{id:"c", ask:()=>`Pista: piensa en el mapa mundial. ¿En qué continente está ${d.country}?`, check:(_: any,t: string)=>({ok: normalize(t)===normalize(cont), feedback:`Está en ${cont}.`})}];
  },
  finalAnswer(ctx: any){
    const d=ctx.data; if(d.kind==="cap-de") return COUNTRIES.get(d.country)!.capital;
    if(d.kind==="pais-de") return CAPITALS.get(d.capital)!; return CONTINENT_BY_COUNTRY.get(d.country)!;
  }
};

/* ─────────────────────────── Registro ─────────────────────────── */

export const engine = new TutorEngine([
  // Matemáticas
  skillFracAddSubDiff, skillFracAddSubSame, skillFracMul, skillFracDiv,
  skillDecimals, skillIntegers, skillMcmMcd, skillPowers, skillOrderOps,
  skillUnits, skillGeometry, skillStats, skillRounding,
  // Lengua
  skillAcentuacion, skillSujPred, skillLexico,
  // Ciencias
  skillMatter, skillCircuit, skillPlanets, skillBioBasics,
  // Historia / Geografía
  skillCentury, skillRoman, skillTimeline, skillCapitals
]);
