import type { MetadataRoute } from "next";
import { layTatCaNguyenTo } from "@/lib/pubchem";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const duongCoDinh: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/bang-tuan-hoan`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/thi-nghiem`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/hop-chat`, changeFrequency: "monthly", priority: 0.8 },
  ];

  const nguyenTo = await layTatCaNguyenTo();
  const duongNguyenTo: MetadataRoute.Sitemap = nguyenTo.map((n) => ({
    url: `${SITE.url}/nguyen-to/${n.kyHieu.toLowerCase()}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...duongCoDinh, ...duongNguyenTo];
}
