import { MetadataRoute } from "next";
import resumePages from "@/data/resumePages.json";

// Only force-dynamic if resumePages.json can change without a redeploy
// (e.g. fetched from a CMS/DB at runtime). If it's a static file bundled
// at build time, drop `dynamic` entirely and let Next.js cache the sitemap.
export const dynamic = "force-dynamic";

const baseUrl = "https://jobfit.co.in";

// Bump this only when you actually edit the shared template/layout
// for the /resume-for/* pages. Not on every deploy.
const ROLE_TEMPLATE_LAST_UPDATED = new Date("2026-08-15");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    return [
        {
            url: `${baseUrl}/`,
            lastModified: new Date("2026-09-01"), // update when homepage content actually changes
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: `${baseUrl}/ats-resume-checker`,
            lastModified: new Date("2026-09-01"),
            changeFrequency: "monthly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/resume-based-on-job-description`,
            lastModified: new Date("2026-09-01"),
            changeFrequency: "monthly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/job-fit-resume`,
            lastModified: new Date("2026-09-01"),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/resume-for`,
            lastModified: new Date("2026-09-01"),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        ...resumePages.map((page) => ({
            url: `${baseUrl}/resume-for/${page.slug}`,
            // If resumePages.json entries ever get an `updatedAt` field, use
            // `page.updatedAt ? new Date(page.updatedAt) : ROLE_TEMPLATE_LAST_UPDATED`
            lastModified: ROLE_TEMPLATE_LAST_UPDATED,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        })),
    ];
}