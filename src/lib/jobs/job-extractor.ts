import { validateJobUrl } from "./url-validator";
import { JobSource } from "./types";

export interface ExtractedJobData {
  title: string;
  company: string | null;
  location: string | null;
  workplaceType?: "remote" | "hybrid" | "onsite" | null;
  jobType?: string | null;
  rawDescription: string;
  source: JobSource;
  sourceUrl: string;
  sourceDomain: string;
}

export interface JobExtractionResult {
  extracted: boolean;
  canonicalUrl: string;
  source: JobSource;
  sourceDomain: string;
  job?: ExtractedJobData;
  message?: string;
}

const MAX_RESPONSE_SIZE = 2 * 1024 * 1024; // 2 MB response limit
const REQUEST_TIMEOUT_MS = 5000; // 5-second timeout

/**
 * Parses Greenhouse job board URLs into verified { boardToken, jobId }.
 * Supported formats:
 * - https://job-boards.greenhouse.io/{board_token}/jobs/{job_id}
 * - https://boards.greenhouse.io/{board_token}/jobs/{job_id}
 * - https://boards.greenhouse.io/embed/job_app?for={board_token}&token={job_id}
 */
export function parseGreenhouseUrl(rawUrl: string): { boardToken: string; jobId: string } | null {
  try {
    if (!rawUrl || rawUrl.includes("..") || rawUrl.toLowerCase().includes("%2e")) {
      return null;
    }

    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    if (!host.endsWith("greenhouse.io")) return null;

    // Pattern 1: /{boardToken}/jobs/{jobId}
    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 3 && pathParts[1] === "jobs") {
      const boardToken = pathParts[0];
      const jobId = pathParts[2];
      if (/^[a-zA-Z0-9_-]+$/.test(boardToken) && /^\d+$/.test(jobId)) {
        return { boardToken, jobId };
      }
    }

    // Pattern 2: /embed/job_app?for={boardToken}&token={jobId}
    if (url.pathname.includes("embed/job_app")) {
      const boardToken = url.searchParams.get("for");
      const jobId = url.searchParams.get("token");
      if (boardToken && jobId && /^[a-zA-Z0-9_-]+$/.test(boardToken) && /^\d+$/.test(jobId)) {
        return { boardToken, jobId };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parses Lever job posting URLs into verified { site, postingId }.
 * Supported formats:
 * - https://jobs.lever.co/{site}/{postingId}
 * - https://jobs.eu.lever.co/{site}/{postingId}
 */
export function parseLeverUrl(rawUrl: string): { site: string; postingId: string } | null {
  try {
    if (!rawUrl || rawUrl.includes("..") || rawUrl.toLowerCase().includes("%2e")) {
      return null;
    }

    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    if (!host.endsWith("lever.co")) return null;

    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2) {
      const site = pathParts[0];
      const postingId = pathParts[1];

      // Avoid static asset paths or reserved keywords
      if (site === "static" || site === "assets" || postingId === "apply") {
        return null;
      }

      if (/^[a-zA-Z0-9_-]+$/.test(site) && /^[a-zA-Z0-9_-]+$/.test(postingId)) {
        return { site, postingId };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Safely decodes HTML entities and strips HTML markup to produce readable plain text.
 */
export function htmlToPlainText(html: string): string {
  if (!html || typeof html !== "string") return "";

  function decodeEntities(str: string): string {
    return str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  }

  // Pre-decode entities in case markup was double-escaped (e.g. Greenhouse &lt;div&gt;)
  let text = decodeEntities(html);

  // Remove scripts and styles completely
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Convert list items to bullet points
  text = text.replace(/<li\b[^>]*>(.*?)<\/li>/gi, "\n• $1");

  // Convert paragraph / break / heading tags to newlines
  text = text.replace(/<\/(p|div|h[1-6]|tr|table)>/gi, "\n\n");
  text = text.replace(/<(br|hr)\s*\/?>/gi, "\n");

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Post-decode remaining entities
  text = decodeEntities(text);

  // Normalize line whitespace
  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function capitalizeWord(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Outbound fetch to official Greenhouse public API:
 * https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs/{job_id}
 */
async function fetchGreenhouseJob(
  boardToken: string,
  jobId: string,
  canonicalUrl: string,
  sourceDomain: string
): Promise<ExtractedJobData | null> {
  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(jobId)}`;

  try {
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "JobFit-JobAnalyzer/1.0",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;

    const contentLength = Number(res.headers.get("content-length") || 0);
    if (contentLength > MAX_RESPONSE_SIZE) return null;

    const rawText = await res.text();
    if (rawText.length > MAX_RESPONSE_SIZE) return null;

    const data = JSON.parse(rawText);
    if (!data || !data.title) return null;

    const cleanDesc = htmlToPlainText(data.content || "");
    if (!cleanDesc || cleanDesc.length < 20) return null;

    return {
      title: String(data.title).trim(),
      company: data.company_name ? String(data.company_name).trim() : capitalizeWord(boardToken),
      location: data.location?.name ? String(data.location.name).trim() : null,
      rawDescription: cleanDesc,
      source: "greenhouse",
      sourceUrl: canonicalUrl,
      sourceDomain,
    };
  } catch {
    return null;
  }
}

/**
 * Outbound fetch to official Lever public API:
 * https://api.lever.co/v0/postings/{site}/{postingId}
 */
async function fetchLeverJob(
  site: string,
  postingId: string,
  canonicalUrl: string,
  sourceDomain: string
): Promise<ExtractedJobData | null> {
  const apiUrl = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}/${encodeURIComponent(postingId)}`;

  try {
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "JobFit-JobAnalyzer/1.0",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;

    const contentLength = Number(res.headers.get("content-length") || 0);
    if (contentLength > MAX_RESPONSE_SIZE) return null;

    const rawText = await res.text();
    if (rawText.length > MAX_RESPONSE_SIZE) return null;

    const data = JSON.parse(rawText);
    if (!data || !data.text) return null;

    let fullHtml = data.description || "";
    if (Array.isArray(data.lists)) {
      for (const list of data.lists) {
        if (list.text) fullHtml += `<h3>${list.text}</h3>`;
        if (list.content) fullHtml += list.content;
      }
    }

    const cleanDesc = htmlToPlainText(fullHtml);
    if (!cleanDesc || cleanDesc.length < 20) return null;

    let workplaceType: "remote" | "hybrid" | "onsite" | null = null;
    if (
      data.workplaceType === "remote" ||
      data.workplaceType === "hybrid" ||
      data.workplaceType === "onsite"
    ) {
      workplaceType = data.workplaceType;
    }

    return {
      title: String(data.text).trim(),
      company: capitalizeWord(site),
      location: data.categories?.location
        ? String(data.categories.location).trim()
        : Array.isArray(data.categories?.allLocations)
        ? data.categories.allLocations.join(", ")
        : null,
      workplaceType,
      jobType: data.categories?.commitment ? String(data.categories.commitment).trim() : null,
      rawDescription: cleanDesc,
      source: "lever",
      sourceUrl: canonicalUrl,
      sourceDomain,
    };
  } catch {
    return null;
  }
}

/**
 * Main job extractor orchestrator:
 * - Validates URL format and rejects non-http(s) and SSRF targets
 * - If Greenhouse: invokes official boards-api.greenhouse.io
 * - If Lever: invokes official api.lever.co
 * - If LinkedIn, Workday, or other: returns extracted=false (fallback required)
 * - If API request fails (404, 429, timeout): returns extracted=false (fallback required)
 */
export async function extractJobFromUrl(rawUrl: string): Promise<JobExtractionResult> {
  const validation = validateJobUrl(rawUrl);
  if (!validation.isValid || !validation.canonicalUrl) {
    return {
      extracted: false,
      canonicalUrl: rawUrl,
      source: "generic_url",
      sourceDomain: "",
      message: validation.error || "Invalid job posting URL.",
    };
  }

  const canonicalUrl = validation.canonicalUrl;
  let sourceDomain = "";
  try {
    sourceDomain = new URL(canonicalUrl).hostname.toLowerCase();
  } catch {
    sourceDomain = "";
  }

  // 1. Check for Greenhouse
  const ghParams = parseGreenhouseUrl(canonicalUrl);
  if (ghParams) {
    const job = await fetchGreenhouseJob(ghParams.boardToken, ghParams.jobId, canonicalUrl, sourceDomain);
    if (job) {
      return {
        extracted: true,
        canonicalUrl,
        source: "greenhouse",
        sourceDomain,
        job,
      };
    }
    return {
      extracted: false,
      canonicalUrl,
      source: "greenhouse",
      sourceDomain,
      message: "We couldn't extract the job details from this Greenhouse URL. Paste the job description below to continue.",
    };
  }

  // 2. Check for Lever
  const leverParams = parseLeverUrl(canonicalUrl);
  if (leverParams) {
    const job = await fetchLeverJob(leverParams.site, leverParams.postingId, canonicalUrl, sourceDomain);
    if (job) {
      return {
        extracted: true,
        canonicalUrl,
        source: "lever",
        sourceDomain,
        job,
      };
    }
    return {
      extracted: false,
      canonicalUrl,
      source: "lever",
      sourceDomain,
      message: "We couldn't extract the job details from this Lever URL. Paste the job description below to continue.",
    };
  }

  // 3. Known unsupported domains (LinkedIn, Workday) and generic URLs
  let source: JobSource = "generic_url";
  if (sourceDomain.includes("linkedin.com")) source = "linkedin";
  else if (sourceDomain.includes("myworkdayjobs.com") || sourceDomain.includes("workday.com")) source = "workday";

  return {
    extracted: false,
    canonicalUrl,
    source,
    sourceDomain,
    message: "We couldn't extract the job details from this URL. Paste the job description below to continue.",
  };
}
