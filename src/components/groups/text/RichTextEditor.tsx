import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { openWithPref } from "@/lib/browserPref";
import { EditorToolbar } from "./EditorToolbar";
import { createExtensions } from "./extensions";
import "./richText.css";

type RichTextEditorProps = {
  /** HTML du document. */
  content: string;
  onChange: (html: string) => void;
};

/**
 * Éditeur riche TipTap (barre d'outils + zone de saisie). Monté avec une `key` par
 * onglet : changer d'onglet recrée l'éditeur avec son propre historique d'annulation.
 */
export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Dernier HTML émis : distingue nos propres mises à jour d'un changement externe.
  const lastHtmlRef = useRef(content);

  const editor = useEditor({
    extensions: createExtensions(),
    content,
    editorProps: {
      attributes: { "aria-label": "Texte de la note", spellcheck: "true" },
      handleClick: (_view, _pos, event) => {
        const anchor = (event.target as HTMLElement | null)?.closest("a");
        const href = anchor?.getAttribute("href");
        if (href && (event.ctrlKey || event.metaKey)) {
          openWithPref(href).catch((err) => console.error("Ouverture du lien impossible", err));
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.isEmpty ? "" : e.getHTML();
      lastHtmlRef.current = html;
      onChangeRef.current(html);
    },
  });

  // Contenu modifié de l'extérieur (import, restauration) : on resynchronise,
  // sauf pendant la saisie pour ne pas casser le curseur.
  useEffect(() => {
    if (!editor || content === lastHtmlRef.current || editor.isFocused) return;
    lastHtmlRef.current = content;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <EditorToolbar editor={editor} />
      <div
        className="yuri-rich-text min-h-0 flex-1 cursor-text overflow-y-auto rounded-[10px] px-1.5 py-1"
        onClick={(e) => {
          // Clic dans la marge sous le texte : place le curseur en fin de document.
          if (e.target === e.currentTarget) editor.commands.focus("end");
        }}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
