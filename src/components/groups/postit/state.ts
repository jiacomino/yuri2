export type PostItState = {
  text: string;
  /** Date ISO à laquelle l'alarme doit sonner. */
  alarmAt?: string;
  /** Vrai une fois l'alarme déclenchée pour cette valeur de `alarmAt`. */
  alarmFired?: boolean;
};

export function defaultState(): PostItState {
  return { text: "" };
}

export function demoState(): PostItState {
  const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000);
  inTwoHours.setMinutes(0, 0, 0);
  return {
    text: "Appeler le plombier avant 17 h\nRésa resto samedi — 4 pers.\nAcheter du pain 🥖",
    alarmAt: inTwoHours.toISOString(),
    alarmFired: false,
  };
}
