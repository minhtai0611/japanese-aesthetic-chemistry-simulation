interface BohrModelProps {
  shells: number[];   // electron count per shell n = 1..7
  symbol: string;
  color: string;
  size?: number;       // SVG side length
}

/**
 * Bohr model — built purely with SVG + CSS animation (no client JS).
 * The electron count per shell is derived from the REAL electron config from PubChem.
 */
export default function BohrModel({ shells, symbol, color, size = 340 }: BohrModelProps) {
  const center = size / 2;
  const ringStep = Math.min((center - 36) / Math.max(shells.length, 1), 30);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-auto w-full max-w-[380px]"
      role="img"
      aria-label={`Mô hình Bohr của ${symbol} với các lớp electron ${shells.join(", ")}`}
    >
      <defs>
        <radialGradient id={`nucleus-${symbol}`} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#ffd9c2" />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor="#241208" />
        </radialGradient>
      </defs>

      {shells.map((electronCount, ring) => {
        const r = 28 + (ring + 1) * ringStep;
        const startAngle = (ring * 137.5) % 360;
        return (
          <g key={ring}>
            <circle
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="rgba(242,234,217,0.16)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            <g
              className="animate-xoay-cham"
              style={{
                transformOrigin: `${center}px ${center}px`,
                animationDuration: `${10 + ring * 5}s`,
                animationDirection: ring % 2 ? "reverse" : "normal",
              }}
            >
              {Array.from({ length: electronCount }).map((_, e) => {
                const angle = ((360 / electronCount) * e + startAngle) * (Math.PI / 180);
                return (
                  <circle
                    key={e}
                    cx={center + r * Math.cos(angle)}
                    cy={center + r * Math.sin(angle)}
                    r={4.2}
                    fill="#f2ead9"
                    stroke={color}
                    strokeWidth="1.4"
                  />
                );
              })}
            </g>
            <text
              x={center + r + 8}
              y={center - 4}
              fontSize="10"
              fill="rgba(242,234,217,0.35)"
              fontFamily="var(--font-mono)"
            >
              n={ring + 1}
            </text>
          </g>
        );
      })}

      <circle cx={center} cy={center} r={24} fill={`url(#nucleus-${symbol})`} stroke={color} strokeOpacity="0.6" />
      <text
        x={center}
        y={center + 6}
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        fill="#0b0a08"
        fontFamily="var(--font-display)"
      >
        {symbol}
      </text>
    </svg>
  );
}
