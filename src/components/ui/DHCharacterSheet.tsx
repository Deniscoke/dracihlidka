"use client";

import { useState } from "react";
import { RACE_ICONS, CLASS_ICONS, GENDER_ICONS } from "@/lib/dh-constants";

/* ── DH-LITE data ─────────────────────────────────────
   Source: DH-LITE.pdf, Chapter 3 – Tvorba postavy
──────────────────────────────────────────────────── */
export const DH_RACES   = ["Člověk","Trpaslík","Elf","Barbar","Obr","Gnóm","Půlčík"] as const;
export const DH_CLASSES = ["Válečník","Hraničář","Alchymista","Kouzelník","Zloděj","Klerik"] as const;
export const DH_GENDERS = ["Muž","Žena"] as const;

export type DHRace   = typeof DH_RACES[number];
export type DHClass  = typeof DH_CLASSES[number];
export type DHGender = typeof DH_GENDERS[number];

export { RACE_ICONS, CLASS_ICONS, GENDER_ICONS } from "@/lib/dh-constants";

/* ── 5 stats per DH-LITE (Životy is DERIVED, not a stat) ── */
export interface DHStats {
  sila:        number;
  obratnost:   number;
  odolnost:    number;
  inteligence: number;
  charisma:    number;
}

export interface DHCharacterData {
  name:        string;
  race:        DHRace;
  class:       DHClass;
  gender:      DHGender;
  level:       number;
  stats:       DHStats;
  notes:       string;
  isNPC:       boolean;
  portraitUrl?: string;
}

/* ── TABULKA RODOVÝCH ATRIBUTŮ (DH-LITE.pdf p.29) ────────
   Rasa:   SIL  OBR  ODO  INT  CHAR
   ─────────────────────────────────── */
const RACE_BASE: Record<DHRace, DHStats> = {
  Člověk:   { sila:7,  obratnost:7,  odolnost:7,  inteligence:7,  charisma:7  },
  Trpaslík: { sila:10, obratnost:5,  odolnost:10, inteligence:5,  charisma:5  },
  Elf:      { sila:6,  obratnost:7,  odolnost:5,  inteligence:10, charisma:9  },
  Barbar:   { sila:9,  obratnost:8,  odolnost:8,  inteligence:5,  charisma:5  },
  Obr:      { sila:12, obratnost:3,  odolnost:12, inteligence:3,  charisma:3  },
  Gnóm:     { sila:4,  obratnost:10, odolnost:5,  inteligence:9,  charisma:5  },
  Půlčík:   { sila:6,  obratnost:9,  odolnost:6,  inteligence:7,  charisma:8  },
};

/* ── DOMINANTNÍ VLASTNOSTI POVOLÁNÍ (+3 each) ────────────── */
type StatKey = keyof DHStats;
const CLASS_DOMINANT: Record<DHClass, [StatKey, StatKey]> = {
  Válečník:  ["sila",        "odolnost"   ],
  Hraničář:  ["obratnost",   "inteligence"],
  Alchymista:["obratnost",   "odolnost"   ],
  Kouzelník: ["inteligence", "charisma"   ],
  Zloděj:    ["obratnost",   "charisma"   ],
  Klerik:    ["inteligence", "charisma"   ],
};

/* ── TABULKA OPRAV ZA ATRIBUT ────────────────────────────── */
function getModifier(stupen: number): number {
  if (stupen <= 1)  return -5;
  if (stupen <= 3)  return -4;
  if (stupen <= 5)  return -3;
  if (stupen <= 7)  return -2;
  if (stupen <= 9)  return -1;
  if (stupen <= 11) return  0;
  if (stupen <= 13) return +1;
  if (stupen <= 15) return +2;
  if (stupen <= 17) return +3;
  if (stupen <= 19) return +4;
  if (stupen <= 21) return +5;
  return +6;
}

/** HP = 10 + ODO modifier */
function calcHP(stats: DHStats): number {
  return 10 + getModifier(stats.odolnost);
}

/* ── Point distribution: 20 pts, min 1 max 6 per stat ─── */
const TOTAL_POINTS = 20;
const MIN_PTS = 1;
const MAX_PTS = 6;

function initPoints(): Record<StatKey, number> {
  return { sila: 4, obratnost: 4, odolnost: 4, inteligence: 4, charisma: 4 };
}

