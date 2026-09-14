# -*- coding: utf-8 -*-
"""Genera los diagramas UML y de arquitectura de Agroplaga AI (PNG) con matplotlib,
y las imagenes de fragmentos de codigo con PIL."""
import os, re, sys, subprocess
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Ellipse, Circle, Polygon, FancyArrowPatch, Rectangle
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
ROOT = r"C:\Users\cesar\Desktop\Proyecto de graduacion\ProyectoGaduacionAP"
os.makedirs(OUT, exist_ok=True)
plt.rcParams["font.family"] = "DejaVu Sans"

C_BOX = "#e8f1fb"; C_EDGE = "#2c3e50"; C_HW = "#fdebd0"; C_AI = "#e8daef"; C_DB = "#d5f5e3"; C_WEB = "#d6eaf8"; C_SOL = "#fcf3cf"

def fig_ax(w, h):
    fig = plt.figure(figsize=(w, h), dpi=150)
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis("off")
    return fig, ax

def box(ax, x, y, w, h, text, fc=C_BOX, fs=9, bold=False, style="round,pad=0.02,rounding_size=1.2", ec=C_EDGE, lw=1.2):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=style, fc=fc, ec=ec, lw=lw, mutation_aspect=1))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs, fontweight="bold" if bold else "normal", wrap=True)

def arrow(ax, p1, p2, text="", fs=7.5, dashed=False, color=C_EDGE, tpos=0.5, toff=(0, 1.2), head=True, cs="arc3,rad=0"):
    a = FancyArrowPatch(p1, p2, arrowstyle="-|>" if head else "-", mutation_scale=12, lw=1.1, color=color,
                        linestyle="--" if dashed else "-", connectionstyle=cs, shrinkA=2, shrinkB=2)
    ax.add_patch(a)
    if text:
        x = p1[0] + (p2[0] - p1[0]) * tpos + toff[0]; y = p1[1] + (p2[1] - p1[1]) * tpos + toff[1]
        ax.text(x, y, text, fontsize=fs, ha="center", va="bottom", bbox=dict(fc="white", ec="none", pad=0.6))

def actor(ax, x, y, name, fs=8.5):
    ax.add_patch(Circle((x, y + 6), 2, fc="white", ec=C_EDGE, lw=1.2))
    ax.plot([x, x], [y + 4, y - 1], color=C_EDGE, lw=1.2)
    ax.plot([x - 3, x + 3], [y + 2.5, y + 2.5], color=C_EDGE, lw=1.2)
    ax.plot([x, x - 2.5], [y - 1, y - 5], color=C_EDGE, lw=1.2)
    ax.plot([x, x + 2.5], [y - 1, y - 5], color=C_EDGE, lw=1.2)
    ax.text(x, y - 7.5, name, ha="center", va="top", fontsize=fs, fontweight="bold")

def save(fig, name):
    fig.savefig(os.path.join(OUT, name), dpi=150, facecolor="white"); plt.close(fig); print("ok", name)

# ----------------------------------------------------------------- casos de uso
def casos_uso():
    fig, ax = fig_ax(10, 8.2)
    ax.add_patch(Rectangle((27, 3), 70, 94, fc="none", ec=C_EDGE, lw=1.3))
    ax.text(62, 95, "Sistema Agroplaga AI", ha="center", fontsize=10, fontweight="bold")
    actors = {"Agricultor": (11, 84), "Técnico": (11, 62), "Administrador": (11, 40), "Nodo ESP32-CAM\n+ DHT22": (11, 18)}
    for n, (x, y) in actors.items(): actor(ax, x, y, n)
    uc = [
        ("Ver video en vivo de la parcela", 88), ("Capturar imagen del cultivo", 80), ("Analizar imagen con IA", 72),
        ("Recibir alerta / diagnóstico de plaga", 64), ("Consultar condiciones ambientales", 56),
        ("Registrar actividades (fumigación, poda)", 48), ("Consultar historial y exportar CSV", 40),
        ("Consultar fichas de plagas", 32), ("Consultar al asistente agronómico", 24),
        ("Gestionar parcelas y plagas", 16), ("Configurar cámaras y análisis automático", 8),
    ]
    for i, (t, y) in enumerate(uc):
        cx = 62 if i % 2 == 0 else 62
        ax.add_patch(Ellipse((cx, y), 46, 6.4, fc="#fff9e6", ec=C_EDGE, lw=1.1)); ax.text(cx, y, t, ha="center", va="center", fontsize=8)
    links = {"Agricultor": [88, 80, 72, 64, 56, 48, 40, 32, 24], "Técnico": [72, 64, 56, 48, 24, 16], "Administrador": [16, 8, 56], "Nodo ESP32-CAM\n+ DHT22": [88, 56]}
    for n, ys in links.items():
        ax_, ay = actors[n]
        for y in ys:
            ax.plot([ax_ + 4, 39], [ay, y], color="#7f8c8d", lw=0.8, alpha=0.8)
    arrow(ax, (62, 84.8), (62, 83.2), "«include»", fs=6.5, dashed=True, toff=(12, -0.3))
    arrow(ax, (62, 76.8), (62, 75.2), "«include»", fs=6.5, dashed=True, toff=(12, -0.3))
    arrow(ax, (62, 68.8), (62, 67.2), "«extend»", fs=6.5, dashed=True, toff=(12, -0.3))
    arrow(ax, (62, 52.8), (62, 51.2), "«extend» alerta por umbral", fs=6.5, dashed=True, toff=(20, -0.3))
    save(fig, "casos_uso.png")

