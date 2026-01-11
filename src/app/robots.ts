import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/login",
                    "/register",
                    "/dashboard",
                    "/checkout",
                    "/subscription",
                    "/builder",
                    "/api",
                ],
            },
        ],
        sitemap: "https://jobfit.co.in/sitemap.xml",
    };
}
