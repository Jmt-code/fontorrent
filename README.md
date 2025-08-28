# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# fontorrent

Frontend WebTorrent (React + Vite) preparado para GitHub Pages. Permite:
- Subir un `.torrent` o pegar un magnet.
- Conectarse a seeds WebRTC y descargar archivos en el navegador.
- Compartir/sembrar (seed) los archivos con otros usuarios vía WebRTC.

## Importante: compatibilidad de torrents en navegador
Los navegadores solo soportan WebRTC y trackers WebSocket (ws/wss). Esto implica:
- NO funcionan UDP/HTTP trackers ni DHT desde el navegador.
- Solo verás peers si existen semillas/pares WebRTC registradas en trackers `wss://` o si el torrent tiene "web seeds" (descarga HTTP/HTTPS directa, campo `url-list`).
- Un torrent con muchas fuentes UDP/DHT en clientes de escritorio puede dar 0 peers en navegador.

### Trackers compatibles (WSS)
Usamos por defecto:
- wss://tracker.openwebtorrent.com
- wss://tracker.webtorrent.io
- wss://tracker.btorrent.xyz
- wss://tracker.fastcast.nz

Si un tracker WSS falla para ti (caída o bloqueo de red), otro puede funcionar. Para minimizar ruido es válido dejar solo `wss://tracker.openwebtorrent.com`.

### Torrents recomendados para pruebas
Estos torrents están pensados para WebTorrent y suelen tener seeds WebRTC:
- Sintel (CC): https://webtorrent.io/torrents/sintel.torrent
- Big Buck Bunny (CC): https://webtorrent.io/torrents/big-buck-bunny.torrent

Si quieres que un torrent "cualquiera" funcione en navegador, necesitas al menos un seed WebRTC o web seeds:
- Opción A: seedea con un cliente híbrido que puentea TCP/UDP ↔ WebRTC (ej. `webtorrent-hybrid`).
- Opción B: crea un .torrent con web seeds (URLs HTTP/HTTPS a los archivos) y sírvelos por HTTPS.

### Sembrar (seed) con webtorrent-hybrid (opcional)
Requisitos: Node.js instalado.

```bash
npm i -g webtorrent-hybrid
# Añade trackers WSS para que el navegador te descubra
webtorrent-hybrid seed "ruta/al/archivo-o-torrent" \
  --announce wss://tracker.openwebtorrent.com \
  --announce wss://tracker.webtorrent.io \
  --announce wss://tracker.btorrent.xyz
```
Mantén esa terminal abierta mientras pruebas desde el navegador.

## Desarrollo local
- Stack: React + Vite + TypeScript + Tailwind, WebTorrent (bundle navegador), polyfills ESM.
- Ejecuta el dev server y abre la URL indicada por Vite.

## Deploy en GitHub Pages
Este proyecto ya está configurado con `base: '/fontorrent/'` en `vite.config.ts`.

Pasos de alto nivel:
1. Subir el repo a GitHub como `usuario/fontorrent` (o ajusta `base` si usas otro nombre).
2. Crear workflow de Pages o publicar el contenido de `dist/` en la rama `gh-pages`.
3. Habilitar GitHub Pages apuntando a `gh-pages`.

Si prefieres, añade un workflow de Actions para construir y publicar automáticamente al hacer push en `main`.

## Limitaciones conocidas en navegador
- DHT/UDP/UTP no están disponibles.
- La conectividad depende de trackers WSS activos y de peers con WebRTC.
- Algunos bloqueadores de contenido o cortafuegos pueden bloquear conexiones WSS a trackers.
