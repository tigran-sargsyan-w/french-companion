import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

interface MarkdownTextProps {
  children: string | string[];
  className?: string;
  inline?: boolean;
}

export function MarkdownText({ children, className = "", inline = false }: MarkdownTextProps) {
  const markdown = Array.isArray(children) ? children.join("\n\n") : children;

  const components: Components = {
    p: ({ children: paragraphChildren }) =>
      inline ? <span>{paragraphChildren}</span> : <p className="mb-3 last:mb-0">{paragraphChildren}</p>,
    strong: ({ children: strongChildren }) => (
      <strong className="font-semibold text-foreground">{strongChildren}</strong>
    ),
    em: ({ children: emphasisChildren }) => <em>{emphasisChildren}</em>,
    del: ({ children: deletedChildren }) => <del>{deletedChildren}</del>,
    a: ({ href, children: linkChildren }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
      >
        {linkChildren}
      </a>
    ),
    code: ({ children: codeChildren }) => (
      <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.9em] text-foreground">
        {codeChildren}
      </code>
    ),
    pre: ({ children: preChildren }) => (
      <pre className="my-3 overflow-x-auto rounded-lg border border-border bg-secondary/60 p-3 text-xs text-foreground">
        {preChildren}
      </pre>
    ),
    blockquote: ({ children: quoteChildren }) => (
      <blockquote className="my-3 border-l-2 border-primary/50 pl-3 italic text-foreground/80">
        {quoteChildren}
      </blockquote>
    ),
    ul: ({ children: listChildren }) => <ul className="my-3 list-disc space-y-1 pl-5">{listChildren}</ul>,
    ol: ({ children: listChildren }) => <ol className="my-3 list-decimal space-y-1 pl-5">{listChildren}</ol>,
    li: ({ children: itemChildren }) => <li>{itemChildren}</li>,
    h1: ({ children: headingChildren }) => (
      <h1 className="mb-2 mt-4 font-display text-xl text-foreground first:mt-0">{headingChildren}</h1>
    ),
    h2: ({ children: headingChildren }) => (
      <h2 className="mb-2 mt-4 font-display text-lg text-foreground first:mt-0">{headingChildren}</h2>
    ),
    h3: ({ children: headingChildren }) => (
      <h3 className="mb-2 mt-3 font-semibold text-foreground first:mt-0">{headingChildren}</h3>
    ),
    hr: () => <hr className="my-4 border-border" />,
    table: ({ children: tableChildren }) => (
      <div className="my-3 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">{tableChildren}</table>
      </div>
    ),
    th: ({ children: cellChildren }) => (
      <th className="border border-border bg-secondary/60 px-3 py-2 font-semibold text-foreground">
        {cellChildren}
      </th>
    ),
    td: ({ children: cellChildren }) => <td className="border border-border px-3 py-2">{cellChildren}</td>,
  };

  const content = (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
      {markdown}
    </ReactMarkdown>
  );

  if (inline) {
    return <span className={className}>{content}</span>;
  }

  return <div className={className}>{content}</div>;
}
