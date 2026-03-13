"use client";

import type { MapLocation, MapMarkerData } from "@/lib/ai/provider";

interface GameMapProps {
  currentLocation: MapLocation | null;
  markers: MapMarkerData[];
}

const MARKER_ICONS: Record<MapMarkerData["type"], string> = {
  enemy: "⚔️",
  city: "🏰",
  poi: "📍",
  quest: "📜",
  npc: "👤",
};

export default function GameMap({ currentLocation, markers }: GameMapProps) {
  const activeMarkers = markers.filter((m) => m.active);

  return (
    <div className="h-full min-h-[300px] rounded-lg border border-amber-500/20 bg-zinc-950/60 p-4 overflow-auto">
      {/* Current location */}
      <div className="mb-4">
        <span className="text-[10px] uppercase tracking-wider text-amber-500/70">Aktuální poloha</span>
        <p className="text-sm font-medium text-amber-200/90 mt-1">
          {currentLocation?.locationName ?? "—"}
        </p>
        {currentLocation && (
          <p className="text-[10px] text-zinc-600 mt-0.5">
            {currentLocation.map === "ihienburgh" ? "Ihienburgh" : "Svět Othion"} · {currentLocation.locationId}
          </p>
        )}
      </div>

      {/* Markers */}
      {activeMarkers.length > 0 && (
        <div>
          <span className="text-[10px] uppercase tracking-wider text-amber-500/70">Body na mapě</span>
          <ul className="mt-2 space-y-2">
            {activeMarkers.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-2 text-xs py-1.5 px-2 rounded border border-zinc-800/60 bg-zinc-900/30"
              >
                <span className="text-base">{MARKER_ICONS[m.type]}</span>
                <div>
                  <span className="font-medium text-zinc-200">{m.name}</span>
                  {m.description && (
                    <p className="text-zinc-500 mt-0.5">{m.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!currentLocation && activeMarkers.length === 0 && (
        <p className="text-zinc-600 text-sm italic">Mapa se naplní po prvním vyprávění.</p>
      )}
    </div>
  );
}
