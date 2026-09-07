import crypto from "crypto";

// Known marketing and tracking query parameters to discard during canonicalization
const TRACKING_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gh_src",
  "lever-source",
  "lever-origin",
  "source",
  "ref",
  "refid",
  "trk",
  "trackingid",
  "fbclid",
  "gclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "originalsubdomain",
  "_ga",
  "_gl",
]);

/**
 * Normalizes job description text:
 * - Lowercases all text
 * - Normalizes unicode quotes and dashes
 * - Collapses consecutive whitespace (spaces, tabs, newlines) into a single space
 * - Trims leading/trailing whitespace
 */
export function normalizeJobText(text: string | null | undefined): string {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Canonicalizes a job URL:
 * - Ensures valid HTTPS/HTTP scheme
 * - Normalizes hostname to lowercase
 * - Strips common tracking parameters (utm_*, gh_src, trk, etc.)
 * - Sorts remaining query parameters deterministically
 * - Strips trailing slash and hash fragments
 */
export function canonicalizeJobUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  let clean = rawUrl.trim();
  if (!clean) return null;

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(clean)) {
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      return null;
    }
  } else {
    clean = "https://" + clean;
  }

  try {
    const url = new URL(clean);

    // Enforce http/https only
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    url.hostname = url.hostname.toLowerCase();
    url.hash = "";

    // Strip trailing slash on pathname unless path is root "/"
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }

    // Filter tracking query params
    const newParams = new URLSearchParams();
    const keys = Array.from(url.searchParams.keys()).sort();
    for (const key of keys) {
      if (!TRACKING_QUERY_PARAMS.has(key.toLowerCase())) {
        const val = url.searchParams.get(key);
        if (val !== null) {
          newParams.append(key.toLowerCase(), val);
        }
      }
    }

    const queryString = newParams.toString();
    const finalUrl = `${url.protocol}//${url.hostname}${url.port ? ":" + url.port : ""}${url.pathname}${queryString ? "?" + queryString : ""}`;

    return finalUrl;
  } catch {
    return null;
  }
}

export interface CreateJobHashParams {
  company?: string | null;
  title?: string | null;
  description: string;
  url?: string | null;
}

/**
 * Generates a deterministic SHA-256 fingerprint for a job posting.
 * Uses a normalized combination of company, title, description, and canonical URL.
 */
export function createJobHash(params: CreateJobHashParams): string {
  const normDesc = normalizeJobText(params.description);
  const normCompany = params.company ? params.company.trim().toLowerCase().replace(/\s+/g, " ") : "";
  const normTitle = params.title ? params.title.trim().toLowerCase().replace(/\s+/g, " ") : "";
  const normUrl = canonicalizeJobUrl(params.url) || "";

  // Structured payload for deterministic hashing
  const payload = [
    `c:${normCompany}`,
    `t:${normTitle}`,
    `d:${normDesc}`,
    `u:${normUrl}`,
  ].join("|");

  return crypto.createHash("sha256").update(payload).digest("hex");
}
