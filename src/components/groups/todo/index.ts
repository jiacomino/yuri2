import { ListTodo } from "lucide-react";
import type { GroupDefinition } from "../types";
import { defaultTodoState, demoTodoState, type TodoState } from "./state";
import { TodoBody } from "./TodoBody";

export const todoGroup: GroupDefinition<TodoState> = {
  kind: "todo",
  label: "Tâches",
  icon: ListTodo,
  color: "#10b981",
  defaultState: defaultTodoState,
  demoState: demoTodoState,
  Body: TodoBody,
  preview: { cols: 1, height: 460 },
};

export type { TodoState } from "./state";
