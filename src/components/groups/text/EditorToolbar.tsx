import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Eraser,
  Highlighter,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Redo2,
  Strikethrough,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { HIGHLIGHT_COLORS, TEXT_COLORS } from "./colors";
import { LinkPopover } from "./LinkPopover";
import { ToolbarButton, ToolbarDivider } from "./ToolbarButton";

/** Barre de mise en forme de l'éditeur riche. */
export function EditorToolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      taskList: e.isActive("taskList"),
      link: e.isActive("link"),
      color: (e.getAttributes("textStyle").color as string | undefined) ?? null,
      highlight: (e.getAttributes("highlight").color as string | undefined) ?? null,
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const run = () => editor.chain().focus();

  return (
    <div role="toolbar" aria-label="Mise en forme" className="flex shrink-0 flex-wrap items-center gap-0.5 rounded-[10px] bg-surface-secondary p-1">
      <ToolbarButton icon={Bold} label="Gras (Ctrl+B)" isActive={s.bold} onPress={() => run().toggleBold().run()} />
      <ToolbarButton icon={Italic} label="Italique (Ctrl+I)" isActive={s.italic} onPress={() => run().toggleItalic().run()} />
      <ToolbarButton
        icon={Underline}
        label="Souligné (Ctrl+U)"
        isActive={s.underline}
        onPress={() => run().toggleUnderline().run()}
      />
      <ToolbarButton icon={Strikethrough} label="Barré" isActive={s.strike} onPress={() => run().toggleStrike().run()} />
      <ToolbarDivider />
      <ToolbarButton
        icon={List}
        label="Liste à puces"
        isActive={s.bulletList}
        onPress={() => run().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="Liste numérotée"
        isActive={s.orderedList}
        onPress={() => run().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={ListChecks}
        label="Liste de cases à cocher"
        isActive={s.taskList}
        onPress={() => run().toggleTaskList().run()}
      />
      <ToolbarDivider />
      <ColorPicker
        icon={Type}
        label="Couleur du texte"
        presets={TEXT_COLORS}
        current={s.color}
        onPick={(c) => run().setColor(c).run()}
        onClear={() => run().unsetColor().run()}
        clearLabel="Couleur par défaut"
      />
      <ColorPicker
        icon={Highlighter}
        label="Couleur de fond"
        presets={HIGHLIGHT_COLORS}
        current={s.highlight}
        onPick={(c) => run().setHighlight({ color: c }).run()}
        onClear={() => run().unsetHighlight().run()}
        clearLabel="Retirer le surlignage"
      />
      <LinkPopover editor={editor} isActive={s.link} />
      <ToolbarDivider />
      <ToolbarButton
        icon={Minus}
        label="Insérer une ligne séparatrice"
        onPress={() => run().setHorizontalRule().run()}
      />
      <ToolbarButton
        icon={Eraser}
        label="Retirer le formatage"
        onPress={() => run().unsetAllMarks().run()}
        className="hover:text-danger"
      />
      <span className="flex-1" />
      <ToolbarButton icon={Undo2} label="Annuler (Ctrl+Z)" isDisabled={!s.canUndo} onPress={() => run().undo().run()} />
      <ToolbarButton icon={Redo2} label="Rétablir (Ctrl+Y)" isDisabled={!s.canRedo} onPress={() => run().redo().run()} />
    </div>
  );
}
