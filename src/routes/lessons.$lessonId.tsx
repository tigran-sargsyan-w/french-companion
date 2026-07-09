import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardList,
  Languages,
  NotebookText,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/AppShell";
import { AnnotatedGrammarExample } from "@/components/AnnotatedGrammarExample";
import { DataErrorState, DataLoadingState } from "@/components/DataState";
import {
  getGrammar,
  getHomework,
  getLesson,
  getMistakesByLesson,
  getVocab,
  useLearningData,
} from "@/data";

export const Route = createFileRoute("/lessons/$lessonId")({
  component: LessonDetail,
});

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function SectionTitle({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="font-display text-lg leading-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="font-display text-3xl mt-2">{value}</div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-4">{children}</div>;
}

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

  const lessonMeta = data.lessonIndex.find((item) => item.id === lesson.id);
  const lessonNumber = lessonMeta?.number ? `Lesson ${lessonMeta.number}` : "Lesson";
  const level = lessonMeta?.level ?? "—";
  const vocab = getVocab(data, lesson.vocabIds);
  const grammar = getGrammar(data, lesson.grammarTopicIds);
  const homework = getHomework(data, lesson.homeworkIds);
  const mistakes = getMistakesByLesson(data, lesson.id);
  const photos = lesson.photos ?? [];

  return (
    <>
      <Link
        to="/lessons"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Toutes les leçons
      </Link>

      <PageHeader
        eyebrow={`${lessonNumber} · ${formatLongDate(lesson.date)} · ${level}`}
        title={lesson.title}
        description={lesson.summary}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Vocabulaire" value={vocab.length} icon={<Languages className="h-4 w-4" />} />
        <StatCard label="Grammaire" value={grammar.length} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Erreurs" value={mistakes.length} icon={<AlertCircle className="h-4 w-4" />} />
        <StatCard label="Devoirs" value={homework.length} icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label="Photos" value={photos.length} icon={<Camera className="h-4 w-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="card-soft p-6 lg:col-span-2">
          <SectionTitle icon={<NotebookText className="h-4 w-4" />} title="Notes de cours" />
          {lesson.notes ? (
            <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
              {lesson.notes}
            </div>
          ) : (
            <EmptyState>Aucune note pour cette leçon.</EmptyState>
          )}
        </section>

        <section className="card-soft p-6">
          <SectionTitle icon={<ClipboardList className="h-4 w-4" />} title="Devoirs" />
          <ul className="space-y-3">
            {homework.map((h) => (
              <li key={h.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                <span
                  className={
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border " +
                    (h.done ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground")
                  }
                >
                  {h.done && <CheckCircle2 className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0">
                  <div className="font-medium">{h.title}</div>
                  {h.description && <div className="text-sm text-muted-foreground">{h.description}</div>}
                  {h.dueDate && (
                    <div className="text-xs text-muted-foreground mt-1">À rendre le {formatShortDate(h.dueDate)}</div>
                  )}
                </div>
              </li>
            ))}
            {homework.length === 0 && <EmptyState>Aucun devoir.</EmptyState>}
          </ul>
        </section>

        <section className="card-soft p-6 lg:col-span-3">
          <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="Grammaire" />
          <div className="space-y-4">
            {grammar.map((g) => (
              <article key={g.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs uppercase tracking-wider text-primary/80">{g.category}</span>
                  <span className="text-muted-foreground">·</span>
                  <h3 className="font-medium">{g.title}</h3>
                </div>
                <div className="text-sm text-muted-foreground">{g.summary}</div>

                {g.examples.length > 0 && (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {g.examples.map((example) => (
                      <li key={example} className="rounded-lg border border-border bg-card/60 px-3 py-2 text-sm italic">
                        « {example} »
                      </li>
                    ))}
                  </ul>
                )}

                {g.annotatedExamples && g.annotatedExamples.length > 0 && (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {g.annotatedExamples.map((example) => (
                      <AnnotatedGrammarExample key={example.title} example={example} />
                    ))}
                  </div>
                )}
              </article>
            ))}
            {grammar.length === 0 && <EmptyState>Aucun point de grammaire.</EmptyState>}
          </div>
        </section>

        <section className="card-soft p-6 lg:col-span-2">
          <SectionTitle icon={<Languages className="h-4 w-4" />} title="Vocabulaire" />
          <div className="grid sm:grid-cols-2 gap-3">
            {vocab.map((v) => (
              <div key={v.id} className="rounded-lg border border-border p-3 bg-secondary/40">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg">{v.french}</span>
                  <span className="text-xs uppercase text-muted-foreground">{v.status}</span>
                </div>
                <div className="text-sm text-muted-foreground">{v.translation}</div>
                <div className="text-xs italic mt-1 text-foreground/70">« {v.example} »</div>
                <div className="mt-2 text-[11px] text-muted-foreground">Occurrences notées: ×{v.appearances}</div>
              </div>
            ))}
            {vocab.length === 0 && <EmptyState>Aucun mot pour cette leçon.</EmptyState>}
          </div>
        </section>

        <section className="card-soft p-6">
          <SectionTitle icon={<AlertCircle className="h-4 w-4" />} title="Erreurs à revoir" />
          <div className="space-y-3">
            {mistakes.map((m) => (
              <article key={m.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="text-xs uppercase tracking-wider text-primary/80 mb-2">{m.category}</div>
                <div className="text-sm text-muted-foreground line-through">{m.wrong}</div>
                <div className="text-sm font-medium text-foreground mt-1">{m.correct}</div>
                <div className="text-xs text-muted-foreground mt-2">{m.note}</div>
              </article>
            ))}
            {mistakes.length === 0 && <EmptyState>Aucune erreur notée.</EmptyState>}
          </div>
        </section>

        <section className="card-soft p-6 lg:col-span-3">
          <SectionTitle icon={<Camera className="h-4 w-4" />} title="Photos & documents" />
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-border text-muted-foreground">
              <Camera className="h-6 w-6 mb-2" />
              <span className="text-xs">Aucune photo pour cette leçon.</span>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {photos.map((src: string, i: number) => (
                <figure key={src} className="rounded-lg border border-border overflow-hidden bg-secondary/30">
                  <img src={src} alt={`Document ${i + 1}`} className="w-full object-cover" />
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground">Document {i + 1}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
