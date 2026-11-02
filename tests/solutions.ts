import type { Locale } from "../src/i18n";
import { game } from "./helpers";

/** rooms/<id>/solution.json: the commands that solve that room, per locale. */
const files = import.meta.glob<Record<Locale, string[]>>("../rooms/*/solution.json", {
  eager: true,
  import: "default",
});

export function solution(roomId: string, locale: Locale = "en-US"): string[] {
  const file = files[`../rooms/${roomId}/solution.json`];
  if (!file) throw new Error(`rooms/${roomId}/solution.json is missing`);
  return file[locale];
}

/** Every room's solution, in level order: wins the whole game. */
export function fullSolution(locale: Locale = "en-US"): string[] {
  return game.order.flatMap((id) => solution(id, locale));
}
