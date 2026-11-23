import type { Key } from "react";
import { Button, Dropdown, Input, Label, TextArea } from "@heroui/react";
import { ArrowDown, ArrowUp, ChevronDown, Check, NotebookPen, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeployStep, StepStatus } from "./state";
import { STEP_STATUSES, statusMeta } from "./statuses";

/** Statut suivant au clic sur l'icône : À faire → En cours → Terminée → À faire. */
const NEXT: Record<StepStatus, StepStatus> = {
  todo: "running",
  running: "done",
  done: "todo",
  failed: "running",
  skipped: "todo",
};

type StepCardProps = {
  step: DeployStep;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<DeployStep>) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
};

/** Étape de la MEP : statut, responsable et note de suivi (dépliée au clic). */
export function StepCard({ step, index, isFirst, isLast, expanded, onToggle, onUpdate, onMove, onRemove }: StepCardProps) {
  const meta = statusMeta(step.status);
  const Icon = meta.icon;
  const closed = step.status === "done" || step.status === "skipped";

  function setStatus(status: StepStatus) {
    if (status !== step.status) onUpdate({ status, statusAt: Date.now() });
  }

  return (
    <li
      className={cn(
        "list-card rounded-[10px] bg-surface shadow-[0_1px_2px_rgba(16,24,40,.08)]",
        step.status === "failed" && "ring-1 ring-danger/40",
      )}
    >
      <div className="flex items-start gap-2 px-2.5 py-2">
        <button
          type="button"
          onClick={() => setStatus(NEXT[step.status])}
          title={`${meta.label} — cliquer pour passer à « ${statusMeta(NEXT[step.status]).label} »`}
          aria-label={`Statut de l'étape ${step.title} : ${meta.label}`}
          className="mt-px grid size-6 shrink-0 cursor-pointer place-items-center rounded-full transition-transform hover:scale-110"
          style={{ color: meta.color }}
        >
          <Icon className={cn("size-[18px]", step.status === "running" && "animate-pulse")} />
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5 text-left"
        >
          <span className="flex items-center gap-1.5">
            <span className="shrink-0 text-[0.8148rem] font-bold text-muted tabular-nums">{index + 1}.</span>
            <span className={cn("min-w-0 flex-1 truncate font-semibold", closed && "text-muted")}>
              {step.title || "Étape sans titre"}
            </span>
          </span>
          {(step.owner || step.statusAt) && (
            <span className="flex items-center gap-2 text-[0.7407rem] text-muted">
              {step.owner && (
                <span className="flex min-w-0 items-center gap-1 truncate">
                  <User className="size-3 shrink-0" />
                  {step.owner}
                </span>
              )}
              {step.statusAt && step.status !== "todo" && (
                <span className="shrink-0 tabular-nums">
                  {meta.label} le{" "}
                  {new Date(step.statusAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </span>
          )}
          {!expanded && step.note && (
            <span className="mt-0.5 line-clamp-2 whitespace-pre-line rounded-md bg-surface-secondary px-2 py-1 text-[0.8148rem] text-muted">
              {step.note}
            </span>
          )}
        </button>

        <StatusMenu status={step.status} title={step.title} onSelect={setStatus} />
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? "Replier l'étape" : "Déplier l'étape"}
          className="mt-1 grid size-5 shrink-0 cursor-pointer place-items-center text-muted"
        >
          <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 border-t border-border/60 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <Input
              value={step.title}
              onChange={(e) => onUpdate({ title: e.currentTarget.value })}
              placeholder="Intitulé de l'étape"
              aria-label="Intitulé de l'étape"
              className="h-7 min-w-0 flex-1 text-[0.8889rem]"
            />
            <Input
              value={step.owner}
              onChange={(e) => onUpdate({ owner: e.currentTarget.value })}
              placeholder="Responsable"
              aria-label="Responsable"
              className="h-7 w-32 text-[0.8889rem]"
            />
          </div>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[0.8148rem] font-semibold text-muted">
              <NotebookPen className="size-3.5" />
              Note
            </span>
            <TextArea
              value={step.note}
              onChange={(e) => onUpdate({ note: e.currentTarget.value })}
              rows={4}
              placeholder="Commandes passées, contrôles, incidents, heure de fin…"
              aria-label="Note de l'étape"
              className="min-h-24 resize-y px-2.5 py-1.5 text-[0.8889rem]"
              autoFocus={!step.note}
            />
          </label>
          <div className="flex items-center gap-1">
            <Button isIconOnly size="sm" variant="ghost" aria-label="Monter l'étape" isDisabled={isFirst} onPress={() => onMove(-1)}>
              <ArrowUp className="size-3.5" />
            </Button>
            <Button isIconOnly size="sm" variant="ghost" aria-label="Descendre l'étape" isDisabled={isLast} onPress={() => onMove(1)}>
              <ArrowDown className="size-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto text-danger" onPress={onRemove}>
              <Trash2 className="size-3.5" />
              Supprimer
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function StatusMenu({ status, title, onSelect }: { status: StepStatus; title: string; onSelect: (s: StepStatus) => void }) {
  const meta = statusMeta(status);
  return (
    <Dropdown>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Changer le statut de ${title}`}
        className="h-6 shrink-0 gap-1 rounded-full px-2 text-[0.7407rem] font-bold"
        style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 13%, transparent)` }}
      >
        {meta.label}
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-40">
        <Dropdown.Menu aria-label="Statut de l'étape" onAction={(k: Key) => onSelect(String(k) as StepStatus)}>
          {STEP_STATUSES.map((s) => (
            <Dropdown.Item key={s.id} id={s.id} textValue={s.label}>
              <s.icon className="size-3.5" style={{ color: s.color }} />
              <Label className="flex-1">{s.label}</Label>
              {s.id === status && <Check className="size-3.5 text-muted" />}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
