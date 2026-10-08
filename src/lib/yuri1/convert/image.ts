/**
 * Image annotée yuri 1 → yuri2. yuri 1 utilisait marker.js 2, dont l'état n'est
 * pas compatible avec marker.js 3 : on l'abandonne et, pour garder les
 * annotations visibles, l'aperçu aplati devient l'image de base.
 */
import { defaultState, type ImageState } from "@/components/groups/image/state";
import type { Converter } from "../types";
import { obj, optStr } from "./util";

function dataImage(v: unknown): string | undefined {
  const s = optStr(v);
  return s?.startsWith("data:image/") ? s : undefined;
}

export const convertImage: Converter<ImageState> = (raw) => {
  const r = obj(raw);
  const image = dataImage(r.rendered) ?? dataImage(r.image);
  return image ? { image, markerState: null, rendered: null } : defaultState();
};
