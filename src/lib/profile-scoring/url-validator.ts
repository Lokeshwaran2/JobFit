/**
 * Validates and normalizes GitHub & LinkedIn profile URLs
 */

export interface ValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  identifier?: string;
  error?: string;
}

export function validateAndNormalizeGithubUrl(input: string | null | undefined): ValidationResult {
  if (!input || !input.trim()) {
    return { isValid: true, normalizedUrl: undefined, identifier: undefined };
  }

  let clean = input.trim();
  // Handle if user just entered "username" or "@username"
  if (/^@?[a-zA-Z0-9-]+$/.test(clean) && !clean.includes(".")) {
    const user = clean.replace(/^@/, "");
    return {
      isValid: true,
      normalizedUrl: `https://github.com/${user}`,
      identifier: user,
    };
  }

  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }

  try {
    const url = new URL(clean);
    const host = url.hostname.toLowerCase();

    if (host !== "github.com" && host !== "www.github.com") {
      return {
        isValid: false,
        error: "URL must be a valid GitHub profile (e.g. https://github.com/username)",
      };
    }

    // Pathname should be /username or /username/
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return {
        isValid: false,
        error: "GitHub profile URL must include a username",
      };
    }

    const username = segments[0];
    // GitHub usernames: max 39 characters, alphanumeric and single hyphens
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
      return {
        isValid: false,
        error: `Invalid GitHub username "${username}"`,
      };
    }

    return {
      isValid: true,
      normalizedUrl: `https://github.com/${username}`,
      identifier: username,
    };
  } catch {
    return {
      isValid: false,
      error: "Invalid GitHub URL format",
    };
  }
}

export function validateAndNormalizeLinkedinUrl(input: string | null | undefined): ValidationResult {
  if (!input || !input.trim()) {
    return { isValid: true, normalizedUrl: undefined, identifier: undefined };
  }

  let clean = input.trim();
  // Handle if user just entered "in/username" or "username"
  if (/^[a-zA-Z0-9-_]+$/.test(clean) && !clean.includes(".")) {
    return {
      isValid: true,
      normalizedUrl: `https://www.linkedin.com/in/${clean}`,
      identifier: clean,
    };
  }

  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }

  try {
    const url = new URL(clean);
    const host = url.hostname.toLowerCase();

    if (!host.endsWith("linkedin.com")) {
      return {
        isValid: false,
        error: "URL must be a valid LinkedIn profile (e.g. https://linkedin.com/in/username)",
      };
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return {
        isValid: false,
        error: "LinkedIn profile URL must include a profile path",
      };
    }

    // Usually /in/username
    let username = segments[segments.length - 1];
    if (segments[0] === "in" && segments[1]) {
      username = segments[1];
    }

    return {
      isValid: true,
      normalizedUrl: `https://www.linkedin.com/in/${username}`,
      identifier: username,
    };
  } catch {
    return {
      isValid: false,
      error: "Invalid LinkedIn URL format",
    };
  }
}
