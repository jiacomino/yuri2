import type { GroupKind } from "@/components/groups/types";
import type { Converter } from "../types";
import { convertCalendar } from "./calendar";
import { convertEisenhower } from "./eisenhower";
import { convertGCalendar } from "./gcalendar";
import { convertImage } from "./image";
import { convertKanban } from "./kanban";
import { convertLinks } from "./links";
import { convertMarkdown } from "./markdown";
import { convertMindMap } from "./mindmap";
import { convertPassword } from "./password";
import { convertPomodoro } from "./pomodoro";
import { convertPomoTask } from "./pomotask";
import { convertPostIt } from "./postit";
import { convertPosture } from "./posture";
import { convertText } from "./text";
import { convertTodo } from "./todo";
import { convertWorkflow } from "./workflow";

/** Un convertisseur yuri 1 → yuri2 par type de composant (types nés dans yuri2 : aucun). */
export const converters: Partial<Record<GroupKind, Converter<unknown>>> = {
  links: convertLinks,
  text: convertText,
  markdown: convertMarkdown,
  postit: convertPostIt,
  todo: convertTodo,
  kanban: convertKanban,
  eisenhower: convertEisenhower,
  pomotask: convertPomoTask,
  pomodoro: convertPomodoro,
  posture: convertPosture,
  calendar: convertCalendar,
  gcalendar: convertGCalendar,
  mindmap: convertMindMap,
  workflow: convertWorkflow,
  image: convertImage,
  password: convertPassword,
};
