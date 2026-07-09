import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { DataErrorState, DataLoadingState } from "@/components/DataState";
import { useLearningData, type LearningData, type VocabStatus, type VocabWord } from "@/data";

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

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR")
    .trim();
}

function getLessonLabel(
  lessonId: string,
  lessonIndex: LearningData["lessonIndex"],
  lessons: LearningData["lessons"],
) {
  const lessonMeta = lessonIndex.find((lesson) => lesson.id === lessonId);
  const lessonDetails = lessons.find((lesson) => lesson.id === lessonId);

  if (!lessonMeta) {
    return lessonDetails?.title;
  }

  const lessonNumber = lessonMeta.number ? `Lesson ${lessonMeta.number}` : "Lesson";
  return `${lessonNumber} · ${lessonMeta.date}`;
}

function buildVocabularySearchHaystack(
  word: VocabWord,
  seenLessonLabels: string[],
  firstSeenLabel: string,
) {
  return normalizeSearchText(
    [
      word.french,
      word.translation,
      word.example,
      statusLabel[word.status],
      word.status,
      firstSeenLabel,
      ...seenLessonLabels,
    ].join(" "),
  );
}

function VocabularyPage() {
  const [filter, setFilter] = useState<VocabStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const learningDataQuery = useLearningData();

  if (learningDataQuery.isPending) {
    return (
      <>
        <PageHeader
          eyebrow="Mots & expressions"
          title="Vocabulaire"
          description="Chargement du carnet de vocabulaire."
        />
        <DataLoadingState />
      </>
    );
  }

  if (learningDataQuery.isError) {
    return (
      <>
        <PageHeader
          eyebrow="Mots & expressions"
          title="Vocabulaire"
          description="Ton carnet de vocabulaire français."
        />
        <DataErrorState error={learningDataQuery.error} />
      </>
    );
  }

  const { vocabulary, lessons, lessonIndex } = learningDataQuery.data;
  const normalizedSearchQuery = normalizeSearchText(searchQuery);

  const vocabularyItems = vocabulary.map((word) => {
    const first = lessonIndex.find((lesson) => lesson.id === word.firstSeenLessonId);
    const seenLessonLabels = word.seenInLessonIds
      .map((lessonId) => getLessonLabel(lessonId, lessonIndex, lessons))
      .filter((label): label is string => Boolean(label));
    const firstSeenLabel = first ? `Lesson ${first.number ?? ""} · ${first.date}`.trim() : "—";

    return {
      word,
      firstSeenLabel,
      seenLessonLabels,
      seenLessonTitle: seenLessonLabels.join("\n"),
      searchHaystack: buildVocabularySearchHaystack(word, seenLessonLabels, firstSeenLabel),
    };
  });

  const filtered = vocabularyItems.filter(
    ({ word, searchHaystack }) =>
      (filter === "all" || word.status === filter) &&
      (normalizedSearchQuery === "" || searchHaystack.includes(normalizedSearchQuery)),
  );

  const hasActiveFilters = filter !== "all" || normalizedSearchQuery !== "";
  const resultLabel = hasActiveFilters
    ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} sur ${vocabulary.length}`
    : `${vocabulary.length} mots dans ton carnet.`;

  return (
    <>
      <PageHeader eyebrow="Mots & expressions" title="Vocabulaire" description={resultLabel} />

      <div className="card-soft p-4 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="search"
              placeholder="Chercher un mot, une traduction, un exemple ou une leçon…"
              className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "new", "learning", "learned"] as const).map((f) => (
              <button
                key={f}
                type="button"
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
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{resultLabel}</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilter("all");
              }}
              className="hover:text-foreground hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card-soft p-10 text-center">
          <div className="font-display text-2xl">Aucun mot trouvé</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Essaie une autre recherche ou enlève le filtre de statut.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ word, firstSeenLabel, seenLessonTitle }) => (
            <article key={word.id} className="card-soft p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-2xl leading-tight">{word.french}</div>
                  <div className="text-sm text-muted-foreground">{word.translation}</div>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${statusStyle[word.status]}`}
                >
                  {statusLabel[word.status]}
                </span>
              </div>
              <p className="text-sm italic text-foreground/80 border-l-2 border-primary/40 pl-3">
                « {word.example} »
              </p>
              <div className="grid gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0">Première fois</span>
                  <span className="truncate text-right" title={seenLessonTitle}>
                    {firstSeenLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Occurrences notées</span>
                  <span className="font-semibold text-foreground" title="Nombre d'apparitions dans les fichiers de vocabulaire">
                    ×{word.appearances}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
