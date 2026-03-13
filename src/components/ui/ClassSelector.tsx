"use client";

import { useRef, useCallback } from "react";
import type { FancyCardTheme } from "./FancyCard";
import { BORDER_COLOR } from "./FancyCard";

export interface DHClassOption {
  name: string;
  class: string;
  race: string;
  gender: string;
  img: string;
  theme: FancyCardTheme;
  role: string;
  dominant: string;
}

const DH_CLASSES: DHClassOption[] = [
  { name: "Válečník", class: "Válečník", race: "Člověk", gender: "Muž", img: "class-valecnik.png", theme: "violet", role: "Mistr meče", dominant: "SIL + ODO" },
  { name: "Kouzelník", class: "Kouzelník", race: "Elf", gender: "Muž", img: "class-kouzelnik.png", theme: "amber", role: "Mistr magie", dominant: "INT + CHA" },
  { name: "Hraničář", class: "Hraničář", race: "Člověk", gender: "Muž", img: "class-hranicar.png", theme: "emerald", role: "Stopár, prežitie", dominant: "OBR + INT" },
  { name: "Alchymista", class: "Alchymista", race: "Trpaslík", gender: "Muž", img: "class-alchymista.png", theme: "violet", role: "Lektváre, výbušniny", dominant: "OBR + ODO" },
  { name: "Zloděj", class: "Zloděj", race: "Půlčík", gender: "Muž", img: "class-zlodej.png", theme: "emerald", role: "Plíženie, zákeřný útok", dominant: "OBR + CHA" },
  { name: "Klerik", class: "Klerik", race: "Člověk", gender: "Žena", img: "class-klerik.png", theme: "gold", role: "Léčenie, odhánění nemrtvých", dominant: "INT + CHA" },
];

export interface ClassSelectorProps {
  mode?: "create" | "levelup";
  onSelect: (ch: { name: string; class: string; race: string; gender: string }) => void;
  onCancel: () => void;
}

export function ClassSelector({ mode = "create", onSelect, onCancel }: ClassSelectorProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleMouseMove = useCallback((e: React.MouseEvent, i: number) => {
    const el = cardRefs.current[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate3d(${x * 0.04}px, ${y * 0.04}px, 0) rotateX(${-y * 0.015}deg) rotateY(${x * 0.015}deg)`;
  }, []);

  const handleMouseLeave = useCallback((i: number) => {
    const el = cardRefs.current[i];
    if (el) el.style.transform = "translate3d(0,0,0) rotateX(0) rotateY(0)";
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-deep)" }}>
      {/* Header */}
      <div className="backdrop-blur sticky top-0 z-10" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-panel)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {mode === "levelup" ? "Postup postavy" : "Výber povolania"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {mode === "levelup"
                ? "Podľa DH-LITE: pri levelupe +1k6 HP a +1 k jednému atribútu dle povolania."
                : "Vyber si povolanie pre novú postavu. DH-LITE — 6 tried."}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            ← Späť
          </button>
        </div>
      </div>

      {/* Class grid */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DH_CLASSES.map((cls, i) => (
            <div
              key={cls.class}
              ref={(el) => { cardRefs.current[i] = el; }}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={() => handleMouseLeave(i)}
              onClick={() => onSelect(cls)}
              className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300"
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform",
                background: "rgba(42, 35, 28, 0.9)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${BORDER_COLOR[cls.theme]}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <div className="relative z-10 flex gap-4 p-5">
                {/* Portrait */}
                <div className="flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden transition-colors" style={{ border: `1px solid ${BORDER_COLOR[cls.theme]}` }}>
                  <img
                    src={`/ilustrations/${cls.img}`}
                    alt={cls.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base tracking-tight transition-colors" style={{ color: "var(--text-primary)" }}>
                    {cls.name}
                  </p>
                  <p className="text-[11px] mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {cls.role}
                  </p>
                  <p className="text-[10px] mt-2 font-mono" style={{ color: "var(--accent-gold)" }}>
                    {cls.dominant}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-dim)" }}>
                    {cls.race} · {cls.gender}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
