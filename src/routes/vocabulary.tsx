import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { vocabulary, lessons, type VocabStatus } from "@/data";

export const Route = createFileRoute("/vocabulary")({
  component: VocabularyPage,
  head: () => ({
    meta: [
      { title: "Vocabulaire — Salut" },
      { name: "description", content: "Ton carnet de vocabulaire français." },
    ],
  }),
});

const statusStyle: Record<VocabStatus, string> = {
  new: "bg-accent/60 text-accent-foreground",
  learning: "bg-[var(--color-mustard)] text-foreground",
  learned: "bg-[var(--color-sage)] text-foreground",
};
const statusLabel: Record<VocabStatus, string> = {
  new: "Nouveau",
  learning: "En cours",
  learned: "Appris",
};

function VocabularyPage() {
  const [filter, setFilter] = useState<VocabStatus | "all">("all");
  const filtered = vocabulary.filter((v) => filter === "all" || v.status === filter);

  return (
    <>
      <PageHeader
        eyebrow="Mots & expressions"
        title="Vocabulaire"
        description={`${vocabulary.length} mots dans ton carnet.`}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "new", "learning", "learned"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "px-3 py-1.5 rounded-full text-sm border transition-colors " +
              (filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-secondary")
            }
          >
            {f === "all" ? "Tous" : statusLabel[f]}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => {
          const first = lessons.find((l) => l.id === v.firstSeenLessonId);
          return (
            <article key={v.id} className="card-soft p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-2xl leading-tight">{v.french}</div>
                  <div className="text-sm text-muted-foreground">{v.translation}</div>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${statusStyle[v.status]}`}
                >
                  {statusLabel[v.status]}
                </span>
              </div>
              <p className="text-sm italic text-foreground/80 border-l-2 border-primary/40 pl-3">
                « {v.example} »
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span className="truncate">Vu dans : {first?.title ?? "—"}</span>
                <span className="shrink-0">×{v.appearances}</span>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
