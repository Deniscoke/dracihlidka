"use client";

export default function RulesPage() {
  const sections = [
    {
      title: "Tvorba postavy",
      description: "Rasy, povolání, schopnosti, výběr výbavy",
      status: "planned",
    },
    {
      title: "Boj a souboj",
      description: "Iniciativa, útoky, obrana, zranění",
      status: "planned",
    },
    {
      title: "Mágia",
      description: "Kouzla, magenergie, rituály",
      status: "planned",
    },
    {
      title: "Vybavení",
      description: "Zbraně, brnění, předměty, obchod",
      status: "planned",
    },
    {
      title: "Bestiář",
      description: "Příšery, zvířata, démoni",
      status: "planned",
    },
    {
      title: "Pravidla pro PJ",
      description: "Vedení hry, tvorba příběhu, odměny",
      status: "planned",
    },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-zinc-100 mb-2">
        Knihovna pravidel
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        Struktura pro budoucí integraci pravidel. Obsah bude parafrázován z
        licencovaných zdrojů.
      </p>

      <div className="space-y-2">
        {sections.map((s) => (
          <div
            key={s.title}
            className="border border-zinc-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-zinc-200 font-medium text-sm">{s.title}</p>
              <p className="text-xs text-zinc-500">{s.description}</p>
            </div>
            <span className="text-xs text-zinc-600 border border-zinc-800 rounded px-2 py-1">
              Plánované
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        <p className="text-xs text-zinc-500">
          <strong className="text-zinc-400">Právní poznámka:</strong> Pravidla
          jsou zpracována jako parafrázovaná shrnutí. Žádný původní text není
          reprodukován. Systém je navržen jako generický RPG engine s
          výměnnými moduly pravidel.
        </p>
      </div>
    </div>
  );
}
