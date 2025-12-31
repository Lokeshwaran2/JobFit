import { MetadataRoute } from 'next';

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
            url: `${baseUrl}/builder`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.8,
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
    ];
}
