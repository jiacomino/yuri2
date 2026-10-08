import type { LucideIcon } from "lucide-react";
import { Button, Tooltip } from "@heroui/react";
import { cn } from "@/lib/utils";

type ToolbarButtonProps = {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  className?: string;
};

/** Bouton icône de la barre d'outils, avec infobulle et état actif. */
export function ToolbarButton({ icon: Icon, label, isActive, isDisabled, onPress, className }: ToolbarButtonProps) {
  return (
    <Tooltip delay={500}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={label}
        aria-pressed={isActive}
        isDisabled={isDisabled}
        onPress={onPress}
        className={cn(
          "size-7 min-w-7 rounded-lg text-muted hover:bg-surface hover:text-foreground",
          isActive && "bg-surface text-accent shadow-[0_1px_2px_rgba(16,24,40,.08)] hover:text-accent",
          className,
        )}
      >
        <Icon className="size-3.5" />
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}

/** Fin séparateur vertical entre groupes de boutons. */
export function ToolbarDivider() {
  return <span aria-hidden className="mx-1 h-4 w-px bg-border" />;
}
