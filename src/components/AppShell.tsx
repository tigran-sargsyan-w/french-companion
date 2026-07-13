import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Languages,
  AlertCircle,
  ClipboardList,
  Repeat,
} from "lucide-react";
import { isMarkdownContent, MarkdownText } from "@/components/MarkdownText";

type NavItem = {
  to: "/" | "/lessons" | "/vocabulary" | "/grammar" | "/mistakes" | "/homework" | "/review";
  label: string;
  mobileLabel: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const nav: NavItem[] = [
  { to: "/", label: "Accueil", mobileLabel: "Accueil", icon: LayoutDashboard, exact: true },
  { to: "/lessons", label: "Leçons", mobileLabel: "Leçons", icon: BookOpen },
  { to: "/vocabulary", label: "Vocabulaire", mobileLabel: "Vocab.", icon: Languages },
  { to: "/grammar", label: "Grammaire", mobileLabel: "Gramm.", icon: Sparkles },
  { to: "/mistakes", label: "Fautes", mobileLabel: "Fautes", icon: AlertCircle },
  { to: "/homework", label: "Devoirs", mobileLabel: "Devoirs", icon: ClipboardList },
  { to: "/review", label: "Révision", mobileLabel: "Réviser", icon: Repeat },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isStandalonePage = pathname === "/vocabulary/unlearned";
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  if (isStandalonePage) {
    return <div className="min-h-screen bg-white text-slate-950">{children}</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-card/60 backdrop-blur">
        <div className="px-6 pt-7 pb-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg">
              Fr
            </span>
            <div className="min-w-0">
              <div className="font-display text-lg leading-none">Salut</div>
              <div className="text-xs text-muted-foreground mt-1">Mon cahier de français</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/80 hover:bg-secondary hover:text-foreground")
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 m-4 rounded-xl bg-accent/40 border border-border">
          <div className="font-display text-sm">Astuce du jour</div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Lis à haute voix pendant 5 minutes — ta prononciation te remerciera.
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 overflow-x-hidden pb-24 md:pl-64 md:pb-8">
        <div className="mx-auto w-full max-w-6xl min-w-0 px-4 pt-6 sm:px-6 md:pt-10">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <ul className="grid w-full min-w-0 grid-cols-7">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <li key={item.to} className="min-w-0">
                <Link
                  to={item.to}
                  aria-label={item.label}
                  className={
                    "flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] " +
                    (active ? "text-primary" : "text-muted-foreground")
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="block w-full truncate text-center leading-tight">{item.mobileLabel}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="mb-8 grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-xs uppercase tracking-widest text-primary/80 mb-2">{eyebrow}</div>
        )}
        <h1 className="break-words font-display text-3xl sm:text-4xl">{title}</h1>
        {description && (
          <div className="text-sm text-muted-foreground mt-2 max-w-xl">
            {isMarkdownContent(description) ? <MarkdownText>{description}</MarkdownText> : description}
          </div>
        )}
      </div>
      {right && <div className="min-w-0 sm:shrink-0">{right}</div>}
    </header>
  );
}
