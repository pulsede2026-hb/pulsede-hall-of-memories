#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT_FILES = [
  "PulseDE_Home_A1_TESTRAHMEN_V4.html",
  "PulseDE_HM_PLAYER_LINKS_A1_V4.html",
  "PulseDE_HM_EXPLORER_TEST_V1.html",
  "PulseDE_HM_SONGTEXT_RECHTS_A1_V4.html"
];
const DEFAULT_RESERVATIONS = path.resolve(import.meta.dirname, "..", "data", "reservations.json");

function fail(message) { throw new Error(message); }
function normalize(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de").replace(/[^a-z0-9]+/g, " ").trim();
}
function safeTitle(value) {
  const clean = String(value || "").trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").replace(/[. ]+$/g, "");
  if (!clean) fail("Der Songtitel ist leer oder als Windows-Dateiname unzulässig.");
  return clean;
}
function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) fail(`Unbekanntes Argument: ${arg}`);
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) result[key] = true;
    else { result[key] = next; i += 1; }
  }
  return result;
}
function findPackageFiles(inputDir) {
  if (!fs.existsSync(inputDir)) fail(`Eingabeordner fehlt: ${inputDir}`);
  const files = fs.readdirSync(inputDir, { withFileTypes: true }).filter(x => x.isFile()).map(x => x.name);
  const take = exts => files.filter(name => exts.includes(path.extname(name).toLowerCase()));
  const groups = { mp3: take([".mp3"]), jpg: take([".jpg", ".jpeg"]), txt: take([".txt"]) };
  for (const [kind, names] of Object.entries(groups)) {
    if (names.length !== 1) fail(`Eingabe benötigt genau eine ${kind.toUpperCase()}-Datei; gefunden: ${names.length}.`);
    if (fs.statSync(path.join(inputDir, names[0])).size === 0) fail(`${names[0]} ist leer.`);
  }
  return Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, path.join(inputDir, v[0])]));
}
function loadReservations(file = DEFAULT_RESERVATIONS) {
  if (!fs.existsSync(file)) return { version: 1, reservations: [] };
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(data.reservations)) fail("Reservierungsdatei ist ungültig.");
  return data;
}
function saveReservations(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.renameSync(temp, file);
}
function collectUsedNumbers(root, catalog, reservations = []) {
  const evidence = new Map();
  const add = (number, source) => {
    const value = Number(number);
    if (!Number.isSafeInteger(value) || value < 1) return;
    if (!evidence.has(value)) evidence.set(value, new Set());
    evidence.get(value).add(source);
  };
  for (const song of catalog.songs) {
    add(song.number, `Katalogeintrag ${song.id}`);
    for (const file of Object.values(song.files || {})) {
      const match = path.basename(file).match(/^(\d{1,4})[_ ]/);
      if (match) add(match[1], `Katalogdatei ${file}`);
    }
  }
  for (const reservation of reservations) {
    if (reservation.reserved && !reservation.released) add(reservation.number, `Reservierung ${reservation.title || reservation.runName || "ohne Titel"}`);
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(mp3|jpe?g|txt)$/i.test(entry.name)) continue;
    const match = entry.name.match(/^(\d{1,4})[_ ]/);
    if (match) add(match[1], `Projektdatei ${entry.name}`);
  }
  for (const name of ROOT_FILES) {
    const html = fs.readFileSync(path.join(root, name), "utf8");
    const filePattern = /["'](?:[^"']*\/)?(\d{1,4})[_ ][^"']+\.(?:mp3|jpe?g|txt)["']/gi;
    let match;
    while ((match = filePattern.exec(html)) !== null) add(match[1], `${name}: Mediendatei`);
    if (name.includes("EXPLORER")) {
      const labelPattern = /data-song-index="\d+"[^>]*>\s*(\d{1,4})\s+/gi;
      while ((match = labelPattern.exec(html)) !== null) add(match[1], `${name}: Explorer-Label`);
    }
  }
  return evidence;
}
function proposeNextNumber(usedNumbers, bridgeNumber = 59) {
  for (let number = 1; number <= bridgeNumber; number += 1) if (!usedNumbers.has(number)) return number;
  let number = bridgeNumber + 1;
  while (usedNumbers.has(number)) number += 1;
  return number;
}
function loadBaseline(root, reservationFile = DEFAULT_RESERVATIONS) {
  const catalogPath = path.join(root, "v1b", "data", "catalog.json");
  if (!fs.existsSync(catalogPath)) fail(`Katalog fehlt: ${catalogPath}`);
  for (const name of ROOT_FILES) if (!fs.existsSync(path.join(root, name))) fail(`Baseline-Datei fehlt: ${name}`);
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  if (!Array.isArray(catalog.songs) || !Array.isArray(catalog.categories)) fail("Katalogstruktur ist ungültig.");
  const numbers = catalog.songs.map(song => Number(song.number));
  const indices = catalog.songs.map(song => Number(song.playlistIndex));
  if (new Set(numbers).size !== numbers.length) fail("Baseline enthält doppelte Songnummern.");
  if (new Set(indices).size !== indices.length) fail("Baseline enthält doppelte Playlist-Indizes.");
  const reservationData = loadReservations(reservationFile);
  const numberEvidence = collectUsedNumbers(root, catalog, reservationData.reservations);
  return { catalog, catalogPath, reservationData, reservationFile, numberEvidence, nextNumber: proposeNextNumber(numberEvidence), nextIndex: Math.max(...indices) + 1 };
}
function collisionsFor({ root, catalog, title, number, targetNames }) {
  const collisions = [];
  const wanted = normalize(title);
  for (const song of catalog.songs) {
    if (normalize(song.title) === wanted) collisions.push(`Titel bereits im Katalog: ${song.number} ${song.title}`);
    if (Number(song.number) === number) collisions.push(`Songnummer bereits im Katalog: ${number}`);
    for (const name of Object.values(song.files || {})) {
      if (Object.values(targetNames).includes(path.basename(name))) collisions.push(`Dateiname bereits im Katalog: ${name}`);
    }
  }
  const lower = new Set(fs.readdirSync(root).map(name => name.toLocaleLowerCase("de")));
  for (const name of Object.values(targetNames)) if (lower.has(name.toLocaleLowerCase("de"))) collisions.push(`Datei bereits im Projekt: ${name}`);
  return [...new Set(collisions)];
}
function copyFile(source, target) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(source, target); }
function copyTree(source, target) { fs.cpSync(source, target, { recursive: true, force: false, errorOnExist: true }); }
function addBase(html, href) { return href ? html.replace(/<head>\s*/i, match => `${match}<base href="${href}">\n`) : html; }
function updateTestHome(source) {
  let html = source;
  for (const file of ROOT_FILES.slice(1)) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const frameSource = new RegExp(`src=(['"])[^'"]*${escaped}\\1`, "i");
    if (!frameSource.test(html)) fail(`Testseiten-Verknüpfung nicht erkannt: ${file}`);
    html = html.replace(frameSource, `src="${file}"`);
  }
  return html;
}
function appendArrayEntry(html, variable, value) {
  const rx = new RegExp(`(const\\s+${variable}\\s*=\\s*\\[[\\s\\S]*?)(\\n\\s*\\];)`);
  if (!rx.test(html)) fail(`HTML-Struktur nicht erkannt: Array ${variable}`);
  return html.replace(rx, (_, body, end) => `${body.replace(/,?\s*$/, "")},\n    ${JSON.stringify(value)}${end}`);
}
function appendSetEntry(html, variable, value) {
  const rx = new RegExp(`(const\\s+${variable}\\s*=\\s*new Set\\(\\[[\\s\\S]*?)(\\n\\s*\\]\\);)`);
  if (!rx.test(html)) fail(`HTML-Struktur nicht erkannt: Set ${variable}`);
  return html.replace(rx, (_, body, end) => `${body.replace(/,?\s*$/, "")},\n    ${JSON.stringify(value)}${end}`);
}
function updatePlayer(source, { baseHref, audio, cover, featured }) {
  let html = addBase(source, baseHref);
  html = appendArrayEntry(html, "playlist", audio);
  html = appendArrayEntry(html, "covers", cover);
  if (featured) html = appendSetEntry(html, "starSongFiles", audio);
  html = html.replace('return songFile.replace(".mp3", "").replaceAll("_", " ");', 'return decodeURIComponent(songFile.split("/").pop()).replace(".mp3", "").replaceAll("_", " ");');
  html = html.replace('const txtFile = songFile.replace(".mp3", ".txt");', 'const txtFile = (source.src || songFile).replace(/\\.mp3(?:$|\\?)/i, ".txt");');
  return html;
}
function updateExplorer(source, { baseHref, number, title, index, hms, featured }) {
  let html = addBase(source, baseHref);
  const starClass = featured ? " starSong" : "";
  const star = featured ? ' <span class="starMark">★</span>' : "";
  for (const hm of hms) {
    const list = `songs${hm}`;
    const marker = new RegExp(`(<div id="${list}" class="songlist">[\\s\\S]*?)(<hr>)`);
    if (!marker.test(html)) fail(`Explorer-Bereich ${list} wurde nicht gefunden.`);
    const label = `<label class="songChoice${starClass}"><input type="checkbox" data-song-index="${index}" onchange="updateFolderSelection('${list}')"> ${String(number).padStart(2, "0")} ${title}${star}</label>\n`;
    html = html.replace(marker, (_, body, hr) => `${body}${label}${hr}`);
  }
  return html;
}
function updateLyrics(source, baseHref) {
  return addBase(source, baseHref).replace("fetch(encodeURI(currentTxtFile), {cache:\"no-store\"})", "fetch(decodeURI(currentTxtFile), {cache:\"no-store\"})");
}
function updateCatalog(catalog, { id, index, number, title, featured, hms, mediaPrefix, names, basePath }) {
  const result = structuredClone(catalog);
  result.basePath = basePath;
  result.songs.push({ id, playlistIndex: index, number: String(number).padStart(2, "0"), title, featured,
    files: { audio: mediaPrefix + names.mp3, cover: mediaPrefix + names.jpg, lyrics: mediaPrefix + names.txt } });
  for (const category of result.categories) if (hms.includes(category.number)) category.songIds.push(id);
  return result;
}
function hash(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").toUpperCase(); }
function manifest(root) {
  const output = [];
  const walk = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else output.push({ file: path.relative(root, p).replaceAll("\\", "/"), bytes: fs.statSync(p).size, sha256: hash(p) }); } };
  walk(root); return output;
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const reservationFile = path.resolve(args["reservation-file"] || DEFAULT_RESERVATIONS);
  if (args["refresh-manifest"]) {
    const folder = path.resolve(String(args["refresh-manifest"]));
    if (!fs.existsSync(folder)) fail(`Laufordner fehlt: ${folder}`);
    const target = path.join(folder, "DATEILISTE.json");
    const files = manifest(folder).filter(entry => entry.file !== "DATEILISTE.json");
    fs.writeFileSync(target, JSON.stringify(files, null, 2) + "\n", "utf8");
    console.log(`Dateiliste aktualisiert: ${target}`); return;
  }
  if (args.inspect) {
    const root = path.resolve(args.root || path.join(import.meta.dirname, "..", ".."));
    const baseline = loadBaseline(root, reservationFile);
    console.log(JSON.stringify({ songs: baseline.catalog.songs.length, nextNumber: baseline.nextNumber, nextIndex: baseline.nextIndex, usedNumbers: [...baseline.numberEvidence.keys()].sort((a, b) => a - b), reservations: baseline.reservationData.reservations }));
    return;
  }
  if (args["reserve-run"]) {
    const root = path.resolve(args.root || path.join(import.meta.dirname, "..", ".."));
    const run = path.resolve(String(args["reserve-run"]));
    const runsRoot = path.resolve(import.meta.dirname, "..", "runs");
    if (reservationFile === DEFAULT_RESERVATIONS && run !== runsRoot && !run.startsWith(runsRoot + path.sep)) fail("Reserviert werden dürfen nur Läufe unter Song_Upgrade_V1C/runs.");
    const reportPath = path.join(run, "integrationsbericht.json");
    if (!fs.existsSync(reportPath)) fail("Integrationsbericht des Laufs fehlt.");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    const required = [report.song?.files?.mp3, report.song?.files?.jpg, report.song?.files?.txt];
    if (required.some(name => !name || !fs.existsSync(path.join(run, "github-paket", name)))) fail("Das vorbereitete Songpaket ist unvollständig.");
    const data = loadReservations(reservationFile);
    const number = Number(report.song.number);
    const existing = data.reservations.find(item => Number(item.number) === number && item.reserved && !item.released);
    if (existing && existing.runName !== path.basename(run)) fail(`Nummer ${number} ist bereits für ${existing.title} reserviert.`);
    const entry = existing || {};
    Object.assign(entry, { number, title: report.song.title, runName: path.basename(run), hms: report.song.hms, featured: Boolean(report.song.featured), recognized: true, prepared: true, hmConfirmed: true, localTested: true, reserved: true, released: false, stemApproved: Boolean(entry.stemApproved), stemIntegrated: Boolean(entry.stemIntegrated), githubApproved: Boolean(entry.githubApproved), githubUpdated: Boolean(entry.githubUpdated), updatedAt: new Date().toISOString() });
    if (!existing) data.reservations.push(entry);
    saveReservations(reservationFile, data);
    const baseline = loadBaseline(root, reservationFile);
    console.log(JSON.stringify({ ok: true, reservation: entry, nextNumber: baseline.nextNumber }));
    return;
  }
  if (args["workflow-number"] && args["workflow-field"]) {
    const number = Number(args["workflow-number"]); const field = String(args["workflow-field"]);
    const allowed = new Set(["stemApproved", "stemIntegrated", "githubApproved", "githubUpdated"]);
    if (!allowed.has(field)) fail("Unzulässiger Workflowstatus.");
    const data = loadReservations(reservationFile); const entry = data.reservations.find(item => Number(item.number) === number && item.reserved && !item.released);
    if (!entry) fail(`Keine aktive Reservierung für Nummer ${number}.`);
    if (field === "stemIntegrated" && !entry.stemApproved) fail("Stammübernahme ist noch nicht freigegeben.");
    if (field === "githubApproved" && !entry.stemIntegrated) fail("Der Projektstamm ist noch nicht integriert.");
    if (field === "githubUpdated" && !entry.githubApproved) fail("GitHub-Übernahme ist noch nicht freigegeben.");
    entry[field] = true; entry.updatedAt = new Date().toISOString(); saveReservations(reservationFile, data);
    console.log(JSON.stringify({ ok: true, reservation: entry })); return;
  }
  if (args.help) { console.log("node tools/song-upgrade.mjs --input <Ordner> --title <Titel> --hm 01,03 --featured ja [--root <Projekt>] [--out <Ordner>] [--number 60]"); return; }
  const root = path.resolve(args.root || path.join(import.meta.dirname, "..", ".."));
  const input = path.resolve(args.input || "");
  const title = safeTitle(args.title);
  const hms = String(args.hm || "").split(",").map(x => x.trim().padStart(2, "0")).filter(Boolean);
  if (!hms.length || hms.some(x => !/^0[1-6]$/.test(x))) fail("--hm benötigt Werte 01 bis 06, kommagetrennt.");
  const featured = /^(ja|yes|true|1)$/i.test(String(args.featured || ""));
  const baseline = loadBaseline(root, reservationFile);
  const number = args.number ? Number(args.number) : baseline.nextNumber;
  if (!Number.isSafeInteger(number) || number < 1) fail("Songnummer muss eine positive ganze Zahl sein.");
  if (number !== baseline.nextNumber) fail(`Nach der Lückenregel ist ausschließlich Nummer ${baseline.nextNumber} zulässig.`);
  const prefix = `${String(number).padStart(2, "0")}_${title}`;
  const names = { mp3: `${prefix}.mp3`, jpg: `${prefix}.jpg`, txt: `${prefix}.txt` };
  const sources = findPackageFiles(input);
  const collisions = collisionsFor({ root, catalog: baseline.catalog, title, number, targetNames: names });
  if (collisions.length) fail(`Integration abgebrochen; Kollisionen:\n- ${collisions.join("\n- ")}`);
  const suggestedRunName = `song-${String(number).padStart(2, "0")}-${normalize(title).replaceAll(" ", "-")}`;
  const out = path.resolve(args.out || path.join(import.meta.dirname, "..", "runs", suggestedRunName));
  const runName = path.basename(out);
  if (fs.existsSync(out)) fail(`Ausgabeordner existiert bereits: ${out}`);
  const test = path.join(out, "testkopie");
  const github = path.join(out, "github-paket");
  const local = path.join(out, "lokales-upload-paket");
  fs.mkdirSync(test, { recursive: true }); fs.mkdirSync(github, { recursive: true }); fs.mkdirSync(local, { recursive: true });
  const mediaRel = `Song_Upgrade_V1C/runs/${runName}/testkopie/media/`;
  for (const [kind, source] of Object.entries(sources)) copyFile(source, path.join(test, "media", names[kind]));
  copyTree(path.join(root, "v1b"), path.join(test, "v1b"));
  fs.writeFileSync(
    path.join(test, ROOT_FILES[0]),
    updateTestHome(fs.readFileSync(path.join(root, ROOT_FILES[0]), "utf8")),
    "utf8"
  );
  const context = { baseHref: "../../../../", number, title, index: baseline.nextIndex, hms, featured, audio: mediaRel + names.mp3, cover: mediaRel + names.jpg };
  fs.writeFileSync(path.join(test, ROOT_FILES[1]), updatePlayer(fs.readFileSync(path.join(root, ROOT_FILES[1]), "utf8"), context), "utf8");
  fs.writeFileSync(path.join(test, ROOT_FILES[2]), updateExplorer(fs.readFileSync(path.join(root, ROOT_FILES[2]), "utf8"), context), "utf8");
  fs.writeFileSync(path.join(test, ROOT_FILES[3]), updateLyrics(fs.readFileSync(path.join(root, ROOT_FILES[3]), "utf8"), context.baseHref), "utf8");
  const id = `song-${String(baseline.nextIndex + 1).padStart(2, "0")}`;
  const testCatalog = updateCatalog(baseline.catalog, { id, index: baseline.nextIndex, number, title, featured, hms, mediaPrefix: mediaRel, names, basePath: "../../../../../" });
  fs.writeFileSync(path.join(test, "v1b", "data", "catalog.json"), JSON.stringify(testCatalog, null, 2) + "\n", "utf8");
  const cmd = `@echo off\r\nsetlocal\r\nfor %%I in ("%~dp0..\\..\\..\\..") do set "PULSEDE_ROOT=%%~fI"\r\npushd "%PULSEDE_ROOT%"\r\nstart "PulseDE Lokalserver" /min python -m http.server 8765 --bind 127.0.0.1\r\npopd\r\ntimeout /t 2 /nobreak >nul\r\nstart "" "http://127.0.0.1:8765/${mediaRel.replace("media/", "")}${ROOT_FILES[0]}"\r\nendlocal\r\n`;
  fs.writeFileSync(path.join(test, "START_LOKALTEST.cmd"), cmd, "utf8");
  const prodCatalog = updateCatalog(baseline.catalog, { id, index: baseline.nextIndex, number, title, featured, hms, mediaPrefix: "", names, basePath: baseline.catalog.basePath });
  fs.mkdirSync(path.join(github, "v1b", "data"), { recursive: true });
  fs.writeFileSync(path.join(github, "v1b", "data", "catalog.json"), JSON.stringify(prodCatalog, null, 2) + "\n", "utf8");
  const prodContext = { ...context, baseHref: "", audio: names.mp3, cover: names.jpg };
  fs.writeFileSync(path.join(github, ROOT_FILES[1]), updatePlayer(fs.readFileSync(path.join(root, ROOT_FILES[1]), "utf8"), prodContext), "utf8");
  fs.writeFileSync(path.join(github, ROOT_FILES[2]), updateExplorer(fs.readFileSync(path.join(root, ROOT_FILES[2]), "utf8"), prodContext), "utf8");
  fs.writeFileSync(path.join(github, ROOT_FILES[3]), updateLyrics(fs.readFileSync(path.join(root, ROOT_FILES[3]), "utf8"), ""), "utf8");
  for (const [kind, source] of Object.entries(sources)) { copyFile(source, path.join(github, names[kind])); copyFile(source, path.join(local, names[kind])); }
  const report = { createdAt: new Date().toISOString(), baseline: { songs: baseline.catalog.songs.length, nextNumber: baseline.nextNumber, nextIndex: baseline.nextIndex }, song: { id, number, index: baseline.nextIndex, title, featured, hms, files: names }, safety: { productionChanged: false, githubPublished: false, committed: false }, folders: { testkopie: "testkopie", github: "github-paket", localUpload: "lokales-upload-paket" } };
  fs.writeFileSync(path.join(out, "integrationsbericht.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(out, "DATEILISTE.json"), JSON.stringify(manifest(out), null, 2) + "\n", "utf8");
  if (args.json) console.log(JSON.stringify({ ok: true, output: out, runName, number, title, index: baseline.nextIndex, id, testStart: path.join(test, "START_LOKALTEST.cmd") }));
  else console.log(`ERFOLG\nAusgabe: ${out}\nSong: ${number} ${title}\nIndex: ${baseline.nextIndex}\nID: ${id}\nTest: ${path.join(test, "START_LOKALTEST.cmd")}`);
}

try { main(); } catch (error) { console.error(`FEHLER: ${error.message}`); process.exitCode = 1; }
