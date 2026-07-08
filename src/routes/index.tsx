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

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              to={s.to}
              className="card-soft p-5 flex flex-col justify-between gap-4 hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-start justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${s.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="font-display text-4xl leading-none">{s.value}</div>
                <div className="mt-2 text-sm font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.hint}</div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mt-8">
        <div className="card-soft p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Leçons récentes</h2>
            <Link to="/lessons" className="text-sm text-primary hover:underline">
              Tout voir
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((l) => (
              <li key={l.id}>
                <Link
                  to="/lessons/$lessonId"
                  params={{ lessonId: l.id }}
                  className="flex items-center gap-4 py-3 group"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground font-display">
                    {new Date(l.date).toLocaleDateString("fr-FR", { day: "2-digit" })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate group-hover:text-primary transition-colors">
                      {l.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{l.summary}</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">En apprentissage</h2>
            <Link to="/review" className="text-sm text-primary hover:underline">
              Réviser
            </Link>
          </div>
          <ul className="space-y-3">
            {learning.map((v) => (
              <li key={v.id} className="flex items-baseline justify-between gap-3">
                <span className="font-display text-base">{v.french}</span>
                <span className="text-xs text-muted-foreground truncate">{v.translation}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
