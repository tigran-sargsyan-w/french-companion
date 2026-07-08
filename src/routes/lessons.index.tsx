import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { lessons, getVocab, getGrammar } from "@/data";

export const Route = createFileRoute("/lessons/")({
  component: LessonsPage,
  head: () => ({
    meta: [
      { title: "Leçons — Salut" },
      { name: "description", content: "Toutes tes leçons de français regroupées par date." },
    ],
  }),
});

function LessonsPage() {
  const sorted = [...lessons].sort((a, b) => b.date.localeCompare(a.date));
  const grouped = sorted.reduce<Record<string, typeof lessons>>((acc, l) => {
    const key = new Date(l.date).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    (acc[key] ||= []).push(l);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Archive"
        title="Leçons"
        description="Regroupées par mois. Clique sur une leçon pour voir les détails."
      />

      <div className="space-y-10">
        {Object.entries(grouped).map(([month, items]) => (
          <section key={month}>
            <h2 className="font-display text-lg text-muted-foreground capitalize mb-3">
              {month}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((l) => {
                const vocab = getVocab(l.vocabIds);
                const gram = getGrammar(l.grammarTopicIds);
                return (
                  <Link
                    key={l.id}
                    to="/lessons/$lessonId"
                    params={{ lessonId: l.id }}
                    className="card-soft p-5 hover:-translate-y-0.5 transition-transform"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg">
                        {new Date(l.date).toLocaleDateString("fr-FR", { day: "2-digit" })}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">
                          {new Date(l.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </div>
                        <div className="font-display text-lg leading-tight truncate">
                          {l.title}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{l.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded-md bg-secondary">
                        {vocab.length} mots
                      </span>
                      <span className="px-2 py-1 rounded-md bg-accent/40">
                        {gram.length} points de grammaire
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
