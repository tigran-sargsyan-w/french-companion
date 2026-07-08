import type { GrammarAnnotatedExample, GrammarExamplePartRole } from "@/types";

const roleClassName: Record<GrammarExamplePartRole, string> = {
  subject: "border-primary/40 bg-primary/10 text-primary",
  "direct-object": "border-destructive/40 bg-destructive/10 text-destructive",
  place: "border-[var(--color-sage)] bg-[var(--color-sage)]/25 text-foreground",
  time: "border-[var(--color-mustard)] bg-[var(--color-mustard)]/25 text-foreground",
  "relative-pronoun": "border-foreground/30 bg-foreground/10 text-foreground",
  pronoun: "border-foreground/30 bg-foreground/10 text-foreground",
  verb: "border-accent bg-accent/40 text-accent-foreground",
  context: "border-border bg-secondary/70 text-foreground",
};

const labelToRole: Record<string, GrammarExamplePartRole> = {
  sujet: "subject",
  cod: "direct-object",
  lieu: "place",
  temps: "time",
  qui: "relative-pronoun",
  que: "relative-pronoun",
  où: "relative-pronoun",
  ou: "relative-pronoun",
  y: "pronoun",
  pronom: "pronoun",
  verbe: "verb",
  ne: "context",
  négation: "context",
  negation: "context",
  contexte: "context",
};

interface ParsedMarkupPart {
  text: string;
  label?: string;
  role?: GrammarExamplePartRole;
}

function getPartClassName(role?: GrammarExamplePartRole) {
  return role ? roleClassName[role] : "border-border bg-secondary/50 text-foreground";
}

function parseMarkup(markup: string): ParsedMarkupPart[] {
  const parts: ParsedMarkupPart[] = [];
  const regex = /\{\{([^:}]+):([^}]+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markup))) {
    const [raw, rawLabel, text] = match;

    if (match.index > lastIndex) {
      parts.push({ text: markup.slice(lastIndex, match.index) });
    }

    const label = rawLabel.trim();
    const role = labelToRole[label.toLowerCase()];
    parts.push({ text, label, role });
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < markup.length) {
    parts.push({ text: markup.slice(lastIndex) });
  }

  return parts;
}

export function AnnotatedGrammarExample({ example }: { example: GrammarAnnotatedExample }) {
  const parts = parseMarkup(example.markup);

  return (
    <div className="rounded-xl border border-border bg-background/70 p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {example.title}
      </div>

      {example.sourceSentences && example.sourceSentences.length > 0 && (
        <div className="mt-3 space-y-1">
          {example.sourceSentences.map((sentence) => (
            <div
              key={sentence}
              className="rounded-md bg-secondary/50 px-3 py-1.5 font-mono text-xs text-muted-foreground"
            >
              {sentence}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-lg border border-border bg-card px-3 py-4 font-mono text-sm leading-8">
        {parts.map((part, index) =>
          part.label ? (
            <span
              key={`${part.text}-${index}`}
              className="inline-flex flex-col items-center align-middle whitespace-pre-wrap"
            >
              <span
                className={`rounded-md border px-1.5 py-0.5 leading-5 ${getPartClassName(part.role)}`}
              >
                {part.text}
              </span>
              <span className="mt-0.5 text-[10px] uppercase leading-none tracking-wide text-muted-foreground">
                {part.label}
              </span>
            </span>
          ) : (
            <span key={`${part.text}-${index}`} className="whitespace-pre-wrap">
              {part.text}
            </span>
          ),
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{example.explanation}</p>
    </div>
  );
}
