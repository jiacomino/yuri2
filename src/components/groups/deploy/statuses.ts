import { CircleCheck, CircleDashed, CircleMinus, CirclePlay, CircleX, type LucideIcon } from "lucide-react";
import type { DeployPhase, StepStatus } from "./state";

export const STEP_STATUSES: { id: StepStatus; label: string; color: string; icon: LucideIcon }[] = [
  { id: "todo", label: "À faire", color: "#94a3b8", icon: CircleDashed },
  { id: "running", label: "En cours", color: "#3b82f6", icon: CirclePlay },
  { id: "done", label: "Terminée", color: "#10b981", icon: CircleCheck },
  { id: "failed", label: "En échec", color: "#ef4444", icon: CircleX },
  { id: "skipped", label: "Ignorée", color: "#a1a1aa", icon: CircleMinus },
];

export function statusMeta(status: StepStatus) {
  return STEP_STATUSES.find((s) => s.id === status) ?? STEP_STATUSES[0];
}

export const PHASES: Record<DeployPhase, { label: string; color: string }> = {
  planned: { label: "Planifiée", color: "#94a3b8" },
  running: { label: "En cours", color: "#3b82f6" },
  done: { label: "Terminée", color: "#10b981" },
  failed: { label: "En échec", color: "#ef4444" },
};
