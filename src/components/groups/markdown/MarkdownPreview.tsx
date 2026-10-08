import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText } from "lucide-react";
import { openWithPref } from "@/lib/browserPref";
import { cn } from "@/lib/utils";

/** Les liens s'ouvrent dans le navigateur choisi, jamais dans la webview. */
const components: Components = {
  a: ({ href, children, node: _node, ...props }) => (
    <a
      {...props}
      href={href}
      title={href}
      onClick={(e) => {
        e.preventDefault();
        if (href) openWithPref(href).catch((err) => console.error("Ouverture du lien impossible", err));
      }}
    >
      {children}
    </a>
  ),
};

const PROSE = cn(
  "text-[1rem] leading-relaxed text-foreground",
  "[&>*:first-child]:mt-0",
  "[&_h1]:mt-3 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-extrabold [&_h1]:tracking-[-0.02em]",
  "[&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-[1.1111rem] [&_h2]:font-bold [&_h2]:tracking-[-0.01em]",
  "[&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-[0.8148rem] [&_h3]:font-bold [&_h3]:tracking-[.06em] [&_h3]:text-muted [&_h3]:uppercase",
  "[&_h4]:mt-2 [&_h4]:mb-1 [&_h4]:font-semibold",
  "[&_p]:my-1.5",
  "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:my-0.5 [&_li>p]:my-0",
  "[&_li.task-list-item]:list-none [&_ul.contains-task-list]:pl-1 [&_input[type=checkbox]]:mr-1.5 [&_input[type=checkbox]]:align-middle [&_input[type=checkbox]]:accent-[var(--accent)]",
  "[&_code]:rounded-md [&_code]:bg-default [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.8148rem]",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-[10px] [&_pre]:bg-surface-secondary [&_pre]:p-3",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_a]:cursor-pointer [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-accent/50 [&_blockquote]:pl-3 [&_blockquote]:text-muted [&_blockquote]:italic",
  "[&_hr]:my-3 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-separator",
  "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[0.8889rem]",
  "[&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-[0.8148rem] [&_th]:font-bold [&_th]:tracking-[.06em] [&_th]:text-muted [&_th]:uppercase",
  "[&_td]:border-b [&_td]:border-separator [&_td]:px-2 [&_td]:py-1.5",
  "[&_del]:text-muted [&_strong]:font-semibold",
);

/** Rendu Markdown (GFM : tableaux, cases à cocher, barré, liens automatiques). */
export function MarkdownPreview({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto rounded-[10px] px-1.5 py-1", className)}>
      {text.trim() ? (
        <div className={PROSE}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {text}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <FileText className="size-5" />
          </span>
          <p className="text-[0.8889rem] text-muted">Aucun contenu. Passe en édition pour saisir du Markdown.</p>
        </div>
      )}
    </div>
  );
}
