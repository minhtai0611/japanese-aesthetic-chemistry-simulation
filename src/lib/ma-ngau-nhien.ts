/** Mã ngẫu nhiên cho học sinh/giáo viên gõ tay — bỏ ký tự dễ nhầm (0/O, 1/I/L). */
import { randomInt } from "crypto";

const BANG_CHU = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function taoMaNgauNhien(doDai: number): string {
  let ra = "";
  for (let i = 0; i < doDai; i++) ra += BANG_CHU[randomInt(BANG_CHU.length)];
  return ra;
}