# ----------------------------------------------------------------- secuencia
def secuencia(name, title, lifelines, msgs, h=7.2):
    fig, ax = fig_ax(11, h)
    n = len(lifelines); xs = [8 + i * (84 / (n - 1)) for i in range(n)]
    ax.text(50, 97, title, ha="center", fontsize=11, fontweight="bold")
    for x, (ln, fc) in zip(xs, lifelines):
        box(ax, x - 8, 86, 16, 7, ln, fc=fc, fs=8, bold=True)
        ax.plot([x, x], [86, 4], color=C_EDGE, lw=0.9, linestyle=(0, (4, 3)))
    y = 82; step = (78) / (len(msgs) + 1)
    for m in msgs:
        src, dst, text = m[0], m[1], m[2]; dashed = len(m) > 3 and m[3]
        x1, x2 = xs[src], xs[dst]
        if src == dst:
            ax.plot([x1, x1 + 6, x1 + 6, x1 + 0.6], [y, y, y - 2.5, y - 2.5], color=C_EDGE, lw=1)
            ax.annotate("", (x1 + 0.6, y - 2.5), (x1 + 2, y - 2.5), arrowprops=dict(arrowstyle="-|>", color=C_EDGE))
            ax.text(x1 + 7, y - 1, text, fontsize=7.2, va="center")
        else:
            ax.annotate("", (x2, y), (x1, y), arrowprops=dict(arrowstyle="-|>", color=C_EDGE, lw=1, linestyle="--" if dashed else "-"))
            ax.text((x1 + x2) / 2, y + 0.8, text, fontsize=7.2, ha="center", va="bottom", bbox=dict(fc="white", ec="none", pad=0.4))
        y -= step
    save(fig, name)

