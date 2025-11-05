// pages/_app.js
// ✨ Configuración global de la aplicación Next.js

import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;