/** Náhodné rozdelenie 20 bodov (1–6 na každý atribút) podľa DH-LITE */
function randomPoints(): Record<StatKey, number> {
  const keys: StatKey[] = ["sila", "obratnost", "odolnost", "inteligence", "charisma"];
  const pts: Record<StatKey, number> = { sila: 1, obratnost: 1, odolnost: 1, inteligence: 1, charisma: 1 };
  let remaining = TOTAL_POINTS - 5;
  while (remaining > 0) {
    const k = keys[Math.floor(Math.random() * keys.length)];
    if (pts[k] < MAX_PTS) {
      pts[k]++;
      remaining--;
    }
  }
  return pts;
}

const RANDOM_NAMES_M: string[] = ["Branek", "Drahomír", "Kazimír", "Lubor", "Miroslav", "Radomír", "Svatopluk", "Vlastimil", "Zdeněk", "Bohumil"];
const RANDOM_NAMES_F: string[] = ["Blanka", "Drahomíra", "Jarmila", "Ludmila", "Milena", "Radka", "Světlana", "Vlasta", "Zdeňka", "Bohumila"];

function randomName(gender: DHGender): string {
  const arr = gender === "Žena" ? RANDOM_NAMES_F : RANDOM_NAMES_M;
  return arr[Math.floor(Math.random() * arr.length)];
}

function computeStats(race: DHRace, cls: DHClass, pts: Record<StatKey, number>): DHStats {
  const base = RACE_BASE[race];
  const dom  = CLASS_DOMINANT[cls];
  return {
    sila:        base.sila        + pts.sila        + (dom.includes("sila")        ? 3 : 0),
    obratnost:   base.obratnost   + pts.obratnost   + (dom.includes("obratnost")   ? 3 : 0),
    odolnost:    base.odolnost    + pts.odolnost    + (dom.includes("odolnost")    ? 3 : 0),
    inteligence: base.inteligence + pts.inteligence + (dom.includes("inteligence") ? 3 : 0),
    charisma:    base.charisma    + pts.charisma    + (dom.includes("charisma")    ? 3 : 0),
  };
}

const STAT_META: { key: StatKey; label: string; abbr: string; desc: string }[] = [
  { key:"sila",        label:"Síla",        abbr:"SIL", desc:"Útok na blízko, nosnost, silové akce"       },
  { key:"obratnost",   label:"Obratnost",   abbr:"OBR", desc:"Obrana, střelba, plížení, Reflex"           },
  { key:"odolnost",    label:"Odolnost",    abbr:"ODO", desc:"Životy, Výdrž, odolání nemocím & jedům"     },
  { key:"inteligence", label:"Inteligence", abbr:"INT", desc:"Magie, Mana, Postřeh, znalosti"             },
  { key:"charisma",    label:"Charisma",    abbr:"CHA", desc:"Vyjednávání, klerická přízeň, Vůle"         },
];

/* ── Jednotná farba Dračej Hlídky — gold/amber namiesto modrej a triedových farieb ── */
const FORM_ACCENT = "text-amber-400";
const FORM_BORDER = "border-amber-500/40";
const FORM_ACTIVE_BTN = "bg-amber-900/60 border-amber-500 text-amber-300";
const FORM_BTN = "bg-amber-600 hover:bg-amber-500 text-black";

/* ── Props ───────────────────────────────────────────── */
interface Props {
  initialClass?:  string;
  initialRace?:   string;
  initialGender?: string;
  initialName?:   string;
  isNPC?:         boolean;
  onSave:   (data: DHCharacterData) => void;
  onCancel: () => void;
}