def secuencias():
    L = [("Agricultor", C_BOX), ("App web\n(React)", C_WEB), ("Backend API\n(Node/Express)", C_BOX), ("OpenAI\nVisión", C_AI), ("MySQL", C_DB)]
    secuencia("sec_imagen.png", "Secuencia 1: Captura y análisis de imagen con alerta", L, [
        (0, 1, "1. Pulsa «Capturar» / «Analizar con IA»"),
        (1, 2, "2. GET /api/camaras/:id/snapshot"),
        (2, 2, "3. Toma el último frame del hub"),
        (2, 1, "4. JPEG del cultivo", True),
        (1, 2, "5. POST /api/camaras/:id/analizar {nota}"),
        (2, 5 - 1, "6. Consulta contexto de parcela (umbrales, lecturas)"),
        (4, 2, "7. Contexto", True),
        (2, 3, "8. Imagen (base64) + prompt estructurado"),
        (3, 2, "9. JSON {plaga, confianza, severidad, recomendaciones}", True),
        (2, 4, "10. INSERT detecciones + guarda snapshot"),
        (2, 1, "11. Detección con diagnóstico", True),
        (1, 0, "12. Muestra tarjeta de resultado y alerta si requiere acción", True),
    ])
    L2 = [("Nodo ESP32-CAM\n+ DHT22", C_HW), ("Backend API", C_BOX), ("MySQL", C_DB), ("App web\n(Dashboard)", C_WEB), ("Agricultor", C_BOX)]
    secuencia("sec_sensores.png", "Secuencia 2: Registro de lecturas del DHT22 y alerta por umbral", L2, [
        (0, 0, "1. Lee temperatura y humedad (cada 60 s)"),
        (0, 1, "2. POST /api/readings {plotId, sensorKey, value}"),
        (1, 2, "3. INSERT sensor_readings"),
        (1, 2, "4. SELECT thresholds (min, max)"),
        (2, 1, "5. Umbrales de la parcela", True),
        (1, 1, "6. ¿Valor fuera de rango?"),
        (1, 2, "7. INSERT alerts (status = open)"),
        (1, 0, "8. {ok, readingId, alert}", True),
        (3, 1, "9. GET /api/plots/:id/last (cada 20 s)"),
        (1, 3, "10. Últimas lecturas por sensor", True),
        (3, 4, "11. Tarjetas de temperatura/humedad y alertas inteligentes", True),
    ])
    L3 = [("Nodo ESP32-CAM", C_HW), ("Backend API\n(FrameHub)", C_BOX), ("App web\n(/camara)", C_WEB), ("Scheduler", C_BOX), ("OpenAI Visión", C_AI)]
    secuencia("sec_video.png", "Secuencia 3: Video en vivo (relay MJPEG) y análisis automático", L3, [
        (2, 1, "1. GET /api/camaras/:id/stream (<img>)"),
        (1, 0, "2. GET http://<ip>:81/stream (una sola conexión)"),
        (0, 1, "3. Flujo MJPEG (frames JPEG)", True),
        (1, 1, "4. Parser SOI/EOI → publica frame en el hub"),
        (1, 2, "5. multipart/x-mixed-replace (a N navegadores)", True),
        (3, 1, "6. Tick: ¿intervalo cumplido y frame fresco?"),
        (1, 3, "7. Último frame", True),
        (3, 4, "8. Diagnóstico de la imagen"),
        (4, 3, "9. JSON estructurado", True),
        (3, 1, "10. Guarda detección (origen = auto)"),
        (2, 1, "11. GET /api/detecciones (cada 10 s)"),
        (1, 2, "12. Historial actualizado; sin espectadores cierra el stream", True),
    ])

# ----------------------------------------------------------------- estados
def estados():
    fig, ax = fig_ax(8.5, 9.5)
    ax.text(50, 97.5, "Ciclo de vida de una imagen en Agroplaga AI", ha="center", fontsize=11, fontweight="bold")
    ax.add_patch(Circle((50, 93), 1.6, fc=C_EDGE))
    S = [("Frame capturado\n(ESP32-CAM / simulador / archivo)", 84), ("Publicado en el FrameHub\n(último frame en memoria)", 72),
         ("Snapshot guardado en disco\n(/uploads/camaras/<id>/)", 60), ("Enviado a OpenAI Visión\n(base64 + contexto de parcela)", 48),
         ("Respuesta JSON normalizada\n(plaga, confianza, severidad)", 36), ("Detección registrada en MySQL", 24)]
    for t, y in S: box(ax, 25, y - 3.5, 50, 7, t, fs=8.5)
    for i in range(len(S) - 1):
        arrow(ax, (50, S[i][1] - 3.5), (50, S[i + 1][1] + 3.5))
    arrow(ax, (50, 91.4), (50, 87.5))
    ax.text(52, 78.5, "solicitud manual o tick del scheduler", fontsize=7, ha="left")
    ax.text(52, 54.5, "reintento con backoff si la IA falla", fontsize=7, ha="left")
    # diamonds
    ax.add_patch(Polygon([(88, 72), (97, 66), (88, 60), (79, 66)], fc="#fff9e6", ec=C_EDGE)); ax.text(88, 66, "¿frame\nfresco?", ha="center", va="center", fontsize=7)
    arrow(ax, (75, 68.5), (79, 66.5), "", head=False)
    ax.text(90, 57, "No → descartar /\nesperar", fontsize=7, ha="center")
    ax.add_patch(Polygon([(88, 30), (97, 24), (88, 18), (79, 24)], fc="#fff9e6", ec=C_EDGE)); ax.text(88, 24, "¿requiere\nacción?", ha="center", va="center", fontsize=7)
    arrow(ax, (75, 24), (79, 24), "", head=False)
    box(ax, 62, 6, 34, 7, "Alerta en Dashboard y\npágina de cámara", fc="#fde2e4", fs=8)
    box(ax, 4, 6, 34, 7, "Historial de detecciones\n(sin alerta)", fc=C_DB, fs=8)
    arrow(ax, (88, 18), (79, 13), "Sí", fs=7, toff=(3, 0))
    arrow(ax, (50, 20.5), (21, 13), "No", fs=7, toff=(-3, 0))
    ax.add_patch(Circle((50, 3.5), 1.8, fc="white", ec=C_EDGE, lw=1.5)); ax.add_patch(Circle((50, 3.5), 1.1, fc=C_EDGE))
    arrow(ax, (38, 6), (48.5, 3.8), head=True); arrow(ax, (62, 6), (51.5, 3.8), head=True)
    box(ax, 4, 45, 18, 6, "Rechazado\n(no es JPEG)", fc="#fde2e4", fs=7.5)
    arrow(ax, (25, 84), (13, 51), "validación\nisJpeg()", fs=6.5, dashed=True, toff=(-6, 0))
    save(fig, "estados.png")

