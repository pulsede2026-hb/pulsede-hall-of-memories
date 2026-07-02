function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .toLocaleLowerCase("de")
    .replace(/[–—-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
}

function containsTerm(text, term) {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;
  const pattern = escapeRegex(normalizedTerm).replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${pattern}(?=$|[^\\p{L}\\p{N}])`, "u").test(text);
}

export function analyzeHmSuggestions(songText, rules) {
  const text = normalizeText(songText);
  if (!text) return Object.freeze({ textAvailable: false, suggestions: [] });

  const suggestions = (rules?.categories ?? []).map((category) => {
    const matches = [];
    const matchedTerms = [];
    for (const topic of category.topics ?? []) {
      const topicTerms = (topic.terms ?? []).filter((term) => containsTerm(text, term));
      if (topicTerms.length) {
        matches.push(topic.label);
        matchedTerms.push(...topicTerms);
      }
    }
    const uniqueTerms = [...new Set(matchedTerms)];
    return Object.freeze({
      id: category.id,
      name: category.name,
      score: matches.length,
      matches: Object.freeze(matches),
      matchedTerms: Object.freeze(uniqueTerms),
      reason: matches.length === 1
        ? `Der Songtext enthält einen eindeutigen Begriff zum Thema ${matches[0]}.`
        : `Der Songtext enthält mehrere Begriffe aus den Themen ${matches.join(", ")}.`
    });
  }).filter((category) => category.score > 0);

  return Object.freeze({ textAvailable: true, suggestions: Object.freeze(suggestions) });
}
