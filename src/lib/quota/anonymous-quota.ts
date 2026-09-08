import { cookies, headers } from "next/headers";
import crypto from "crypto";

const QUOTA_COOKIE_NAME = "jobfit_anon_quota";
const MAX_ANON_SCANS = 3;
const SECRET = process.env.NEXTAUTH_SECRET || "jobfit-anonymous-quota-secret-salt";

interface QuotaPayload {
  count: number;
  ipHash: string;
  firstUsedAt: number;
}

async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();
  } catch {
    // fallback if headers() fails in non-request contexts
  }
  return "127.0.0.1";
}

function hashIp(ip: string): string {
  return crypto.createHmac("sha256", SECRET).update(ip).digest("hex").substring(0, 16);
}

function signPayload(payload: QuotaPayload): string {
  const jsonStr = JSON.stringify(payload);
  const base64 = Buffer.from(jsonStr).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(base64).digest("base64url");
  return `${base64}.${signature}`;
}

function verifyPayload(cookieVal: string): QuotaPayload | null {
  try {
    const parts = cookieVal.split(".");
    if (parts.length !== 2) return null;
    const [base64, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(base64).digest("base64url");
    if (signature !== expectedSig) return null;

    const jsonStr = Buffer.from(base64, "base64url").toString("utf-8");
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed.count === "number" && typeof parsed.ipHash === "string") {
      return parsed as QuotaPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function checkAnonymousQuota(): Promise<{
  allowed: boolean;
  count: number;
  remaining: number;
  maxScans: number;
}> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(QUOTA_COOKIE_NAME)?.value;
  const ip = await getClientIp();
  const currentIpHash = hashIp(ip);

  let quota: QuotaPayload | null = null;
  if (rawCookie) {
    quota = verifyPayload(rawCookie);
  }

  const currentCount = quota ? quota.count : 0;
  const remaining = Math.max(0, MAX_ANON_SCANS - currentCount);

  return {
    allowed: currentCount < MAX_ANON_SCANS,
    count: currentCount,
    remaining,
    maxScans: MAX_ANON_SCANS,
  };
}

export async function incrementAnonymousQuota(): Promise<{
  newCount: number;
  remaining: number;
  cookieHeader: string;
}> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(QUOTA_COOKIE_NAME)?.value;
  const ip = await getClientIp();
  const currentIpHash = hashIp(ip);

  let quota = rawCookie ? verifyPayload(rawCookie) : null;
  const newCount = (quota?.count || 0) + 1;

  const updated: QuotaPayload = {
    count: newCount,
    ipHash: currentIpHash,
    firstUsedAt: quota?.firstUsedAt || Date.now(),
  };

  const signedToken = signPayload(updated);
  
  // Set cookie for 30 days
  cookieStore.set(QUOTA_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return {
    newCount,
    remaining: Math.max(0, MAX_ANON_SCANS - newCount),
    cookieHeader: signedToken,
  };
}
