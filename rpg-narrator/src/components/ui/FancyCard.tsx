"use client";

import { useRef, useCallback, CSSProperties, ReactNode } from "react";

/* ── Medieval themes — warm, muted, no neon ────────────── */
export type FancyCardTheme =
  | "amber"   // Kouzelník, Klerik, default
  | "violet"  // Válečník, Alchymista
  | "emerald" // Hraničář, Zloděj
  | "rose"    // Postavy / hero nav
  | "cyan"    // Vypravěč AI
  | "gold";   // Campaigns / golden

/* Subtle warm accents — no glow (exported for ClassSelector) */
export const BORDER_COLOR: Record<FancyCardTheme, string> = {
  amber:   "rgba(201, 162, 39, 0.35)",
  violet:  "rgba(139, 115, 150, 0.35)",
  emerald: "rgba(90, 138, 106, 0.35)",
  rose:    "rgba(168, 115, 115, 0.35)",
  cyan:    "rgba(90, 138, 138, 0.35)",
  gold:    "rgba(201, 162, 39, 0.45)",
};

/* Very subtle corner warmth — no splash */
const CORNER_WARMTH: Record<FancyCardTheme, string> = {
  amber:   "radial-gradient(circle at 100% 0%, rgba(201,162,39,0.08) 0%, transparent 50%)",
  violet:  "radial-gradient(circle at 100% 0%, rgba(139,115,150,0.08) 0%, transparent 50%)",
  emerald: "radial-gradient(circle at 100% 0%, rgba(90,138,106,0.08) 0%, transparent 50%)",
  rose:    "radial-gradient(circle at 100% 0%, rgba(168,115,115,0.08) 0%, transparent 50%)",
  cyan:    "radial-gradient(circle at 100% 0%, rgba(90,138,138,0.08) 0%, transparent 50%)",
  gold:    "radial-gradient(circle at 100% 0%, rgba(201,162,39,0.1) 0%, transparent 50%)",
};

const TITLE_COLOR: Record<FancyCardTheme, string> = {
  amber:   "#e8d4a8",
  violet:  "#c4b0d4",
  emerald: "#a8c4b0",
  rose:    "#d4b0b0",
  cyan:    "#a8c4c4",
  gold:    "#e8d4a8",
};

/* ── Props ───────────────────────────────────────────── */
export interface FancyCardProps {
  title:       string;
  subtitle?:   string;
  role?:       string;
  watermark?:  string;
  icon?:       string;
  items?:      { icon: ReactNode; label: string }[];
  theme?:      FancyCardTheme;
  children?:   ReactNode;
  onClick?:    () => void;
  href?:       string;
  className?:  string;
  flat?:       boolean;
}

