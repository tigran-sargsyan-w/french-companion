import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { homework as initial, lessons } from "@/data";

export const Route = createFileRoute("/homework")({
  component: HomeworkPage,
  head: () => ({
    meta: [
      { title: "Devoirs — Salut" },
      { name: "description", content: "Tes devoirs de français à faire et déjà rendus." },
    ],
  }),
});

function HomeworkPage() {
  const [items, setItems] = useState(initial);
  const toggle = (id: string) =>
    setItems((prev) => prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));

  const pending = items.filter((h) => !h.done);
  const done = items.filter((h) => h.done);

  return (
    <>
      <PageHeader
        eyebrow="À faire"
        title="Devoirs"
        description={`${pending.length} en cours · ${done.length} terminés`}
      />

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="font-display text-lg mb-3">En cours</h2>
          <ul className="space-y-3">
            {pending.map((h) => {
              const lesson = lessons.find((l) => l.id === h.lessonId);
              return (
                <li key={h.id} className="card-soft p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={h.done}
                      onChange={() => toggle(h.id)}
                      className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{h.title}</div>
                      <div className="text-sm text-muted-foreground">{h.description}</div>
                      <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3">
                        <span>Dû le {new Date(h.dueDate).toLocaleDateString("fr-FR")}</span>
                        {lesson && (
                          <Link
                            to="/lessons/$lessonId"
                            params={{ lessonId: lesson.id }}
                            className="text-primary hover:underline"
                          >
                            {lesson.title}
                          </Link>
                        )}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
            {pending.length === 0 && (
              <div className="text-sm text-muted-foreground">Tout est à jour 🎉</div>
            )}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg mb-3">Terminés</h2>
          <ul className="space-y-3">
            {done.map((h) => (
              <li
                key={h.id}
                className="card-soft p-4 opacity-70 flex items-start gap-3"
              >
                <input
                  type="checkbox"
                  checked
                  onChange={() => toggle(h.id)}
                  className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                />
                <div>
                  <div className="font-medium line-through">{h.title}</div>
                  <div className="text-xs text-muted-foreground">{h.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
