# Analisis del proyecto Agroplaga Web

Fecha de revision: 2026-06-03

## Que es este proyecto

Este repositorio contiene una aplicacion web llamada **Agroplaga AI**. Por la estructura y los componentes revisados, es un frontend hecho con **React 19** y **Vite**, pensado para apoyar el monitoreo agricola de parcelas, seguimiento de actividades, gestion de plagas y consultas con un asistente de IA.

El proyecto principal esta en:

```text
ProyectoGaduacionAP/agroplaga-web
```

La aplicacion espera comunicarse con un backend HTTP, principalmente en `http://localhost:4000`, aunque el `Dashboard` usa como fallback una IP de red local: `http://192.168.0.106:4000`.

## Tecnologias detectadas

- React 19
- Vite 6
- React Router DOM 7
- React Icons
- Recharts
- Firebase instalado y configurado como plantilla, pero no integrado en las rutas revisadas
- Fetch API nativa para comunicacion con backend
- CSS por componente/pantalla

Dependencias relevantes en `package.json`:

```json
"react": "^19.1.0",
"react-router-dom": "^7.6.2",
"recharts": "^2.15.3",
"firebase": "^12.5.0",
"react-icons": "^5.5.0"
```

## Estructura general

Archivos principales:

```text
src/main.jsx
src/App.jsx
src/components/Dashboard.jsx
src/components/AlertaPlagas.jsx
src/components/Plagas.jsx
src/components/NuevaPlaga.jsx
src/components/Parcelas.jsx
src/components/Seguimiento.jsx
src/components/GraficaActividades.jsx
src/components/Chatbot.jsx
src/components/Layout.jsx
src/components/Navbar.jsx
src/lib/api.js
src/firebase.js
src/styles/*.css
```

`src/main.jsx` parece ser el punto de entrada real, porque monta React en `#root` y define las rutas con `BrowserRouter`, `Routes`, `Layout` y `Navbar`.

`src/App.jsx` tambien define rutas, pero no parece estar siendo usado por `main.jsx`. Puede quedar como archivo duplicado/antiguo si no se importa en ningun lado.

## Rutas de la aplicacion

Definidas en `src/main.jsx`:

| Ruta | Componente | Funcion |
| --- | --- | --- |
| `/` | `Dashboard` | Panel de monitoreo ambiental |
| `/plagas` | `Plagas` | Gestion/listado/edicion de plagas |
| `/seguimiento` | `Seguimiento` | Registro e historial de actividades agricolas |
| `/nueva-plaga` | `NuevaPlaga` | Formulario para registrar una plaga |
| `/parcelas` | `Parcelas` | CRUD de parcelas |
| `/chat` | `Chatbot` | Chat agricola con IA y diagnostico por imagen |

La navegacion visual esta en `Navbar.jsx`.

## Dashboard.jsx

`Dashboard.jsx` es el panel principal de monitoreo ambiental por parcela.

### Proposito

Muestra las ultimas lecturas de sensores para una parcela:

- Temperatura
- Humedad
- Luminosidad

Tambien calcula alertas simples de riesgo de plagas usando el componente `AlertaPlagas`.

### Fuente de datos

Usa esta constante:

```js
const API = import.meta.env.VITE_API_URL || "http://192.168.0.106:4000";
```

Eso significa:

1. Si existe `VITE_API_URL` en variables de entorno, usa esa URL.
2. Si no existe, usa la IP local `192.168.0.106:4000`.

Endpoints usados:

```text
GET /api/plots
GET /api/plots/:id/last
```

### Flujo interno

1. Si `Dashboard` recibe `plotId` por props, usa ese id directamente.
2. Si no recibe `plotId`, carga la lista de parcelas desde `/api/plots`.
3. Toma la primera parcela disponible y la selecciona.
4. Consulta `/api/plots/:id/last`.
5. Convierte las metricas del backend a claves del frontend:

```text
temperature -> temp
humidity    -> hum
light       -> lux
```

6. Renderiza tarjetas para temperatura, humedad y luminosidad.
7. Calcula la ultima fecha de actualizacion con `useMemo`.
8. Actualiza automaticamente los datos cada 20 segundos.
9. Permite refrescar manualmente con un boton.
10. Pasa los valores numericos a `AlertaPlagas`.

### Estado usado