/* ── Component ───────────────────────────────────────── */
export function FancyCard({
  title, subtitle, role, watermark, icon, items = [], theme = "amber",
  children, onClick, href, className = "", flat = false,
}: FancyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (flat || !cardRef.current) return;
    const r  = cardRef.current.getBoundingClientRect();
    const x  = e.clientX - r.left - r.width  / 2;
    const y  = e.clientY - r.top  - r.height / 2;
    cardRef.current.style.transform =
      `translate3d(${x * 0.03}px, ${y * 0.03}px, 0)`;
  }, [flat]);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "translate3d(0,0,0)";
  }, []);

  const cardStyle: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    transformStyle: "preserve-3d",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    willChange: "transform",
    background: "rgba(42, 35, 28, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1px solid ${BORDER_COLOR[theme]}`,
    boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  const cornerStyle: CSSProperties = {
    position: "absolute",
    top: 0, right: 0,
    width: "120px", height: "120px",
    background: CORNER_WARMTH[theme],
    pointerEvents: "none",
  };

  const noiseStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E")`,
    mixBlendMode: "overlay" as const,
    pointerEvents: "none",
  };

  const titleStyle: CSSProperties = {
    color: TITLE_COLOR[theme],
  };

  const iconIsImage = icon && (icon.startsWith("/") || icon.startsWith("http"));

  const content = (
    <>
      <div style={noiseStyle} />
      <div style={cornerStyle} />
      {iconIsImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${icon})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.12,
            pointerEvents: "none",
          }}
        />
      )}

      <div className="relative z-10">
        {icon && !iconIsImage && (
          <div className="mb-3">
            <span className="text-3xl">{icon}</span>
          </div>
        )}
        <div className="leading-[0.92] font-bold" style={{ fontSize: "clamp(1.4rem,4vw,2rem)", letterSpacing: "-0.3px" }}>
          <span className="block" style={titleStyle}>{title}</span>
          {subtitle && <span className="block" style={titleStyle}>{subtitle}</span>}
        </div>
        {role && (
          <p className="mt-3 text-[11px] tracking-[2px] uppercase" style={{ color: "rgba(196,184,168,0.6)" }}>
            {role}
          </p>
        )}

        {(items.length > 0 || children) && (
          <div className="relative my-5">
            <div style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(139,115,85,0.4), transparent)" }} />
            <div style={{
              width: "4px", height: "4px", borderRadius: "50%",
              background: BORDER_COLOR[theme],
              margin: "8px auto 0",
              opacity: 0.8,
            }} />
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <span className="opacity-60 flex-shrink-0" style={{ color: "rgba(196,184,168,0.8)" }}>
                  {item.icon}
                </span>
                <span className="text-sm group-hover:text-[#e8e0d4] transition-colors" style={{ color: "rgba(196,184,168,0.7)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}
      </div>

      {watermark && (
        <div style={{
          position: "absolute",
          bottom: "-15px",
          right: "-5px",
          fontSize: "clamp(48px, 12vw, 80px)",
          fontWeight: 800,
          letterSpacing: "-4px",
          color: "rgba(139,115,85,0.08)",
          transform: "rotate(-8deg)",
          pointerEvents: "none",
          userSelect: "none",
          lineHeight: 1,
        }}>
          {watermark}
        </div>
      )}
    </>
  );

  const sharedProps = {
    ref: cardRef,
    style: cardStyle,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };

  if (href) {
    return (
      <a
        href={href}
        ref={cardRef as React.Ref<HTMLAnchorElement>}
        style={cardStyle}
        onMouseMove={handleMouseMove as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        onMouseLeave={handleMouseLeave}
        className={`block rounded-xl p-6 cursor-pointer transition-all hover:border-[rgba(201,162,39,0.5)] ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className={`rounded-xl p-6 ${onClick ? "cursor-pointer" : ""} ${className}`}
      {...sharedProps}
    >
      {content}
    </div>
  );
}

/* ── Compact character card variant ─────────────────── */
export interface CharFancyCardProps {
  name:        string;
  race:        string;
  classname:   string;
  gender?:     string;
  level:       number;
  hp?:         number;
  maxHp?:      number;
  stats?:      Record<string, number>;
  portraitUrl?: string;
  raceIcon?:   string;
  classIcon?:  string;
  genderIcon?: string;
  theme?:      FancyCardTheme;
  isNPC?:      boolean;
  statuses?:   string[];
  injuries?:   string[];
  notes?:      string;
  specialization?: string;
  onEdit?:     () => void;
  onDelete?:   () => void;
}

const STAT_ABBR: [string, string][] = [
  ["sila","SIL"], ["obratnost","OBR"], ["odolnost","ODO"],
  ["inteligence","INT"], ["charisma","CHA"],
];

export function CharFancyCard({
  name, race, classname, gender, level, hp, maxHp, stats,
  portraitUrl, raceIcon = "👤", classIcon = "⚔️", genderIcon = "",
  theme = "amber", isNPC, statuses, injuries, notes, specialization,
  onEdit, onDelete,
}: CharFancyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = e.clientX - r.left - r.width  / 2;
    const y = e.clientY - r.top  - r.height / 2;
    cardRef.current.style.transform =
      `translate3d(${x * 0.02}px, ${y * 0.02}px, 0)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "translate3d(0,0,0)";
  }, []);

  const borderColor = BORDER_COLOR[theme];
  const titleColor = TITLE_COLOR[theme];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        overflow: "hidden",
        transformStyle: "preserve-3d",
        willChange: "transform",
        background: "rgba(42, 35, 28, 0.9)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: `1px solid ${borderColor}`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.02)",
        transition: "border-color 0.2s ease",
      }}
      className="rounded-xl"
    >
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "80px", height: "80px",
        background: CORNER_WARMTH[theme],
        pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 flex">

        <div className="flex-shrink-0 flex flex-col items-center justify-start pt-4 pl-4 pr-2 gap-2"
          style={{ minWidth: "56px" }}>
          {portraitUrl ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden border"
              style={{ borderColor, borderWidth: "1px" }}>
              <img src={portraitUrl} alt={name} className="w-full h-full object-cover object-top" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${borderColor}` }}>
              {classIcon}
            </div>
          )}
          {raceIcon?.startsWith("/") || raceIcon?.startsWith("http") ? (
            <img src={raceIcon} alt="" className="w-6 h-6 object-contain" />
          ) : (
            <span className="text-base">{raceIcon}</span>
          )}
          {genderIcon && <span className="text-xs" style={{ color: "rgba(196,184,168,0.5)" }}>{genderIcon}</span>}
        </div>

        <div className="flex-1 p-4 pl-2 min-w-0">

          <div className="flex items-start justify-between mb-1">
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate" style={{ color: titleColor }}>
                {name}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(196,184,168,0.55)", letterSpacing: "0.5px" }}>
                {[gender && `${genderIcon} ${gender}`, race, classname, specialization && `→ ${specialization}`, `Úr.${level}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            {(onEdit || onDelete) && (
              <div className="flex gap-2 ml-2 flex-shrink-0">
                {onEdit   && <button onClick={onEdit}   className="text-[11px] opacity-40 hover:opacity-90 transition-opacity hover:text-[#c9a227]">✏️</button>}
                {onDelete && <button onClick={onDelete} className="text-[11px] opacity-40 hover:opacity-90 transition-opacity hover:text-[#a85c4a]">✕</button>}
              </div>
            )}
          </div>

          <div style={{ height: "1px", background: `linear-gradient(to right, ${borderColor}, transparent)`, margin: "8px 0" }} />

          {stats && (
            <div className="flex flex-wrap gap-1 mb-2">
              {STAT_ABBR.map(([k, l]) => stats[k] !== undefined ? (
                <span key={k} className="text-[10px] rounded px-1.5 py-0.5 font-mono"
                  style={{ background: "rgba(0,0,0,0.2)", color: "rgba(196,184,168,0.7)", border: "1px solid rgba(139,115,85,0.2)" }}>
                  <span style={{ color: "rgba(228,224,212,0.9)" }}>{l}</span> {stats[k]}
                </span>
              ) : null)}
            </div>
          )}

          {hp !== undefined && (
            <p className="text-[11px] font-semibold mb-1" style={{ color: "#5a8a6a" }}>
              ♥ {hp}{maxHp ? `/${maxHp}` : ""} životov
            </p>
          )}

          {(statuses?.length || injuries?.length) ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {statuses?.map(s => <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(90,138,138,0.2)", color: "#8ab0b0" }}>{s}</span>)}
              {injuries?.map(s => <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(168,115,115,0.2)", color: "#c4a090" }}>{s}</span>)}
            </div>
          ) : null}

          {notes && <p className="text-[10px] mt-1 italic line-clamp-1" style={{ color: "rgba(196,184,168,0.4)" }}>{notes}</p>}
          {isNPC && <span className="text-[9px] tracking-widest uppercase mt-1 block" style={{ color: "rgba(196,184,168,0.35)" }}>NPC</span>}
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: "-5px", right: "8px",
        fontSize: "48px", opacity: 0.04, pointerEvents: "none",
        transform: "rotate(-8deg)", lineHeight: 1, userSelect: "none",
      }}>
        {classIcon}
      </div>
    </div>
  );
}
