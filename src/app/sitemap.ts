import type { MetadataRoute } from "next";
import { fetchAllElements } from "@/lib/pubchem";
import { SITE } from "@/lib/site";
import { FEATURED_COMPOUNDS } from "@/lib/featured-compounds";
import { slugifyCompound } from "@/lib/slug";
import { LABS } from "@/lib/laboratory";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/periodic-table`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/experiments`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/compound`, changeFrequency: "monthly", priority: 0.8 },
    ...LABS.map((p) => ({
      url: `${SITE.url}/experiments/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const elements = await fetchAllElements();
  const elementRoutes: MetadataRoute.Sitemap = elements.map((n) => ({
    url: `${SITE.url}/element/${n.symbol.toLowerCase()}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const compoundRoutes: MetadataRoute.Sitemap = FEATURED_COMPOUNDS.map((c) => ({
    url: `${SITE.url}/compound/${slugifyCompound(c.name)}`,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [...staticRoutes, ...elementRoutes, ...compoundRoutes];
}
