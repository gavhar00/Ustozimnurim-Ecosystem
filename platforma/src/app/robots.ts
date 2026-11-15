import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ustozimnurim.uz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/kirish", "/royxatdan-otish", "/parolni-tiklash", "/panel"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
