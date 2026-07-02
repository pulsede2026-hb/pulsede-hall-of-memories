import { resolveTitleProposal } from "../js/core/title-service.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tests = [
  {
    name: "Titel-Zeile der TXT hat höchste Priorität",
    run() {
      const result = resolveTitleProposal({
        txtText: "Titel: Das WIR gewinnt\nErste Liedzeile",
        txtName: "59_Falscher TXT Name.txt",
        jpgName: "Bildname.jpg",
        mp3Name: "Audioname.mp3"
      });
      assert(result.title === "Das WIR gewinnt" && result.source === "txt-content", "Titel-Zeile wurde nicht priorisiert.");
    }
  },
  {
    name: "Songtitel-Zeile wird erkannt",
    run() {
      const result = resolveTitleProposal({ txtText: "Songtitel: Licht für uns\nText" });
      assert(result.title === "Licht für uns", "Songtitel-Zeile wurde nicht erkannt.");
    }
  },
  {
    name: "TXT-Dateiname ist erster Rückfall",
    run() {
      const result = resolveTitleProposal({
        txtText: "Direkt beginnender Liedtext",
        txtName: "59_Das_WIR_gewinnt.txt",
        jpgName: "Anderes Bild.jpg"
      });
      assert(result.title === "Das WIR gewinnt" && result.source === "txt-filename", "TXT-Dateiname wurde nicht verwendet.");
    }
  },
  {
    name: "JPG-Dateiname ist zweiter Rückfall",
    run() {
      const result = resolveTitleProposal({ jpgName: "59_Grüße aus dem Pott.jpg", mp3Name: "Audio.mp3" });
      assert(result.title === "Grüße aus dem Pott" && result.source === "jpg-filename", "JPG-Rückfall ist falsch.");
    }
  },
  {
    name: "MP3-Dateiname ist letzter Rückfall",
    run() {
      const result = resolveTitleProposal({ mp3Name: "59_Letzter_Versuch.mp3" });
      assert(result.title === "Letzter Versuch" && result.source === "mp3-filename", "MP3-Rückfall ist falsch.");
    }
  },
  {
    name: "Nummer, Unterstriche und unzulässige Zeichen werden bereinigt",
    run() {
      const result = resolveTitleProposal({ txtName: '059_Grüße:_Wir?.txt' });
      assert(result.title === "Grüße Wir", "Bereinigung ist falsch: " + result.title);
    }
  }
];

export async function runTitleServiceTests() {
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
