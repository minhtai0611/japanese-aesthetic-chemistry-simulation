import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";
import FadeIn from "@/components/fade-in";
import Viewer3D from "@/components/compound/viewer-3d";
import { fetchCompound3D, fetchCompoundByVariant, type Compound3D } from "@/lib/pubchem";
import { slugifyCompound } from "@/lib/slug";
import { canRedirect, lookupVariants, isEducationalSubstance, canonicalSlug, EDUCATIONAL_SUBSTANCES } from "@/lib/substance-identification";
import { FEATURED_COMPOUNDS } from "@/lib/featured-compounds";

interface CompoundPageProps {
  params: Promise<{ name: string }>;
}

// Explicit declaration (already defaults to true): outside the education whitelist
// below, other substances still render (knowledge isn't blocked — see
// isEducationalSubstance + the "outside curriculum" banner), they just aren't
// statically prerendered at build time.
export const dynamicParams = true;

export function generateStaticParams() {
  // Prerender the entire education whitelist, not just the 8 featured compounds.
  return EDUCATIONAL_SUBSTANCES.map((c) => ({ name: c.slug }));
}

export async function generateMetadata({ params }: CompoundPageProps): Promise<Metadata> {
  const { name } = await params;
  if (canRedirect(name)) return {};

  const { matchedKeyword: resolvedName, compound } = await fetchCompoundByVariant(lookupVariants(name));
  if (!compound) return { title: "Không tìm thấy hợp chất" };

  const description = `${resolvedName} — công thức ${compound.formula ?? "—"}, khối lượng mol ${
    compound.molarMass ?? "—"
  } g/mol, CID ${compound.cid}. Mô hình 3D và thuộc tính phân tử đồng bộ từ PubChem PUG-REST.`;

  return {
    title: `${compound.formula ?? resolvedName} — hợp chất ${resolvedName}`,
    description,
    alternates: { canonical: `/compound/${canonicalSlug(name)}` },
    openGraph: {
      title: `${resolvedName} (CID ${compound.cid}) · KAGAKU`,
      description,
    },
    // Substances outside the education curriculum: don't let Google index them
    // (blocks infinite thin content — /compound/love, /compound/sunshine… aren't
    // product content meant to be promoted).
    robots: isEducationalSubstance(name) ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function CompoundPage({ params }: CompoundPageProps) {
  const { name } = await params;

  // URL with accents / uppercase / odd characters → 308 to the canonical ASCII form.
  // This is where the 500 error is defused: a segment outside Latin-1 never reaches
  // the render step below.
  const canon = canRedirect(name);
  if (canon) permanentRedirect(`/compound/${canon}`);

  const { matchedKeyword: resolvedName, compound: initialProperties } = await fetchCompoundByVariant(
    lookupVariants(name),
  );

  // ONLY notFound when properties are missing. Missing 3D conformer does NOT mean
  // "the substance doesn't exist" (e.g. chlorophyll a: PubChem has properties, no 3D).
  if (!initialProperties) notFound();

  const initial3D: Compound3D | null = await fetchCompound3D(resolvedName, initialProperties);

  const outsideCurriculum = !isEducationalSubstance(name);

  const relatedCompounds = FEATURED_COMPOUNDS.filter(
    (c) => c.name.toLowerCase() !== resolvedName.toLowerCase(),
  ).slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8">
      <nav className="flex items-center gap-1.5 text-xs text-washi-mo" aria-label="Đường mòn">
        <Link href="/" className="gach-dong hover:text-washi">Trang chủ</Link>
        <ChevronRight size={12} />
        <Link href="/compound" className="gach-dong hover:text-washi">Hợp chất 3D</Link>
        <ChevronRight size={12} />
        <span className="text-shu-sang">{resolvedName}</span>
      </nav>

      <FadeIn className="mt-8 text-center">
        <p className="chi-muc mb-4 text-shu-sang">分子観測台 — Molecular Observatory</p>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-black leading-tight capitalize sm:text-6xl">
          {initialProperties?.formula ?? resolvedName}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-washi-mo">
          Mô hình 3D và toàn bộ thuộc tính phân tử của <strong className="text-washi">{resolvedName}</strong>{" "}
          — dựng trực tiếp từ tọa độ conformer thật của PubChem.
        </p>
      </FadeIn>

      {outsideCurriculum && (
        <div role="note" className="the-khac mx-auto mt-8 max-w-2xl rounded-2xl border-l-4 border-kin p-5">
          <p className="text-sm text-washi-mo">
            <strong className="text-washi">Ngoài chương trình phổ thông.</strong>{" "}
            Chất này có trong CSDL PubChem nhưng không thuộc danh mục giáo dục của KAGAKU.
            Dữ liệu hiển thị vẫn lấy nguyên từ PubChem, không qua chỉnh sửa.
          </p>
        </div>
      )}

      {!initial3D && (
        <div role="note" className="the-khac mx-auto mt-8 max-w-2xl rounded-2xl p-6 text-center">
          <p className="text-washi-mo">
            PubChem chưa công bố tọa độ conformer 3D cho{" "}
            <strong className="text-washi">{resolvedName}</strong>. Các thuộc tính phân tử bên dưới
            vẫn là dữ liệu thật từ CID {initialProperties.cid}.
          </p>
        </div>
      )}

      <div className="mt-12">
        <Viewer3D
          initialName={resolvedName}
          initialProperties={initialProperties}
          initial3D={initial3D}
        />
      </div>

      {relatedCompounds.length > 0 && (
        <section className="mt-16">
          <p className="chi-muc mb-4 text-shu-sang">Hợp chất liên quan</p>
          <div className="flex flex-wrap gap-2">
            {relatedCompounds.map((c) => (
              <Link
                key={c.name}
                href={`/compound/${slugifyCompound(c.name)}`}
                className="rounded-full border border-washi/12 px-4 py-2 text-xs text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {initialProperties && (
        <p className="mt-10 flex items-center gap-2 text-[11px] text-washi-mo">
          <ExternalLink size={12} className="text-kin" />
          Toàn bộ số liệu trên trang này từ{" "}
          <a
            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${initialProperties.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="gach-dong text-kin"
          >
            Hợp chất CID {initialProperties.cid} trên PubChem
          </a>
        </p>
      )}
    </main>
  );
}