| Estado | Uso |
| --- | --- |
| `plotId` | Parcela seleccionada localmente |
| `plots` | Lista de parcelas cargada desde API |
| `metrics` | Ultimas metricas normalizadas |
| `plotName` | Nombre mostrado en el titulo |
| `loading` | Estado de carga |
| `error` | Mensaje de error |

### Forma esperada de la respuesta del backend

Por lo que consume el componente, `/api/plots/:id/last` deberia devolver algo parecido a:

```json
{
  "plot": {
    "name": "Parcela 1"
  },
  "metrics": [
    {
      "key": "temperature",
      "last_value": 27.5,
      "last_time": "2026-06-03T16:00:00.000Z",
      "unit": "C"
    }
  ]
}
```

## AlertaPlagas.jsx

Este componente recibe:

```js
temperatura
humedad
luz
```

Y genera alertas mediante reglas fijas:

| Condicion | Alerta |
| --- | --- |
| `temperatura > 28 && humedad > 70 && luz > 2000` | Condiciones para Mosca de la fruta |
| `temperatura > 22 && humedad > 60` | Posible aparicion de Pulgones |
| `temperatura > 30 && humedad < 50` | Riesgo de Acaros |

No usa IA ni backend; es logica local en frontend.

## Gestion de plagas

### Plagas.jsx

Pantalla para listar, editar y eliminar plagas.

Endpoints:

```text
GET    /api/plagas
PUT    /api/plagas/:id
DELETE /api/plagas/:id
POST   /api/upload
```

Maneja campos como:

- `nombre`
- `nombre_cientifico`
- `sintomas`
- `tratamiento`
- `imagen`

### NuevaPlaga.jsx

Formulario para registrar una nueva plaga.

Endpoints:

```text
POST /api/upload
POST /api/plagas
```

Primero puede subir una imagen y luego guarda la plaga con la URL recibida.

## Parcelas.jsx

Pantalla CRUD para parcelas/lotes de cultivo.

Endpoint base:

```text
http://localhost:4000/api/parcelas
```

Operaciones:

- Cargar parcelas
- Crear parcela
- Editar parcela
- Eliminar parcela
- Subir imagen opcional con `FormData`

Campos:

- `nombre`
- `ubicacion`
- `cultivo`
- `superficie`
- `fecha_siembra`
- `observaciones`
- `imagen`

## Seguimiento.jsx

Pantalla para registrar actividades agricolas por parcela.

Endpoints:

```text
GET    /api/parcelas
GET    /api/actividades
POST   /api/actividades
DELETE /api/actividades/:id
```

Funciones principales:

- Cargar parcelas
- Cargar actividades
- Registrar nueva actividad
- Subir imagen opcional
- Filtrar historial por parcela
- Eliminar registros
- Exportar historial a CSV
- Mostrar grafica mensual con `GraficaActividades`

## GraficaActividades.jsx

Usa `recharts` para generar una grafica de barras agrupando registros por mes.

Entrada:

```js
registros
```

Salida visual:

- Eje X: mes
- Eje Y: cantidad de actividades
- Barra: numero de actividades por mes

## Chatbot.jsx

Pantalla de chat agricola.

Endpoint base:

```js
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
```

Endpoints usados:

```text
POST /api/ai/chat
POST /api/ai/vision-diagnose
```

Funciones:

- Enviar preguntas de texto asociadas a una parcela
- Enviar URL de imagen para diagnostico
- Mostrar historial tipo chat
- Mostrar respuesta del backend

Nota: en `main.jsx` se renderiza asi:

```jsx
<Chatbot plotId={4} />
```

Pero `Chatbot.jsx` recibe la prop como `initialPlotId`, no como `plotId`:

```js
export default function Chatbot({ initialPlotId = 4 })
```

Como el valor por defecto tambien es `4`, actualmente no rompe, pero si se intenta cambiar el id desde la ruta usando `plotId`, no surtira efecto.

## src/lib/api.js

Hay un wrapper de API reutilizable:

```js
export const api = {
  lastByPlot,
  history,
  alerts,
  closeAlert
}
```

Pero los componentes revisados usan mayormente `fetch` directo en vez de este helper.

Esto indica que el proyecto tiene dos estilos de consumo de API:

1. Helper centralizado en `src/lib/api.js`
2. URLs hardcodeadas dentro de componentes

Conviene unificarlo para evitar errores al cambiar la URL del backend.

## Firebase