/* ── Component ───────────────────────────────────────── */
export function DHCharacterSheet({
  initialClass, initialRace, initialGender, initialName, isNPC: initNPC, onSave, onCancel,
}: Props) {
  const safeClass  = (DH_CLASSES as readonly string[]).includes(initialClass  ?? "") ? initialClass  as DHClass  : "Válečník";
  const safeRace   = (DH_RACES   as readonly string[]).includes(initialRace   ?? "") ? initialRace   as DHRace   : "Člověk";
  const safeGender = (DH_GENDERS as readonly string[]).includes(initialGender ?? "") ? initialGender as DHGender : "Muž";

  const [name,    setName]    = useState(initialName ?? "");
  const [race,    setRace]    = useState<DHRace>(safeRace);
  const [cls,     setCls]     = useState<DHClass>(safeClass);
  const [gender,  setGender]  = useState<DHGender>(safeGender);
  const [level,   setLevel]   = useState(1);
  const [pts,     setPts]     = useState<Record<StatKey, number>>(initPoints);
  const [notes,   setNotes]   = useState("");
  const [isNPC,   setIsNPC]   = useState(initNPC ?? false);
  const [creationMode, setCreationMode] = useState<"manual" | "random">("manual");

  // Portrait generation
  const [portraitUrl,     setPortraitUrl]     = useState<string | null>(null);
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitError,   setPortraitError]   = useState<string | null>(null);

  const ptsUsed = Object.values(pts).reduce((s, v) => s + v, 0);
  const ptsLeft = TOTAL_POINTS - ptsUsed;

  const stats = computeStats(race, cls, pts);
  const hp    = calcHP(stats);
  const [dom1, dom2] = CLASS_DOMINANT[cls];

  function changePt(key: StatKey, delta: number) {
    setPts(prev => {
      const next = prev[key] + delta;
      if (next < MIN_PTS || next > MAX_PTS) return prev;
      const newUsed = ptsUsed + delta;
      if (newUsed < 0 || newUsed > TOTAL_POINTS) return prev;
      return { ...prev, [key]: next };
    });
  }

  async function generateRandomCharacter() {
    const newRace   = DH_RACES[Math.floor(Math.random() * DH_RACES.length)];
    const newClass  = DH_CLASSES[Math.floor(Math.random() * DH_CLASSES.length)];
    const newGender = DH_GENDERS[Math.floor(Math.random() * DH_GENDERS.length)];
    const newName   = randomName(newGender);
    setRace(newRace);
    setCls(newClass);
    setGender(newGender);
    setName(newName);
    setPts(randomPoints());
    setPortraitUrl(null);
    setPortraitError(null);
    // Auto-generate portrait
    setPortraitLoading(true);
    try {
      const res = await fetch("/api/generate-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          race: newRace,
          class: newClass,
          gender: newGender,
        }),
      });
      const data = await res.json();
      if (!res.ok) setPortraitError(data.error ?? "Chyba generovania");
      else setPortraitUrl(data.url);
    } catch {
      setPortraitError("Nepodařilo se spojit se serverem.");
    } finally {
      setPortraitLoading(false);
    }
  }

  async function generatePortrait() {
    setPortraitLoading(true);
    setPortraitError(null);
    try {
      const res = await fetch("/api/generate-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), race, class: cls, gender }),
      });
      const data = await res.json();
      if (!res.ok) setPortraitError(data.error ?? "Chyba generovania");
      else         setPortraitUrl(data.url);
    } catch {
      setPortraitError("Nepodařilo se spojit se serverem.");
    } finally {
      setPortraitLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), race, class: cls, gender, level, stats, notes, isNPC, portraitUrl: portraitUrl ?? undefined });
  }

  const clsIcon   = CLASS_ICONS[cls]  ?? "";

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${FORM_ACCENT}`}>Tvorba Postavy</h2>
            <p className="text-xs text-zinc-600 tracking-widest uppercase mt-0.5">Dračí Hlídka · Lite</p>
          </div>
          <button type="button" onClick={onCancel}
            className="text-zinc-600 hover:text-zinc-400 text-sm border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors"
          >← Zpět</button>
        </div>

        {/* Creation mode: Manual / Random */}
        <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Způsob tvorby</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreationMode("manual")}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                creationMode === "manual"
                  ? "bg-amber-600/20 border-amber-500/50 text-amber-300"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              ✎ Ručné
            </button>
            <button
              type="button"
              onClick={() => setCreationMode("random")}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                creationMode === "random"
                  ? "bg-amber-600/20 border-amber-500/50 text-amber-300"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              🎲 Náhodné
            </button>
          </div>
          {creationMode === "random" && (
            <button
              type="button"
              onClick={generateRandomCharacter}
              disabled={portraitLoading}
              className="w-full mt-3 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-semibold text-sm tracking-wider uppercase transition-all"
            >
              {portraitLoading ? "Generuji postavu + DALL·E 3…" : "✦ Vygenerovat postavu (rasa, povolání, vlastnosti, AI portrét)"}
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">

          {/* ── Left panel: portrait + name ── */}
          <div className={`border ${FORM_BORDER} rounded-xl bg-zinc-900/50 flex flex-col overflow-hidden`}>

            {/* Portrait */}
            <div className="relative flex-shrink-0 bg-zinc-900 aspect-square flex items-center justify-center">
              {portraitLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-zinc-500">DALL·E 3…</p>
                </div>
              ) : portraitUrl ? (
                <img src={portraitUrl} alt={name || cls} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-6 w-full h-full">
                  {/* Summoning portal / magic circle */}
                  <svg viewBox="0 0 120 120" className="w-24 h-24 text-amber-500/60" aria-hidden>
                    <defs>
                      <linearGradient id="portal-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
                      </linearGradient>
                      <filter id="portal-blur">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
                      </filter>
                    </defs>
                    {/* Outer ring */}
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                    <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 4" />
                    {/* Inner arcane runes ring */}
                    <circle cx="60" cy="60" r="28" fill="url(#portal-glow)" opacity="0.6" />
                    <circle cx="60" cy="60" r="22" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
                    {/* Central vortex */}
                    <circle cx="60" cy="60" r="8" fill="currentColor" opacity="0.4" />
                    <circle cx="60" cy="60" r="4" fill="currentColor" opacity="0.8" />
                    {/* Rune symbols */}
                    {[0, 60, 120, 180, 240, 300].map((deg) => {
                      const rad = (deg * Math.PI) / 180;
                      const x = 60 + 38 * Math.cos(rad);
                      const y = 60 + 38 * Math.sin(rad);
                      return (
                        <text key={deg} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="currentColor" opacity="0.4" fontFamily="serif">✦</text>
                      );
                    })}
                  </svg>
                  <p className="text-[10px] text-zinc-600 text-center">
                    Bez portrétu · klikni Generovať AI
                  </p>
                </div>
              )}
              {/* bottom fade */}
              <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
              {portraitUrl && (
                <div className="absolute bottom-1 right-2 text-[9px] text-zinc-600">AI · DALL·E 3</div>
              )}
            </div>

            {/* Generate portrait */}
            <div className="px-3 py-2 border-t border-zinc-800/60">
              <button type="button" onClick={generatePortrait} disabled={portraitLoading}
                className={`w-full py-1.5 rounded text-xs font-semibold tracking-wider uppercase transition-all disabled:opacity-40
                  ${portraitUrl ? "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : FORM_BTN}`}
              >
                {portraitLoading ? "Generuji…" : portraitUrl ? "↻ Nový portrét" : "✦ AI portrét (DALL·E 3)"}
              </button>
              {portraitError && <p className="text-[10px] text-red-400 mt-1 text-center">{portraitError}</p>}
            </div>

            {/* Name + NPC */}
            <div className="px-3 pb-3 space-y-2">
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Jméno postavy</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Zadej jméno…"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Úroveň</label>
                <input type="number" min={1} max={20} value={level}
                  onChange={e => setLevel(Math.max(1, parseInt(e.target.value)||1))}
                  className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 text-center focus:outline-none focus:border-amber-500"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
                <input type="checkbox" checked={isNPC} onChange={e => setIsNPC(e.target.checked)} className="rounded" />
                NPC
              </label>
            </div>
          </div>

          {/* ── Right panels ── */}
          <div className="md:col-span-2 flex flex-col gap-4">

            {/* Race + Gender + Class */}
            <div className={`border ${FORM_BORDER} rounded-xl bg-zinc-900/50 p-4 space-y-4`}>

              {/* Gender */}
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Pohlavie</label>
                <div className="flex gap-2">
                  {DH_GENDERS.map(g => (
                    <button key={g} type="button" onClick={() => { setGender(g); setPortraitUrl(null); }}
                      className={`flex-1 py-2 rounded border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        gender === g
                          ? `${FORM_ACCENT} border-amber-500/50 bg-zinc-800`
                          : "text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      <span className="text-base">{GENDER_ICONS[g]}</span> {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Race */}
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Rasa</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {DH_RACES.map(r => (
                    <button key={r} type="button" onClick={() => { setRace(r); setPortraitUrl(null); }}
                      className={`py-2 rounded border text-xs transition-all flex flex-col items-center gap-1 ${
                        race === r
                          ? `${FORM_ACCENT} border-amber-500/50 bg-zinc-800`
                          : "text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      {RACE_ICONS[r]?.startsWith("/") || RACE_ICONS[r]?.startsWith("http") ? (
                        <img src={RACE_ICONS[r]} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-lg">{RACE_ICONS[r]}</span>
                      )}
                      <span>{r}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Class */}
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Povolanie</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DH_CLASSES.map(c => (
                    <button key={c} type="button" onClick={() => { setCls(c); setPortraitUrl(null); }}
                      className={`py-2 px-2 rounded border text-xs transition-all flex items-center gap-1.5 ${
                        cls === c
                          ? FORM_ACTIVE_BTN
                          : "text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      <span>{CLASS_ICONS[c]}</span> {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className={`border ${FORM_BORDER} rounded-xl bg-zinc-900/50 p-4`}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  Vlastnosti · Alternativní rozdělení
                </label>
                <span className={`text-xs font-mono ${ptsLeft === 0 ? "text-emerald-400" : ptsLeft < 0 ? "text-red-400" : "text-zinc-400"}`}>
                  {ptsLeft} / {TOTAL_POINTS} bodů zbývá
                </span>
              </div>

              <div className="space-y-1.5">
                {STAT_META.map(({ key, label, abbr, desc }) => {
                  const val  = stats[key];
                  const mod  = getModifier(val);
                  const isDom = key === dom1 || key === dom2;
                  return (
                    <div key={key} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isDom ? "bg-zinc-800/80" : "bg-zinc-900/50"}`}>
                      {/* label */}
                      <div className="w-28 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono font-bold ${isDom ? FORM_ACCENT : "text-zinc-500"}`}>{abbr}</span>
                          {isDom && <span className={`text-[9px] ${FORM_ACCENT} opacity-70`}>+3</span>}
                        </div>
                        <p className="text-[10px] text-zinc-600 leading-tight">{desc}</p>
                      </div>

                      {/* pts control */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button type="button" onClick={() => changePt(key, -1)}
                          disabled={pts[key] <= MIN_PTS}
                          className="w-5 h-5 flex items-center justify-center border border-zinc-700 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 text-sm"
                        >−</button>
                        <span className="text-[10px] text-zinc-600 w-3 text-center">{pts[key]}</span>
                        <button type="button" onClick={() => changePt(key, +1)}
                          disabled={pts[key] >= MAX_PTS || ptsLeft <= 0}
                          className="w-5 h-5 flex items-center justify-center border border-zinc-700 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 text-sm"
                        >+</button>
                      </div>

                      {/* value + modifier */}
                      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                        <span className={`text-lg font-bold tabular-nums w-7 text-right ${isDom ? FORM_ACCENT : "text-zinc-300"}`}>
                          {val}
                        </span>
                        <span className={`text-xs font-mono w-8 text-center rounded px-1 py-0.5 ${
                          mod > 0 ? "text-emerald-400 bg-emerald-950/40" :
                          mod < 0 ? "text-red-400 bg-red-950/40" :
                                    "text-zinc-500 bg-zinc-800"
                        }`}>
                          {mod >= 0 ? `+${mod}` : mod}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* HP derived */}
              <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Životy (HP)</p>
                  <p className="text-[10px] text-zinc-700">= 10 + oprava ODO</p>
                </div>
                <span className="text-2xl font-bold text-emerald-400">♥ {hp}</span>
              </div>

              <p className="text-[10px] text-zinc-700 mt-2">
                Základ = rasový atribut + tvoje body (1–6 na každý) + dominantní bonus povolání (+3).
                {" "}Celkovo {TOTAL_POINTS} bodov k rozdeleniu.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Pozadie / Poznámky</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Príbeh, motivácia, výzor…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button type="submit" className={`flex-1 py-3 rounded font-semibold text-sm tracking-widest uppercase transition-all ${FORM_BTN}`}>
            {clsIcon} Vytvořit postavu
          </button>
          <button type="button" onClick={onCancel}
            className="px-5 py-3 rounded border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
          >Zrušit</button>
        </div>

        <p className="text-[10px] text-zinc-700 mt-3 text-center">
          Podle DH-LITE pravidel · základ rasy + 20 bodů + dominantní bonusy povolání.
        </p>

      </form>
    </div>
  );
}
