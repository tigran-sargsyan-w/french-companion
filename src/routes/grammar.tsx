import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { grammar } from "@/data";

export const Route = createFileRoute("/grammar")({
  component: GrammarPage,
  head: () => ({
    meta: [
      { title: "Grammaire — Salut" },
      { name: "description", content: "Tes points de grammaire française." },
    ],
  }),
});

function GrammarPage() {
  const byCategory = grammar.reduce<Record<string, typeof grammar>>((acc, g) => {
    (acc[g.category] ||= []).push(g);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Règles & structures"
        title="Grammaire"
        description="Chaque carte reprend un point vu en cours."
      />

      <div className="space-y-8">
        {Object.entries(byCategory).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="font-display text-lg text-muted-foreground mb-3">{cat}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((g) => (
                <article key={g.id} className="card-soft p-5">
                  <div className="text-xs uppercase tracking-widest text-primary/80">
                    {g.category}
                  </div>
                  <h3 className="font-display text-xl mt-1">{g.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{g.summary}</p>
                  <ul className="mt-3 space-y-1">
                    {g.examples.map((ex, i) => (
                      <li
                        key={i}
                        className="text-sm font-mono bg-secondary/60 px-3 py-1.5 rounded-md"
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
