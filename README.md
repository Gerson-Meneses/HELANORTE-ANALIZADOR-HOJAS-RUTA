# HelaNorte · Frontend de rutas (React + TS)

App web responsiva, mobile-first, para escanear reportes de visita diaria
(usando el microservicio de OCR) y analizar la salud de los clientes de
una ruta. Todo se guarda localmente en **IndexedDB** — no hay backend
propio; solo llama directamente al microservicio de OCR.

## Requisitos

- Node.js 18+
- El microservicio de OCR corriendo (local o en Render) — ver el proyecto
  `ocr-service`.

## Empezar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. La primera vez, ve a **Ajustes** y pon la
URL de tu microservicio de OCR (por defecto usa `http://127.0.0.1:8001`,
que es la que usas corriendo `uvicorn` en local).

## Compilar para producción

```bash
npm run build
```

Genera la carpeta `dist/` — es un sitio 100% estático, así que se puede
desplegar en Render (Static Site), Vercel, Netlify o GitHub Pages sin
configuración especial. Solo asegúrate de configurar la URL del
microservicio de OCR desde Ajustes una vez desplegado (queda guardada en
`localStorage` del navegador de quien lo use).

## Estructura

```
src/
  views/          → pantallas completas (rutas de react-router)
  features/
    scan/         → captura, llamada al OCR, guardado del resultado
    clients/      → lista, orden/agrupación, motor de semáforo de salud
    dashboard/    → tarjetas de estadísticas del resumen
  shared/
    components/   → UI reutilizable (Botón, Tarjeta, Insignia, Nav...)
    theme/        → ThemeProvider (claro/oscuro)
  db/             → capa de IndexedDB (usando la librería `idb`)
  utils/          → formateo, exportación CSV
  types/          → tipos compartidos (reflejan el JSON del OCR)
  styles/         → variables de tema (tema.css) y reset global
```

## Notas importantes

- **Todo vive en el navegador.** Si cambias de dispositivo o borras los
  datos del navegador, pierdes el historial — usa el botón de "Descargar
  respaldo completo" en Ajustes regularmente, o cuando vayas a cambiar
  de celular.
- El semáforo de salud (bueno/regular/malo) es **100% configurable**
  desde Ajustes, y se puede personalizar por cliente individual desde su
  ficha.
- CORS: el microservicio de OCR ya tiene `allow_origins=["*"]`, así que
  puede llamarse directamente desde el navegador sin backend intermedio.
