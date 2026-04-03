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
  description: string;
}

const DH_CLASSES: DHClassOption[] = [
  {
    name: "Válečník", class: "Válečník", race: "Člověk", gender: "Muž",
    img: "class-valecnik.png", theme: "violet", role: "Mistr meče", dominant: "SIL + ODO",
    description: "Mistr bojového umění a těžké zbroje. Nosí brnění bez trestu, od 5. úrovně útočí dvakrát za kolo. Spoléhá na sílu a výdrž — je to skutečný frontliner, který stráží spolubojovníky.",
  },
  {
    name: "Kouzelník", class: "Kouzelník", race: "Elf", gender: "Muž",
    img: "class-kouzelnik.png", theme: "amber", role: "Mistr magie", dominant: "INT + CHA",
    description: "Vládne kouzly prostřednictvím many. Studuje přírodní zákony a často uvažuje analyticky. Při boji se drží v ústraní, připravuje účinná kouzla a má tendenci se vyhýbat přímému kontaktu.",
  },
  {
    name: "Hraničář", class: "Hraničář", race: "Člověk", gender: "Muž",
    img: "class-hranicar.png", theme: "emerald",     role: "Stopař, přežití", dominant: "OBR + INT",
    description: "Stopař a expert na přežití v přírodě. Umí stopovat, skrýt se a udílet silný útok ze zálohy (+1k6). Často působí samotářsky, preferuje lesy a hranici mezi civilizací a divočinou.",
  },
  {
    name: "Alchymista", class: "Alchymista", race: "Trpaslík", gender: "Muž",
    img: "class-alchymista.png", theme: "violet",     role: "Lektvary, výbušniny", dominant: "OBR + ODO",
    description: "Vyrábí lektvary a výbušniny. Bomba udílí 2k6 poškození a může být rozhodující v boji. Často posedlý experimentováním, obezřetný, ale při ohrožení rychle reaguje a vyhodí flašku.",
  },
  {
    name: "Zloděj", class: "Zloděj", race: "Půlčík", gender: "Muž",
    img: "class-zlodej.png", theme: "emerald", role: "Plíženie, zákeřný útok", dominant: "OBR + CHA",
    description: "Mistr plížení a zákeřného útoku (+2k6 ze zálohy). Skrývá se ve stínech, otevírá zámky a často kalkuluje riziko. Může působit lehkovážně, ale při misi je koncentrovaný a precizní.",
  },
  {
    name: "Klerik", class: "Klerik", race: "Člověk", gender: "Žena",
    img: "class-klerik.png", theme: "gold", role: "Léčenie, odhánění nemrtvých", dominant: "INT + CHA",
    description: "Léčí spojence (1k6+CHA) a odhání nemrtvé. Slouží božstvu nebo vyššímu cíli. Zpravidla pokojná a soucitná, ale v boji proti nečistým silám je neoblomná.",
  },
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
              {mode === "levelup" ? "Postup postavy" : "Výběr povolání"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {mode === "levelup"
                ? "Podle DH-LITE: při levelu +1k6 HP a +1 k jednomu atributu dle povolání."
                : "Vyber si povolání pro novou postavu. DH-LITE — 6 tříd."}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            ← Zpět
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
              <div className="relative z-10 flex flex-col">
                <div className="flex gap-4 p-5">
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

                {/* Rozbalený popis pri hover */}
                <div
                  className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out"
                  style={{ borderTop: `1px solid ${BORDER_COLOR[cls.theme]}33` }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 pt-0 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {cls.description}
                    </p>
                  </div>
                </div>

                <p className="px-5 pb-3 text-[10px]" style={{ color: "var(--text-dim)" }}>
                  Přejeď myší pro popis · Klikni pro tvorbu
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
