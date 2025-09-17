// types/react-katex.d.ts
declare module 'react-katex' {
  import * as React from 'react';

  export interface KatexProps {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
  }

  export const InlineMath: React.FC<KatexProps>;
  export const BlockMath: React.FC<KatexProps>;
  // (Opcional) export default para compatibilidad con algunos ejemplos.
  const TeX: React.FC<KatexProps>;
  export default TeX;
}

// si TS te da guerra con el import del CSS, deja también esto:
declare module 'katex/dist/katex.min.css';
