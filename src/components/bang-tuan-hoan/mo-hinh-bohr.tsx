interface ThuocTinhBohr {
  lopVo: number[];   // số electron từng lớp n = 1..7
  kyHieu: string;
  mau: string;
  co?: number;       // cạnh SVG
}

/**
 * Nguyên mẫu Bohr — dựng thuần bằng SVG + hoạt cảnh CSS (không JS client).
 * Số electron mỗi lớp được suy từ cấu hình electron THẬT của PubChem.
 */
export default function MoHinhBohr({ lopVo, kyHieu, mau, co = 340 }: ThuocTinhBohr) {
  const tam = co / 2;
  const buocBan = Math.min((tam - 36) / Math.max(lopVo.length, 1), 30);

  return (
    <svg
      viewBox={`0 0 ${co} ${co}`}
      className="h-auto w-full max-w-[380px]"
      role="img"
      aria-label={`Mô hình Bohr của ${kyHieu} với các lớp electron ${lopVo.join(", ")}`}
    >
      <defs>
        <radialGradient id={`hat-nhan-${kyHieu}`} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#ffd9c2" />
          <stop offset="45%" stopColor={mau} />
          <stop offset="100%" stopColor="#241208" />
        </radialGradient>
      </defs>

      {lopVo.map((soE, lop) => {
        const r = 28 + (lop + 1) * buocBan;
        const gocBatDau = (lop * 137.5) % 360;
        return (
          <g key={lop}>
            <circle
              cx={tam}
              cy={tam}
              r={r}
              fill="none"
              stroke="rgba(242,234,217,0.16)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            <g
              className="animate-xoay-cham"
              style={{
                transformOrigin: `${tam}px ${tam}px`,
                animationDuration: `${10 + lop * 5}s`,
                animationDirection: lop % 2 ? "reverse" : "normal",
              }}
            >
              {Array.from({ length: soE }).map((_, e) => {
                const goc = ((360 / soE) * e + gocBatDau) * (Math.PI / 180);
                return (
                  <circle
                    key={e}
                    cx={tam + r * Math.cos(goc)}
                    cy={tam + r * Math.sin(goc)}
                    r={4.2}
                    fill="#f2ead9"
                    stroke={mau}
                    strokeWidth="1.4"
                  />
                );
              })}
            </g>
            <text
              x={tam + r + 8}
              y={tam - 4}
              fontSize="10"
              fill="rgba(242,234,217,0.35)"
              fontFamily="var(--font-mono)"
            >
              n={lop + 1}
            </text>
          </g>
        );
      })}

      <circle cx={tam} cy={tam} r={24} fill={`url(#hat-nhan-${kyHieu})`} stroke={mau} strokeOpacity="0.6" />
      <text
        x={tam}
        y={tam + 6}
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        fill="#0b0a08"
        fontFamily="var(--font-display)"
      >
        {kyHieu}
      </text>
    </svg>
  );
}
