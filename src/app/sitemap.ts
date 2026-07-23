import type { MetadataRoute } from "next";
import { layTatCaNguyenTo } from "@/lib/pubchem";
import { SITE } from "@/lib/site";
import { HOP_CHAT_NOI_BAT } from "@/lib/hop-chat-noi-bat";
import { slugHoaHopChat } from "@/lib/slug";
import { CAC_PHONG } from "@/lib/phong-thi-nghiem";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const duongCoDinh: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/bang-tuan-hoan`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/thi-nghiem`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/hop-chat`, changeFrequency: "monthly", priority: 0.8 },
    ...CAC_PHONG.map((p) => ({
      url: `${SITE.url}/thi-nghiem/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const nguyenTo = await layTatCaNguyenTo();
  const duongNguyenTo: MetadataRoute.Sitemap = nguyenTo.map((n) => ({
    url: `${SITE.url}/nguyen-to/${n.kyHieu.toLowerCase()}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const duongHopChat: MetadataRoute.Sitemap = HOP_CHAT_NOI_BAT.map((c) => ({
    url: `${SITE.url}/hop-chat/${slugHoaHopChat(c.ten)}`,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [...duongCoDinh, ...duongNguyenTo, ...duongHopChat];
}
