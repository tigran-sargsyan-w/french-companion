import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { DataErrorState, DataLoadingState } from "@/components/DataState";
import { MarkdownText } from "@/components/MarkdownText";
import { useLearningData } from "@/data";

export const Route = createFileRoute("/mistakes")({
  component: MistakesPage,
  head: () => ({
    meta: [
      { title: "Fautes — Salut" },
      { name: "description", content: "Tes fautes à corriger et à réviser." },
    ],
  }),
});

function MistakesPage() {
  const learningDataQuery = useLearningData();

  if (learningDataQuery.isPending) {
    return (
      <>
        <PageHeader
          eyebrow="À corriger"
          title="Mes fautes"
          description="Chargement des fautes à revoir."
        />
        <DataLoadingState />
      </>
    );
  }

  if (learningDataQuery.isError) {
    return (
      <>
        <PageHeader
          eyebrow="À corriger"
          title="Mes fautes"
          description="Chaque erreur vaut une leçon. Relis-les régulièrement."
        />
        <DataErrorState error={learningDataQuery.error} />
      </>
    );
  }

  const { mistakes } = learningDataQuery.data;
  const grouped = mistakes.reduce<Record<string, typeof mistakes>>((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="À corriger"
        title="Mes fautes"
        description="Chaque erreur vaut une leçon. Relis-les régulièrement."
      />

      <div className="space-y-8">
        {Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="font-display text-lg">{cat}</h2>
              <span className="text-xs text-muted-foreground">{items.length} fautes</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {items.map((m) => (
                <article key={m.id} className="card-soft p-5">
                  <div className="flex flex-col gap-2">
                    <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-destructive mb-1">
                        Faux
                      </div>
                      <MarkdownText inline className="font-mono text-sm line-through decoration-destructive/50">
                        {m.wrong}
                      </MarkdownText>
                    </div>
                    <div className="rounded-lg bg-[var(--color-sage)]/25 border border-[var(--color-sage)]/60 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-foreground/70 mb-1">
                        Correct
                      </div>
                      <MarkdownText inline className="font-mono text-sm">
                        {m.correct}
                      </MarkdownText>
                    </div>
                  </div>
                  <MarkdownText className="mt-3 text-sm text-muted-foreground">{m.note}</MarkdownText>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
