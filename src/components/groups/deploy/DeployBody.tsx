import { useState, type Key } from "react";
import { Button, Dropdown, Input, Label, ListBox, Select } from "@heroui/react";
import { Ellipsis, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { confirmDelete } from "@/lib/confirm";
import type { BodyProps } from "../types";
import {
  closedCount,
  deployPhase,
  formatDate,
  lastDeploymentOf,
  newDeployment,
  newStep,
  sortByDate,
  type DeployState,
  type DeployStep,
  type Deployment,
} from "./state";
import { PHASES } from "./statuses";
import { StepCard } from "./StepCard";

const fieldClass = "rounded-md bg-field px-1.5 py-0.5 ring-1 ring-field-border";

/** Corps du groupe « Mise en production » : déroulé d'une MEP par étapes, avec une note par étape. */
export function DeployBody({ groupId, value, onChange }: BodyProps<DeployState>) {
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const active = value.deployments.find((d) => d.id === value.activeId) ?? sortByDate(value.deployments)[0];

  function updateActive(fn: (d: Deployment) => Deployment) {
    if (!active) return;
    onChange({ ...value, deployments: value.deployments.map((d) => (d.id === active.id ? fn(d) : d)) });
  }

  function updateStep(id: string, patch: Partial<DeployStep>) {
    updateActive((d) => ({ ...d, steps: d.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  }

  function moveStep(id: string, delta: -1 | 1) {
    updateActive((d) => {
      const steps = [...d.steps];
      const i = steps.findIndex((s) => s.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= steps.length) return d;
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...d, steps };
    });
  }

  async function removeStep(step: DeployStep) {
    if (await confirmDelete(`Supprimer l'étape « ${step.title || "sans titre"} » ?`)) {
      updateActive((d) => ({ ...d, steps: d.steps.filter((s) => s.id !== step.id) }));
    }
  }

  async function removeDeployment(d: Deployment) {
    if (await confirmDelete(`Supprimer la MEP « ${d.app} ${d.version} » et toutes ses notes ?`)) {
      const deployments = value.deployments.filter((x) => x.id !== d.id);
      onChange({ deployments, activeId: sortByDate(deployments)[0]?.id ?? null });
    }
  }

  function handleMenu(key: Key) {
    if (!active) return;
    if (key === "reset") {
      updateActive((d) => ({ ...d, steps: d.steps.map((s) => ({ ...s, status: "todo", statusAt: null })) }));
    } else if (key === "delete") {
      void removeDeployment(active);
    }
  }

  if (creating || !active) {
    return (
      <NewDeploymentForm
        listId={`deploy-apps-${groupId}`}
        deployments={value.deployments}
        onCancel={value.deployments.length > 0 ? () => setCreating(false) : undefined}
        onCreate={(d) => {
          onChange({ deployments: [...value.deployments, d], activeId: d.id });
          setCreating(false);
          setExpandedId(null);
        }}
      />
    );
  }

  const phase = PHASES[deployPhase(active)];
  const closed = closedCount(active);
  const percent = active.steps.length === 0 ? 0 : Math.round((closed / active.steps.length) * 100);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="flex shrink-0 items-center gap-1.5">
        <Select
          aria-label="Mise en production affichée"
          value={active.id}
          onChange={(k) => {
            if (k == null) return;
            onChange({ ...value, activeId: String(k) });
            setExpandedId(null);
          }}
          className="min-w-0 flex-1"
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {sortByDate(value.deployments).map((d) => (
                <ListBox.Item key={d.id} id={d.id} textValue={`${d.app} ${d.version} — ${formatDate(d.date)}`}>
                  <span className="size-2 shrink-0 rounded-full" style={{ background: PHASES[deployPhase(d)].color }} />
                  <span className="min-w-0 flex-1 truncate">
                    {d.app} {d.version}
                    <span className="text-muted"> — {formatDate(d.date)}</span>
                  </span>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <Button size="sm" variant="secondary" onPress={() => setCreating(true)}>
          <Plus className="size-3.5" />
          Nouvelle MEP
        </Button>
        <Dropdown>
          <Button isIconOnly size="sm" variant="ghost" aria-label="Actions de la MEP" className="text-muted">
            <Ellipsis className="size-4" />
          </Button>
          <Dropdown.Popover placement="bottom end" className="min-w-52">
            <Dropdown.Menu aria-label="Actions de la MEP" onAction={handleMenu}>
              <Dropdown.Item id="reset" textValue="Remettre les étapes à faire">
                <RotateCcw className="size-3.5" />
                <Label>Remettre les étapes « À faire »</Label>
              </Dropdown.Item>
              <Dropdown.Item id="delete" textValue="Supprimer la MEP" variant="danger">
                <Trash2 className="size-3.5" />
                <Label>Supprimer la MEP</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      <div className="flex shrink-0 flex-col gap-2 rounded-xl bg-surface-secondary px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5 text-[0.8889rem]">
          <input
            value={active.app}
            onChange={(e) => updateActive((d) => ({ ...d, app: e.currentTarget.value }))}
            placeholder="Application"
            aria-label="Application"
            className={`${fieldClass} min-w-0 flex-1 font-semibold`}
          />
          <input
            value={active.version}
            onChange={(e) => updateActive((d) => ({ ...d, version: e.currentTarget.value }))}
            placeholder="Version"
            aria-label="Version"
            className={`${fieldClass} w-20`}
          />
          <input
            type="date"
            value={active.date}
            onChange={(e) => updateActive((d) => ({ ...d, date: e.currentTarget.value }))}
            aria-label="Date de la MEP"
            className={fieldClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <span
            className="shrink-0 rounded-full px-2 py-px text-[0.7407rem] font-bold"
            style={{ color: phase.color, background: `color-mix(in srgb, ${phase.color} 13%, transparent)` }}
          >
            {phase.label}
          </span>
          <span
            className="h-2 flex-1 overflow-hidden rounded-full bg-default"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span
              className="block h-full rounded-full transition-[width]"
              style={{ width: `${percent}%`, background: phase.color }}
            />
          </span>
          <span className="shrink-0 text-[0.8148rem] text-muted tabular-nums">
            {closed} / {active.steps.length}
          </span>
        </div>
      </div>

      <ol className="m-0 flex min-h-0 flex-1 list-none flex-col gap-1.5 overflow-y-auto p-0.5">
        {active.steps.length === 0 ? (
          <li className="py-6 text-center text-[0.8889rem] text-muted">Ajoutez une première étape ci-dessous.</li>
        ) : (
          active.steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              index={i}
              isFirst={i === 0}
              isLast={i === active.steps.length - 1}
              expanded={expandedId === step.id}
              onToggle={() => setExpandedId((cur) => (cur === step.id ? null : step.id))}
              onUpdate={(patch) => updateStep(step.id, patch)}
              onMove={(delta) => moveStep(step.id, delta)}
              onRemove={() => void removeStep(step)}
            />
          ))
        )}
      </ol>

      <AddStepForm onAdd={(title) => updateActive((d) => ({ ...d, steps: [...d.steps, newStep(title)] }))} />
    </div>
  );
}

function AddStepForm({ onAdd }: { onAdd: (title: string) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <form
      className="flex shrink-0 items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.trim()) return;
        onAdd(draft);
        setDraft("");
      }}
    >
      <Input
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        placeholder="Nouvelle étape…"
        aria-label="Nouvelle étape"
        className="min-w-0 flex-1"
      />
      <Button type="submit" isIconOnly size="sm" variant="ghost" aria-label="Ajouter l'étape" isDisabled={!draft.trim()}>
        <Plus className="size-4" />
      </Button>
    </form>
  );
}

type NewDeploymentFormProps = {
  listId: string;
  deployments: Deployment[];
  onCreate: (d: Deployment) => void;
  /** Absent quand il n'existe encore aucune MEP (rien vers quoi revenir). */
  onCancel?: () => void;
};

function NewDeploymentForm({ listId, deployments, onCreate, onCancel }: NewDeploymentFormProps) {
  const [app, setApp] = useState("");
  const [version, setVersion] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const previous = lastDeploymentOf(deployments, app);
  const apps = [...new Set(deployments.map((d) => d.app.trim()).filter(Boolean))];

  return (
    <form
      className="flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto"
      onSubmit={(e) => {
        e.preventDefault();
        if (!app.trim()) return;
        onCreate(newDeployment(app, version, date, previous));
      }}
    >
      <div className="flex items-center">
        <span className="flex-1 font-semibold">Nouvelle mise en production</span>
        {onCancel && (
          <Button isIconOnly size="sm" variant="ghost" aria-label="Annuler" onPress={onCancel}>
            <X className="size-4" />
          </Button>
        )}
      </div>
      <label className="flex flex-col gap-1 text-[0.8889rem]">
        <span className="font-semibold text-muted">Application</span>
        <Input
          value={app}
          onChange={(e) => setApp(e.currentTarget.value)}
          placeholder="Nom de l'application"
          list={listId}
          autoFocus
        />
        <datalist id={listId}>
          {apps.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </label>
      <div className="flex gap-2 text-[0.8889rem]">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-semibold text-muted">Version</span>
          <Input value={version} onChange={(e) => setVersion(e.currentTarget.value)} placeholder="ex. 2.1.0" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-semibold text-muted">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
            className={`${fieldClass} h-full py-1`}
          />
        </label>
      </div>
      <p className="m-0 rounded-lg bg-surface-secondary px-2.5 py-2 text-[0.8148rem] text-muted">
        {previous
          ? `Les ${previous.steps.length} étapes de la MEP${previous.version ? ` ${previous.version}` : ""} du ${formatDate(previous.date)} seront reprises (sans statuts ni notes).`
          : "Le déroulé standard sera proposé ; il reste modifiable étape par étape."}
      </p>
      <Button type="submit" isDisabled={!app.trim()} className="self-end">
        <Plus className="size-4" />
        Créer la MEP
      </Button>
    </form>
  );
}
