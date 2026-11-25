import { useEffect, useMemo, useRef, useState } from "react";
import type FullCalendar from "@fullcalendar/react";
import type { BodyProps } from "../types";
import { AppsBar } from "./AppsBar";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarToolbar } from "./CalendarToolbar";
import { createSharedApp, removeSharedApp, updateSharedApp, useAdoptLocalApps, useSharedApps } from "@/lib/apps";
import { confirmDelete } from "@/lib/confirm";
import { nextSlot } from "./dates";
import { EventEditorModal } from "./EventEditorModal";
import { genId, nextColor } from "./meta";
import type { CalendarState, CalendarTask, CalendarView } from "./state";
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

  // Applications : liste partagée des paramètres ; l'état ne garde que les appId.
  const apps = useSharedApps();
  useAdoptLocalApps(value, onChange, (s, map) => ({
    ...s,
    events: s.events.map((e) => (e.appId && map.has(e.appId) ? { ...e, appId: map.get(e.appId) } : e)),
  }));

  // La vue peut aussi changer depuis l'extérieur (état restauré).
  useEffect(() => {
    const api = calRef.current?.getApi();
    if (api && api.view.type !== value.view) api.changeView(value.view);
  }, [value.view]);

  // Un filtre sur une application supprimée n'a plus de sens.
  const activeFilter = filterAppId && apps.some((a) => a.id === filterAppId) ? filterAppId : null;

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

  // ─── Applications (partagées) ─────────────────────────────────────────────
  const addApp = (name: string, color?: string) => createSharedApp(name, color);
  const updateApp = updateSharedApp;

  /** Supprime l'application de la liste partagée et désaffecte les tâches de ce calendrier. */
  async function removeApp(appId: string) {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    const used = valueRef.current.events.filter((e) => e.appId === appId).length;
    const plural = used > 1;
    const ok = await confirmDelete(
      `Supprimer l'application « ${app.name} » ? Elle disparaît de tous les composants (liste partagée des paramètres).${
        used > 0 ? ` ${used} tâche${plural ? "s seront" : " sera"} désaffectée${plural ? "s" : ""} ici.` : ""
      }`,
    );
    if (!ok) return;
    removeSharedApp(appId);
    if (used > 0) update((s) => ({ ...s, events: s.events.map((e) => (e.appId === appId ? { ...e, appId: undefined } : e)) }));
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
        apps={apps}
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
          apps={apps}
          selectedId={selectedId}
          onSelectRange={(start, end, allDay) => setSelectedId(addTask(start, end, allDay))}
          onTaskClick={setSelectedId}
          onTaskMove={patchTask}
          onTitleChange={setPeriodTitle}
        />
      </div>
      <EventEditorModal
        task={selected}
        apps={apps}
        onPatch={patchTask}
        onCreateApp={addApp}
        onDelete={removeTask}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
