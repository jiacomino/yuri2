import { useEffect, useState } from "react";
import { Button, Input, ListBox, Select } from "@heroui/react";
import { Play, Plus, Square, Trash2, X } from "lucide-react";
import { confirmDelete } from "@/lib/confirm";
import { cn } from "@/lib/utils";
import type { BodyProps } from "../types";
import {
  addProject,
  entryMs,
  formatDuration,
  periodStart,
  removeProject,
  runningEntry,
  start,
  stop,
  totalsSince,
  type Period,
  type TimeEntry,
  type TimeProject,
  type TimeTrackState,
} from "./state";

const NO_PROJECT = "none";

/** Heure courante, rafraîchie chaque seconde quand un chrono tourne, sinon chaque minute. */
function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), running ? 1000 : 60_000);
    return () => window.clearInterval(id);
  }, [running]);
  return now;
}

/** Corps du groupe « Suivi du temps » : chrono par tâche et projet, totaux du jour / de la semaine. */
export function TimeTrackBody({ value, onChange }: BodyProps<TimeTrackState>) {
  const running = runningEntry(value);
  const now = useNow(!!running);
  const [period, setPeriod] = useState<Period>("day");
  const projectOf = (id: string | null) => value.projects.find((p) => p.id === id);

  async function deleteProject(p: TimeProject) {
    if (await confirmDelete(`Supprimer le projet « ${p.name} » ? Ses plages de temps sont conservées, sans projet.`)) {
      onChange(removeProject(value, p.id));
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {running ? (
        <RunningCard
          entry={running}
          project={projectOf(running.projectId)}
          elapsed={entryMs(running, now)}
          onStop={() => onChange(stop(value))}
        />
      ) : (
        <StartForm projects={value.projects} onStart={(label, projectId) => onChange(start(value, label, projectId))} />
      )}

      <ProjectsBar
        projects={value.projects}
        onAdd={(name) => onChange(addProject(value, name))}
        onRemove={(p) => void deleteProject(p)}
      />

      <Totals state={value} now={now} period={period} onPeriod={setPeriod} projectOf={projectOf} />

      <History
        entries={value.entries.filter((e) => e.end !== null)}
        now={now}
        projectOf={projectOf}
        onRestart={(e) => onChange(start(value, e.label, e.projectId))}
        onRemove={(id) => onChange({ ...value, entries: value.entries.filter((e) => e.id !== id) })}
      />
    </div>
  );
}

// ─── Chrono ─────────────────────────────────────────────────────────────────

function RunningCard({
  entry,
  project,
  elapsed,
  onStop,
}: {
  entry: TimeEntry;
  project?: TimeProject;
  elapsed: number;
  onStop: () => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5"
      style={{ background: `color-mix(in oklab, ${project?.color ?? "var(--accent)"} 12%, var(--surface))` }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{entry.label || "Sans libellé"}</p>
        {project && <ProjectTag project={project} />}
      </div>
      <span className="font-mono text-[1.5rem] font-bold tabular-nums">{formatDuration(elapsed, true)}</span>
      <Button size="sm" variant="danger" onPress={onStop}>
        <Square className="size-3 fill-current" />
        Arrêter
      </Button>
    </div>
  );
}

function StartForm({
  projects,
  onStart,
}: {
  projects: TimeProject[];
  onStart: (label: string, projectId: string | null) => void;
}) {
  const [label, setLabel] = useState("");
  const [projectId, setProjectId] = useState<string>(NO_PROJECT);

  return (
    <form
      className="flex shrink-0 items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        onStart(label, projectId === NO_PROJECT ? null : projectId);
        setLabel("");
      }}
    >
      <Input
        value={label}
        onChange={(e) => setLabel(e.currentTarget.value)}
        placeholder="Sur quoi travaillez-vous ?"
        aria-label="Tâche"
        className="min-w-0 flex-1"
      />
      {projects.length > 0 && (
        <Select
          aria-label="Projet"
          value={projectId}
          onChange={(k) => k != null && setProjectId(String(k))}
          className="w-36"
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id={NO_PROJECT} textValue="Sans projet">
                Sans projet
                <ListBox.ItemIndicator />
              </ListBox.Item>
              {projects.map((p) => (
                <ListBox.Item key={p.id} id={p.id} textValue={p.name}>
                  <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} />
                  {p.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      )}
      <Button type="submit" size="sm">
        <Play className="size-3 fill-current" />
        Démarrer
      </Button>
    </form>
  );
}

// ─── Projets ────────────────────────────────────────────────────────────────

function ProjectTag({ project }: { project: TimeProject }) {
  return (
    <span className="inline-flex items-center gap-1 text-[0.8148rem] font-semibold text-muted">
      <span className="size-2 shrink-0 rounded-full" style={{ background: project.color }} />
      {project.name}
    </span>
  );
}

function ProjectsBar({
  projects,
  onAdd,
  onRemove,
}: {
  projects: TimeProject[];
  onAdd: (name: string) => void;
  onRemove: (p: TimeProject) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function commit() {
    if (name.trim()) onAdd(name);
    setName("");
    setAdding(false);
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1">
      <span className="mr-1 text-[0.8148rem] font-semibold text-muted">Projets</span>
      {projects.map((p) => (
        <span
          key={p.id}
          className="group/proj inline-flex h-6 items-center gap-1 rounded-full pr-1 pl-2 text-[0.8148rem] font-semibold"
          style={{ background: `color-mix(in oklab, ${p.color} 14%, var(--surface))` }}
        >
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}
          <button
            type="button"
            aria-label={`Supprimer le projet ${p.name}`}
            onClick={() => onRemove(p)}
            className="grid size-4 cursor-pointer place-items-center rounded-full opacity-0 transition-opacity group-hover/proj:opacity-100 hover:bg-black/10"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") {
              setName("");
              setAdding(false);
            }
          }}
          placeholder="Nom du projet"
          aria-label="Nom du projet"
          className="h-6 w-32 text-[0.8148rem]"
        />
      ) : (
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Ajouter un projet"
          className="size-6 min-w-6"
          onPress={() => setAdding(true)}
        >
          <Plus className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

// ─── Totaux ─────────────────────────────────────────────────────────────────

function Totals({
  state,
  now,
  period,
  onPeriod,
  projectOf,
}: {
  state: TimeTrackState;
  now: number;
  period: Period;
  onPeriod: (p: Period) => void;
  projectOf: (id: string | null) => TimeProject | undefined;
}) {
  const totals = [...totalsSince(state, periodStart(period, now), now)].sort((a, b) => b[1] - a[1]);
  const sum = totals.reduce((acc, [, ms]) => acc + ms, 0);

  return (
    <section className="flex shrink-0 flex-col gap-1.5 rounded-xl bg-surface-secondary p-2.5">
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg bg-default p-0.5">
          {(["day", "week"] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => onPeriod(p)}
              className={cn(
                "cursor-pointer rounded-md px-2 py-0.5 text-[0.8148rem] font-semibold transition-colors",
                period === p ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
              )}
            >
              {p === "day" ? "Aujourd'hui" : "Cette semaine"}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[1.1rem] font-bold tabular-nums">{formatDuration(sum)}</span>
      </div>
      {totals.length === 0 ? (
        <p className="text-[0.8889rem] text-muted">Aucun temps enregistré sur la période.</p>
      ) : (
        totals.map(([projectId, ms]) => {
          const p = projectOf(projectId);
          const color = p?.color ?? "var(--muted)";
          return (
            <div key={projectId ?? NO_PROJECT} className="flex items-center gap-2 text-[0.8889rem]">
              <span className="w-28 shrink-0 truncate font-semibold">{p?.name ?? "Sans projet"}</span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-default">
                <div className="h-full rounded-full" style={{ width: `${(ms / sum) * 100}%`, background: color }} />
              </div>
              <span className="w-14 shrink-0 text-right tabular-nums text-muted">{formatDuration(ms)}</span>
            </div>
          );
        })
      )}
    </section>
  );
}

// ─── Historique ─────────────────────────────────────────────────────────────

function dayLabel(iso: string, now: number): string {
  const day = new Date(iso);
  day.setHours(0, 0, 0, 0);
  const today = periodStart("day", now);
  const diff = Math.round((today - day.getTime()) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  return day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function History({
  entries,
  now,
  projectOf,
  onRestart,
  onRemove,
}: {
  entries: TimeEntry[];
  now: number;
  projectOf: (id: string | null) => TimeProject | undefined;
  onRestart: (e: TimeEntry) => void;
  onRemove: (id: string) => void;
}) {
  const sorted = [...entries].sort((a, b) => b.start.localeCompare(a.start));
  const days = new Map<string, TimeEntry[]>();
  for (const e of sorted) {
    const label = dayLabel(e.start, now);
    days.set(label, [...(days.get(label) ?? []), e]);
  }

  if (sorted.length === 0) {
    return (
      <p className="py-4 text-center text-[0.8889rem] text-muted">L'historique des plages terminées s'affiche ici.</p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      {[...days].map(([label, list]) => (
        <section key={label}>
          <h4 className="mb-0.5 flex px-1 text-[0.8148rem] font-bold text-muted first-letter:uppercase">
            <span className="flex-1">{label}</span>
            <span className="tabular-nums">{formatDuration(list.reduce((acc, e) => acc + entryMs(e, now), 0))}</span>
          </h4>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {list.map((e) => {
              const p = projectOf(e.projectId);
              return (
                <li key={e.id} className="list-row group/entry flex items-center gap-2 rounded-[10px] px-2 py-1.5">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: p?.color ?? "var(--muted)" }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{e.label || "Sans libellé"}</p>
                    <p className="truncate text-[0.8148rem] text-muted">
                      {p ? `${p.name} · ` : ""}
                      {hhmm(e.start)} – {e.end ? hhmm(e.end) : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/entry:opacity-100 focus-within:opacity-100">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="Relancer cette tâche"
                      onPress={() => onRestart(e)}
                    >
                      <Play className="size-3.5" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="Supprimer"
                      className="hover:text-danger"
                      onPress={() => onRemove(e.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <span className="w-14 shrink-0 text-right font-semibold tabular-nums">
                    {formatDuration(entryMs(e, now))}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
