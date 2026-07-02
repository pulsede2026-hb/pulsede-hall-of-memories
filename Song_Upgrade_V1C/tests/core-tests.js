import { CONFIG } from "../js/config.js";
import { evaluateSongPackage } from "../js/core/package-validator.js";
import { buildTargetNames, sanitizeTitle } from "../js/core/naming-service.js";

function jpgFile(name = "cover.jpg") {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xdb])], name, { type: "image/jpeg" });
}

function mp3File(name = "audio.mp3") {
  return new File([new Uint8Array([0x49, 0x44, 0x33, 0x04])], name, { type: "audio/mpeg" });
}

function txtFile(content = "Ein Songtext", name = "song.txt") {
  return new File([content], name, { type: "text/plain" });
}

function completeInput(overrides = {}) {
  return {
    number: 59,
    title: "Das WIR gewinnt",
    files: { jpg: jpgFile(), mp3: mp3File(), txt: txtFile() },
    hm: ["03", "01", "03"],
    hmConfirmed: true,
    featured: true,
    ...overrides
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tests = [
  {
    name: "Vollständiges Paket wird grün",
    async run() {
      const result = await evaluateSongPackage(completeInput());
      assert(result.complete, result.errors.join(" | "));
      assert(result.hm.code === "0103", "HM-Code muss sortiert und eindeutig sein.");
      assert(result.targetNames.mp3 === "59_Das WIR gewinnt.mp3", "MP3-Zielname ist falsch.");
    }
  },
  {
    name: "JPG, MP3 und TXT sind jeweils Pflicht",
    async run() {
      for (const role of ["jpg", "mp3", "txt"]) {
        const files = { jpg: jpgFile(), mp3: mp3File(), txt: txtFile(), [role]: null };
        const result = await evaluateSongPackage(completeInput({ files }));
        assert(!result.complete, `Fehlende ${role}-Datei wurde nicht erkannt.`);
      }
    }
  },
  {
    name: "Fehlende HM-Zuordnung wird rot",
    async run() {
      const result = await evaluateSongPackage(completeInput({ hm: [] }));
      assert(!result.complete && result.errors.some((error) => error.includes("HM-Zuordnung")), "HM-Pflicht fehlt.");
    }
  },
  {
    name: "Leere TXT-Datei wird rot",
    async run() {
      const files = { jpg: jpgFile(), mp3: mp3File(), txt: txtFile("   ") };
      const result = await evaluateSongPackage(completeInput({ files }));
      assert(!result.complete && result.errors.some((error) => error.includes("Songtext")), "Leere TXT wurde nicht erkannt.");
    }
  },
  {
    name: "JPEG wird erkannt, Ziel bleibt JPG",
    async run() {
      const files = { jpg: jpgFile("cover.jpeg"), mp3: mp3File(), txt: txtFile() };
      const result = await evaluateSongPackage(completeInput({ files }));
      assert(result.complete, result.errors.join(" | "));
      assert(result.targetNames.jpg.endsWith(".jpg"), "Zielendung muss .jpg sein.");
      assert(result.warnings.some((warning) => warning.includes("JPEG")), "JPEG-Hinweis fehlt.");
    }
  },
  {
    name: "Unzulässiger Dateityp wird rot",
    async run() {
      const files = { jpg: jpgFile("cover.png"), mp3: mp3File(), txt: txtFile() };
      const result = await evaluateSongPackage(completeInput({ files }));
      assert(!result.complete && result.errors.some((error) => error.includes("Dateiendung")), "Falsche Endung wurde nicht erkannt.");
    }
  },
  {
    name: "Unzulässige Zeichen werden entfernt, Umlaute bleiben",
    async run() {
      const clean = sanitizeTitle('  Grüße: "Wir" / Heute?  ');
      assert(clean === "Grüße Wir Heute", `Unerwarteter Titel: ${clean}`);
      assert(buildTargetNames(clean, 59).jpg === "59_Grüße Wir Heute.jpg", "Zielname ist falsch.");
    }
  },
  {
    name: "Nummerierung beginnt bei 59",
    async run() {
      const result = await evaluateSongPackage({ ...completeInput(), number: undefined }, CONFIG);
      assert(result.number === 59, "Startnummer ist nicht 59.");
      assert(result.targetNames.baseName.startsWith("59_"), "Basisname beginnt nicht mit 59_.");
    }
  },
  {
    name: "Ja/Nein-Kennzeichnung ist verpflichtend",
    async run() {
      const missing = await evaluateSongPackage(completeInput({ featured: null }));
      const no = await evaluateSongPackage(completeInput({ featured: false }));
      assert(!missing.complete, "Fehlende Kennzeichnung wurde nicht erkannt.");
      assert(no.complete && no.featured === false, "Nein wurde nicht eindeutig übernommen.");
    }
  }
];

export async function runCoreTests() {
  const results = [];
  for (const test of tests) {
    try {
      await test.run();
      results.push({ name: test.name, passed: true, error: "" });
    } catch (error) {
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  return results;
}
