const FORBIDDEN_FILE_CHARACTERS = /[\u0000-\u001f\\/:*?"<>|]/g;

export function sanitizeTitle(value) {
  return String(value ?? "")
    .replace(FORBIDDEN_FILE_CHARACTERS, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
}

export function formatSongNumber(number) {
  if (!Number.isInteger(number) || number < 1) {
    throw new TypeError("Die Songnummer muss eine positive ganze Zahl sein.");
  }
  return String(number).padStart(2, "0");
}

export function buildTargetNames(title, number) {
  const cleanTitle = sanitizeTitle(title);
  if (!cleanTitle) throw new Error("Ein gültiger Songtitel wird benötigt.");
  const baseName = `${formatSongNumber(number)}_${cleanTitle}`;
  return Object.freeze({
    baseName,
    jpg: `${baseName}.jpg`,
    mp3: `${baseName}.mp3`,
    txt: `${baseName}.txt`
  });
}
