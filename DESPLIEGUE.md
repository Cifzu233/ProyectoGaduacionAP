# Poner Agroplaga AI en linea

## Estado actual (desplegado el 2026-09-13)

| Pieza | Donde | URL |
|---|---|---|
| Frontend | Vercel, proyecto `agroplaga-ai` (cuenta ingenieros0901) | <https://agroplaga-ai.vercel.app> |
| Backend | Railway, proyecto `agroplaga-ai`, servicio `agroplaga-backend` | <https://agroplaga-backend-production.up.railway.app> |
| MySQL | Railway, servicio `MySQL` (base `railway`) | solo red privada |

- Salud del backend: <https://agroplaga-backend-production.up.railway.app/api/debug/health>
- El backend se subio con `railway up` desde la carpeta local (no desde GitHub).
  Para publicar cambios del backend: `cd PGAPAYBABACK && railway up`.
- El frontend se subio con `vercel --prod` desde `agroplaga-web`. Para publicar
  cambios: `cd agroplaga-web && vercel --prod`.
- La base se cargo con la variable temporal `IMPORTAR_SQL` (ver seccion 2, paso 6).
- Costo: prueba gratuita de Railway (credito unico de 5 USD, 30 dias); Vercel Hobby gratis.

Arquitectura en la nube (todo con plan gratuito o de pocos dolares):

```
Navegador ──► Vercel (agroplaga-web, React/Vite)
                 │  VITE_API_URL
                 ▼
             Railway (PGAPAYBABACK, Express) ──► Railway MySQL
                 │
                 └──► OpenAI (chat gpt-4o-mini, vision gpt-4o)
ESP32-CAM ──(POST /api/camaras/2/frame, modo push)──► Railway
```

El codigo ya esta preparado:

- `PGAPAYBABACK/db.js` acepta `DATABASE_URL` / `MYSQL_URL` (URL unica que entrega
  Railway) y `DB_SSL=true` para proveedores que exigen TLS.
- `PGAPAYBABACK/railway.json` define arranque y healthcheck (`/api/debug/health`).
- `agroplaga-web/vercel.json` reescribe todas las rutas a `index.html` (React Router).
- `PGAPAYBABACK/database/agroplaga_v2_completo.sql` es el volcado completo de la
  base local (esquema + datos de demo) para cargar en la nube.
- El chat usa `AI_PROVIDER=openai`. Ollama no existe en la nube.

Tiempo estimado: 30 minutos. Solo hace falta una cuenta de GitHub, una de
Railway y una de Vercel (las tres permiten entrar con la cuenta de GitHub).

---

## 1. Codigo en GitHub (dos repositorios)

Hay dos repositorios, ambos de la cuenta `Cifzu233`:

| Repositorio | Contenido | Lo despliega |
|---|---|---|
| `PGAPAYBABACK` | backend Express (carpeta `PGAPAYBABACK/`, tiene su propio `.git`) | Railway |
| `ProyectoGaduacionAP` | frontend `agroplaga-web/`, `docs/`, `firmware/`, esta guia | Vercel |

`.env` y sus copias estan en `.gitignore` en los dos, asi que la clave de OpenAI
no se sube. Para publicar cambios:

```bat
:: backend
cd "C:\Users\cesar\Desktop\Proyecto de graduacion\ProyectoGaduacionAP\PGAPAYBABACK"
git add -A && git commit -m "mensaje" && git push

:: frontend / docs
cd "C:\Users\cesar\Desktop\Proyecto de graduacion\ProyectoGaduacionAP"
git add -A && git commit -m "mensaje" && git push
```

## 2. Backend + MySQL en Railway

1. Entra en <https://railway.com> con GitHub → **New Project** → **Deploy from
   GitHub repo** → elige `PGAPAYBABACK`.
