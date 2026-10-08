import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { ChevronDown, Minus, Plus, Trash2, X } from "lucide-react";
import { confirmDelete } from "@/lib/confirm";
import { genId } from "@/lib/id";
import { cn } from "@/lib/utils";
import { TaskCheckbox } from "../todo/TaskCheckbox";
import type { BodyProps } from "../types";
import { daysLeft, newGoal, progress, type Goal, type GoalsState } from "./state";

const DONE_COLOR = "#10b981";

/** Corps du groupe « Objectifs » : objectifs par étapes ou chiffrés, avec avancement et échéance. */
export function GoalsBody({ value, onChange }: BodyProps<GoalsState>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Objectifs atteints en fin de liste, ordre de création conservé sinon.
  const sorted = [...value.goals].sort((a, b) => Number(progress(a) >= 1) - Number(progress(b) >= 1));

  function updateGoal(id: string, fn: (g: Goal) => Goal) {
    onChange({ goals: value.goals.map((g) => (g.id === id ? fn(g) : g)) });
  }

  async function removeGoal(goal: Goal) {
    if (await confirmDelete(`Supprimer l'objectif « ${goal.title} » ?`)) {
      onChange({ goals: value.goals.filter((g) => g.id !== goal.id) });
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <AddGoalForm
        onAdd={(title, kind) => {
          const goal = newGoal(title, kind);
          onChange({ goals: [...value.goals, goal] });
          setExpandedId(goal.id);
        }}
      />
      <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-1.5 overflow-y-auto p-0.5">
        {sorted.length === 0 ? (
          <li className="py-6 text-center text-[0.8889rem] text-muted">Ajoutez un premier objectif ci-dessus.</li>
        ) : (
          sorted.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              expanded={expandedId === goal.id}
              onToggle={() => setExpandedId((cur) => (cur === goal.id ? null : goal.id))}
              onUpdate={(fn) => updateGoal(goal.id, fn)}
              onRemove={() => void removeGoal(goal)}
            />
          ))
        )}
      </ul>
    </div>
  );
}

function AddGoalForm({ onAdd }: { onAdd: (title: string, kind: Goal["kind"]) => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Goal["kind"]>("steps");
  return (
    <form
      className="flex shrink-0 items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd(title, kind);
        setTitle("");
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        placeholder="Nouvel objectif…"
        aria-label="Nouvel objectif"
        className="min-w-0 flex-1"
      />
      <div className="flex shrink-0 rounded-lg bg-default p-0.5" role="radiogroup" aria-label="Mesure de l'objectif">
        {(["steps", "value"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            title={k === "steps" ? "Mesuré par des étapes à cocher" : "Mesuré par une valeur chiffrée"}
            className={cn(
              "cursor-pointer rounded-md px-2 py-0.5 text-[0.8148rem] font-semibold transition-colors",
              kind === k ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {k === "steps" ? "Étapes" : "Valeur"}
          </button>
        ))}
      </div>
      <Button
        type="submit"
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Ajouter l'objectif"
        isDisabled={!title.trim()}
      >
        <Plus className="size-4" />
      </Button>
    </form>
  );
}

function DueBadge({ goal, done }: { goal: Goal; done: boolean }) {
  const left = daysLeft(goal);
  if (left === null || done) return null;
  const label = left < 0 ? `En retard de ${-left} j` : left === 0 ? "Aujourd'hui" : `J-${left}`;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-px text-[0.7407rem] font-bold",
        left < 0 ? "bg-danger/12 text-danger" : left <= 7 ? "bg-warning/15 text-warning" : "bg-default text-muted",
      )}
      title={`Échéance : ${new Date(`${goal.due}T00:00:00`).toLocaleDateString("fr-FR")}`}
    >
      {label}
    </span>
  );
}

type GoalCardProps = {
  goal: Goal;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (fn: (g: Goal) => Goal) => void;
  onRemove: () => void;
};

