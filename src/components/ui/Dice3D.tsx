"use client";

import { useEffect, useRef, useState, useMemo } from "react";

// ============================================================
// 3D Dice Animation — CSS 3D cube (d6) & gem-cube (d20)
// ============================================================

const SIZE = 60;
const HALF = SIZE / 2;
const ROLL_DURATION = 1200;

// ── d6 pip layouts (x%, y%) ──────────────────────────────────
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
};

// Final rotation to show each d6 face (the face with value N faces the viewer)
const D6_FINAL: Record<number, string> = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(-90deg) rotateY(0deg)",
  3: "rotateY(90deg) rotateX(0deg)",
  4: "rotateY(-90deg) rotateX(0deg)",
  5: "rotateX(90deg) rotateY(0deg)",
  6: "rotateX(180deg) rotateY(0deg)",
};

// ── Pip face SVG ─────────────────────────────────────────────
function D6Face({ value }: { value: number }) {
  const pips = PIPS[value] ?? [];
  return (
    <svg viewBox="0 0 100 100" width={SIZE} height={SIZE} style={{ display: "block" }}>
      <rect width="100" height="100" rx="16" fill="#1e1a16" stroke="#6b5a3e" strokeWidth="3.5" />
      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={9.5} fill="#c9a227" />
      ))}
    </svg>
  );
}

// ── d20 face — dark purple gem with golden number ────────────
function D20Face({ value }: { value: number }) {
  return (
    <svg viewBox="0 0 100 100" width={SIZE} height={SIZE} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`d20g${value}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1f1530" />
          <stop offset="100%" stopColor="#2a1a3e" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="16" fill={`url(#d20g${value})`} stroke="#7a5cad" strokeWidth="3.5" />
      {/* Subtle diamond shape */}
      <polygon points="50,12 88,50 50,88 12,50" fill="none" stroke="#9370db" strokeWidth="1" opacity="0.3" />
      <text
        x="50" y="54"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={value >= 10 ? 34 : 40}
        fontWeight="bold"
        fill="#c9a227"
        fontFamily="Georgia, serif"
      >
        {value}
      </text>
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────
export interface Dice3DProps {
  type: "d6" | "d20";
  value: number | null;
  rolling: boolean;
  onAnimationEnd?: () => void;
}

export function Dice3D({ type, value, rolling, onAnimationEnd }: Dice3DProps) {
  const [settled, setSettled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animEndRef = useRef(onAnimationEnd);
  animEndRef.current = onAnimationEnd;

  // Stable random face values for d20 non-result faces
  const d20Faces = useMemo(() => {
    const faces = [value ?? 20];
    const used = new Set(faces);
    while (faces.length < 6) {
      let n = Math.floor(Math.random() * 20) + 1;
      while (used.has(n)) n = (n % 20) + 1;
      used.add(n);
      faces.push(n);
    }
    return faces;
  }, [value]);

  useEffect(() => {
    if (rolling) {
      setSettled(false);
      timerRef.current = setTimeout(() => {
        setSettled(true);
        animEndRef.current?.();
      }, ROLL_DURATION);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [rolling]);

  // Build final transform for settled state
  const finalTransform = type === "d6"
    ? (D6_FINAL[value ?? 1] ?? "rotateX(0deg) rotateY(0deg)")
    : "rotateX(0deg) rotateY(0deg)";

  // Generate unique animation name per roll so it always re-triggers
  const animId = useMemo(() => `dt${Date.now()}`, [rolling]); // eslint-disable-line react-hooks/exhaustive-deps

  const containerStyle: React.CSSProperties = {
    width: SIZE,
    height: SIZE,
    position: "relative" as const,
    transformStyle: "preserve-3d" as const,
  };

  if (rolling && !settled) {
    Object.assign(containerStyle, {
      animation: `${animId} ${ROLL_DURATION}ms cubic-bezier(.15,.6,.35,1) forwards`,
    });
  } else if (settled || !rolling) {
    Object.assign(containerStyle, {
      transform: finalTransform,
      transition: "transform 0.35s cubic-bezier(.25,.8,.25,1)",
    });
  }

  const faces = type === "d6"
    ? [1, 6, 3, 4, 2, 5]
    : d20Faces;

  const FaceComponent = type === "d6" ? D6Face : D20Face;

  // Dynamic keyframes unique per roll
  const keyframesCSS = `
    @keyframes ${animId} {
      0%   { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
      15%  { transform: rotateX(120deg) rotateY(80deg) rotateZ(30deg); }
      30%  { transform: rotateX(260deg) rotateY(200deg) rotateZ(90deg); }
      50%  { transform: rotateX(420deg) rotateY(380deg) rotateZ(170deg); }
      70%  { transform: rotateX(580deg) rotateY(540deg) rotateZ(280deg); }
      85%  { transform: rotateX(680deg) rotateY(660deg) rotateZ(340deg); }
      100% { transform: ${finalTransform} rotateZ(0deg); }
    }
  `;

  return (
    <div className="dice3d-wrapper" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <style>{DICE_CSS}{rolling ? keyframesCSS : ""}</style>
      <div className="dice3d-scene">
        <div style={containerStyle} className={rolling && !settled ? "dice3d-glow" : ""}>
          <div className="dice3d-face dice3d-front"><FaceComponent value={faces[0]} /></div>
          <div className="dice3d-face dice3d-back"><FaceComponent value={faces[1]} /></div>
          <div className="dice3d-face dice3d-right"><FaceComponent value={faces[2]} /></div>
          <div className="dice3d-face dice3d-left"><FaceComponent value={faces[3]} /></div>
          <div className="dice3d-face dice3d-top"><FaceComponent value={faces[4]} /></div>
          <div className="dice3d-face dice3d-bottom"><FaceComponent value={faces[5]} /></div>
        </div>
      </div>
    </div>
  );
}

// ── CSS ──────────────────────────────────────────────────────
const DICE_CSS = `
  .dice3d-scene {
    width: ${SIZE}px;
    height: ${SIZE}px;
    perspective: 280px;
    perspective-origin: 50% 50%;
  }

  .dice3d-face {
    position: absolute;
    width: ${SIZE}px;
    height: ${SIZE}px;
    backface-visibility: visible;
  }

  .dice3d-front  { transform: translateZ(${HALF}px); }
  .dice3d-back   { transform: rotateY(180deg) translateZ(${HALF}px); }
  .dice3d-right  { transform: rotateY(90deg)  translateZ(${HALF}px); }
  .dice3d-left   { transform: rotateY(-90deg) translateZ(${HALF}px); }
  .dice3d-top    { transform: rotateX(90deg)  translateZ(${HALF}px); }
  .dice3d-bottom { transform: rotateX(-90deg) translateZ(${HALF}px); }

  .dice3d-glow {
    filter: drop-shadow(0 0 14px rgba(201, 162, 39, 0.55));
  }
`;
