// Levanta simulador + backend + frontend y captura pantallas con Edge headless.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = "C:\\Users\\cesar\\Desktop\\Proyecto de graduacion\\ProyectoGaduacionAP";
const BE = path.join(ROOT, "PGAPAYBABACK");
const FE = path.join(ROOT, "agroplaga-web");
const OUT = process.argv[2];
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function start(cmd, args, cwd, extraEnv = {}) {
  const p = spawn(cmd, args, { cwd, env: { ...process.env, ...extraEnv }, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
  let log = ""; p.stdout.on("data", (d) => (log += d)); p.stderr.on("data", (d) => (log += d));
  return { p, log: () => log };
}
async function waitFor(url, tries = 40) {
  for (let i = 0; i < tries; i++) { try { const r = await fetch(url); if (r.ok) return true; } catch {} await sleep(1000); }
  return false;
}

const simArgs = ["scripts/simular-camara.js", "--port", "8081", "--fps", "5"];
if (process.env.SIM_DIR) simArgs.push("--dir", process.env.SIM_DIR);
const sim = start("node", simArgs, BE);
await sleep(800);
const be = start("node", ["server.js"], BE, { CAMERA_SCHEDULER: "off" });
const fe = start("npx", ["vite", "--host", "127.0.0.1", "--port", "5173", "--strictPort"], FE);
console.log("backend:", await waitFor("http://localhost:4000/api/plots"));
console.log("frontend:", await waitFor("http://127.0.0.1:5173/"));
console.log("simulador:", sim.log().split("\n").filter((l) => l.includes("frames") || l.includes("respaldo")).join(" | "));
const PROFILE = path.join(OUT, "..", "edge-profile");
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
// abrir el stream una vez para que la camara 1 quede "online" antes de la captura
try { const ac = new AbortController(); setTimeout(() => ac.abort(), 2500); await fetch("http://localhost:4000/api/camaras/1/stream", { signal: ac.signal }); } catch {}
await sleep(1500);
if (process.env.ANALIZAR === "1") {
  // Un analisis real con OpenAI sobre el frame actual (imagen de plaga) para tener una deteccion en pantalla
  const r = await fetch("http://localhost:4000/api/camaras/1/analizar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nota: "Revisar hojas y brotes del melocotonero" }) });
  const j = await r.json().catch(() => ({}));
  console.log("analizar:", r.status, j.plaga, j.severidad, j.confianza);
}

const pages = [
  ["dashboard", "/", 1280, 1320],
  ["camara", "/camara", 1280, 2050],
  ["plagas", "/plagas", 1280, 900],
  ["seguimiento", "/seguimiento", 1280, 1100],
  ["parcelas", "/parcelas", 1280, 1000],
  ["chat", "/chat", 1280, 850],
];
for (const [name, route, w, h] of pages) {
  if (ONLY && !ONLY.includes(name)) continue;
  const file0 = path.join(OUT, `ui_${name}.png`);
  if (fs.existsSync(file0)) fs.unlinkSync(file0);
  // mantener el stream abierto mientras se captura /camara para que el badge diga "En línea"
  let keep = null;
  if (name === "camara") { keep = new AbortController(); fetch("http://localhost:4000/api/camaras/1/stream", { signal: keep.signal }).catch(() => {}); await sleep(1200); }
  const file = path.join(OUT, `ui_${name}.png`);
  const r = spawnSync(EDGE, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${PROFILE}`,
    `--window-size=${w},${h}`, "--virtual-time-budget=9000", `--screenshot=${file}`, `http://127.0.0.1:5173${route}`,
  ], { timeout: 90000 });
  if (keep) keep.abort();
  let ok = fs.existsSync(file);
  if (!ok) {
    // reintento unico (Edge headless a veces falla al arrancar)
    await sleep(2000);
    spawnSync(EDGE, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--user-data-dir=${PROFILE}`,
      `--window-size=${w},${h}`, "--virtual-time-budget=9000", `--screenshot=${file}`, `http://127.0.0.1:5173${route}`], { timeout: 90000 });
    ok = fs.existsSync(file);
  }
  console.log(name, ok ? `${Math.round(fs.statSync(file).size / 1024)} KB` : `FALLO ${r.status} ${String(r.stderr).slice(0, 200)}`);
}
be.p.kill(); sim.p.kill(); fe.p.kill();
spawnSync("taskkill", ["/F", "/T", "/PID", String(fe.p.pid)], { stdio: "ignore" });
spawnSync("taskkill", ["/F", "/T", "/PID", String(be.p.pid)], { stdio: "ignore" });
spawnSync("taskkill", ["/F", "/T", "/PID", String(sim.p.pid)], { stdio: "ignore" });
console.log("--- backend log ---\n" + be.log().split("\n").slice(-5).join("\n"));
process.exit(0);
