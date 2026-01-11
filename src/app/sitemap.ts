import { MetadataRoute } from 'next';
import resumePages from '@/data/resumePages.json';

export const revalidate = 0;

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://jobfit.co.in';
    const lastModified = new Date().toISOString();

    return [
        {
            url: `${baseUrl}/`,
            lastModified,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/ats-resume-checker`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/resume-based-on-job-description`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/job-fit-resume`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.8,
        },

        ...resumePages.map((page) => ({
            url: `${baseUrl}/resume-for/${page.slug}`,
            lastModified,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        })),
    ];
}
