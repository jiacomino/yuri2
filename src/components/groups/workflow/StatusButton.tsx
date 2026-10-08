import { Circle, CircleCheck, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionStatus } from "./state";

const STATUS_META: Record<ActionStatus, { title: string; className: string; Icon: typeof Circle }> = {
  todo: { title: "À faire — cliquer pour démarrer", className: "text-muted", Icon: Circle },
  doing: { title: "En cours — cliquer pour terminer", className: "text-blue-500", Icon: CircleDot },
  done: { title: "Terminée — cliquer pour rouvrir", className: "text-emerald-500", Icon: CircleCheck },
};

/** Pastille de statut : à faire → en cours → terminée → rouverte. */
export function StatusButton({ status, onPress }: { status: ActionStatus; onPress: () => void }) {
  const { title, className, Icon } = STATUS_META[status];
  return (
    <button
      type="button"
      onClick={onPress}
      title={title}
      aria-label={title}
      className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-default"
    >
      <Icon className={cn("size-4", className)} />
    </button>
  );
}
