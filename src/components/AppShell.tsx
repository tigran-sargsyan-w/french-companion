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

type NavItem = {
  to: "/" | "/lessons" | "/vocabulary" | "/grammar" | "/mistakes" | "/homework" | "/review";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/lessons", label: "Lessons", icon: BookOpen },
  { to: "/vocabulary", label: "Vocabulary", icon: Languages },
  { to: "/grammar", label: "Grammar", icon: Sparkles },
  { to: "/mistakes", label: "Mistakes", icon: AlertCircle },
  { to: "/homework", label: "Homework", icon: ClipboardList },
  { to: "/review", label: "Review", icon: Repeat },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-background text-foreground">
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
      <main className="md:pl-64 pb-24 md:pb-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 md:pt-10">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <ul className="grid grid-cols-7">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={
                    "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] " +
                    (active ? "text-primary" : "text-muted-foreground")
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate max-w-full px-1">{item.label}</span>
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
  description?: string;
  right?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-xs uppercase tracking-widest text-primary/80 mb-2">{eyebrow}</div>
        )}
        <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">{description}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
