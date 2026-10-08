import { KeyRound } from "lucide-react";
import type { GroupDefinition } from "../types";
import { PasswordBody } from "./PasswordBody";
import { defaultState, demoState, type PasswordState } from "./state";

export const passwordGroup: GroupDefinition<PasswordState> = {
  kind: "password",
  label: "Mots de passe",
  icon: KeyRound,
  color: "#14b8a6",
  defaultState,
  demoState,
  Body: PasswordBody,
  preview: { cols: 1, height: 420 },
};
