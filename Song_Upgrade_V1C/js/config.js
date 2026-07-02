export const CONFIG = Object.freeze({
  startNumber: 59,
  hmRulesPath: "./data/hm-rules.json",
  hmCategories: Object.freeze([
    { id: "01", name: "Gefühl", icon: "❤️" },
    { id: "02", name: "Nachdenken", icon: "🌙" },
    { id: "03", name: "Hoffnung", icon: "🍀" },
    { id: "04", name: "Menschlichkeit", icon: "🤝" },
    { id: "05", name: "Alltag & Leben", icon: "⚙️" },
    { id: "06", name: "Entscheidung", icon: "⚖️" }
  ]),
  extensions: Object.freeze({
    jpg: Object.freeze([".jpg", ".jpeg"]),
    mp3: Object.freeze([".mp3"]),
    txt: Object.freeze([".txt"])
  })
});