# ----------------------------------------------------------------- clases
def clase(ax, x, y, w, name, attrs, meths, fc="white"):
    ah = 3.3 * len(attrs) + 1.5; mh = 3.3 * len(meths) + 1.5 if meths else 0.8
    ax.add_patch(Rectangle((x, y - 6 - ah - mh), w, 6 + ah + mh, fc=fc, ec=C_EDGE, lw=1.1))
    ax.text(x + w / 2, y - 3, name, ha="center", va="center", fontsize=8.5, fontweight="bold")
    ax.plot([x, x + w], [y - 6, y - 6], color=C_EDGE, lw=1)
    for i, a in enumerate(attrs): ax.text(x + 1, y - 8.2 - 3.3 * i, a, fontsize=6.6, va="center")
    ax.plot([x, x + w], [y - 6 - ah, y - 6 - ah], color=C_EDGE, lw=1)
    for i, m in enumerate(meths): ax.text(x + 1, y - 8.2 - ah - 3.3 * i, m, fontsize=6.6, va="center")
    return (x, y, w, 6 + ah + mh)

def clases():
    fig, ax = fig_ax(11, 9)
    ax.text(50, 99.2, "Diagrama de clases (modelo de datos de Agroplaga AI)", ha="center", va="top", fontsize=11, fontweight="bold")
    clase(ax, 2, 94, 22, "Parcela", ["id, nombre, ubicacion", "cultivo, superficie", "fecha_siembra, imagen"], ["registrar()", "actualizar()"])
    clase(ax, 2, 62, 22, "Actividad", ["id, actividad, fecha", "observaciones, imagen", "parcela_id"], ["registrar()", "exportarCSV()"])
    clase(ax, 2, 32, 22, "Plaga", ["id, nombre", "nombre_cientifico", "sintomas, tratamiento", "imagen"], ["consultarFicha()"])
    clase(ax, 30, 94, 22, "Plot (parcela de\nsensores)", ["id, name"], ["ultimasLecturas()"])
    clase(ax, 30, 66, 22, "TipoSensor", ["id, key, name, unit", "(temperature, humidity)"], [])
    clase(ax, 30, 44, 22, "LecturaSensor", ["id, plot_id", "sensor_type_id", "value, unit, created_at"], ["registrar()"])
    clase(ax, 30, 18, 22, "Umbral", ["plot_id, sensor_type_id", "min_value, max_value"], ["evaluar(valor)"])
    clase(ax, 58, 94, 22, "Alerta", ["id, plot_id", "sensor_type_id", "current_value, status"], ["abrir()", "cerrar()"])
    clase(ax, 58, 62, 22, "Camara", ["id, nombre, base_url", "modo (pull/push), activa", "intervalo_analisis_seg", "token, parcela_id, plot_id"], ["stream()", "snapshot()", "analizar()"])
    clase(ax, 58, 24, 22, "Deteccion", ["id, camara_id, plot_id", "imagen, plaga, confianza", "severidad, resumen", "recomendaciones", "requiere_accion, origen"], ["serializar()"])
    clase(ax, 82, 94, 16, "NodoESP32CAM\n«hardware»", ["ip, token", "dht22: GPIO13"], ["enviarFrame()", "enviarLectura()"], fc=C_HW)
    clase(ax, 82, 60, 16, "ServicioVision\n«OpenAI»", ["modelo"], ["diagnosticar(img)"], fc=C_AI)
    clase(ax, 82, 36, 16, "Scheduler", ["tickMs, minIntervalo"], ["tick()", "reload()"], fc=C_BOX)
    # relaciones (etiquetas colocadas en espacios libres)
    arrow(ax, (13, 63), (13, 71), "", head=False); ax.text(14.5, 67, "1..* registra", fontsize=6.5, va="center")
    arrow(ax, (41, 67), (41, 74), "", head=False); ax.text(42.5, 70.5, "1..*", fontsize=6.5, va="center")
    arrow(ax, (41, 45), (41, 51), "", head=False); ax.text(42.5, 48, "1..*", fontsize=6.5, va="center")
    arrow(ax, (41, 18), (41, 21.8), "", head=False); ax.text(42.5, 19.9, "1 umbral por sensor", fontsize=6.5, va="center")
    arrow(ax, (52, 84), (58, 84), "", head=False); ax.text(55, 85.5, "genera", fontsize=6.5, ha="center")
    arrow(ax, (69, 63), (69, 71), "", head=False); ax.text(70.5, 67, "1..* produce", fontsize=6.5, va="center")
    arrow(ax, (24, 84), (30, 84), "", head=False, dashed=True); ax.text(27, 85.5, "asociada", fontsize=6.5, ha="center")
    ax.plot([24, 58], [49.5, 49.5], color=C_EDGE, lw=0.9, linestyle="--"); ax.text(50, 50.3, "parcela_id", fontsize=6.5, ha="center", va="bottom")
    arrow(ax, (90, 71.8), (80, 62), "", dashed=True); ax.text(88, 69.3, "pull / push (frames)", fontsize=6.5, ha="center", va="top")
    ax.plot([90, 90, 41], [71.8, 96.6, 96.6], color=C_EDGE, lw=0.9, linestyle="--"); arrow(ax, (41, 96.6), (41, 94), "", dashed=True)
    ax.text(66, 95.3, "POST /api/readings (lecturas del DHT22)", fontsize=6.5, ha="center", va="center", bbox=dict(fc="white", ec="none", pad=0.3))
    arrow(ax, (90, 36), (90, 44.4), "", dashed=True); ax.text(91.5, 40, "usa", fontsize=6.5, va="center")
    arrow(ax, (82, 30), (80, 40), "", head=True); ax.text(69, 27.3, "analiza cada N s", fontsize=6.5, ha="center", va="center")
    save(fig, "clases.png")

