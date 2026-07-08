import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RotateCw, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { vocabulary } from "@/data/mockData";

export const Route = createFileRoute("/review")({
  component: ReviewPage,
  head: () => ({
    meta: [
      { title: "Révision — Salut" },
      { name: "description", content: "Révise ton vocabulaire en mode flashcards." },
    ],
  }),
});

function ReviewPage() {
  const deck = useMemo(
    () => vocabulary.filter((v) => v.status !== "learned"),
    [],
  );
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);

  const current = deck[i];
  const total = deck.length;
  const finished = i >= total;

  const next = (correct: boolean) => {
    if (correct) setKnown((k) => k + 1);
    else setUnknown((u) => u + 1);
    setFlipped(false);
    setI((n) => n + 1);
  };

  const restart = () => {
    setI(0);
    setFlipped(false);
    setKnown(0);
    setUnknown(0);
  };

  return (
    <>
      <PageHeader
        eyebrow="Flashcards"
        title="Révision"
        description="Retourne la carte, puis dis si tu connaissais le mot."
        right={
          <button
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"
          >
            <RotateCw className="h-4 w-4" /> Recommencer
          </button>
        }
      />

      {total === 0 ? (
        <div className="card-soft p-10 text-center">
          <div className="font-display text-2xl">Bravo, tout est appris !</div>
          <p className="text-sm text-muted-foreground mt-2">
            Ajoute de nouveaux mots dans ton vocabulaire pour continuer.
          </p>
        </div>
      ) : finished ? (
        <div className="card-soft p-10 text-center">
          <div className="font-display text-3xl">Session terminée</div>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div>
              <div className="font-display text-3xl text-[var(--color-sage)]">{known}</div>
              <div className="text-muted-foreground">Connus</div>
            </div>
            <div>
              <div className="font-display text-3xl text-destructive">{unknown}</div>
              <div className="text-muted-foreground">À revoir</div>
            </div>
          </div>
          <button
            onClick={restart}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <RotateCw className="h-4 w-4" /> Nouvelle session
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>
              Carte {i + 1} / {total}
            </span>
            <span>
              ✓ {known} · ✗ {unknown}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden mb-6">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((i) / total) * 100}%` }}
            />
          </div>

          <button
            onClick={() => setFlipped((f) => !f)}
            className="card-soft w-full aspect-[4/3] flex flex-col items-center justify-center p-8 text-center hover:shadow-lg transition-shadow"
          >
            {!flipped ? (
              <>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  Français
                </div>
                <div className="font-display text-4xl sm:text-5xl">{current.french}</div>
                <div className="mt-6 text-xs text-muted-foreground">
                  Clique pour retourner
                </div>
              </>
            ) : (
              <>
                <div className="text-xs uppercase tracking-widest text-primary/80 mb-4">
                  Traduction
                </div>
                <div className="font-display text-3xl">{current.translation}</div>
                <p className="text-sm italic text-muted-foreground mt-4">« {current.example} »</p>
              </>
            )}
          </button>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => next(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 font-medium hover:bg-destructive/20"
            >
              <X className="h-5 w-5" /> À revoir
            </button>
            <button
              onClick={() => next(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 font-medium hover:bg-primary/90"
            >
              <Check className="h-5 w-5" /> Connu
            </button>
          </div>

          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <button
              className="inline-flex items-center gap-1 hover:text-foreground disabled:opacity-40"
              disabled={i === 0}
              onClick={() => {
                setI((n) => Math.max(0, n - 1));
                setFlipped(false);
              }}
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </button>
            <button
              className="inline-flex items-center gap-1 hover:text-foreground"
              onClick={() => {
                setFlipped(false);
                setI((n) => n + 1);
              }}
            >
              Passer <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
