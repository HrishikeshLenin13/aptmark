import type { Figure as FigureType } from "@/lib/types";
export function Figure({ figure }: { figure: FigureType }) {
  if (figure.kind === "triangle")
    return (
      <figure className="question-figure">
        <svg viewBox="0 0 320 200" role="img" aria-label={figure.alt}>
          <path
            d="M55 160 L265 160 L55 35 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M55 145 L70 145 L70 160" fill="none" stroke="currentColor" />
          <text x="35" y="30">
            B
          </text>
          <text x="275" y="170">
            A
          </text>
          <text x="35" y="180">
            C
          </text>
          <text x="12" y="105">
            {figure.sides?.[0]}
          </text>
          <text x="150" y="185">
            {figure.sides?.[1]}
          </text>
          <text x="165" y="85">
            {figure.sides?.[2]}
          </text>
        </svg>
        <figcaption>Figure not drawn to scale</figcaption>
      </figure>
    );
  const h = figure.h ?? 0,
    k = figure.k ?? 0,
    a = figure.a ?? 1;
  const pts = Array.from({ length: 81 }, (_, i) => {
    const x = h - 2 + i / 20,
      y = a * (x - h) ** 2 + k;
    return `${30 + i * 3.25},${170 - ((y - k) / (4 * a)) * 140}`;
  }).join(" ");
  return (
    <figure className="question-figure">
      <svg viewBox="0 0 320 220" role="img" aria-label={figure.alt}>
        {[30, 95, 160, 225, 290].map((x, i) => (
          <g key={x}>
            <line x1={x} y1="20" x2={x} y2="175" stroke="#e3e9e5" />
            <text x={x} y="195" textAnchor="middle" fontSize="12">
              {h - 2 + i}
            </text>
          </g>
        ))}
        {[30, 65, 100, 135, 170].map((y, i) => (
          <g key={y}>
            <line x1="25" x2="295" y1={y} y2={y} stroke="#e3e9e5" />
            <text x="8" y={y + 4} fontSize="9">
              {k + (4 - i) * a}
            </text>
          </g>
        ))}
        <polyline points={pts} fill="none" stroke="#245c45" strokeWidth="2.5" />
        <circle cx="160" cy="170" r="4" fill="#245c45" />
        <text x="305" y="175">
          x
        </text>
      </svg>
      <figcaption>
        Coordinates shown on a local window around the vertex.
      </figcaption>
    </figure>
  );
}
