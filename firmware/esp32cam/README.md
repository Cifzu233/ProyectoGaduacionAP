# Firmware ESP32-CAM para Agroplaga AI

Sketch Arduino para el modulo **AI-Thinker ESP32-CAM** (sensor OV2640). Sirve
video MJPEG y fotos como el `CameraWebServer` oficial, opcionalmente envia
fotos al backend (modo push) y **lee el sensor DHT22** (temperatura y humedad)
enviando las lecturas a `POST /api/readings`.

## Hardware del nodo de campo

| Componente | Funcion |
|---|---|
| ESP32-CAM (AI-Thinker, OV2640) | Camara + Wi-Fi + lectura del DHT22 |
| DHT22 (AM2302) | Temperatura y humedad del aire |
| Panel solar 6 V / 3-6 W | Fuente de energia |
| Modulo de carga TP4056 (con proteccion) | Carga la bateria desde el panel |
| Bateria Li-ion 18650 (2600-3400 mAh) | Autonomia nocturna |
| Elevador (boost) MT3608 o modulo 5 V | 3.7 V -> 5 V estables para el ESP32-CAM |

Conexiones:

```
Panel solar (+/-)  -> TP4056 IN+ / IN-
TP4056 B+ / B-     -> Bateria 18650
TP4056 OUT+ / OUT- -> Boost 5 V IN
Boost 5 V OUT      -> ESP32-CAM 5V / GND
DHT22 VCC          -> ESP32-CAM 3V3
DHT22 GND          -> ESP32-CAM GND
DHT22 DATA         -> GPIO 13 (+ resistencia 10 kΩ entre DATA y 3V3)
```

El ESP32-CAM consume hasta 300 mA al transmitir video; con un panel de 5-6 W y
una bateria de 3000 mAh el nodo funciona de forma continua en dias soleados y
mantiene el envio de lecturas durante la noche.

## Requisitos

- Arduino IDE 2.x
- Paquete de placas **esp32 by Espressif Systems** (>= 2.0.x) instalado desde
  el Gestor de placas (URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`)
- Libreria **DHT sensor library** (Adafruit) y su dependencia **Adafruit Unified Sensor**, desde el Gestor de librerias
- Un adaptador USB-serie (FTDI/CH340) a 5 V, o una placa ESP32-CAM-MB

## Configuracion

1. Copia `config.h.example` como `config.h`.
2. Edita `config.h`:
   - `WIFI_SSID` / `WIFI_PASS`
   - `BACKEND_URL`: IP del PC donde corre el backend, por ejemplo `http://192.168.1.10:4000`
   - `CAMERA_ID` y `CAMERA_TOKEN`: solo para modo push (se obtienen en la web, pagina **Camara → Nueva → modo push → Generar token**)
   - `PUSH_MODE`: `false` (pull, recomendado en la misma red) o `true` (push)
   - `DHT_ENABLED`, `DHT_PIN`, `PLOT_ID`, `SENSOR_INTERVAL_MS`: sensor DHT22 y parcela de sensores a la que se asocian las lecturas
   - `FRAME_SIZE` / `JPEG_QUALITY`: `FRAMESIZE_VGA` y `12` dan buen equilibrio

## Flasheo

1. Placa: **AI Thinker ESP32-CAM**. Partition Scheme: **Huge APP (3MB No OTA/1MB SPIFFS)**. Upload Speed: 115200.
2. Conecta el adaptador: 5V→5V, GND→GND, TX→U0R, RX→U0T.
3. Puentea **GPIO0 a GND**, pulsa RESET y sube el sketch.
4. Quita el puente GPIO0, pulsa RESET y abre el Monitor Serie a 115200. Veras la IP asignada.

## Registro en la web

- **Modo pull** (el servidor se conecta a la camara): en la pagina *Camara* pulsa
  **Nueva**, modo *Pull*, `URL base = http://<ip-del-esp32>`. El backend abrira
  `http://<ip>:81/stream` y usara `http://<ip>/capture` para fotos.
- **Modo push** (la camara envia fotos): crea la camara en modo *Push*, pulsa
  **Generar token** y copia `CAMERA_ID` y el token en `config.h`. El ESP32 hara
  `POST <BACKEND_URL>/api/camaras/<id>/frame` cada `PUSH_INTERVAL_MS`.

## Endpoints que expone el ESP32

| Ruta | Descripcion |
|---|---|
| `http://<ip>/` y `/status` | JSON con uptime, RSSI, heap, modo |
| `http://<ip>/capture` | Una foto JPEG |
| `http://<ip>:81/stream` | MJPEG continuo |

Todas las respuestas incluyen `Access-Control-Allow-Origin: *`.

## Consejos

- El ESP32-CAM solo aguanta 1-2 clientes de stream: no abras `:81/stream`
  directamente en varios navegadores; usa siempre la pagina *Camara* de la web,
  que retransmite desde el backend con una sola conexion.
- Si la imagen sale al reves, descomenta `set_vflip` / `set_hmirror` en `setupCamera()`.
- Usa una fuente de 5 V de al menos 1 A; los reinicios aleatorios suelen ser por alimentacion.
- Sin hardware puedes probar todo con el simulador: `npm run simular-camara` en `PGAPAYBABACK`.
