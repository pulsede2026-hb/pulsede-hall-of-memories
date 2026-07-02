import { sanitizeTitle } from "./naming-service.js";

export function buildExportPreview({ number, title, featured, hmCode, complete, hmConfirmed }) {
  if (!complete || !hmConfirmed || !hmCode) return "";
  const cleanTitle = sanitizeTitle(title);
  if (!cleanTitle) return "";
  const star = featured ? " *" : "";
  return `${number} ${cleanTitle}${star} | HM: ${hmCode}`;
}
