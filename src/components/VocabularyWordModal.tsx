import { AlertCircle, BookOpen, Sparkles, X } from "lucide-react";
import { useEffect } from "react";
import type { LearningData, VocabStatus, VocabWord } from "@/data";

export interface VocabularySourceExample {
  id: string;
  lessonLabel: string;
  french: string;
  translation: string;
  example: string;
  status: VocabStatus;
}

export interface VocabularyWordModalItem {
  word: VocabWord;
  firstSeenLabel: string;
  seenLessonLabels: string[];
  sourceExamples: VocabularySourceExample[];
  relatedMistakes: LearningData["mistakes"];
  relatedGrammar: LearningData["grammar"];
}

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

export function VocabularyWordModal({ item, onClose }: { item: VocabularyWordModalItem; onClose: () => void }) {
  const { word, sourceExamples, relatedMistakes, relatedGrammar, seenLessonLabels, firstSeenLabel } = item;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={`Détails du mot ${word.french}`}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Fermer" onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-3xl leading-tight sm:text-4xl">{word.french}</h2>
              <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${statusStyle[word.status]}`}>{statusLabel[word.status]}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">{word.translation}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-secondary">
            <X className="h-4 w-4" /> Fermer
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-secondary/30 p-4"><div className="text-xs uppercase tracking-wider text-muted-foreground">Occurrences</div><div className="mt-2 font-display text-3xl">×{word.appearances}</div></div>
            <div className="rounded-xl border border-border bg-secondary/30 p-4"><div className="text-xs uppercase tracking-wider text-muted-foreground">Première fois</div><div className="mt-2 text-sm font-medium text-foreground">{firstSeenLabel}</div></div>
            <div className="rounded-xl border border-border bg-secondary/30 p-4"><div className="text-xs uppercase tracking-wider text-muted-foreground">Sources</div><div className="mt-2 font-display text-3xl">{word.sourceIds.length}</div></div>
          </div>

          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><h3 className="font-display text-lg">Exemples de cours</h3></div>
            <div className="grid gap-3 lg:grid-cols-2">
              {sourceExamples.map((source) => (
                <article key={source.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{source.lessonLabel}</span><span className={`rounded-full px-2 py-0.5 uppercase tracking-wider ${statusStyle[source.status]}`}>{statusLabel[source.status]}</span></div>
                  <div className="font-display text-xl">{source.french}</div>
                  <div className="text-sm text-muted-foreground">{source.translation}</div>
                  <p className="mt-3 border-l-2 border-primary/40 pl-3 text-sm italic text-foreground/80">« {source.example} »</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><h3 className="font-display text-lg">Vu dans les leçons</h3></div>
            <div className="flex flex-wrap gap-2">{seenLessonLabels.map((label) => <span key={label} className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-sm">{label}</span>)}</div>
          </section>

          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-primary" /><h3 className="font-display text-lg">Erreurs liées</h3></div>
            {relatedMistakes.length === 0 ? <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Aucune erreur liée à ce mot pour le moment.</div> : (
              <div className="grid gap-3 lg:grid-cols-2">{relatedMistakes.map((mistake) => <article key={mistake.id} className="rounded-xl border border-border bg-secondary/30 p-4"><div className="mb-2 text-xs uppercase tracking-wider text-primary/80">{mistake.category}</div><div className="text-sm text-muted-foreground line-through">{mistake.wrong}</div><div className="mt-1 text-sm font-medium text-foreground">{mistake.correct}</div><div className="mt-2 text-xs text-muted-foreground">{mistake.note}</div></article>)}</div>
            )}
          </section>

          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h3 className="font-display text-lg">Grammaire liée</h3></div>
            {relatedGrammar.length === 0 ? <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Aucun point de grammaire lié automatiquement.</div> : (
              <div className="grid gap-3 lg:grid-cols-2">{relatedGrammar.map((grammar) => <article key={grammar.id} className="rounded-xl border border-border bg-secondary/30 p-4"><div className="mb-2 text-xs uppercase tracking-wider text-primary/80">{grammar.category}</div><div className="font-medium">{grammar.title}</div><div className="mt-1 text-sm text-muted-foreground">{grammar.summary}</div></article>)}</div>
            )}
          </section>

          <details className="mt-6 rounded-xl border border-border bg-secondary/20 p-4 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">Détails techniques</summary>
            <div className="mt-3 space-y-2"><div><span className="font-medium text-foreground">Word ID:</span> {word.id}</div><div><span className="font-medium text-foreground">Source IDs:</span> {word.sourceIds.join(", ")}</div></div>
          </details>
        </div>
      </div>
    </div>
  );
}
