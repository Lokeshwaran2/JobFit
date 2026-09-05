import { CuratedResourceDTO, ResourceStatus } from "./types";

export interface VerificationResult {
  url: string;
  status: ResourceStatus;
  statusCode?: number;
  finalUrl?: string;
  isRedirected?: boolean;
  error?: string;
  verifiedAt: Date;
}

export class ResourceVerificationService {
  private cache: Map<string, VerificationResult> = new Map();
  private static CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

  /**
   * Verifies an external URL via HTTP HEAD/GET with timeout.
   */
  public async verifyUrl(url: string, timeoutMs: number = 6000): Promise<VerificationResult> {
    // Check in-memory verification cache
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.verifiedAt.getTime() < ResourceVerificationService.CACHE_TTL_MS) {
      return cached;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Validate URL syntax
      const parsedUrl = new URL(url);
      if (!parsedUrl.protocol.startsWith("http")) {
        throw new Error("Invalid protocol: must be HTTP or HTTPS");
      }

      // First attempt with lightweight HEAD request
      let response: Response | null = null;
      try {
        response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
          headers: {
            "User-Agent": "JobFit-ResourceVerifier/1.0 (+https://jobfit.ai)",
          },
        });
      } catch (headErr) {
        // Some servers reject HEAD requests (e.g. 405 Method Not Allowed or 403)
        // We will fallback to GET below
      }

      if (!response || response.status === 405 || response.status === 403) {
        response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": "JobFit-ResourceVerifier/1.0 (+https://jobfit.ai)",
            Range: "bytes=0-1024", // lightweight range request
          },
        });
      }

      clearTimeout(timeoutId);

      const isRedirected = Boolean(response.redirected || (response.url && response.url !== url));
      const isSuccess = response.status >= 200 && response.status < 400;

      const result: VerificationResult = {
        url,
        status: isSuccess ? (isRedirected ? "redirected" : "active") : "inactive",
        statusCode: response.status,
        finalUrl: response.url || url,
        isRedirected,
        error: isSuccess ? undefined : `HTTP status ${response.status}`,
        verifiedAt: new Date(),
      };

      this.cache.set(url, result);
      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);

      const errorMsg =
        err.name === "AbortError"
          ? "Request timed out after " + timeoutMs + "ms"
          : err.message || "Network error";

      const result: VerificationResult = {
        url,
        status: "inactive",
        error: errorMsg,
        verifiedAt: new Date(),
      };

      this.cache.set(url, result);
      return result;
    }
  }

  /**
   * Verifies a list of curated resources.
   * If primary is inactive, seamlessly swaps with the active alternative.
   */
  public async verifyAndApplyFallbacks(
    primary: CuratedResourceDTO | null,
    alternative: CuratedResourceDTO | null
  ): Promise<{
    activePrimary: CuratedResourceDTO | null;
    activeAlternative: CuratedResourceDTO | null;
    wasFallbackApplied: boolean;
  }> {
    if (!primary) {
      return {
        activePrimary: alternative ? { ...alternative, isPrimary: true } : null,
        activeAlternative: null,
        wasFallbackApplied: !!alternative,
      };
    }

    // Verify primary
    const primaryCheck = await this.verifyUrl(primary.url);
    const updatedPrimary: CuratedResourceDTO = {
      ...primary,
      status: primaryCheck.status,
      lastVerifiedAt: primaryCheck.verifiedAt.toISOString(),
      verificationError: primaryCheck.error || null,
    };

    if (primaryCheck.status === "active" || primaryCheck.status === "redirected") {
      // Primary is healthy
      return {
        activePrimary: updatedPrimary,
        activeAlternative: alternative,
        wasFallbackApplied: false,
      };
    }

    // Primary is inactive! Check if alternative is available and healthy
    console.warn(
      `[ResourceVerificationService] Primary resource "${primary.title}" is ${primaryCheck.status} (${primaryCheck.error}). Attempting fallback to alternative.`
    );

    if (alternative) {
      const altCheck = await this.verifyUrl(alternative.url);
      if (altCheck.status === "active" || altCheck.status === "redirected") {
        const promotedAlternative: CuratedResourceDTO = {
          ...alternative,
          isPrimary: true,
          status: altCheck.status,
          lastVerifiedAt: altCheck.verifiedAt.toISOString(),
          verificationError: null,
          whyThisResource: `Promoted fallback (Primary was unavailable: ${primaryCheck.error || "offline"})`,
        };

        return {
          activePrimary: promotedAlternative,
          activeAlternative: null,
          wasFallbackApplied: true,
        };
      }
    }

    // If both failed, return primary with inactive status (caller can show notice or retry)
    return {
      activePrimary: updatedPrimary,
      activeAlternative: alternative,
      wasFallbackApplied: false,
    };
  }

  /**
   * Batch verification helper designed for background jobs or scheduled maintenance.
   */
  public async batchVerify(urls: string[]): Promise<Map<string, VerificationResult>> {
    const results = new Map<string, VerificationResult>();
    // Process in batches of 5 to avoid socket saturation
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map((u) => this.verifyUrl(u));
      const batchResults = await Promise.all(batchPromises);
      for (const res of batchResults) {
        results.set(res.url, res);
      }
    }
    return results;
  }
}

export const resourceVerificationService = new ResourceVerificationService();
