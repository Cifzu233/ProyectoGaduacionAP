/*
 * esp32cam_agroplaga.ino — Firmware ESP32-CAM para Agroplaga AI
 *
 * Expone el mismo API que el CameraWebServer de Espressif, que es lo que el
 * backend (PGAPAYBABACK) espera en modo "pull":
 *   GET http://<ip>/         -> JSON de estado
 *   GET http://<ip>/status   -> JSON de estado
 *   GET http://<ip>/capture  -> una foto JPEG
 *   GET http://<ip>:81/stream-> video MJPEG (multipart/x-mixed-replace)
 *
 * Opcionalmente (PUSH_MODE=true) envia un JPEG por HTTP POST al backend cada
 * PUSH_INTERVAL_MS a:  POST <BACKEND_URL>/api/camaras/<CAMERA_ID>/frame
 * con cabecera X-Camera-Token.
 *
 * Ademas (DHT_ENABLED=true) lee el sensor DHT22 conectado a DHT_PIN y envia
 * temperatura y humedad cada SENSOR_INTERVAL_MS a:
 *   POST <BACKEND_URL>/api/readings  {"plotId":PLOT_ID,"sensorKey":"temperature","value":..}
 *   POST <BACKEND_URL>/api/readings  {"plotId":PLOT_ID,"sensorKey":"humidity","value":..}
 * tambien con cabecera X-Camera-Token: el backend exige el token de dispositivo
 * (DEVICE_TOKEN o CAMERA_PUSH_TOKEN en el servidor) porque el resto de la API
 * esta protegida por inicio de sesion de usuario.
 *
 * Alimentacion: panel solar 6 V -> modulo de carga TP4056 -> bateria Li-ion
 * 18650 -> elevador (boost) 5 V -> pin 5V del ESP32-CAM.
 *
 * Placa: "AI Thinker ESP32-CAM"   Partition Scheme: "Huge APP (3MB No OTA)"
 * Core ESP32 para Arduino >= 2.0.x.  Libreria: "DHT sensor library" (Adafruit)
 */

#include "esp_camera.h"
#include "esp_http_server.h"
#include "esp_timer.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "camera_pins.h"
#include "config.h"

#if DHT_ENABLED
#include <DHT.h>
DHT dht(DHT_PIN, DHT_TYPE);
#endif

#define PART_BOUNDARY "123456789000000000000987654321"
static const char* STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

httpd_handle_t httpServer = NULL;     // puerto 80: /, /status, /capture
httpd_handle_t streamServer = NULL;   // puerto 81: /stream

unsigned long lastPush = 0;
unsigned long lastSensor = 0;
unsigned long bootMillis = 0;
uint32_t framesServed = 0;
int lastPushStatus = 0;
float lastTemp = NAN;
float lastHum = NAN;

/* ------------------------------ camara ------------------------------ */

bool setupCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk  = XCLK_GPIO_NUM;
  config.pin_pclk  = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href  = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn  = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size   = FRAME_SIZE;
  config.jpeg_quality = JPEG_QUALITY;
  config.fb_location  = CAMERA_FB_IN_PSRAM;
  config.grab_mode    = CAMERA_GRAB_LATEST;

  if (psramFound()) {
    config.fb_count = 2;
  } else {
    // Sin PSRAM: bajar resolucion para no quedarnos sin memoria
    config.fb_count = 1;
    config.fb_location = CAMERA_FB_IN_DRAM;
    if (config.frame_size > FRAMESIZE_SVGA) config.frame_size = FRAMESIZE_SVGA;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ Camara no inicializada: 0x%x\n", err);
    return false;
  }

  sensor_t* s = esp_camera_sensor_get();
  if (s) {
    s->set_brightness(s, 0);
    s->set_saturation(s, 0);
    // Muchas placas AI-Thinker montan el sensor invertido
    // s->set_vflip(s, 1);
    // s->set_hmirror(s, 1);
  }
  return true;
}

/* ------------------------------- WiFi ------------------------------- */

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("📶 Conectando a %s", WIFI_SSID);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 60) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("✅ IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("⚠️  Sin WiFi; reintentando en loop()");
  }
}

/* --------------------------- handlers HTTP --------------------------- */

