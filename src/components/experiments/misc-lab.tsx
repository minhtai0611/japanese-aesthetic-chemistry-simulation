import Link from "next/link";
import { LABS, type LabSlug } from "@/lib/laboratory";

export default function MiscLab({ current }: { current: LabSlug }) {
  const others = LABS.filter((p) => p.slug !== current);
  return (
    <div className="mt-16 flex flex-wrap gap-2 border-t border-washi/10 pt-8">
      <span className="text-xs text-washi-mo">Phòng khác:</span>
      {others.map((p) => (
        <Link
          key={p.slug}
          href={`/experiments/${p.slug}`}
          className="rounded-full border border-washi/12 px-4 py-1.5 text-xs text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
        >
          {p.kanji} {p.label}
        </Link>
      ))}
    </div>
  );
}