`src/firebase.js` inicializa Firebase Auth y GoogleAuthProvider, pero contiene placeholders:

```js
apiKey: "TU_API_KEY"
authDomain: "TU_AUTH_DOMAIN"
```

No se observa uso directo de `auth` o `googleProvider` en las pantallas revisadas. Parece una preparacion para autenticacion futura.

## Hallazgos importantes

### 1. Problemas de codificacion de caracteres

Muchos textos muestran caracteres corruptos, por ejemplo:

```text
Temperatura Â°C
Ãšltima actualizaciÃ³n
âŒ
ðŸŒ¿
```

Esto sugiere que archivos con texto UTF-8 fueron interpretados o guardados con otra codificacion. Visualmente afecta titulos, botones, comentarios, alertas y mensajes.

Impacto:

- Mala presentacion en UI
- Comentarios dificiles de leer
- Riesgo de copiar textos corruptos a mas archivos

Recomendacion:

- Reabrir/convertir los archivos como UTF-8.
- Corregir textos visibles.
- Configurar el editor para guardar siempre en UTF-8.

### 2. Inconsistencia de URLs del backend

Hay varias bases de API:

```text
http://192.168.0.106:4000
http://localhost:4000
import.meta.env.VITE_API_URL
```

Impacto:

- La app puede funcionar en una pantalla y fallar en otra.
- Dificulta desplegar en otra maquina.
- Obliga a editar codigo para cambiar ambiente.

Recomendacion:

- Usar `VITE_API_URL` en todos los componentes.
- Centralizar endpoints en `src/lib/api.js`.

### 3. Diferencia entre `/api/plots` y `/api/parcelas`

`Dashboard.jsx` usa:

```text
/api/plots
/api/plots/:id/last
```

Pero `Parcelas.jsx` y `Seguimiento.jsx` usan:

```text
/api/parcelas
```

Puede ser correcto si el backend tiene ambos modelos, pero tambien puede ser una mezcla de nombres en ingles/espanol.

Riesgo:

- Que el dashboard lea parcelas de una tabla/API diferente a la gestion de parcelas.

### 4. `App.jsx` parece no usarse

`src/main.jsx` define las rutas reales. `src/App.jsx` tambien define rutas, pero no parece estar montado.

Recomendacion:

- Confirmar si `App.jsx` se usa.
- Si no se usa, eliminarlo o alinearlo para evitar confusion.

### 5. Prop incorrecta en Chatbot

En `main.jsx`:

```jsx
<Chatbot plotId={4} />
```

En `Chatbot.jsx`:

```js
function Chatbot({ initialPlotId = 4 })
```

Recomendacion:

- Cambiar la ruta a `<Chatbot initialPlotId={4} />` o cambiar el componente para aceptar `plotId`.

### 6. Import de CSS con mayusculas/minusculas

`Dashboard.jsx` importa:

```js
import "../styles/dashboard.css";
```

El archivo listado es:

```text
Dashboard.css
```

En Windows esto puede pasar desapercibido porque el sistema de archivos no distingue mayusculas/minusculas de la misma manera. En Linux o en un build de CI puede fallar.

Recomendacion:

- Igualar exactamente el nombre del archivo y el import.

### 7. Falta de validaciones de respuesta

Varios componentes hacen:

```js
const data = await res.json();
setPlagas(data);
```

Sin validar si `res.ok` o si la forma de `data` es la esperada.

Recomendacion:

- Validar `res.ok`.
- Mostrar mensajes de error consistentes.
- Evitar que una respuesta inesperada rompa el render.

### 8. Riesgo en exportacion CSV

`Seguimiento.jsx` reemplaza comas en algunos campos, pero no escapa comillas, saltos de linea ni valores nulos.

Recomendacion:

- Crear una funcion de escape CSV.
- Considerar `r.observaciones || ""`.

### 9. Carpeta duplicada

Dentro de `agroplaga-web` existe otra carpeta:

```text
agroplaga-web/agroplaga-web
```

Tambien contiene `package.json`, `src`, `vite.config.js`, etc.

Esto parece una copia anidada del frontend.

Riesgo:

- Editar una copia equivocada.
- Instalar dependencias en la carpeta equivocada.
- Confusion al ejecutar `npm run dev`.

Recomendacion:

- Confirmar cual es la version oficial.
- Eliminar o mover la copia anidada si no se usa.

## Resumen funcional por modulo