2. No hace falta Root Directory. Railway detecta Node y usa `railway.json`.
3. **+ Create → Database → MySQL**. Espera a que arranque.
4. En el servicio del backend, **Variables → Add Variable Reference** →
   `MYSQL_URL` del servicio MySQL (Railway lo enlaza solo). Anade ademas:

   | Variable | Valor |
   |---|---|
   | `AI_PROVIDER` | `openai` |
   | `OPENAI_API_KEY` | tu clave (la misma del `.env` local) |
   | `OPENAI_MODEL_TEXT` | `gpt-4o-mini` |
   | `OPENAI_MODEL_VISION` | `gpt-4o` |
   | `CAMERA_PUSH_TOKEN` | un token largo que tu inventes (protege `POST /frame`) |
   | `CAMERA_AUTO_MIN_INTERVAL` | `300` (controla el coste de OpenAI) |

   No definas `PORT`: Railway lo inyecta y el servidor ya lo lee.
5. **Settings → Networking → Generate Domain**. Anota la URL, por ejemplo
   `https://agroplaga-backend-production.up.railway.app`.
6. Cargar la base de datos. El MySQL de Railway no es accesible desde fuera, asi
   que el propio backend la carga al arrancar si existe la variable
   `IMPORTAR_SQL`:

   ```bat
   cd PGAPAYBABACK
   railway variable set IMPORTAR_SQL=database/agroplaga_v2_completo.sql --service agroplaga-backend --skip-deploys
   railway up --service agroplaga-backend
   railway variable delete IMPORTAR_SQL --service agroplaga-backend
   ```

   El ultimo paso es obligatorio: el volcado hace `DROP TABLE` + `CREATE TABLE`,
   asi que si la variable se queda, cada reinicio borraria los datos de la nube.

7. Comprueba `https://TU-BACKEND.up.railway.app/api/debug/health`. Debe
   devolver `{"ok":true,...}`.

## 3. Frontend en Vercel

1. Entra en <https://vercel.com> con GitHub → **Add New → Project** → importa
   `agroplaga-ai`.
2. **Root Directory** = `agroplaga-web` (Vercel lee `vercel.json`).
3. **Environment Variables**: `VITE_API_URL` = la URL del backend de Railway,
   sin barra final.
4. **Deploy**. Vercel entrega una URL tipo `https://agroplaga-ai.vercel.app`.
   Esa es la que se abre desde cualquier navegador.

Cada `git push` a `main` vuelve a desplegar backend y frontend solos.

## 4. Camara ESP32-CAM en la nube

El modo *pull* (el backend se conecta a la IP de la camara) no funciona desde
internet porque la camara esta en tu red local. Usa el modo *push*: en el
firmware pon `BACKEND_URL = https://TU-BACKEND.up.railway.app/api/camaras/2/frame`
y el token `CAMERA_PUSH_TOKEN`. La camara envia la foto y el servidor la
analiza igual que en local. Para la demo sin hardware, desde tu PC:

```bat
cd PGAPAYBABACK
node scripts\simular-camara.js --dir scripts\frames-trampa --push https://TU-BACKEND.up.railway.app/api/camaras/2/frame --token TU_TOKEN --every 5
```

## Limitaciones a tener en cuenta

- **Disco efimero**: Railway borra `uploads/` en cada despliegue. Las fotos de
  detecciones antiguas desaparecen; la fila en la base queda. Si necesitas que
  persistan, anade un **Volume** montado en `/app/uploads` (Railway lo permite
  en el plan Hobby).
- **Costo de OpenAI**: cada analisis de imagen con gpt-4o cuesta alrededor de
  un centavo de dolar. El analisis automatico por camara esta limitado por
  `CAMERA_AUTO_MIN_INTERVAL`.
- **Plan gratuito de Railway**: da credito mensual limitado; el backend con
  MySQL suele caber. Si se agota, el plan Hobby cuesta 5 USD al mes.
- **CORS** esta abierto a cualquier origen (`app.use(cors())`). Para la tesis es
  aceptable; en produccion real conviene restringirlo al dominio de Vercel.

## Alternativa rapida para una demo de un dia (sin cuentas de nube)

Con el backend y el frontend corriendo en tu PC:

```bat
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:5173
```

Da una URL publica temporal `https://algo.trycloudflare.com`. Antes cambia
`agroplaga-web/.env` para que `VITE_API_URL` apunte a un segundo tunel del
puerto 4000. Se cae al apagar la PC.
