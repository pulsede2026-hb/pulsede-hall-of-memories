import { CONFIG } from "../config.js";
import { buildHmResult } from "./hm-service.js";
import { buildTargetNames, sanitizeTitle } from "./naming-service.js";

function extensionOf(filename) {
  const match = String(filename ?? "").toLowerCase().match(/\.[^.]+$/);
  return match ? match[0] : "";
}

async function firstBytes(file, count = 3) {
  if (!file || typeof file.slice !== "function") return new Uint8Array();
  return new Uint8Array(await file.slice(0, count).arrayBuffer());
}

async function hasJpegSignature(file) {
  const bytes = await firstBytes(file, 2);
  return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

async function hasMp3Signature(file) {
  const bytes = await firstBytes(file, 3);
  const id3 = bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const frameSync = bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  return id3 || frameSync;
}

function requireFile(file, role, extensions, errors) {
  if (!file) {
    errors.push(`${role} fehlt.`);
    return false;
  }
  if (!extensions.includes(extensionOf(file.name))) {
    errors.push(`${role} besitzt keine zulässige Dateiendung.`);
    return false;
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    errors.push(`${role} ist leer.`);
    return false;
  }
  return true;
}

export async function evaluateSongPackage(input, config = CONFIG) {
  const errors = [];
  const warnings = [];
  const title = sanitizeTitle(input?.title);
  const number = Number.isInteger(input?.number) ? input.number : config.startNumber;

  if (!title) errors.push("Songtitel fehlt oder enthält keine zulässigen Zeichen.");
  if (typeof input?.featured !== "boolean") {
    errors.push("Behinderung / Lebenserfahrung muss mit Ja oder Nein beantwortet werden.");
  }

  const hm = buildHmResult(input?.hm, config.hmCategories);
  if (!hm.valid) errors.push("Mindestens eine gültige HM-Zuordnung wird benötigt.");
  if (input?.hmConfirmed !== true) errors.push("Die HM-Auswahl muss von Harald bestätigt werden.");

  const jpgUsable = requireFile(input?.files?.jpg, "JPG", config.extensions.jpg, errors);
  const mp3Usable = requireFile(input?.files?.mp3, "MP3", config.extensions.mp3, errors);
  const txtUsable = requireFile(input?.files?.txt, "TXT", config.extensions.txt, errors);

  if (jpgUsable) {
    if (extensionOf(input.files.jpg.name) === ".jpeg") {
      warnings.push("JPEG erkannt; der vorgeschlagene Zielstandard lautet .jpg.");
    }
    if (!(await hasJpegSignature(input.files.jpg))) {
      errors.push("JPG/JPEG besitzt keine erkennbare JPEG-Signatur.");
    }
  }

  if (mp3Usable && !(await hasMp3Signature(input.files.mp3))) {
    errors.push("MP3 besitzt keine erkennbare MP3-Signatur.");
  }

  if (txtUsable) {
    const text = await input.files.txt.text();
    if (!text.trim()) errors.push("TXT enthält keinen Songtext.");
  }

  let targetNames = null;
  if (title) {
    try {
      targetNames = buildTargetNames(title, number);
    } catch (error) {
      errors.push(error.message);
    }
  }

  return Object.freeze({
    status: errors.length === 0 ? "complete" : "incomplete",
    complete: errors.length === 0,
    number,
    title,
    featured: typeof input?.featured === "boolean" ? input.featured : null,
    hmConfirmed: input?.hmConfirmed === true,
    hm,
    targetNames,
    errors,
    warnings
  });
}
