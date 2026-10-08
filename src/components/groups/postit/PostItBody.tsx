import { fireAlarmNotification } from "@/lib/alarm";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import type { BodyProps } from "../types";
import type { PostItState } from "./state";
import { PostItFooter } from "./PostItFooter";
import { useAlarmScheduler } from "./useAlarmScheduler";

/** Corps du groupe « Post-it » : note rapide sur papier jaune + rappel optionnel. */
export function PostItBody({ value, onChange }: BodyProps<PostItState>) {
  const fired = !!value.alarmFired;

  useAlarmScheduler(value.alarmAt, fired, () => {
    const note = value.text.trim() || "Rappel post-it";
    notify({ title: "Rappel post-it", body: note, kind: "alarm", durationMs: 12_000 });
    void fireAlarmNotification("yuri — post-it", note, { sound: true });
    onChange({ ...value, alarmFired: true });
  });

  return (
    <div className="flex h-full flex-col">
      {/* Papier jaune « pense-bête » ; en sombre, teinte jaune translucide sur la carte. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col rounded-xl bg-[#fef08a] shadow-[0_1px_2px_rgba(16,24,40,.05),0_4px_14px_rgba(120,90,0,.12)]",
          "dark:bg-yellow-300/[.13] dark:shadow-none",
          fired && "ring-2 ring-danger/60",
        )}
      >
        <textarea
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.currentTarget.value })}
          placeholder="Écris ta note rapide…"
          aria-label="Contenu du post-it"
          className={cn(
            "min-h-0 flex-1 resize-none bg-transparent px-3.5 pt-3 pb-1 text-[1.1111rem] leading-[1.55] font-medium outline-none",
            "text-[#422006] placeholder:text-[#713f12]/45 dark:text-yellow-50 dark:placeholder:text-yellow-100/35",
          )}
        />
        <PostItFooter
          text={value.text}
          alarmAt={value.alarmAt}
          alarmFired={fired}
          onAlarmChange={(alarmAt) => onChange({ ...value, alarmAt, alarmFired: false })}
        />
      </div>
    </div>
  );
}
