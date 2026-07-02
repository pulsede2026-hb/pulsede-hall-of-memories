import { buildExportPreview } from "../js/core/export-preview-service.js";
import { analyzeHmSuggestions } from "../js/core/hm-suggestion-service.js";
import { evaluateSongPackage } from "../js/core/package-validator.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function jpgFile() {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], "cover.jpg", { type: "image/jpeg" });
}

function mp3File() {
  return new File([new Uint8Array([0x49, 0x44, 0x33])], "audio.mp3", { type: "audio/mpeg" });
}

function txtFile() {
  return new File(["Songtext"], "song.txt", { type: "text/plain" });
}

async function loadRules() {
  const response = await fetch("../data/hm-rules.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Testregeln konnten nicht geladen werden.");
  return response.json();
}

const tests = [
  {
    name: "Alle sechs HM-Bereiche werden mit eindeutigen Begriffen erkannt",
    async run(rules) {
      const examples = [["Liebe", "01"], ["Vergangenheit", "02"], ["Mut", "03"], ["Familie", "04"], ["Arbeit", "05"], ["Schicksal", "06"]];
      for (const [text, expected] of examples) {
        const ids = analyzeHmSuggestions(text, rules).suggestions.map((item) => item.id);
        assert(ids.includes(expected), text + " erkannte HM " + expected + " nicht.");
      }
    }
  },
  {
    name: "Mehrere HM-Bereiche werden gleichzeitig vorgeschlagen",
    async run(rules) {
      const ids = analyzeHmSuggestions("Liebe schenkt uns Mut für die Zukunft.", rules).suggestions.map((item) => item.id);
      assert(ids.includes("01") && ids.includes("03"), "Mehrfachvorschlag fehlt.");
    }
  },
  {
    name: "Ein einzelner Begriff liefert sichtbare Trefferbegründung",
    async run(rules) {
      const result = analyzeHmSuggestions("Wir tragen Verantwortung.", rules);
      const hm06 = result.suggestions.find((item) => item.id === "06");
      assert(hm06?.matches.includes("Verantwortung"), "Trefferbegründung fehlt.");
      assert(hm06?.matchedTerms.includes("verantwortung"), "Tatsächliches Trefferwort fehlt.");
      assert(hm06?.reason.includes("Verantwortung"), "Kurze Begründung fehlt.");
    }
  },
  {
    name: "Titel beeinflusst HM nicht",
    async run(rules) {
      const result = analyzeHmSuggestions("Wolken ziehen über das Feld.", rules);
      assert(result.suggestions.length === 0, "Text ohne HM-Begriff erzeugte einen Vorschlag.");
    }
  },
  {
    name: "Leerer Songtext erzeugt keinen Vorschlag",
    async run(rules) {
      const result = analyzeHmSuggestions("   ", rules);
      assert(!result.textAvailable && result.suggestions.length === 0, "Leerer Text wurde analysiert.");
    }
  },
  {
    name: "Automatischer Vorschlag ist ohne Bestätigung nicht vollständig",
    async run() {
      const base = {
        number: 59,
        title: "Das WIR gewinnt",
        files: { jpg: jpgFile(), mp3: mp3File(), txt: txtFile() },
        hm: ["01", "03"],
        featured: true
      };
      const unconfirmed = await evaluateSongPackage({ ...base, hmConfirmed: false });
      const confirmed = await evaluateSongPackage({ ...base, hmConfirmed: true });
      assert(!unconfirmed.complete && unconfirmed.errors.some((error) => error.includes("bestätigt")), "Bestätigungspflicht fehlt.");
      assert(confirmed.complete, confirmed.errors.join(" | "));
      const preview = buildExportPreview({
        number: confirmed.number,
        title: confirmed.title,
        featured: confirmed.featured,
        hmCode: confirmed.hm.code,
        complete: confirmed.complete,
        hmConfirmed: confirmed.hmConfirmed
      });
      assert(preview === "59 Das WIR gewinnt * | HM: 0103", "Exportvorschau ist falsch: " + preview);
    }
  },
  {
    name: "Manuelle HM-Korrektur bleibt gültig",
    async run() {
      const result = await evaluateSongPackage({
        number: 59,
        title: "Manuelle Entscheidung",
        files: { jpg: jpgFile(), mp3: mp3File(), txt: txtFile() },
        hm: ["06"],
        hmConfirmed: true,
        featured: false
      });
      assert(result.complete && result.hm.code === "06", "Manuelle HM-Auswahl wurde nicht übernommen.");
    }
  }
];

export async function runHmSuggestionTests() {
  const rules = await loadRules();
  const results = [];
  for (const test of tests) {
    try {
      await test.run(rules);
      results.push({ name: test.name, passed: true, error: "" });
    } catch (error) {
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  return results;
}
