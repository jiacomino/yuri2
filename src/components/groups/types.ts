import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export type GroupKind =
  | "links"
  | "text"
  | "markdown"
  | "postit"
  | "todo"
  | "kanban"
  | "eisenhower"
  | "pomotask"
  | "pomodoro"
  | "posture"
  | "calendar"
  | "gcalendar"
  | "mindmap"
  | "workflow"
  | "image"
  | "password"
  | "timetrack"
  | "goals"
  | "clipboard"
  | "launcher";

/**
 * Contrat commun à tous les corps de groupe : un état typé, contrôlé par le parent.
 * L'état est sérialisable en JSON (il sera stocké dans la colonne `content` en SQLite).
 */
export type BodyProps<S> = {
  /** Identifiant du groupe, utile pour des ids DOM ou des clés de timers. */
  groupId: string;
  value: S;
  onChange: (next: S) => void;
};

/** Description d'un type de groupe, consommée par le registre. */
export type GroupDefinition<S> = {
  kind: GroupKind;
  /** Libellé français affiché à l'utilisateur. */
  label: string;
  icon: LucideIcon;
  /** Couleur par défaut de la pastille (hex). */
  color: string;
  /** État initial d'un groupe neuf. */
  defaultState: () => S;
  /** État de démonstration pour la galerie (sinon `defaultState`). */
  demoState?: () => S;
  Body: ComponentType<BodyProps<S>>;
  /** Taille dans la galerie : nombre de colonnes (1 à 3) et hauteur en px. */
  preview: { cols: 1 | 2 | 3; height: number };
};
