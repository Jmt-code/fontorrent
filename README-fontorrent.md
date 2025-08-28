# FontTorrent - Cliente BitTorrent P2P Web

Cliente BitTorrent que funciona completamente en el navegador web, desarrollado con React y WebTorrent. Permite descargar y compartir archivos torrent directamente desde el navegador sin necesidad de instalar software adicional.

## 🚀 Características

- **🌐 Funciona en el navegador**: Cliente P2P completamente web-based
- **📁 Soporte completo de torrents**: Compatible con archivos .torrent y enlaces magnet
- **🔄 Conexiones P2P**: Utiliza WebRTC para conexiones directas entre peers
- **📊 Monitoreo en tiempo real**: Progreso de descarga, velocidad y estadísticas de peers
- **📤 Creación de torrents**: Crea tus propios torrents desde archivos locales
- **📱 Interfaz responsiva**: Diseño moderno con Tailwind CSS
- **🚀 GitHub Pages Ready**: Listo para desplegar en GitHub Pages

## 🛠️ Tecnologías Utilizadas

- **React 19** con TypeScript
- **Vite** como build tool
- **WebTorrent** para funcionalidad BitTorrent
- **Tailwind CSS** para estilos
- **React Dropzone** para drag & drop
- **Lucide React** para iconos

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/fontorrent.git
cd fontorrent
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre http://localhost:5173 en tu navegador

## 🌐 Despliegue en GitHub Pages

1. Construye el proyecto:
```bash
npm run build
```

2. Despliega a GitHub Pages:
```bash
npm run deploy
```

El proyecto se desplegará automáticamente en `https://tu-usuario.github.io/fontorrent/`

## 🎯 Uso

### Agregar Torrents

1. **Archivo .torrent**: Arrastra y suelta un archivo .torrent en la zona de carga
2. **Enlace Magnet**: Pega un enlace magnet en el campo de texto
3. **Crear Torrent**: Selecciona archivos locales para crear un nuevo torrent

### Gestión de Descargas

- **Progreso**: Visualiza el progreso de descarga en tiempo real
- **Peers**: Ve los peers conectados y sus estadísticas
- **Archivos**: Descarga archivos individuales cuando estén listos
- **Estadísticas**: Monitorea velocidades de descarga/subida

### Compartir Archivos

1. Selecciona los archivos que quieres compartir
2. El sistema creará automáticamente un archivo .torrent
3. Comparte el archivo .torrent o el enlace magnet con otros usuarios

## ⚙️ Configuración

### Variables de Entorno

El proyecto está configurado para funcionar directamente en GitHub Pages. Para personalizar:

- Edita `vite.config.ts` para cambiar la ruta base
- Modifica `package.json` para el script de despliegue

### Limitaciones del Navegador

- Algunos navegadores pueden requerir HTTPS para WebRTC
- Los firewalls corporativos pueden bloquear conexiones P2P
- El almacenamiento está limitado por las restricciones del navegador

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build de producción
- `npm run lint` - Ejecutar linter
- `npm run deploy` - Desplegar a GitHub Pages

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## ⚠️ Disclaimer

Este proyecto es solo para fines educativos y de demostración. Asegúrate de cumplir con las leyes locales sobre derechos de autor y distribución de contenido al usar torrents.

## 🔗 Enlaces Útiles

- [WebTorrent](https://webtorrent.io/) - Biblioteca P2P para el navegador
- [React](https://react.dev/) - Framework de frontend
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Framework de CSS

## 📞 Soporte

Si encuentras algún problema o tienes preguntas, por favor abre un issue en GitHub.

---

Desarrollado con ❤️ para la comunidad P2P
