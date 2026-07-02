export function normalizeHmSelection(values, categories) {
  const validIds = new Set(categories.map((category) => category.id));
  return [...new Set((values ?? []).map(String).filter((id) => validIds.has(id)))]
    .sort((left, right) => Number(left) - Number(right));
}

export function buildHmResult(values, categories) {
  const selected = normalizeHmSelection(values, categories);
  return Object.freeze({
    selected,
    code: selected.join(""),
    valid: selected.length > 0
  });
}
