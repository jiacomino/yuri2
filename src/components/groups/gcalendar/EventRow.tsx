import { Button } from "@heroui/react";
import { MapPin, Video } from "lucide-react";
import { openWithPref } from "@/lib/browserPref";
import type { CalendarEvent } from "@/lib/google";
import { cn } from "@/lib/utils";
import { formatEventTime } from "./agenda";

type EventRowProps = {
  event: CalendarEvent;
  color: string;
  ongoing: boolean;
};

/** Un événement : pastille du calendrier, horaire, titre (lien Google), lieu et visio. */
export function EventRow({ event, color, ongoing }: EventRowProps) {
  const open = (url?: string) => {
    if (url) void openWithPref(url);
  };
  return (
    <li
      className={cn(
        "group flex items-start gap-2.5 rounded-[10px] px-2.5 py-2 transition-colors",
        event.htmlLink && "list-row cursor-pointer",
        ongoing && "bg-accent/8 hover:bg-accent/12",
      )}
      onClick={() => open(event.htmlLink)}
      onKeyDown={(e) => {
        if (e.key === "Enter") open(event.htmlLink);
      }}
      tabIndex={event.htmlLink ? 0 : undefined}
      title={event.htmlLink ? "Ouvrir dans Google Agenda" : undefined}
    >
      <span aria-hidden className="mt-[5px] size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <div className="leading-snug font-semibold break-words">{event.summary}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[0.8889rem] text-muted tabular-nums">
          {formatEventTime(event)}
          {ongoing && (
            <span className="rounded-md bg-accent/12 px-1.5 py-px text-[0.8148rem] font-bold text-accent">en cours</span>
          )}
        </div>
        {event.location && (
          <div className="mt-0.5 flex items-center gap-1 text-[0.8889rem] text-muted">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
      </div>
      {event.videoLink && (
        // Le clic sur la visio ne doit pas aussi ouvrir l'événement.
        <span className="shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Rejoindre la visioconférence"
            onPress={() => open(event.videoLink)}
            className="size-7 min-w-7 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
          >
            <Video className="size-4" />
          </Button>
        </span>
      )}
    </li>
  );
}