| Modulo | Estado observado | Comentario |
| --- | --- | --- |
| Dashboard | Funcional en concepto | Depende de `/api/plots` y `/last` |
| Alertas | Logica local simple | Reglas fijas por umbrales |
| Plagas | CRUD parcial | Lista, edita, elimina y sube imagen |
| Nueva plaga | Formulario funcional | Usa upload + POST plaga |
| Parcelas | CRUD completo | Usa `FormData` por imagen |
| Seguimiento | Registro e historial | Incluye CSV y grafica |
| Chatbot | Integracion IA | Texto e imagen por URL |
| Firebase | Preparado, no integrado | Credenciales placeholder |

## Recomendaciones prioritarias

1. Corregir codificacion UTF-8 en todos los archivos fuente.
2. Centralizar la URL base del backend con `VITE_API_URL`.
3. Unificar nombres de endpoints: `plots` vs `parcelas`.
4. Corregir el prop de `Chatbot`.
5. Revisar si `App.jsx` debe eliminarse o integrarse.
6. Revisar la carpeta duplicada `agroplaga-web/agroplaga-web`.
7. Igualar exactamente el nombre del CSS importado por `Dashboard.jsx`.
8. Agregar manejo de errores consistente en todas las peticiones.

## Mejoras aplicadas posteriormente

Se aplicaron varias mejoras tecnicas sin cambiar el flujo principal de la app:

- El frontend ahora usa `VITE_API_URL` de forma centralizada mediante `src/lib/api.js`.
- Se agrego `agroplaga-web/.env.example`.
- Se agrego `.env` al `.gitignore` del frontend para evitar subir configuracion local.
- `Dashboard`, `Chatbot`, `Plagas`, `NuevaPlaga`, `Parcelas` y `Seguimiento` dejaron de usar URLs hardcodeadas a `localhost:4000` o IP local.
- Se corrigio el uso de `Chatbot`: ahora se pasa `initialPlotId` en vez de `plotId`.
- El chat tiene placeholder mas orientado al dominio del melocoton.
- El chat renderiza encabezados simples y elimina marcas `**` basicas para mejorar lectura.
- La exportacion CSV de seguimiento ahora escapa comillas, comas y valores vacios.
- En backend se agrego filtro de dominio para que el chat responda solo sobre agronomia del melocoton/durazno.
- El backend rechaza preguntas fuera de tema sin llamar a OpenAI, evitando gasto de cuota.
- El backend ahora soporta proveedor local `ollama` para chat de texto mediante `AI_PROVIDER=ollama`.
- Se agregaron variables `AI_FALLBACK_OPENAI`, `OLLAMA_BASE_URL` y `OLLAMA_MODEL`.
- Con `AI_FALLBACK_OPENAI=false`, si Ollama no esta disponible no se consume OpenAI.
- El prompt del sistema del chat fue reforzado para mantenerse dentro del dominio.
- Se agregaron validaciones basicas para plagas, parcelas, actividades y lecturas de sensores.
- Se mejoro el manejo de errores de OpenAI para distinguir cuota insuficiente o API key/modelo invalido.
- Se agrego limite y validacion de tipo para uploads de imagenes: JPG, PNG, WEBP o GIF, maximo 5 MB.
- Se sanea el nombre de archivos subidos.
- Se agrego `controllers/plagas.controller.js` para resolver la importacion rota de `routes/plagas.routes.js`.
- Se corrigio el SQL incompatible con MySQL 8 usando alias escapado para `last_value`.

Validaciones realizadas:

```text
Backend: node --check server.js
Backend: node --check controllers/plagas.controller.js
Frontend: npm run build
API: GET /api/debug/health
API: GET /api/plots/1/last
API: POST /api/ai/chat con pregunta fuera de tema
API: POST /api/readings con payload invalido
```

Resultado:

```text
Build frontend correcto.
Backend responde correctamente.
Chat restringe temas fuera de melocoton/durazno.
Validaciones devuelven 400 cuando corresponde.
```

## Verificacion realizada

Se intento ejecutar:

```bash
npm run build
```

En PowerShell fallo primero por la politica de ejecucion de scripts de Windows sobre `npm.ps1`.

Luego se intento:

```bat
cmd /c npm run build
```

Ese segundo intento llego al script de `package.json`, pero fallo con:

```text
"vite" no se reconoce como un comando interno o externo
```

