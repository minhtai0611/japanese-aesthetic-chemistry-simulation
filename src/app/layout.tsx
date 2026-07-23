import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Be_Vietnam_Pro, Playfair_Display, IBM_Plex_Mono } from "next/font/google";
import { SITE } from "@/lib/site";
import DieuHuong from "@/components/dieu-huong";
import ChanTrang from "@/components/chan-trang";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["vietnamese", "latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.ten} ${SITE.kanji} — Phòng thí nghiệm hóa học ảo | Dữ liệu mở PubChem`,
    template: `%s · ${SITE.ten} ${SITE.kanji}`,
  },
  description: SITE.moTa,
  keywords: [
    "phòng thí nghiệm hóa học ảo",
    "mô phỏng thí nghiệm hóa học",
    "bảng tuần hoàn tiếng Việt",
    "PubChem tiếng Việt",
    "118 nguyên tố hóa học",
    "chuẩn độ axit bazơ",
    "pha loãng dung dịch",
    "xem phân tử 3D",
    "hóa học trực quan",
    "học hóa học online",
  ],
  authors: [{ name: "KAGAKU Lab" }],
  creator: "KAGAKU Lab",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE.url,
    siteName: `${SITE.ten} — ${SITE.khauHieu}`,
    title: `${SITE.ten} ${SITE.kanji} — Phòng thí nghiệm hóa học ảo`,
    description: SITE.moTa,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.ten} ${SITE.kanji} — Phòng thí nghiệm hóa học ảo`,
    description: SITE.moTa,
  },
  category: "Giáo dục khoa học",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "KAGAKU — Phòng thí nghiệm hóa học ảo",
      alternateName: "Kagaku かがく",
      url: SITE.url,
      inLanguage: "vi",
      description: SITE.moTa,
    },
    {
      "@type": "Organization",
      name: "KAGAKU Lab",
      url: SITE.url,
      logo: `${SITE.url}/icon`,
    },
    {
      "@type": "EducationalOrganization",
      name: "KAGAKU — Phòng thí nghiệm hóa học số",
      url: SITE.url,
      knowsAbout: ["Hóa học", "Bảng tuần hoàn", "Mô phỏng thí nghiệm", "PubChem"],
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${playfair.variable} ${plexMono.variable}`}>
      <body className="hat-ro min-h-screen bg-sumi text-washi antialiased">
        <a href="#noi-dung-chinh" className="lien-ket-bo-qua">
          Bỏ qua tới nội dung chính
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <DieuHuong />
        <div id="noi-dung-chinh">{children}</div>
        <ChanTrang />
      </body>
    </html>
  );
}