static void addCommonHeaders(httpd_req_t* req) {
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Cache-Control", "no-store");
}

static esp_err_t statusHandler(httpd_req_t* req) {
  char buf[400];
  snprintf(buf, sizeof(buf),
           "{\"id\":%d,\"firmware\":\"agroplaga-esp32cam\",\"uptime_s\":%lu,"
           "\"rssi\":%d,\"free_heap\":%u,\"psram\":%s,\"push_mode\":%s,"
           "\"push_interval_ms\":%d,\"last_push_status\":%d,\"frames\":%u,\"ip\":\"%s\","
           "\"dht\":%s,\"temperature\":%.1f,\"humidity\":%.1f}",
           CAMERA_ID, (millis() - bootMillis) / 1000, WiFi.RSSI(), ESP.getFreeHeap(),
           psramFound() ? "true" : "false", PUSH_MODE ? "true" : "false",
           PUSH_INTERVAL_MS, lastPushStatus, framesServed,
           WiFi.localIP().toString().c_str(),
           DHT_ENABLED ? "true" : "false", lastTemp, lastHum);
  addCommonHeaders(req);
  httpd_resp_set_type(req, "application/json");
  return httpd_resp_send(req, buf, HTTPD_RESP_USE_STRLEN);
}

static esp_err_t captureHandler(httpd_req_t* req) {
  if (USE_FLASH) digitalWrite(LED_FLASH_PIN, HIGH);
  camera_fb_t* fb = esp_camera_fb_get();
  if (USE_FLASH) digitalWrite(LED_FLASH_PIN, LOW);
  if (!fb) {
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }
  addCommonHeaders(req);
  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=capture.jpg");
  esp_err_t res = httpd_resp_send(req, (const char*)fb->buf, fb->len);
  esp_camera_fb_return(fb);
  framesServed++;
  return res;
}

static esp_err_t streamHandler(httpd_req_t* req) {
  camera_fb_t* fb = NULL;
  esp_err_t res = ESP_OK;
  char partBuf[64];

  res = httpd_resp_set_type(req, STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;
  addCommonHeaders(req);

  Serial.println("▶️  cliente de stream conectado");
  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("⚠️  fallo capturando frame");
      res = ESP_FAIL;
      break;
    }
    size_t hlen = snprintf(partBuf, sizeof(partBuf), STREAM_PART, (unsigned)fb->len);
    res = httpd_resp_send_chunk(req, STREAM_BOUNDARY, strlen(STREAM_BOUNDARY));
    if (res == ESP_OK) res = httpd_resp_send_chunk(req, partBuf, hlen);
    if (res == ESP_OK) res = httpd_resp_send_chunk(req, (const char*)fb->buf, fb->len);
    esp_camera_fb_return(fb);
    fb = NULL;
    if (res != ESP_OK) break;
    framesServed++;
  }
  Serial.println("⏹️  cliente de stream desconectado");
  return res;
}

void startWebServers() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;
  config.ctrl_port = 32768;

  httpd_uri_t rootUri    = { .uri = "/",        .method = HTTP_GET, .handler = statusHandler,  .user_ctx = NULL };
  httpd_uri_t statusUri  = { .uri = "/status",  .method = HTTP_GET, .handler = statusHandler,  .user_ctx = NULL };
  httpd_uri_t captureUri = { .uri = "/capture", .method = HTTP_GET, .handler = captureHandler, .user_ctx = NULL };
  httpd_uri_t streamUri  = { .uri = "/stream",  .method = HTTP_GET, .handler = streamHandler,  .user_ctx = NULL };

  if (httpd_start(&httpServer, &config) == ESP_OK) {
    httpd_register_uri_handler(httpServer, &rootUri);
    httpd_register_uri_handler(httpServer, &statusUri);
    httpd_register_uri_handler(httpServer, &captureUri);
    Serial.println("🌐 HTTP :80 listo (/status, /capture)");
  }

  config.server_port = STREAM_PORT;
  config.ctrl_port = 32769;
  if (httpd_start(&streamServer, &config) == ESP_OK) {
    httpd_register_uri_handler(streamServer, &streamUri);
    Serial.printf("🎥 Stream :%d listo (/stream)\n", STREAM_PORT);
  }
}

/* ------------------------------- push ------------------------------- */