Se confirmo que existe `node_modules/vite`, pero no existe `node_modules/.bin/vite.cmd`. Esto sugiere que la instalacion local de dependencias esta incompleta o inconsistente.

Recomendacion:

```bat
cmd /c npm install
cmd /c npm run build
```

## Como correr el frontend

Desde:

```text
ProyectoGaduacionAP/agroplaga-web
```

Instalar dependencias si hace falta:

```bash
npm install
```

Ejecutar en desarrollo:

```bash
npm run dev
```

Construir para produccion:

```bash
npm run build
```

Para configurar backend:

```bash
VITE_API_URL=http://localhost:4000
```

En Windows PowerShell podria usarse:

```powershell
$env:VITE_API_URL="http://localhost:4000"
npm run dev
```

## Conclusion

El proyecto es un frontend agricola para monitoreo y gestion de plagas/parcelas. La idea general esta clara: sensores ambientales alimentan un dashboard, las condiciones generan alertas, las plagas y actividades se administran desde pantallas CRUD, y el chat agrega una capa de asistencia inteligente.

Lo mas importante antes de seguir creciendo el sistema es ordenar base de API, codificacion, rutas duplicadas y convenciones de nombres. Con eso, el proyecto quedaria mucho mas facil de mantener, desplegar y presentar.

# Analisis del backend PGAPAYBABACK

El backend fue clonado desde:

```text
https://github.com/Cifzu233/PGAPAYBABACK.git
```

Ruta local:

```text
ProyectoGaduacionAP/PGAPAYBABACK
```

## Que es el backend

Es una API Node.js con Express 5, Sequelize y MySQL. Expone endpoints para:

- Subir imagenes
- Gestionar plagas
- Gestionar parcelas
- Gestionar actividades
- Registrar lecturas de sensores
- Consultar ultimas metricas por parcela
- Generar alertas por umbrales
- Consultar OpenAI para chat y diagnostico visual

## Archivos principales del backend

```text
server.js
db.js
package.json
controllers/parcelas.controller.js
controllers/actividades.controller.js
routes/plagas.routes.js
routes/parcelas.routes.js
routes/actividades.routes.js
tests/
uploads/
```

Aunque existen `routes` y `controllers`, el archivo `server.js` actualmente define casi todos los endpoints directamente. Las rutas separadas no se montan en `server.js`.

## Dependencias del backend

Principales:

- `express`
- `cors`
- `dotenv`
- `multer`
- `mysql2`
- `sequelize`
- `node-fetch`
- `jest`
- `supertest`
- `nock`
- `nodemon`

Se ejecuto:

```bat
cmd /c npm install
```

Resultado:

- Dependencias instaladas correctamente.
- `npm` reporto 14 vulnerabilidades: 6 moderadas y 8 altas.

No se aplico `npm audit fix` automaticamente para evitar cambios de comportamiento sin revision.

## Variables de entorno necesarias

Se agrego este archivo:

```text
PGAPAYBABACK/.env.example
```

Contenido base:

```text
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=agroplaga_v2
DB_USER=root
DB_PASS=
OPENAI_API_KEY=
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL_TEXT=gpt-4o-mini
OPENAI_MODEL_VISION=gpt-4o
```

Para arrancar el backend, debe crearse un `.env` real con esos valores.

## Base de datos requerida

El backend usa MySQL. La conexion esta en `db.js` y toma estos valores:

```js
process.env.DB_NAME
process.env.DB_USER
process.env.DB_PASS
process.env.DB_HOST
process.env.DB_PORT
```

Tablas requeridas por `server.js`:

```text
plots
sensor_types
thresholds
sensor_readings
alerts
plagas
parcelas
actividades
```

Se agregaron archivos para crear y poblar la base:

```text
PGAPAYBABACK/database/schema.sql
PGAPAYBABACK/database/seed.sql
```

## Comandos para preparar MySQL

Desde `PGAPAYBABACK`:

```bat
mysql -u root -p < database\schema.sql
mysql -u root -p < database\seed.sql
```

Si root no tiene password:

```bat
mysql -u root < database\schema.sql
mysql -u root < database\seed.sql
```

## Pruebas realizadas

### Frontend

Despues de instalar dependencias, se ejecuto:

```bat
cmd /c npm run build
```

Resultado:

```text
Build correcto.
```