# ----------------------------------------------------------------- arquitectura
def arquitectura():
    fig, ax = fig_ax(11.5, 7.2)
    ax.text(50, 96, "Arquitectura del sistema Agroplaga AI", ha="center", fontsize=12, fontweight="bold")
    # nodo de campo
    ax.add_patch(FancyBboxPatch((2, 30), 26, 60, boxstyle="round,pad=0.02,rounding_size=1.5", fc="#fff7ec", ec="#e67e22", lw=1.4))
    ax.text(15, 87.5, "Nodo de campo (parcela)", ha="center", fontsize=9, fontweight="bold", color="#b9770e")
    box(ax, 5, 74, 20, 9, "Panel solar 6 V", fc=C_SOL, fs=8)
    box(ax, 5, 62, 20, 9, "TP4056 + batería 18650\n+ elevador 5 V", fc=C_SOL, fs=7.5)
    box(ax, 5, 46, 20, 11, "ESP32-CAM\n(OV2640, Wi-Fi)", fc=C_HW, fs=8.5, bold=True)
    box(ax, 5, 33, 20, 9, "DHT22\ntemperatura / humedad", fc=C_HW, fs=7.5)
    arrow(ax, (15, 74), (15, 71)); arrow(ax, (15, 62), (15, 57)); arrow(ax, (15, 42), (15, 46), "GPIO 13", fs=6.5, toff=(6, -1))
    # backend
    ax.add_patch(FancyBboxPatch((36, 20), 34, 70, boxstyle="round,pad=0.02,rounding_size=1.5", fc="#f4f6f7", ec=C_EDGE, lw=1.2))
    ax.text(53, 87.5, "Servidor (Node.js + Express)", ha="center", fontsize=9, fontweight="bold")
    box(ax, 39, 74, 28, 9, "API REST /api/*\nparcelas · plagas · actividades", fs=7.5)
    box(ax, 39, 61, 28, 9, "Lecturas y alertas\n/api/readings · umbrales", fs=7.5)
    box(ax, 39, 47, 28, 10, "FrameHub + relay MJPEG\n/api/camaras/:id/stream", fs=7.5, fc=C_WEB)
    box(ax, 39, 34, 28, 9, "Análisis IA + scheduler\n/api/camaras/:id/analizar", fs=7.5, fc=C_AI)
    box(ax, 39, 23, 28, 8, "MySQL (agroplaga_v2)", fs=8, fc=C_DB, bold=True)
    # externos
    box(ax, 78, 60, 20, 10, "OpenAI\n(modelo de visión)", fc=C_AI, fs=8, bold=True)
    box(ax, 78, 30, 20, 12, "Navegador web\nReact + Vite\n(agricultor / técnico)", fc=C_WEB, fs=8, bold=True)
    # flechas nodo -> servidor
    arrow(ax, (25, 53), (39, 53), "", fs=6.5)
    ax.text(32, 55, "GET :81/stream\n(MJPEG)", fontsize=6.5, ha="center", va="bottom")
    arrow(ax, (25, 50), (39, 64), "", fs=6.5, cs="arc3,rad=0.25")
    ax.text(30, 44, "POST /api/readings\n(temperatura, humedad)", fontsize=6.5, ha="center", va="top")
    # servidor -> OpenAI
    arrow(ax, (67, 41), (78, 63), "", cs="arc3,rad=-0.25")
    arrow(ax, (78, 61), (67, 37), "", dashed=True, cs="arc3,rad=-0.25")
    ax.text(74, 52, "imagen + contexto\n← JSON diagnóstico", fontsize=6.5, ha="center", va="center", bbox=dict(fc="white", ec="none", pad=0.4))
    # servidor <-> navegador
    arrow(ax, (67, 78), (78, 40), "", cs="arc3,rad=0.25")
    ax.text(85, 47, "fetch /api/*\nJSON", fontsize=6.5, ha="center", va="center", bbox=dict(fc="white", ec="none", pad=0.4))
    arrow(ax, (67, 50), (78, 33), "", cs="arc3,rad=-0.05")
    ax.text(70.5, 44.5, "MJPEG en <img>", fontsize=6.5, ha="left", va="center", bbox=dict(fc="white", ec="none", pad=0.4))
    # modulos -> MySQL (flechas verticales limpias en el borde izquierdo del servidor)
    for y0 in (74, 61, 34):
        ax.plot([38, 38], [y0 + 4, 27], color=C_EDGE, lw=0.9)
    arrow(ax, (38, 27), (39, 27))
    ax.text(15, 24, "Wi-Fi 2.4 GHz", ha="center", fontsize=7.5, style="italic")
    save(fig, "arquitectura.png")

