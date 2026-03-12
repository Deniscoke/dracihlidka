"use client";

import { useEffect, useRef, useState } from "react";

export interface SelectedCharacter {
  name:   string;
  class:  string;
  race:   string;
  gender: string;
}

interface CharacterBannerProps {
  onSelectCharacter?: (character: SelectedCharacter) => void;
}

export function CharacterBanner({ onSelectCharacter }: CharacterBannerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "SELECT_CHARACTER" && onSelectCharacter) {
        onSelectCharacter(event.data.payload as SelectedCharacter);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSelectCharacter]);

  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-600 text-xs tracking-widest uppercase">Načítanie galérie…</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/character-banner/index.html"
        className="w-full h-full border-0"
        style={{ display: isLoaded ? "block" : "none" }}
        onLoad={() => setIsLoaded(true)}
        title="Výber Povolania – Dračí Hlídka"
      />
    </div>
  );
}