function GoalCard({ goal, expanded, onToggle, onUpdate, onRemove }: GoalCardProps) {
  const ratio = progress(goal);
  const done = ratio >= 1;
  const percent = Math.round(ratio * 100);
  const summary =
    goal.kind === "steps"
      ? `${goal.steps.filter((s) => s.done).length} / ${goal.steps.length} étape(s)`
      : `${goal.current.toLocaleString("fr-FR")} / ${goal.target.toLocaleString("fr-FR")}${goal.unit ? ` ${goal.unit}` : ""}`;

  return (
    <li
      className={cn("list-card rounded-[10px] bg-surface shadow-[0_1px_2px_rgba(16,24,40,.08)]", done && "opacity-75")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer flex-col gap-1.5 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2">
          <span className={cn("min-w-0 flex-1 truncate font-semibold", done && "line-through decoration-muted")}>
            {goal.title}
          </span>
          <DueBadge goal={goal} done={done} />
          <span className="shrink-0 font-bold tabular-nums" style={done ? { color: DONE_COLOR } : undefined}>
            {percent}%
          </span>
          <ChevronDown className={cn("size-3.5 shrink-0 text-muted transition-transform", expanded && "rotate-180")} />
        </span>
        <span
          className="h-2 overflow-hidden rounded-full bg-default"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span
            className="block h-full rounded-full transition-[width]"
            style={{ width: `${percent}%`, background: done ? DONE_COLOR : "var(--group-tint, var(--accent))" }}
          />
        </span>
        <span className="text-[0.8148rem] text-muted">{summary}</span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 border-t border-border/60 px-3 py-2.5">
          {goal.kind === "steps" ? (
            <StepsEditor goal={goal} onUpdate={onUpdate} />
          ) : (
            <ValueEditor goal={goal} onUpdate={onUpdate} />
          )}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[0.8889rem] text-muted">
              Échéance
              <input
                type="date"
                value={goal.due}
                onChange={(e) => onUpdate((g) => ({ ...g, due: e.currentTarget.value }))}
                className="rounded-md bg-field px-1.5 py-0.5 text-foreground ring-1 ring-field-border"
              />
            </label>
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

function StepsEditor({ goal, onUpdate }: { goal: Goal; onUpdate: (fn: (g: Goal) => Goal) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="flex flex-col gap-0.5">
      {goal.steps.map((s) => (
        <div key={s.id} className="list-row group/step flex items-center gap-2 rounded-lg px-1.5 py-1">
          <TaskCheckbox
            small
            isSelected={s.done}
            label={s.label}
            onChange={() =>
              onUpdate((g) => ({ ...g, steps: g.steps.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) }))
            }
          />
          <span className={cn("min-w-0 flex-1 truncate", s.done && "text-muted line-through")}>{s.label}</span>
          <button
            type="button"
            aria-label={`Supprimer l'étape ${s.label}`}
            onClick={() => onUpdate((g) => ({ ...g, steps: g.steps.filter((x) => x.id !== s.id) }))}
            className="grid size-5 cursor-pointer place-items-center rounded text-muted opacity-0 transition-opacity group-hover/step:opacity-100 hover:text-danger"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
      <form
        className="mt-1 flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          const label = draft.trim();
          if (!label) return;
          onUpdate((g) => ({ ...g, steps: [...g.steps, { id: genId(), label, done: false }] }));
          setDraft("");
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder="Nouvelle étape…"
          aria-label="Nouvelle étape"
          className="h-7 min-w-0 flex-1 text-[0.8889rem]"
        />
        <Button
          type="submit"
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Ajouter l'étape"
          isDisabled={!draft.trim()}
        >
          <Plus className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  className?: string;
}) {
  return (
    <input
      type="number"
      aria-label={label}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const n = e.currentTarget.valueAsNumber;
        onChange(Number.isNaN(n) ? 0 : n);
      }}
      className={cn("rounded-md bg-field px-1.5 py-0.5 text-right tabular-nums ring-1 ring-field-border", className)}
    />
  );
}

function ValueEditor({ goal, onUpdate }: { goal: Goal; onUpdate: (fn: (g: Goal) => Goal) => void }) {
  const set = (patch: Partial<Goal>) => onUpdate((g) => ({ ...g, ...patch }));
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[0.8889rem]">
      <Button
        isIconOnly
        size="sm"
        variant="secondary"
        aria-label="Diminuer de 1"
        onPress={() => set({ current: goal.current - 1 })}
      >
        <Minus className="size-3.5" />
      </Button>
      <NumberField
        label="Valeur actuelle"
        value={goal.current}
        onChange={(current) => set({ current })}
        className="w-20"
      />
      <Button
        isIconOnly
        size="sm"
        variant="secondary"
        aria-label="Augmenter de 1"
        onPress={() => set({ current: goal.current + 1 })}
      >
        <Plus className="size-3.5" />
      </Button>
      <span className="text-muted">sur</span>
      <NumberField label="Valeur cible" value={goal.target} onChange={(target) => set({ target })} className="w-20" />
      <input
        value={goal.unit}
        onChange={(e) => set({ unit: e.currentTarget.value })}
        placeholder="unité"
        aria-label="Unité"
        className="w-20 rounded-md bg-field px-1.5 py-0.5 ring-1 ring-field-border"
      />
    </div>
  );
}
