/**
 * Hệ số co tọa độ conformer 3D thật (Å, từ PubChem record_type=3d) về đơn vị
 * khung cảnh three.js hiển thị. Tách riêng khỏi pubchem.ts (dù đây là nơi
 * dùng nó lần đầu) vì pubchem.ts import động `@/db` — bất kỳ component
 * "use client" nào import GIÁ TRỊ (không phải `import type`) từ pubchem.ts
 * đều kéo cả pg/Node builtins (fs/net/tls) vào bundle trình duyệt, làm vỡ
 * `next build`. File hằng số thuần này an toàn để import trực tiếp từ cả
 * client component lẫn pubchem.ts.
 */
export const TY_LE_TOA_DO_3D = 0.62;
