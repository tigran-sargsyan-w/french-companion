import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Check, RotateCw, Settings2, X } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import {
  createDeck,
  createQuestion,
  PRONOUNS,
  TENSES,
  useConjugationVerbs,
  type Pronoun,
  type Question,
  type Tense,
  type VerbGroup,
} from "@/data/conjugaison";

export const Route = createFileRoute("/review_/conjugaison")({
  component: ConjugaisonPage,
  head: () => ({
    meta: [
      { title: "Conjugaison — Salut" },
      { name: "description", content: "Entraîne-toi à conjuguer les verbes français." },
    ],
  }),
});

type VerbFilter = "all" | VerbGroup;
type RecordAnswer = { question: Question; correct: boolean };
const button = "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors";
const primary = button + " bg-primary text-primary-foreground hover:bg-primary/90";
const outlined = button + " border border-border hover:bg-secondary";
const label = (tense: Tense) => TENSES.find((item) => item.id === tense)?.label ?? tense;

function ConjugaisonPage() {
  const verbQuery = useConjugationVerbs();
  const [tenses, setTenses] = useState<Tense[]>(TENSES.map((tense) => tense.id));
  const [pronouns, setPronouns] = useState<Pronoun[]>([...PRONOUNS]);
  const [verbFilter, setVerbFilter] = useState<VerbFilter>("all");
  const [questionLimit, setQuestionLimit] = useState("20");
  const [deck, setDeck] = useState<Question[] | null>(null);
  const [position, setPosition] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<RecordAnswer[]>([]);

  const available = useMemo(
    () => (verbQuery.data ?? []).filter((verb) => verbFilter === "all" || verb.group === verbFilter),
    [verbFilter, verbQuery.data],
  );
  const current = deck?.[position];
  const finished = deck !== null && position >= deck.length;

  const start = (customDeck?: Question[]) => {
    const questions = customDeck ?? createDeck(
      available,
      tenses,
      pronouns,
      questionLimit === "all" ? Number.MAX_SAFE_INTEGER : Number(questionLimit),
    );
    if (!questions.length) return;
    setDeck(questions);
    setPosition(0);
    setChosen(null);
    setAnswers([]);
  };

  const pick = (index: number) => {
    if (!current || chosen !== null) return;
    setChosen(index);
    setAnswers((previous) => [
      ...previous,
      { question: current, correct: current.correctIndex === index },
    ]);
  };

  const advance = () => {
    if (chosen === null) return;
    setChosen(null);
    setPosition((previous) => previous + 1);
  };

  const mistakes = answers.filter((answer) => !answer.correct);
  const successful = answers.length - mistakes.length;
  const resultsByTense = TENSES
    .map((tense) => {
      const relevant = answers.filter((answer) => answer.question.tense === tense.id);
      const correct = relevant.filter((answer) => answer.correct).length;
      return { label: tense.label, count: relevant.length, correct };
    })
    .filter((item) => item.count > 0);
  const difficultVerbs = Object.entries(
    mistakes.reduce<Record<string, number>>((acc, answer) => {
      const verb = answer.question.verb.infinitive;
      acc[verb] = (acc[verb] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Révision · Choix multiple"
        title="Conjugaison"
        description="Quatre réponses mélangées à chaque question : conjugue les verbes à tous les temps."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link to="/review" className={outlined}>Vocabulaire</Link>
        <span className={primary} aria-current="page">Conjugaison</span>
      </div>

      {verbQuery.isPending ? (
        <div className="card-soft p-8 text-center text-muted-foreground">Chargement des conjugaisons…</div>
      ) : verbQuery.isError ? (
        <div role="alert" className="card-soft p-8 text-center text-destructive">Impossible de charger les conjugaisons : {verbQuery.error.message}</div>
      ) : deck === null ? (
        <section className="card-soft mx-auto max-w-3xl space-y-6 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-2xl">
              <Settings2 className="h-5 w-5" /> Configuration
            </h2>
            <span className="text-sm text-muted-foreground">
              {available.length} verbes en apprentissage
            </span>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Temps verbaux ({tenses.length} / {TENSES.length})</h3>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setTenses(TENSES.map((t) => t.id))} className="text-primary hover:underline">Tout sélectionner</button>
                <button onClick={() => setTenses([])} className="text-muted-foreground hover:underline">Aucun</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {TENSES.map((tense) => {
                const active = tenses.includes(tense.id);
                return (
                  <button
                    key={tense.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTenses((previous) =>
                      active ? previous.filter((id) => id !== tense.id) : [...previous, tense.id],
                    )}
                    className={"rounded-full border px-3 py-2 text-xs sm:text-sm " +
                      (active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/40 text-muted-foreground")}
                  >
                    {active ? "✓ " : ""}{tense.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Pronoms ({pronouns.length} / {PRONOUNS.length})</h3>
              <button className="text-xs text-primary hover:underline" onClick={() => setPronouns([...PRONOUNS])}>Tous</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRONOUNS.map((pronoun) => {
                const active = pronouns.includes(pronoun);
                return (
                  <button
                    key={pronoun}
                    aria-pressed={active}
                    onClick={() => setPronouns((previous) => active
                      ? previous.filter((value) => value !== pronoun)
                      : [...previous, pronoun],
                    )}
                    className={"rounded-lg border px-3 py-2 text-sm " +
                      (active ? "border-primary bg-primary/10" : "border-border bg-secondary/40 text-muted-foreground")}
                  >{pronoun}</button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Verbes
              <select value={verbFilter} onChange={(event) => setVerbFilter(event.target.value as VerbFilter)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-normal">
                <option value="all">Tous les verbes</option>
                <option value="regular">Verbes réguliers</option>
                <option value="irregular">Verbes irréguliers</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Nombre de questions
              <select value={questionLimit} onChange={(event) => setQuestionLimit(event.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-normal">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="all">Sans limite (toutes les combinaisons)</option>
              </select>
            </label>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Par défaut, tout est sélectionné. Seuls les verbes avec le statut « learning »
            participent au test. Pour « je », « tu », « on » et les sujets pluriels,
            les accords avec être suivent les conventions précisées dans les fichiers JSON.
          </p>
          <button
            className={primary + " flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"}
            disabled={!tenses.length || !pronouns.length || !available.length}
            onClick={() => start()}
          >
            Commencer <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      ) : finished ? (
        <section className="card-soft mx-auto max-w-2xl space-y-6 p-5 sm:p-8">
          <h2 className="text-center font-display text-3xl">Session terminée</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-secondary/60 p-3">
              <div className="font-display text-3xl text-emerald-600">{successful}</div>
              <div className="text-xs text-muted-foreground">Correctes</div>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <div className="font-display text-3xl text-destructive">{mistakes.length}</div>
              <div className="text-xs text-muted-foreground">Erreurs</div>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <div className="font-display text-3xl">{answers.length ? Math.round(successful / answers.length * 100) : 0}%</div>
              <div className="text-xs text-muted-foreground">Réussite</div>
            </div>
          </div>
          {resultsByTense.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-xl">Résultats par temps</h3>
              {resultsByTense.map((result) => (
                <div key={result.label}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span>{result.label}</span>
                    <span>{result.correct} / {result.count} ({Math.round(result.correct / result.count * 100)}%)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${result.correct / result.count * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {difficultVerbs.length > 0 && (
            <div>
              <h3 className="mb-2 font-display text-xl">Verbes à revoir</h3>
              <div className="flex flex-wrap gap-2">
                {difficultVerbs.map(([verb, count]) =>
                  <span key={verb} className="rounded-lg border border-border px-3 py-2 text-sm">
                    {verb} · {count} {count > 1 ? "erreurs" : "erreur"}
                  </span>,
                )}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Résultats conservés uniquement pendant cette session.</p>
          <div className="flex flex-wrap gap-2">
            {mistakes.length > 0 && (
              <button
                className={primary}
                onClick={() => start(mistakes
                  .map(({ question }) => createQuestion(question))
                  .filter((question): question is Question => question !== null))}
              >
                Revoir mes erreurs ({mistakes.length})
              </button>
            )}
            <button className={outlined + " inline-flex items-center gap-2"} onClick={() => start()}>
              <RotateCw className="h-4 w-4" /> Nouvelle session
            </button>
            <button className={outlined} onClick={() => { setDeck(null); setAnswers([]); }}>
              Configuration
            </button>
          </div>
        </section>
      ) : current ? (
        <section className="mx-auto max-w-2xl space-y-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Question {position + 1} / {deck.length}</span>
            <span>✓ {successful} · ✗ {mistakes.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${position / deck.length * 100}%` }} />
          </div>
          <div className="card-soft space-y-4 p-6 text-center sm:p-8">
            <div className="text-sm text-muted-foreground">Choisis la bonne conjugaison</div>
            <div className="font-display text-4xl">{current.verb.infinitive}</div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-secondary px-3 py-1 text-sm">{current.pronoun}</span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm">{label(current.tense)}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {current.choices.map((choice, index) => {
              const right = chosen !== null && index === current.correctIndex;
              const wrong = chosen === index && !right;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={chosen !== null}
                  aria-pressed={chosen === index}
                  onClick={() => pick(index)}
                  className={"flex min-h-20 items-center justify-center gap-2 rounded-xl border p-4 text-center text-sm font-medium transition-colors disabled:cursor-default sm:text-base " +
                    (right ? "border-emerald-500 bg-emerald-500/10" : wrong
                      ? "border-destructive bg-destructive/10"
                      : "border-border bg-card hover:bg-secondary disabled:hover:bg-card")}
                >
                  {choice}
                  {right && <Check className="h-5 w-5 shrink-0 text-emerald-600" />}
                  {wrong && <X className="h-5 w-5 shrink-0 text-destructive" />}
                </button>
              );
            })}
          </div>
          {chosen !== null && (
            <div className="card-soft space-y-3 p-4">
              <div className="font-semibold">
                {chosen === current.correctIndex ? "✓ Bonne réponse !" : "✗ Pas tout à fait."}
              </div>
              {chosen !== current.correctIndex &&
                <p className="text-sm">Bonne réponse : <strong>{current.correct}</strong></p>}
              <p className="text-xs text-muted-foreground">{label(current.tense)} · {current.verb.infinitive}</p>
              <button className={primary + " flex w-full items-center justify-center gap-2"} onClick={advance}>
                {position === deck.length - 1 ? "Voir les résultats" : "Question suivante"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="text-center">
            <button
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => { setChosen(null); setPosition(deck.length); }}
            >
              Terminer la session
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
