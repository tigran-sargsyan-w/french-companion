import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { DataErrorState, DataLoadingState } from "@/components/DataState";
import { MarkdownText } from "@/components/MarkdownText";
import { getGrammarByLesson, getVocabByLesson, useLearningData } from "@/data";

const CLASS_LEVEL_FILTERS = ["all", "B1N1", "B1N2", "B1N3"] as const;
type ClassLevelFilter = (typeof CLASS_LEVEL_FILTERS)[number];

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
  const learningDataQuery = useLearningData();
  const [selectedClassLevel, setSelectedClassLevel] = useState<ClassLevelFilter>("all");

  if (learningDataQuery.isPending) {
    return (
      <>
        <PageHeader
          eyebrow="Archive"
          title="Leçons"
          description="Chargement des leçons."
        />
        <DataLoadingState />
      </>
    );
  }

  if (learningDataQuery.isError) {
    return (
      <>
        <PageHeader
          eyebrow="Archive"
          title="Leçons"
          description="Regroupées par mois. Clique sur une leçon pour voir les détails."
        />
        <DataErrorState error={learningDataQuery.error} />
      </>
    );
  }

  const data = learningDataQuery.data;
  const classLevelByLessonId = new Map(
    data.lessonIndex.map((lesson) => [lesson.id, lesson.classLevel] as const),
  );

  const visibleLessons = data.lessons.filter((lesson) => {
    if (selectedClassLevel === "all") {
      return true;
    }

    return classLevelByLessonId.get(lesson.id) === selectedClassLevel;
  });

  const sorted = [...visibleLessons].sort((a, b) => b.date.localeCompare(a.date));
  const grouped = sorted.reduce<Record<string, typeof data.lessons>>((acc, l) => {
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
        description="Filtre les leçons par niveau de classe, puis ouvre une leçon pour voir les détails."
      />

      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filtrer les leçons par niveau">
        {CLASS_LEVEL_FILTERS.map((classLevel) => {
          const isActive = selectedClassLevel === classLevel;
          const count =
            classLevel === "all"
              ? data.lessons.length
              : data.lessonIndex.filter((lesson) => lesson.classLevel === classLevel).length;

          return (
            <button
              key={classLevel}
              type="button"
              onClick={() => setSelectedClassLevel(classLevel)}
              aria-pressed={isActive}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {classLevel === "all" ? "Toutes" : classLevel}
              <span className="ml-2 text-xs opacity-75">{count}</span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <div className="card-soft p-6 text-sm text-muted-foreground">
          Aucune leçon n’est encore disponible pour ce niveau.
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([month, items]) => (
            <section key={month}>
              <h2 className="mb-3 font-display text-lg capitalize text-muted-foreground">
                {month}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((l) => {
                  const vocab = getVocabByLesson(data, l.id);
                  const gram = getGrammarByLesson(data, l.id);
                  const classLevel = classLevelByLessonId.get(l.id);

                  return (
                    <Link
                      key={l.id}
                      to="/lessons/$lessonId"
                      params={{ lessonId: l.id }}
                      className="card-soft p-5 transition-transform hover:-translate-y-0.5"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary font-display text-lg text-primary-foreground">
                          {new Date(l.date).toLocaleDateString("fr-FR", { day: "2-digit" })}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs text-muted-foreground">
                              {new Date(l.date).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </div>
                            {classLevel ? (
                              <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                                {classLevel}
                              </span>
                            ) : null}
                          </div>
                          <div className="truncate font-display text-lg leading-tight">
                            {l.title}
                          </div>
                        </div>
                      </div>
                      <MarkdownText inline className="line-clamp-2 text-sm text-muted-foreground">
                        {l.summary}
                      </MarkdownText>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-secondary px-2 py-1">
                          {vocab.length} mots
                        </span>
                        <span className="rounded-md bg-accent/40 px-2 py-1">
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
      )}
    </>
  );
}