Vite aviso que el bundle JS supera 500 kB, pero eso es advertencia de optimizacion, no bloqueo.

### Backend

Se ejecuto:

```bat
cmd /c npm start
```

Resultado:

```text
[WARN] Falta OPENAI_API_KEY en .env. Los endpoints /api/ai/* fallaran.
Error al conectar con la base de datos: connect ECONNREFUSED 127.0.0.1:3306
```

Conclusion: el backend no puede arrancar hasta que MySQL este activo y configurado.

Tambien se ejecuto:

```bat
cmd /c npm test
```

Resultado:

- Pasaron las pruebas unitarias de `src/lib/utils.js`.
- Fallaron pruebas de integracion/sistema por no haber MySQL en `127.0.0.1:3306`.
- El test de chat tambien falla porque antes de llamar a OpenAI intenta cargar contexto desde MySQL.

## Compatibilidad frontend-backend

El frontend y backend si coinciden en varios endpoints:

| Frontend | Backend | Estado |
| --- | --- | --- |
| `GET /api/plots` | Existe | OK |
| `GET /api/plots/:id/last` | Existe | OK |
| `GET /api/plagas` | Existe | OK |
| `POST /api/plagas` | Existe | OK |
| `PUT /api/plagas/:id` | Existe | OK |
| `DELETE /api/plagas/:id` | Existe | OK |
| `POST /api/upload` | Existe | OK |
| `GET /api/parcelas` | Existe | OK |
| `POST /api/parcelas` | Existe | OK |
| `PUT /api/parcelas/:id` | Existe | OK |
| `DELETE /api/parcelas/:id` | Existe | OK |
| `GET /api/actividades` | Existe | OK |
| `POST /api/actividades` | Existe | OK |
| `DELETE /api/actividades/:id` | Existe | OK |
| `POST /api/ai/chat` | Existe | Requiere MySQL y OpenAI |
| `POST /api/ai/vision-diagnose` | Existe | Requiere OpenAI |

## Faltantes para hacerlo funcional

1. Instalar y arrancar MySQL local o configurar un MySQL externo.
2. Crear `.env` en `PGAPAYBABACK` basado en `.env.example`.
3. Ejecutar `database/schema.sql`.
4. Ejecutar `database/seed.sql`.
5. Arrancar backend con `cmd /c npm start`.
6. Configurar frontend con `VITE_API_URL=http://localhost:4000`.
7. Arrancar frontend con `cmd /c npm run dev`.
8. Agregar `OPENAI_API_KEY` si se usara chat/vision.

En esta maquina se verifico que:

- No hay cliente `mysql` disponible en PATH.
- No se encontro servicio local MySQL/MariaDB visible.
- Docker tampoco esta disponible/arrancado.

Por eso, la pieza pendiente real es instalar o habilitar un servidor MySQL y ejecutar los SQL agregados.

## Problemas de codigo detectados en backend

### Controlador faltante

`routes/plagas.routes.js` importa:

```js
../controllers/plagas.controller.js
```

Pero ese archivo no existe.

Actualmente no rompe el arranque porque esas rutas no se montan en `server.js`, pero si en algun momento se intenta usar `routes/plagas.routes.js`, fallara.

### Rutas duplicadas/no usadas

Hay dos estilos mezclados:

- Endpoints escritos directamente en `server.js`
- Rutas/controladores separados

Conviene escoger uno. Para mantenimiento, lo ideal seria mover la logica de `server.js` a rutas/controladores.

### Codificacion rota

El backend tambien tiene textos corruptos por codificacion, igual que el frontend.

### Tests con dependencia real de MySQL

Las pruebas de integracion y sistema no levantan una base temporal ni mockean DB. Necesitan MySQL real con base `agroplaga_v2`.

### Docker no disponible

Se intento listar contenedores con Docker, pero Docker Desktop/daemon no esta corriendo o no esta disponible.

## Archivos agregados en esta revision

```text
agroplaga-web/.env
agroplaga-web/.env.example
PGAPAYBABACK/.env.example
PGAPAYBABACK/.env
PGAPAYBABACK/database/schema.sql
PGAPAYBABACK/database/seed.sql
PGAPAYBABACK/LEVANTAR_BACKEND.md
```

## Comando final esperado

Backend:

```bat
cd PGAPAYBABACK
cmd /c npm start
```

Frontend:

```bat
cd agroplaga-web
cmd /c npm run dev
```
