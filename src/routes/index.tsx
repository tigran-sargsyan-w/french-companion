import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Languages, Sparkles, AlertCircle, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { DataErrorState, DataLoadingState } from "@/components/DataState";
import { useLearningData } from "@/data";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const learningDataQuery = useLearningData();

  if (learningDataQuery.isPending) {
    return (
      <>
        <PageHeader
          eyebrow="Bonjour 👋"
          title="Ton tableau de bord"
          description="Un aperçu de ta progression en français cette semaine."
        />
        <DataLoadingState />
      </>
    );
  }

  if (learningDataQuery.isError) {
    return (
      <>
        <PageHeader
          eyebrow="Bonjour 👋"
          title="Ton tableau de bord"
          description="Un aperçu de ta progression en français cette semaine."
        />
        <DataErrorState error={learningDataQuery.error} />
      </>
    );
  }

  const { lessons, vocabulary, grammar, mistakes } = learningDataQuery.data;

  const stats = [
    {
      label: "Leçons",
      value: lessons.length,
      hint: "cours archivés",
      icon: BookOpen,
      to: "/lessons",
      tone: "bg-primary text-primary-foreground",
    },
    {
      label: "Mots de vocabulaire",
      value: vocabulary.length,
      hint: `${vocabulary.filter((v) => v.status === "learned").length} appris`,
      icon: Languages,
      to: "/vocabulary",
      tone: "bg-[var(--color-sage)] text-foreground",
    },
    {
      label: "Points de grammaire",
      value: grammar.length,
      hint: "sujets étudiés",
      icon: Sparkles,
      to: "/grammar",
      tone: "bg-[var(--color-mustard)] text-foreground",
    },
    {
      label: "Fautes à revoir",
      value: mistakes.length,
      hint: "à corriger",
      icon: AlertCircle,
      to: "/mistakes",
      tone: "bg-destructive text-destructive-foreground",
    },
  ];

  const recent = [...lessons].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const learning = vocabulary.filter((v) => v.status === "learning").slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Bonjour 👋"
        title="Ton tableau de bord"
        description="Un aperçu de ta progression en français cette semaine."
      />

      <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              to={s.to}
              className="card-soft flex min-w-0 flex-col justify-between gap-4 overflow-hidden p-4 transition-transform hover:-translate-y-0.5 sm:p-5"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-4xl leading-none">{s.value}</div>
                <div className="mt-2 break-words text-sm font-medium leading-snug">{s.label}</div>
                <div className="break-words text-xs text-muted-foreground">{s.hint}</div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 grid min-w-0 gap-4 lg:grid-cols-3">
        <div className="card-soft min-w-0 overflow-hidden p-4 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
            <h2 className="min-w-0 break-words font-display text-xl">Leçons récentes</h2>
            <Link to="/lessons" className="shrink-0 text-sm text-primary hover:underline">
              Tout voir
            </Link>
          </div>
          <ul className="min-w-0 divide-y divide-border">
            {recent.map((l) => (
              <li key={l.id} className="min-w-0">
                <Link
                  to="/lessons/$lessonId"
                  params={{ lessonId: l.id }}
                  className="group flex min-w-0 items-center gap-3 py-3 sm:gap-4"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground font-display sm:h-12 sm:w-12">
                    {new Date(l.date).toLocaleDateString("fr-FR", { day: "2-digit" })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium transition-colors group-hover:text-primary">
                      {l.title}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{l.summary}</div>
                  </div>
                  <ArrowUpRight className="hidden h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-soft min-w-0 overflow-hidden p-4 sm:p-6">
          <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
            <h2 className="min-w-0 break-words font-display text-xl">En apprentissage</h2>
            <Link to="/review" className="shrink-0 text-sm text-primary hover:underline">
              Réviser
            </Link>
          </div>
          <ul className="min-w-0 space-y-3">
            {learning.map((v) => (
              <li key={v.id} className="flex min-w-0 items-baseline justify-between gap-3">
                <span className="min-w-0 truncate font-display text-base">{v.french}</span>
                <span className="min-w-0 truncate text-right text-xs text-muted-foreground">{v.translation}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