# ----------------------------------------------------------------- componentes
def componentes():
    fig, ax = fig_ax(11.5, 6.8)
    ax.text(50, 96, "Diagrama de componentes de Agroplaga AI", ha="center", fontsize=12, fontweight="bold")
    def comp(x, y, w, h, t, fc=C_BOX, fs=8):
        box(ax, x, y, w, h, t, fc=fc, fs=fs, style="round,pad=0.02,rounding_size=0.8")
        ax.add_patch(Rectangle((x + 1, y + h - 3.2), 2.4, 1.2, fc="white", ec=C_EDGE, lw=0.8)); ax.add_patch(Rectangle((x + 1, y + h - 5.2), 2.4, 1.2, fc="white", ec=C_EDGE, lw=0.8))
    comp(3, 66, 24, 20, "Frontend React Web\nDashboard · Plagas · Seguimiento\nParcelas · Cámara en vivo · Chat", fc=C_WEB)
    comp(36, 66, 28, 20, "Backend API (Express)\nserver.js · rutas de negocio\nsrc/camaras/routes.js", fc=C_BOX)
    comp(36, 38, 28, 18, "Módulo de cámaras\nframeHub · mjpeg · upstream\nregistry · scheduler", fc=C_WEB)
    comp(36, 12, 28, 16, "Módulo de IA\nsrc/ai/vision.js · openai.js\n(diagnóstico JSON)", fc=C_AI)
    comp(72, 66, 25, 20, "MySQL\nplots · sensor_readings · alerts\nparcelas · plagas · actividades\ncamaras · detecciones", fc=C_DB, fs=7.5)
    comp(72, 12, 25, 16, "OpenAI API\n(modelo de visión)", fc=C_AI)
    comp(3, 12, 24, 20, "Nodo ESP32-CAM + DHT22\nfirmware Arduino\n(/stream, /capture, DHT)", fc=C_HW)
    comp(3, 38, 24, 16, "Simulador de cámara\nscripts/simular-camara.js", fc="#f2f3f4")
    arrow(ax, (27, 76), (36, 76), "HTTP/JSON", fs=7, toff=(0, 1))
    arrow(ax, (64, 76), (72, 76), "SQL (Sequelize)", fs=7, toff=(0, 1))
    arrow(ax, (50, 66), (50, 56), "usa", fs=7, toff=(3, 0))
    arrow(ax, (50, 38), (50, 28), "analizar()", fs=7, toff=(5, 0))
    arrow(ax, (64, 20), (72, 20), "HTTPS", fs=7, toff=(0, 1))
    arrow(ax, (27, 22), (36, 45), "MJPEG / POST frame\nPOST /api/readings", fs=6.5, cs="arc3,rad=-0.2", toff=(-2, 1))
    arrow(ax, (27, 46), (36, 47), "MJPEG (pruebas)", fs=6.5, toff=(0, 1))
    arrow(ax, (15, 66), (15, 54), "", head=False, dashed=True)
    ax.text(16, 60, "<img> stream\n/api/camaras/:id/stream", fontsize=6.5, ha="left")
    arrow(ax, (64, 47), (76, 66), "detecciones", fs=6.5, cs="arc3,rad=0.2", toff=(4, 0))
    save(fig, "componentes.png")

