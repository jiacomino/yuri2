import { useEffect, useMemo, useRef, useState } from "react";
import type FullCalendar from "@fullcalendar/react";
import type { BodyProps } from "../types";
import { AppsBar } from "./AppsBar";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarToolbar } from "./CalendarToolbar";
import { confirmDelete } from "@/lib/confirm";
import { nextSlot } from "./dates";
import { EventEditorModal } from "./EventEditorModal";
import { genId, nextColor } from "./meta";
import type { AppTag, CalendarState, CalendarTask, CalendarView } from "./state";
import "./calendar.css";

/** Calendrier de tâches sur grille horaire, avec applications, priorités et filtre. */
export function CalendarBody({ value, onChange }: BodyProps<CalendarState>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterAppId, setFilterAppId] = useState<string | null>(null);
  const [periodTitle, setPeriodTitle] = useState("");
  const calRef = useRef<FullCalendar | null>(null);

  const valueRef = useRef(value);
  valueRef.current = value;
  /** Les mises à jour enchaînées dans un même événement se composent (ex. créer une appli puis l'affecter). */
  const update = (fn: (s: CalendarState) => CalendarState) => {
    valueRef.current = fn(valueRef.current);
    onChange(valueRef.current);
  };

  // La vue peut aussi changer depuis l'extérieur (état restauré).
  useEffect(() => {
    const api = calRef.current?.getApi();
    if (api && api.view.type !== value.view) api.changeView(value.view);
  }, [value.view]);

  // Un filtre sur une application supprimée n'a plus de sens.
  const activeFilter = filterAppId && value.apps.some((a) => a.id === filterAppId) ? filterAppId : null;

  const visibleTasks = useMemo(
    () => (activeFilter ? value.events.filter((e) => e.appId === activeFilter) : value.events),
    [value.events, activeFilter],
  );
  const selected = value.events.find((e) => e.id === selectedId) ?? null;

  // ─── Tâches ───────────────────────────────────────────────────────────────
  function patchTask(id: string, patch: Partial<CalendarTask>) {
    update((s) => ({ ...s, events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  }

  function addTask(start: string, end: string, allDay: boolean): string {
    const id = genId();
    update((s) => ({
      ...s,
      events: [
        ...s.events,
        {
          id,
          title: "",
          start,
          end,
          allDay,
          color: nextColor(s.events.length),
          priority: "normal",
          // En filtrant sur une application, les nouvelles tâches y sont rattachées.
          appId: activeFilter ?? undefined,
          notes: "",
        },
      ],
    }));
    return id;
  }

  async function removeTask(id: string) {
    const task = valueRef.current.events.find((e) => e.id === id);
    if (!(await confirmDelete(`Supprimer « ${task?.title || "(sans titre)"} » ?`))) return;
    update((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
    setSelectedId(null);
  }

  // ─── Applications ─────────────────────────────────────────────────────────
  function addApp(name: string, color?: string): string | undefined {
    const clean = name.trim();
    if (!clean) return undefined;
    const id = genId();
    update((s) => ({ ...s, apps: [...s.apps, { id, name: clean, color: color || nextColor(s.apps.length) }] }));
    return id;
  }

  function updateApp(appId: string, patch: Partial<Omit<AppTag, "id">>) {
    update((s) => ({ ...s, apps: s.apps.map((a) => (a.id === appId ? { ...a, ...patch } : a)) }));
  }

  /** Supprime l'application et désaffecte les tâches qui la référençaient. */
  async function removeApp(appId: string) {
    const app = valueRef.current.apps.find((a) => a.id === appId);
    if (!app) return;
    const used = valueRef.current.events.filter((e) => e.appId === appId).length;
    if (used > 0) {
      const plural = used > 1;
      const ok = await confirmDelete(
        `Supprimer l'application « ${app.name} » ? ${used} tâche${plural ? "s seront" : " sera"} désaffectée${plural ? "s" : ""}.`,
      );
      if (!ok) return;
    }
    update((s) => ({
      ...s,
      apps: s.apps.filter((a) => a.id !== appId),
      events: s.events.map((e) => (e.appId === appId ? { ...e, appId: undefined } : e)),
    }));
  }

  // ─── Navigation ───────────────────────────────────────────────────────────
  const api = () => calRef.current?.getApi();

  function changeView(view: CalendarView) {
    update((s) => ({ ...s, view }));
    api()?.changeView(view);
  }

  return (
    <div className="flex h-full flex-col">
      <AppsBar
        apps={value.apps}
        activeAppId={activeFilter}
        onSelectApp={setFilterAppId}
        onAdd={addApp}
        onUpdate={updateApp}
        onRemove={removeApp}
      />
      <CalendarToolbar
        title={periodTitle}
        view={value.view}
        onPrev={() => api()?.prev()}
        onNext={() => api()?.next()}
        onToday={() => api()?.today()}
        onViewChange={changeView}
        onAdd={() => {
          const { start, end } = nextSlot();
          setSelectedId(addTask(start, end, false));
          api()?.today();
        }}
      />
      <div className="cal-airy min-h-0 flex-1">
        <CalendarGrid
          calRef={calRef}
          initialView={value.view}
          tasks={visibleTasks}
          apps={value.apps}
          selectedId={selectedId}
          onSelectRange={(start, end, allDay) => setSelectedId(addTask(start, end, allDay))}
          onTaskClick={setSelectedId}
          onTaskMove={patchTask}
          onTitleChange={setPeriodTitle}
        />
      </div>
      <EventEditorModal
        task={selected}
        apps={value.apps}
        onPatch={patchTask}
        onCreateApp={addApp}
        onDelete={removeTask}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
