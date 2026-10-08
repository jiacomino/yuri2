import { useState } from "react";
import { Globe } from "lucide-react";
import { faviconFor } from "@/lib/url";
import { cn } from "@/lib/utils";

/** Favicon du site dans une pastille arrondie, avec un globe en repli si l'image ne charge pas. */
export function Favicon({ url, className }: { url: string; className?: string }) {
  const src = faviconFor(url);
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-default", className)}>
      {!src || failed ? (
        <Globe className="size-3.5 text-muted" />
      ) : (
        <img
          src={src}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          className="size-4 rounded-[3px] object-contain"
        />
      )}
    </span>
  );
}