# ----------------------------------------------------------------- hardware
def hardware():
    fig, ax = fig_ax(10.5, 5.8)
    ax.text(50, 95, "Esquema de conexión del nodo de campo con punto de carga solar", ha="center", fontsize=11, fontweight="bold")
    box(ax, 3, 62, 18, 16, "Panel solar\n6 V · 5 W", fc=C_SOL, fs=8.5, bold=True)
    box(ax, 27, 62, 18, 16, "Módulo de carga\nTP4056\n(con protección)", fc=C_SOL, fs=8)
    box(ax, 27, 30, 18, 14, "Batería Li-ion\n18650 · 3.7 V\n3000 mAh", fc=C_SOL, fs=8)
    box(ax, 51, 62, 18, 16, "Elevador (boost)\nMT3608\n3.7 V → 5 V", fc=C_SOL, fs=8)
    box(ax, 75, 52, 22, 32, "ESP32-CAM\n(AI-Thinker)\n\n5V   GND\n3V3\nGPIO 13", fc=C_HW, fs=8.5, bold=True)
    box(ax, 51, 18, 18, 18, "DHT22\nVCC · DATA · GND", fc=C_HW, fs=8.5, bold=True)
    arrow(ax, (21, 70), (27, 70), "IN+ / IN−", fs=7)
    arrow(ax, (36, 62), (36, 44), "B+ / B−", fs=7, toff=(6, 0), head=True)
    arrow(ax, (36, 44), (36, 62), head=True)
    arrow(ax, (45, 66), (51, 66), "OUT+ / OUT−", fs=7, toff=(0, 1))
    arrow(ax, (69, 70), (75, 72), "5 V / GND", fs=7, toff=(0, 1))
    arrow(ax, (69, 27), (75, 60), "DATA → GPIO 13", fs=7, cs="arc3,rad=-0.3", toff=(6, 0))
    arrow(ax, (75, 56), (69, 30), "3V3 / GND", fs=7, dashed=True, cs="arc3,rad=-0.3", toff=(8, -4))
    ax.text(60, 10, "Resistencia pull-up de 10 kΩ entre DATA y 3V3", fontsize=7.5, ha="center", style="italic")
    ax.text(12, 50, "Consumo típico:\nESP32-CAM 180–300 mA (video)\nDHT22 < 2 mA", fontsize=7, ha="center", bbox=dict(fc="white", ec="#bdc3c7"))
    ax.text(12, 25, "Autonomía estimada:\n~10 h nocturnas con 3000 mAh\n(video bajo demanda)", fontsize=7, ha="center", bbox=dict(fc="white", ec="#bdc3c7"))
    save(fig, "hardware.png")

# ----------------------------------------------------------------- codigo (PIL)
def code_image(name, path, start, end, title):
    lines = open(path, encoding="utf-8").read().splitlines()[start - 1:end]
    try:
        font = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 17); fb = ImageFont.truetype(r"C:\Windows\Fonts\consolab.ttf", 17)
    except Exception:
        font = ImageFont.load_default(); fb = font
    lh = 24; W = 1180; H = lh * (len(lines) + 3) + 20
    img = Image.new("RGB", (W, H), (30, 30, 30)); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 34], fill=(45, 45, 48)); d.text((14, 8), title, font=fb, fill=(220, 220, 220))
    y = 46
    for i, ln in enumerate(lines, start=start):
        d.text((12, y), f"{i:4d}", font=font, fill=(110, 110, 110))
        col = (212, 212, 212)
        s = ln.rstrip()
        if s.strip().startswith("//") or s.strip().startswith("/*") or s.strip().startswith("*"): col = (106, 153, 85)
        d.text((70, y), s[:118], font=font, fill=col)
        y += lh
    img.save(os.path.join(OUT, name)); print("ok", name)

