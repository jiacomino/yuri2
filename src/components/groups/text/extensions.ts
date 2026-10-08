import StarterKit from "@tiptap/starter-kit";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";

/** Extensions TipTap du groupe « Texte ». */
export function createExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Les liens s'ouvrent par Ctrl+clic (géré dans l'éditeur), pas au simple clic.
      link: { openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: "https" },
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder: "Écris quelque chose…" }),
  ];
}
