import { sanitizeTitle } from "./naming-service.js";

function titleFromFilename(filename) {
  const withoutExtension = String(filename ?? "").replace(/\.[^.]+$/, "");
  return sanitizeTitle(
    withoutExtension
      .replace(/^\d+[\s_-]*/, "")
      .replaceAll("_", " ")
  );
}

export function explicitTitleFromText(text) {
  const lines = String(text ?? "").split(/\r?\n/).slice(0, 25);
  for (const line of lines) {
    const match = line.match(/^\s*(?:songtitel|titel)\s*:\s*(.+?)\s*$/i);
    if (match) {
      const title = sanitizeTitle(match[1]);
      if (title) return title;
    }
  }
  return "";
}

export function resolveTitleProposal({ txtText = "", txtName = "", jpgName = "", mp3Name = "" } = {}) {
  const explicitTitle = explicitTitleFromText(txtText);
  if (explicitTitle) return Object.freeze({ title: explicitTitle, source: "txt-content" });

  const sources = [
    ["txt-filename", txtName],
    ["jpg-filename", jpgName],
    ["mp3-filename", mp3Name]
  ];
  for (const [source, filename] of sources) {
    const title = titleFromFilename(filename);
    if (title) return Object.freeze({ title, source });
  }
  return Object.freeze({ title: "", source: "none" });
}

export function titleSourceLabel(source) {
  return ({
    "txt-content": "Titel-Zeile der TXT-Datei",
    "txt-filename": "TXT-Dateiname",
    "jpg-filename": "JPG-Dateiname",
    "mp3-filename": "MP3-Dateiname",
    "none": "keine Quelle"
  })[source] ?? "unbekannte Quelle";
}
