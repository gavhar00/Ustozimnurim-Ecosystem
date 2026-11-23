import type { MetadataRoute } from "next";
import { kurslarRoyxati } from "@/lib/data/kurslar";
import { yonalishlarRoyxati } from "@/lib/data/yonalishlar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ustozimnurim.uz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sahifalar = [
    "",
    "/kurslar",
    "/yonalishlar",
    "/hamjamiyat",
    "/notlar",
    "/biz-haqimizda",
  ].map((yol) => ({
    url: `${SITE_URL}${yol}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: yol === "" ? 1 : 0.8,
  }));

  const yonalishlar = (await yonalishlarRoyxati()).map((y) => ({
    url: `${SITE_URL}/yonalishlar/${y.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const kurslar = (await kurslarRoyxati()).map((k) => ({
    url: `${SITE_URL}/kurslar/${k.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...sahifalar, ...yonalishlar, ...kurslar];
}
