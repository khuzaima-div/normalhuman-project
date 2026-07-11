import { turndown } from "./turndown";

/** Plain-text excerpt per matched email */
const MAX_BODY_CHARS_PER_EMAIL = 800;

/** Hard cap on the entire RAG context block (~8–10k tokens with headroom for the rest of the prompt) */
const MAX_TOTAL_CONTEXT_CHARS = 24_000;

type OramaEmailDocument = {
  title?: string;
  body?: string;
  rawBody?: string;
  from?: string;
  to?: string[];
  sentAt?: string;
  threadId?: string;
};

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxChars: number): string {
  const cleaned = normalizeWhitespace(text);
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars)}…`;
}

function htmlToPlainText(html: string): string {
  if (!html.trim()) return "";
  try {
    return turndown.turndown(html);
  } catch {
    return normalizeWhitespace(html.replace(/<[^>]+>/g, " "));
  }
}

function extractPlainBody(doc: OramaEmailDocument): string {
  const snippet = doc.body?.trim() ?? "";

  if (snippet) {
    return truncate(snippet, MAX_BODY_CHARS_PER_EMAIL);
  }

  if (doc.rawBody) {
    return truncate(htmlToPlainText(doc.rawBody), MAX_BODY_CHARS_PER_EMAIL);
  }

  return "";
}

function formatEmailDocument(doc: OramaEmailDocument): string {
  const toLine = doc.to?.length ? doc.to.join(", ") : "Unknown";

  return [
    `Subject: ${doc.title ?? "(No subject)"}`,
    `From: ${doc.from ?? "Unknown"}`,
    `To: ${toLine}`,
    `Date: ${doc.sentAt ?? "Unknown"}`,
    `Body: ${extractPlainBody(doc) || "(empty)"}`,
  ].join("\n");
}

export function buildEmailRagContext(
  hits: Array<{ document?: unknown }>,
): string {
  const parts: string[] = [];
  let totalChars = 0;

  for (const hit of hits) {
    const doc = hit.document as OramaEmailDocument | undefined;
    if (!doc) continue;

    const formatted = formatEmailDocument(doc);
    const separatorChars = parts.length > 0 ? 5 : 0; // "\n---\n"

    if (totalChars + separatorChars + formatted.length > MAX_TOTAL_CONTEXT_CHARS) {
      break;
    }

    parts.push(formatted);
    totalChars += separatorChars + formatted.length;
  }

  return parts.join("\n---\n");
}
