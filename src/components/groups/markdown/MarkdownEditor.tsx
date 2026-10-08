import { cn } from "@/lib/utils";

const PLACEHOLDER = `# Titre

Écris ton **Markdown** ici…

- liste
- avec [un lien](https://exemple.com)

\`\`\`
bloc de code
\`\`\``;

type MarkdownEditorProps = {
  value: string;
  onChange: (text: string) => void;
  className?: string;
};

/** Zone de saisie Markdown brute (police à chasse fixe). */
export function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder={PLACEHOLDER}
      spellCheck={false}
      aria-label="Texte Markdown"
      className={cn(
        "min-h-0 flex-1 resize-none rounded-[10px] bg-transparent px-1.5 py-1 font-mono text-[0.9259rem] leading-relaxed text-foreground outline-none",
        "placeholder:text-muted/60",
        className,
      )}
    />
  );
}
