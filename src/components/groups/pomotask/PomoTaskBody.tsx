import type { BodyProps } from "../types";
import { announceTimerEnd, warmUpNotifications } from "../pomodoro/announce";
import { idleTimer, pauseTimer, startTimer } from "../pomodoro/timer";
import { usePomodoroTimer } from "../pomodoro/usePomodoroTimer";
import { ActiveTaskTimer } from "./ActiveTaskTimer";
import { AddTaskForm } from "./AddTaskForm";
import { PomoTaskList } from "./PomoTaskList";
import type { PomoTask, PomoTaskState } from "./state";

export function PomoTaskBody({ value, onChange }: BodyProps<PomoTaskState>) {
  const { tasks, activeTaskId, timer } = value;
  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const totalMs = activeTask ? activeTask.estimateMin * 60_000 : 0;

  const view = usePomodoroTimer(timer, totalMs, () => {
    announceTimerEnd({
      title: "Pomodoro terminé",
      body: activeTask ? `Tâche : ${activeTask.text}` : "Session terminée",
    });
    onChange({ ...value, timer: idleTimer() });
  });

  function patchTasks(fn: (tasks: PomoTask[]) => PomoTask[]) {
    onChange({ ...value, tasks: fn(tasks) });
  }

  function select(id: string) {
    if (id === activeTaskId) return;
    onChange({ ...value, activeTaskId: id, timer: idleTimer() });
  }

  function start() {
    if (!activeTask) return;
    warmUpNotifications();
    onChange({ ...value, timer: startTimer(timer, totalMs) });
  }

  function add(text: string, estimateMin: number) {
    patchTasks((ts) => [...ts, { id: crypto.randomUUID(), text, estimateMin }]);
  }

  function remove(id: string) {
    const isActive = id === activeTaskId;
    onChange({
      ...value,
      tasks: tasks.filter((t) => t.id !== id),
      activeTaskId: isActive ? null : activeTaskId,
      timer: isActive ? idleTimer() : timer,
    });
  }

  function updateText(id: string, text: string) {
    const clean = text.trim();
    if (!clean) return remove(id);
    patchTasks((ts) => ts.map((t) => (t.id === id ? { ...t, text: clean } : t)));
  }

  function changeEstimate(id: string, estimateMin: number) {
    // La tâche active à l'arrêt repart sur sa nouvelle durée.
    const resetTimer = id === activeTaskId && !view.isRunning;
    onChange({
      ...value,
      tasks: tasks.map((t) => (t.id === id ? { ...t, estimateMin } : t)),
      timer: resetTimer ? idleTimer() : timer,
    });
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <ActiveTaskTimer
        task={activeTask}
        view={view}
        onStart={start}
        onPause={() => onChange({ ...value, timer: pauseTimer(timer) })}
        onReset={() => onChange({ ...value, timer: idleTimer() })}
        onChangeEstimate={(m) => activeTask && changeEstimate(activeTask.id, m)}
      />

      <AddTaskForm onAdd={add} />

      <div className="min-h-24 flex-1 overflow-y-auto rounded-xl bg-surface-secondary p-2.5">
        <PomoTaskList
          tasks={tasks}
          activeTaskId={activeTaskId}
          isRunning={view.isRunning}
          onSelect={select}
          onUpdateText={updateText}
          onChangeEstimate={changeEstimate}
          onRemove={remove}
        />
      </div>
    </div>
  );
}