def text_image(name, text, title, width=1180):
    try:
        font = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 16); fb = ImageFont.truetype(r"C:\Windows\Fonts\consolab.ttf", 17)
    except Exception:
        font = ImageFont.load_default(); fb = font
    lines = text.splitlines(); lh = 22; H = lh * (len(lines) + 3) + 20
    img = Image.new("RGB", (width, H), (30, 30, 30)); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, width, 34], fill=(45, 45, 48)); d.text((14, 8), title, font=fb, fill=(220, 220, 220))
    y = 46
    for ln in lines:
        col = (212, 212, 212)
        if "PASS" in ln or "√" in ln or "✓" in ln: col = (120, 200, 120)
        if "Tests:" in ln or "Test Suites:" in ln: col = (255, 220, 120)
        d.text((14, y), ln[:135], font=font, fill=col); y += lh
    img.save(os.path.join(OUT, name)); print("ok", name)

if __name__ == "__main__":
    casos_uso(); secuencias(); estados(); clases(); arquitectura(); componentes(); hardware()
    FW = os.path.join(ROOT, "firmware", "esp32cam", "esp32cam_agroplaga.ino")
    src = open(FW, encoding="utf-8").read().splitlines()
    def find(s):
        return next(i for i, l in enumerate(src, start=1) if s in l)
    a = find("bool sendReading("); code_image("cod_firmware_dht.png", FW, a, a + 30, "firmware/esp32cam/esp32cam_agroplaga.ino — lectura del DHT22 y envío a /api/readings")
    b = find("static esp_err_t streamHandler"); code_image("cod_firmware_stream.png", FW, b, b + 26, "firmware/esp32cam/esp32cam_agroplaga.ino — servidor MJPEG /stream")
    MJ = os.path.join(ROOT, "PGAPAYBABACK", "src", "camaras", "mjpeg.js")
    ms = open(MJ, encoding="utf-8").read().splitlines(); c = next(i for i, l in enumerate(ms, start=1) if "function push(chunk)" in l)
    code_image("cod_mjpeg.png", MJ, c, c + 34, "src/camaras/mjpeg.js — parser incremental de frames JPEG (SOI/EOI)")
    RT = os.path.join(ROOT, "PGAPAYBABACK", "src", "camaras", "routes.js")
    rs = open(RT, encoding="utf-8").read().splitlines(); r = next(i for i, l in enumerate(rs, start=1) if '"/api/camaras/:id/stream"' in l)
    code_image("cod_stream_route.png", RT, r, r + 40, "src/camaras/routes.js — relay MJPEG a los navegadores (multipart/x-mixed-replace)")
    VS = os.path.join(ROOT, "PGAPAYBABACK", "src", "ai", "vision.js")
    vs = open(VS, encoding="utf-8").read().splitlines(); v = next(i for i, l in enumerate(vs, start=1) if "export function buildVisionPrompt" in l)
    code_image("cod_vision_prompt.png", VS, v, v + 24, "src/ai/vision.js — prompt estructurado para el modelo de visión")
    SC = os.path.join(ROOT, "PGAPAYBABACK", "src", "camaras", "scheduler.js")
    ss = open(SC, encoding="utf-8").read().splitlines(); s = next(i for i, l in enumerate(ss, start=1) if "async function tick()" in l)
    code_image("cod_scheduler.png", SC, s, s + 30, "src/camaras/scheduler.js — análisis automático con intervalo mínimo y frame fresco")
    # salida de jest (se pasa por archivo)
    jest = os.path.join(OUT, "jest_output.txt")
    if os.path.exists(jest):
        t = open(jest, encoding="utf-8", errors="ignore").read()
        t = re.sub(r"\x1b\[[0-9;]*m", "", t)
        keep = [l for l in t.splitlines() if l.strip() and not l.startswith("(node") and "ExperimentalWarning" not in l and "trace-warnings" not in l and "baseline" not in l]
        text_image("pruebas_jest.png", "\n".join(keep[-60:]), "npm test — suite automatizada del backend (jest + supertest + nock)")
