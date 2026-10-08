export type Quadrant = "do" | "schedule" | "delegate" | "eliminate";

export const QUADRANT_IDS: Quadrant[] = ["do", "schedule", "delegate", "eliminate"];

export type EisenhowerTask = {
  id: string;
  text: string;
  done?: boolean;
  /** Date ISO à laquelle l'alarme doit sonner. */
  alarmAt?: string;
  /** Vrai une fois l'alarme déclenchée pour cette valeur d'`alarmAt`. */
  alarmFired?: boolean;
};

export type EisenhowerState = {
  tasks: Record<Quadrant, EisenhowerTask[]>;
};

export function defaultState(): EisenhowerState {
  return { tasks: { do: [], schedule: [], delegate: [], eliminate: [] } };
}

export function demoState(): EisenhowerState {
  const inTwoHours = new Date(Date.now() + 2 * 3_600_000);
  inTwoHours.setMinutes(0, 0, 0);
  const tomorrowMorning = new Date();
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 30, 0, 0);

  return {
    tasks: {
      do: [
        { id: "eis-1", text: "Envoyer le devis signé à la société Martin", alarmAt: inTwoHours.toISOString() },
        { id: "eis-2", text: "Corriger le bug de connexion signalé en prod" },
        { id: "eis-3", text: "Payer la facture d'électricité", done: true },
      ],
      schedule: [
        { id: "eis-4", text: "Préparer l'entretien annuel de Camille", alarmAt: tomorrowMorning.toISOString() },
        { id: "eis-5", text: "Réserver la formation TypeScript avancé" },
        { id: "eis-6", text: "Planifier les congés d'été de l'équipe" },
      ],
      delegate: [
        { id: "eis-7", text: "Commander les fournitures de bureau" },
        { id: "eis-8", text: "Mettre à jour le planning des astreintes" },
      ],
      eliminate: [
        { id: "eis-9", text: "Trier les vieux mails promotionnels" },
        { id: "eis-10", text: "Réunion d'info sans ordre du jour", done: true },
      ],
    },
  };
}
