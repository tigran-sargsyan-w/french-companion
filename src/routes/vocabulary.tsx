import { Link, createFileRoute } from "@tanstack/react-router";
import { Printer, Search, X } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { DataErrorState, DataLoadingState } from "@/components/DataState";
import { MarkdownText } from "@/components/MarkdownText";
import { VocabularyWordModal, type VocabularyWordModalItem } from "@/components/VocabularyWordModal";
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

const inlineMarkdownMarkerPattern = /[*_`\[\]~<>]/;

function VocabularyCardText({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  if (!inlineMarkdownMarkerPattern.test(children)) {
    return <span className={className}>{children}</span>;
  }

  return (
    <MarkdownText inline className={className}>
      {children}
    </MarkdownText>
  );
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR")
    .trim();
}

function normalizeComparableText(value: string) {
  return normalizeSearchText(value)
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ");
}

function getWordSearchCandidates(word: VocabWord) {
  const normalizedWord = normalizeComparableText(word.french);
  const withoutLeadingArticle = normalizedWord
    .replace(/^(un|une|le|la|les|des|du|de|d|l)\s+/, "")
    .trim();

  return Array.from(new Set([normalizedWord, withoutLeadingArticle].filter(Boolean)));
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

function getSourceExamples(
  word: VocabWord,
  data: LearningData,
): VocabularyWordModalItem["sourceExamples"] {
  return data.lessonBundles.flatMap((bundle) => {
    const lessonLabel =
      getLessonLabel(bundle.lesson.id, data.lessonIndex, data.lessons) ?? bundle.lesson.title;

    return bundle.vocabulary
      .filter((sourceWord) => word.sourceIds.includes(sourceWord.id))
      .map((sourceWord) => ({
        id: sourceWord.id,
        lessonLabel,
        french: sourceWord.french,
        translation: sourceWord.translation,
        example: sourceWord.example,
        status: sourceWord.status,
      }));
  });
}

function findRelatedMistakes(word: VocabWord, data: LearningData) {
  const candidates = getWordSearchCandidates(word);

  return data.mistakes.filter((mistake) => {
    const mistakeText = normalizeComparableText(
      [mistake.wrong, mistake.correct, mistake.note, mistake.category].join(" "),
    );

    return candidates.some((candidate) => mistakeText.includes(candidate));
  });
}

function findRelatedGrammar(word: VocabWord, data: LearningData) {
  const candidates = getWordSearchCandidates(word);

  return data.grammar.filter((grammar) => {
    const grammarText = normalizeComparableText(
      [
        grammar.title,
        grammar.category,
        grammar.summary,
        ...grammar.examples,
        ...(grammar.annotatedExamples ?? []).flatMap((example) => [
          example.title,
          example.explanation,
          example.markup,
          ...(example.sourceSentences ?? []),
        ]),
      ].join(" "),
    );

    return candidates.some((candidate) => grammarText.includes(candidate));
  });
}

interface GrammarSearchIndexEntry {
  grammar: LearningData["grammar"][number];
  comparableText: string;
}

function buildGrammarSearchIndex(data: LearningData): GrammarSearchIndexEntry[] {
  return data.grammar.map((grammar) => ({
    grammar,
    comparableText: normalizeComparableText(
      [
        grammar.title,
        grammar.category,
        grammar.summary,
        ...grammar.examples,
        ...(grammar.annotatedExamples ?? []).flatMap((example) => [
          example.title,
          example.explanation,
          example.markup,
          ...(example.sourceSentences ?? []),
        ]),
      ].join(" "),
    ),
  }));
}

function findRelatedGrammarFromIndex(
  word: VocabWord,
  grammarSearchIndex: GrammarSearchIndexEntry[],
) {
  const candidates = getWordSearchCandidates(word);

  return grammarSearchIndex
    .filter(({ comparableText }) =>
      candidates.some((candidate) => comparableText.includes(candidate)),
    )
    .map(({ grammar }) => grammar);
}

function buildVocabularyModalItem(
  word: VocabWord,
  data: LearningData,
  seenLessonLabels: string[],
  firstSeenLabel: string,
): VocabularyWordModalItem {
  return {
    word,
    firstSeenLabel,
    seenLessonLabels,
    sourceExamples: getSourceExamples(word, data),
    relatedMistakes: findRelatedMistakes(word, data),
    relatedGrammar: findRelatedGrammar(word, data),
  };
}

function buildVocabularySearchHaystack(
  word: VocabWord,
  seenLessonLabels: string[],
  firstSeenLabel: string,
  sourceExamples: VocabularyWordModalItem["sourceExamples"],
  relatedMistakes: LearningData["mistakes"],
  relatedGrammar: LearningData["grammar"],
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
      ...sourceExamples.flatMap((source) => [source.french, source.translation, source.example, source.lessonLabel]),
      ...relatedMistakes.flatMap((mistake) => [mistake.wrong, mistake.correct, mistake.note, mistake.category]),
      ...relatedGrammar.flatMap((grammar) => [grammar.title, grammar.category, grammar.summary, ...grammar.examples]),
    ].join(" "),
  );
}

interface VocabularyListItem {
  word: VocabWord;
  firstSeenLabel: string;
  seenLessonLabels: string[];
  seenLessonTitle: string;
  modalItem: VocabularyWordModalItem;
  searchHaystack: string;
}

const VocabularyCard = memo(function VocabularyCard({
  item,
  onSelect,
}: {
  item: VocabularyListItem;
  onSelect: (wordId: string) => void;
}) {
  const { word, firstSeenLabel, seenLessonTitle, modalItem } = item;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ouvrir les détails du mot ${word.french}`}
      onClick={() => onSelect(word.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(word.id);
        }
      }}
      className="card-soft p-5 flex cursor-pointer flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-2xl leading-tight">{word.french}</div>
          <VocabularyCardText className="text-sm text-muted-foreground">
            {word.translation}
          </VocabularyCardText>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${statusStyle[word.status]}`}
        >
          {statusLabel[word.status]}
        </span>
      </div>

      <div className="text-sm italic text-foreground/80 border-l-2 border-primary/40 pl-3">
        « <VocabularyCardText>{word.example}</VocabularyCardText> »
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {modalItem.relatedMistakes.length > 0 && (
          <span className="rounded-full bg-secondary px-2 py-1">
            ⚠ {modalItem.relatedMistakes.length} erreur(s)
          </span>
        )}
        {modalItem.relatedGrammar.length > 0 && (
          <span className="rounded-full bg-secondary px-2 py-1">
            ✦ {modalItem.relatedGrammar.length} grammaire
          </span>
        )}
      </div>

      <div className="grid gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0">Première fois</span>
          <span className="truncate text-right" title={seenLessonTitle}>
            {firstSeenLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Occurrences notées</span>
          <span
            className="font-semibold text-foreground"
            title="Nombre d'apparitions dans les fichiers de vocabulaire"
          >
            ×{word.appearances}
          </span>
        </div>
      </div>
    </article>
  );
});

function VocabularyPage() {
  const [filter, setFilter] = useState<VocabStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const learningDataQuery = useLearningData();
  const handleSelectWord = useCallback((wordId: string) => {
    setSelectedWordId(wordId);
  }, []);
  const learningData = learningDataQuery.data;

  const vocabularyItems = useMemo<VocabularyListItem[]>(() => {
    if (!learningData) {
      return [];
    }

    const { vocabulary, lessons, lessonIndex } = learningData;
    const profile = {
      lessonMetadataMs: 0,
      sourceExamplesMs: 0,
      relatedMistakesMs: 0,
      grammarIndexBuildMs: 0,
      relatedGrammarMs: 0,
      searchHaystackMs: 0,
    };
    const totalStart = performance.now();

    let stepStart = performance.now();
    const grammarSearchIndex = buildGrammarSearchIndex(learningData);
    profile.grammarIndexBuildMs += performance.now() - stepStart;

    const items = vocabulary.map((word) => {
      stepStart = performance.now();
      const first = lessonIndex.find((lesson) => lesson.id === word.firstSeenLessonId);
      const seenLessonLabels = word.seenInLessonIds
        .map((lessonId) => getLessonLabel(lessonId, lessonIndex, lessons))
        .filter((label): label is string => Boolean(label));
      const firstSeenLabel = first ? `Lesson ${first.number ?? ""} · ${first.date}`.trim() : "—";
      profile.lessonMetadataMs += performance.now() - stepStart;

      stepStart = performance.now();
      const sourceExamples = getSourceExamples(word, learningData);
      profile.sourceExamplesMs += performance.now() - stepStart;

      stepStart = performance.now();
      const relatedMistakes = findRelatedMistakes(word, learningData);
      profile.relatedMistakesMs += performance.now() - stepStart;

      stepStart = performance.now();
      const relatedGrammar = findRelatedGrammarFromIndex(word, grammarSearchIndex);
      profile.relatedGrammarMs += performance.now() - stepStart;

      const modalItem: VocabularyWordModalItem = {
        word,
        firstSeenLabel,
        seenLessonLabels,
        sourceExamples,
        relatedMistakes,
        relatedGrammar,
      };

      stepStart = performance.now();
      const searchHaystack = buildVocabularySearchHaystack(
        word,
        seenLessonLabels,
        firstSeenLabel,
        sourceExamples,
        relatedMistakes,
        relatedGrammar,
      );
      profile.searchHaystackMs += performance.now() - stepStart;

      return {
        word,
        firstSeenLabel,
        seenLessonLabels,
        seenLessonTitle: seenLessonLabels.join("\n"),
        modalItem,
        searchHaystack,
      };
    });

    const totalMs = performance.now() - totalStart;
    const measuredMs =
      profile.lessonMetadataMs +
      profile.sourceExamplesMs +
      profile.relatedMistakesMs +
      profile.grammarIndexBuildMs +
      profile.relatedGrammarMs +
      profile.searchHaystackMs;

    console.groupCollapsed(
      `[Vocabulary profile] built ${vocabulary.length} items in ${totalMs.toFixed(1)} ms`,
    );
    console.table({
      total: { ms: Number(totalMs.toFixed(1)), share: "100%" },
      lessonMetadata: {
        ms: Number(profile.lessonMetadataMs.toFixed(1)),
        share: `${((profile.lessonMetadataMs / totalMs) * 100).toFixed(1)}%`,
      },
      sourceExamples: {
        ms: Number(profile.sourceExamplesMs.toFixed(1)),
        share: `${((profile.sourceExamplesMs / totalMs) * 100).toFixed(1)}%`,
      },
      relatedMistakes: {
        ms: Number(profile.relatedMistakesMs.toFixed(1)),
        share: `${((profile.relatedMistakesMs / totalMs) * 100).toFixed(1)}%`,
      },
      grammarIndexBuild: {
        ms: Number(profile.grammarIndexBuildMs.toFixed(1)),
        share: `${((profile.grammarIndexBuildMs / totalMs) * 100).toFixed(1)}%`,
      },
      relatedGrammar: {
        ms: Number(profile.relatedGrammarMs.toFixed(1)),
        share: `${((profile.relatedGrammarMs / totalMs) * 100).toFixed(1)}%`,
      },
      searchHaystack: {
        ms: Number(profile.searchHaystackMs.toFixed(1)),
        share: `${((profile.searchHaystackMs / totalMs) * 100).toFixed(1)}%`,
      },
      unmeasured: {
        ms: Number((totalMs - measuredMs).toFixed(1)),
        share: `${(((totalMs - measuredMs) / totalMs) * 100).toFixed(1)}%`,
      },
    });
    console.groupEnd();

    return items;
  }, [learningData]);

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

  const data = learningDataQuery.data;
  const { vocabulary } = data;
  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const learnedCount = vocabulary.filter((word) => word.status === "learned").length;
  const unlearnedCount = vocabulary.length - learnedCount;

  const filtered = vocabularyItems.filter(
    ({ word, searchHaystack }) =>
      (filter === "all" || word.status === filter) &&
      (normalizedSearchQuery === "" || searchHaystack.includes(normalizedSearchQuery)),
  );

  const selectedItem = selectedWordId
    ? vocabularyItems.find(({ word }) => word.id === selectedWordId)?.modalItem
    : undefined;

  const hasActiveFilters = filter !== "all" || normalizedSearchQuery !== "";
  const resultLabel = hasActiveFilters
    ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} sur ${vocabulary.length}`
    : `${vocabulary.length} mots dans ton carnet.`;

  return (
    <>
      <PageHeader
        eyebrow="Mots & expressions"
        title="Vocabulaire"
        description={
          <div className="space-y-0.5">
            <div>{resultLabel}</div>
            <div>
              {unlearnedCount} {unlearnedCount === 1 ? "mot non appris" : "mots non appris"}.
            </div>
            <div>
              {learnedCount} {learnedCount === 1 ? "mot appris" : "mots appris"}.
            </div>
          </div>
        }
        right={
          <Link
            to="/vocabulary/unlearned"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <Printer className="h-4 w-4" />
            Imprimer les mots non appris
          </Link>
        }
      />

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
          {filtered.map((item) => (
            <VocabularyCard key={item.word.id} item={item} onSelect={handleSelectWord} />
          ))}
        </div>
      )}

      {selectedItem && <VocabularyWordModal item={selectedItem} onClose={() => setSelectedWordId(null)} />}
    </>
  );
}