bool pushFrame() {
  if (WiFi.status() != WL_CONNECTED) return false;
  if (USE_FLASH) digitalWrite(LED_FLASH_PIN, HIGH);
  camera_fb_t* fb = esp_camera_fb_get();
  if (USE_FLASH) digitalWrite(LED_FLASH_PIN, LOW);
  if (!fb) return false;

  String url = String(BACKEND_URL) + "/api/camaras/" + String(CAMERA_ID) + "/frame";
  HTTPClient http;
  http.setTimeout(8000);
  http.begin(url);
  http.addHeader("Content-Type", "image/jpeg");
  if (strlen(CAMERA_TOKEN) > 0) http.addHeader("X-Camera-Token", CAMERA_TOKEN);
  int code = http.POST(fb->buf, fb->len);
  lastPushStatus = code;
  if (code > 0) {
    Serial.printf("⬆️  push %u bytes -> HTTP %d\n", (unsigned)fb->len, code);
  } else {
    Serial.printf("⬆️  push fallo: %s\n", http.errorToString(code).c_str());
  }
  http.end();
  esp_camera_fb_return(fb);
  return code == 200;
}

/* ------------------------------ DHT22 ------------------------------ */

// Envia una lectura al backend (mismo endpoint que usa el simulador y Postman).
bool sendReading(const char* sensorKey, float value, const char* unit) {
  if (WiFi.status() != WL_CONNECTED || isnan(value)) return false;
  String url = String(BACKEND_URL) + "/api/readings";
  String body = String("{\"plotId\":") + PLOT_ID + ",\"sensorKey\":\"" + sensorKey +
                "\",\"value\":" + String(value, 1) + ",\"unit\":\"" + unit + "\"}";
  HTTPClient http;
  http.setTimeout(8000);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  // Token de dispositivo: debe coincidir con DEVICE_TOKEN (o CAMERA_PUSH_TOKEN) del backend.
  if (strlen(CAMERA_TOKEN) > 0) http.addHeader("X-Camera-Token", CAMERA_TOKEN);
  int code = http.POST(body);
  Serial.printf("🌡️  %s=%.1f%s -> HTTP %d\n", sensorKey, value, unit, code);
  http.end();
  return code == 200;
}

void readAndSendDht() {
#if DHT_ENABLED
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) {
    Serial.println("⚠️  DHT22 sin lectura (revisa cableado y pull-up)");
    return;
  }
  lastTemp = t;
  lastHum = h;
  sendReading("temperature", t, "C");
  sendReading("humidity", h, "%");
#endif
}

/* ------------------------------ arduino ------------------------------ */

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(false);
  Serial.println();
  Serial.println("🌿 Agroplaga AI — ESP32-CAM");
  bootMillis = millis();

  pinMode(LED_FLASH_PIN, OUTPUT);
  digitalWrite(LED_FLASH_PIN, LOW);

  if (!setupCamera()) {
    Serial.println("Reiniciando en 5 s...");
    delay(5000);
    ESP.restart();
  }

  connectWifi();
  startWebServers();

#if DHT_ENABLED
  dht.begin();
  Serial.printf("🌡️  DHT22 en GPIO %d, parcela de sensores %d, cada %d ms\n", DHT_PIN, PLOT_ID, SENSOR_INTERVAL_MS);
#endif

  Serial.println("Registra esta camara en la web:");
  Serial.printf("  modo pull -> base_url = http://%s\n", WiFi.localIP().toString().c_str());
  if (PUSH_MODE) {
    Serial.printf("  modo push -> POST %s/api/camaras/%d/frame cada %d ms\n", BACKEND_URL, CAMERA_ID, PUSH_INTERVAL_MS);
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastReconnect = 0;
    if (millis() - lastReconnect > 10000) {
      lastReconnect = millis();
      Serial.println("📶 WiFi perdido, reconectando...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASS);
    }
  }

  if (PUSH_MODE && millis() - lastPush >= PUSH_INTERVAL_MS) {
    lastPush = millis();
    pushFrame();
  }

  if (DHT_ENABLED && millis() - lastSensor >= SENSOR_INTERVAL_MS) {
    lastSensor = millis();
    readAndSendDht();
  }

  delay(10);
}
