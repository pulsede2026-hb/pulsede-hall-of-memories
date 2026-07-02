#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const moduleRoot = path.resolve(import.meta.dirname, "..");
const projectRoot = path.resolve(moduleRoot, "..");
const generator = path.join(import.meta.dirname, "song-upgrade.mjs");
const host = "127.0.0.1";
const port = Number(process.env.PULSEDE_PORT || 8766);
const maxBody = 40 * 1024 * 1024;
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".png":"image/png", ".txt":"text/plain; charset=utf-8" };

function send(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}
function runGenerator(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [generator, ...args], { cwd: projectRoot, windowsHide: true });
    let stdout = "", stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr.trim().replace(/^FEHLER:\s*/, "") || `Generator beendet mit Code ${code}.`)));
  });
}
async function readJson(request) {
  const chunks = []; let size = 0;
  for await (const chunk of request) { size += chunk.length; if (size > maxBody) throw new Error("Songpaket ist für die lokale Übertragung zu groß."); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function decodeFile(file, kind) {
  if (!file || typeof file.name !== "string" || typeof file.data !== "string") throw new Error(`${kind.toUpperCase()} fehlt.`);
  const ext = path.extname(file.name).toLowerCase();
  const allowed = { mp3:[".mp3"], jpg:[".jpg", ".jpeg"], txt:[".txt"] }[kind];
  if (!allowed.includes(ext)) throw new Error(`${kind.toUpperCase()} besitzt eine unzulässige Dateiendung.`);
  const data = Buffer.from(file.data, "base64");
  if (!data.length) throw new Error(`${kind.toUpperCase()} ist leer.`);
  return { ext, data };
}
async function generate(payload) {
  const hm = Array.isArray(payload.hm) ? payload.hm.map(String) : [];
  if (!hm.length || hm.some(value => !/^0[1-6]$/.test(value))) throw new Error("Mindestens ein gültiger HM-Bereich muss bestätigt sein.");
  if (typeof payload.featured !== "boolean") throw new Error("Sternsong muss mit Ja oder Nein bestätigt sein.");
  const files = { mp3:decodeFile(payload.files?.mp3, "mp3"), jpg:decodeFile(payload.files?.jpg, "jpg"), txt:decodeFile(payload.files?.txt, "txt") };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pulsede-v2-"));
  try {
    for (const [kind, file] of Object.entries(files)) fs.writeFileSync(path.join(temp, `${kind}${file.ext}`), file.data, { flag: "wx" });
    const output = await runGenerator(["--root", projectRoot, "--input", temp, "--title", String(payload.title || ""), "--hm", hm.join(","), "--featured", payload.featured ? "ja" : "nein", "--json"]);
    return JSON.parse(output);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
function staticFile(urlPath, response) {
  let relative = decodeURIComponent(urlPath.slice(1));
  if (relative.endsWith("/")) relative += "index.html";
  const target = path.resolve(projectRoot, relative);
  if (target !== projectRoot && !target.startsWith(projectRoot + path.sep)) return send(response, 403, { error:"Unzulässiger Pfad." });
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return send(response, 404, { error:"Datei nicht gefunden." });
  const type = mime[path.extname(target).toLowerCase()] || "application/octet-stream";
  response.writeHead(200, { "Content-Type":type, "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" });
  fs.createReadStream(target).pipe(response);
}

const server = http.createServer(async (request, response) => {
  try {
    const allowedHosts = new Set([`${host}:${port}`, `localhost:${port}`]);
    if (!allowedHosts.has(String(request.headers.host || "").toLowerCase())) return send(response, 403, { error:"Unzulässiger Host." });
    const origin = request.headers.origin;
    if (origin && ![`http://${host}:${port}`, `http://localhost:${port}`].includes(origin)) return send(response, 403, { error:"Unzulässiger Ursprung." });
    const url = new URL(request.url, `http://${host}:${port}`);
    if (request.method === "GET" && url.pathname === "/") { response.writeHead(302, { Location:"/Song_Upgrade_V1C/" }); response.end(); return; }
    if (request.method === "GET" && url.pathname === "/api/status") {
      const status = JSON.parse(await runGenerator(["--root", projectRoot, "--inspect"]));
      return send(response, 200, status);
    }
    if (request.method === "POST" && url.pathname === "/api/generate") return send(response, 200, await generate(await readJson(request)));
    if (request.method === "POST" && url.pathname === "/api/reserve") {
      const payload = await readJson(request);
      if (payload.localTested !== true) throw new Error("Die Reservierung benötigt die ausdrückliche Bestätigung des erfolgreichen Lokaltests.");
      const runName = String(payload.runName || "");
      if (!/^song-\d{2,4}-[a-z0-9-]+$/.test(runName)) throw new Error("Ungültiger Laufname.");
      const output = await runGenerator(["--root", projectRoot, "--reserve-run", path.join(moduleRoot, "runs", runName)]);
      return send(response, 200, JSON.parse(output));
    }
    if (request.method === "POST" && url.pathname === "/api/workflow") {
      const payload = await readJson(request); const fields = { "approve-stem":"stemApproved", "approve-github":"githubApproved" };
      const field = fields[payload.action]; if (!field) throw new Error("Unzulässige Freigabeaktion.");
      const output = await runGenerator(["--workflow-number", String(payload.number), "--workflow-field", field]);
      return send(response, 200, JSON.parse(output));
    }
    if (request.method === "GET") return staticFile(url.pathname, response);
    send(response, 405, { error:"Methode nicht erlaubt." });
  } catch (error) { send(response, 400, { error:error.message || "Unbekannter Fehler." }); }
});
server.listen(port, host, () => console.log(`Song-Leitzentrale V2: http://${host}:${port}/`));
