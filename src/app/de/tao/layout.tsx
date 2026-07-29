import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tạo đề bài tập — chế độ giáo viên",
  description: "Giáo viên tạo bộ đề sinh tất định từ số liệu thật, nhận mã 6 ký tự cho học sinh và mã quản trị để xem kết quả.",
  robots: { index: false, follow: true },
};

export default function LayoutTaoDe({ children }: { children: ReactNode }) {
  return children;
}
