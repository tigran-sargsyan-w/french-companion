import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Camera } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { AnnotatedGrammarExample } from "@/components/AnnotatedGrammarExample";
import { DataErrorState, DataLoadingState } from "@/components/DataState";
import { getGrammar, getHomework, getLesson, getVocab, useLearningData } from "@/data";

export const Route = createFileRoute("/lessons/$lessonId")({
  component: LessonDetail,
});

function LessonDetail() {
  const { lessonId } = Route.useParams();
  const learningDataQuery = useLearningData();

  if (learningDataQuery.isPending) {
    return (
      <>
        <Link
          to="/lessons"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Toutes les leçons
        </Link>
        <DataLoadingState />
      </>
    );
  }

  if (learningDataQuery.isError) {
    return (
      <>
        <Link
          to="/lessons"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Toutes les leçons
        </Link>
        <DataErrorState error={learningDataQuery.error} />
      </>
    );
  }

  const data = learningDataQuery.data;
  const lesson = getLesson(data, lessonId);

  if (!lesson) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-display text-3xl">Leçon introuvable</h1>
        <Link to="/lessons" className="text-primary hover:underline mt-4 inline-block">
          ← Retour aux leçons
        </Link>
      </div>
    );
  }

  const vocab = getVocab(data, lesson.vocabIds);
  const grammar = getGrammar(data, lesson.grammarTopicIds);
  const homework = getHomework(data, lesson.homeworkIds);

  return (
    <>
      <Link
        to="/lessons"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Toutes les leçons
      </Link>

      <PageHeader
        eyebrow={new Date(lesson.date).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        title={lesson.title}
        description={lesson.summary}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="card-soft p-6 lg:col-span-2">
          <h2 className="font-display text-lg mb-3">Vocabulaire</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {vocab.map((v) => (
              <div key={v.id} className="rounded-lg border border-border p-3 bg-secondary/40">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg">{v.french}</span>
                  <span className="text-xs uppercase text-muted-foreground">{v.status}</span>
                </div>
                <div className="text-sm text-muted-foreground">{v.translation}</div>
                <div className="text-xs italic mt-1 text-foreground/70">« {v.example} »</div>
              </div>
            ))}
            {vocab.length === 0 && (
              <div className="text-sm text-muted-foreground">Aucun mot pour cette leçon.</div>
            )}
          </div>
        </section>

        <section className="card-soft p-6">
          <h2 className="font-display text-lg mb-3">Devoirs</h2>
          <ul className="space-y-3">
            {homework.map((h) => (
              <li
                key={h.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border"
              >
                <span
                  className={
                    "mt-1 h-4 w-4 shrink-0 rounded border " +
                    (h.done ? "bg-primary border-primary" : "border-border")
                  }
                />
                <div className="min-w-0">
                  <div className="font-medium">{h.title}</div>
                  <div className="text-sm text-muted-foreground">{h.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    À rendre le {new Date(h.dueDate).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </li>
            ))}
            {homework.length === 0 && (
              <div className="text-sm text-muted-foreground">Aucun devoir.</div>
            )}
          </ul>
        </section>

        <section className="card-soft p-6 lg:col-span-3">
          <h2 className="font-display text-lg mb-3">Grammaire</h2>
          <div className="space-y-4">
            {grammar.map((g) => (
              <article key={g.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="text-xs uppercase tracking-wider text-primary/80">
                  {g.category}
                </div>
                <div className="font-medium">{g.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{g.summary}</div>
                {g.annotatedExamples && g.annotatedExamples.length > 0 && (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {g.annotatedExamples.map((example) => (
                      <AnnotatedGrammarExample key={example.title} example={example} />
                    ))}
                  </div>
                )}
              </article>
            ))}
            {grammar.length === 0 && (
              <div className="text-sm text-muted-foreground">Aucun point de grammaire.</div>
            )}
          </div>
        </section>

        <section className="card-soft p-6 lg:col-span-2">
          <h2 className="font-display text-lg mb-3">Notes & Photos</h2>
          <p className="text-sm text-foreground/80 whitespace-pre-line">{lesson.notes}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {lesson.photos.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-border text-muted-foreground">
                <Camera className="h-6 w-6 mb-2" />
                <span className="text-xs">Aucune photo</span>
              </div>
            ) : (
              lesson.photos.map((src: string, i: number) => (
                <img
                  key={i}
                  src={src}
                  alt={`Note ${i + 1}`}
                  className="rounded-lg border border-border"
                />
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
