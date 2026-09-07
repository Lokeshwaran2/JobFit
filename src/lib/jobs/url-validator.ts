import { canonicalizeJobUrl } from "./job-fingerprint";

/**
 * Validates a job URL for security and protocol compliance.
 * Enforces:
 * - http: or https: only
 * - Rejects malformed URLs
 * - Rejects dangerous protocols (javascript:, file:, data:, ftp:, etc.)
 * - Rejects SSRF targets (localhost, private network ranges, cloud metadata)
 */
export function validateJobUrl(rawUrl: string | null | undefined): {
  isValid: boolean;
  canonicalUrl: string | null;
  error?: string;
} {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return {
      isValid: false,
      canonicalUrl: null,
      error: "Job URL cannot be empty.",
    };
  }

  const trimmed = rawUrl.trim();

  // Explicit check for non-http(s) schemes
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== "http" && scheme !== "https") {
      return {
        isValid: false,
        canonicalUrl: null,
        error: `Unsupported protocol "${scheme}:". Only http:// and https:// URLs are accepted.`,
      };
    }
  }

  const canonicalUrl = canonicalizeJobUrl(trimmed);
  if (!canonicalUrl) {
    return {
      isValid: false,
      canonicalUrl: null,
      error: "Invalid URL format. Please provide a valid HTTP or HTTPS job posting URL.",
    };
  }

  try {
    const parsed = new URL(canonicalUrl);
    const hostname = parsed.hostname.toLowerCase();

    // SSRF / Private IP / Metadata address protection
    if (isRestrictedHostname(hostname)) {
      return {
        isValid: false,
        canonicalUrl: null,
        error: "Invalid or restricted job URL hostname.",
      };
    }

    return {
      isValid: true,
      canonicalUrl,
    };
  } catch {
    return {
      isValid: false,
      canonicalUrl: null,
      error: "Malformed URL.",
    };
  }
}

/**
 * Checks if a hostname resolves to a loopback, private address, or cloud metadata endpoint.
 */
export function isRestrictedHostname(hostname: string): boolean {
  if (!hostname) return true;

  const h = hostname.toLowerCase().trim();

  // Localhost and loopback aliases
  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "::1" ||
    h === "[::1]" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  ) {
    return true;
  }

  // AWS/GCP/Azure link-local metadata address
  if (h === "169.254.169.254" || h.startsWith("169.254.")) {
    return true;
  }

  // IPv4 Private Address Blocks (RFC 1918) & Carrier-Grade NAT (RFC 6598)
  const ipv4Match = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, oct1, oct2] = ipv4Match.map(Number);
    // 10.0.0.0/8
    if (oct1 === 10) return true;
    // 172.16.0.0/12 (172.16 - 172.31)
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) return true;
    // 192.168.0.0/16
    if (oct1 === 192 && oct2 === 168) return true;
    // 127.0.0.0/8
    if (oct1 === 127) return true;
    // 0.0.0.0/8
    if (oct1 === 0) return true;
    // 100.64.0.0/10 (CGNAT)
    if (oct1 === 100 && oct2 >= 64 && oct2 <= 127) return true;
  }

  return false;
}
