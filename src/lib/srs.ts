// Répétition espacée — variante de SM-2 (l'algorithme d'Anki / SuperMemo).

export type Grade = 0 | 1 | 2 | 3; // 0 = à revoir, 1 = difficile, 2 = bien, 3 = facile

export interface SrsState {
  ease: number; // facteur de facilité (≥ 1.3)
  interval: number; // en jours
  reps: number; // répétitions réussies d'affilée
  lapses: number;
  due: number; // timestamp ms
}

const DAY = 24 * 60 * 60 * 1000;

export function newSrs(): SrsState {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: Date.now() };
}

export function schedule(s: SrsState, grade: Grade, now = Date.now()): SrsState {
  let { ease, interval, reps, lapses } = s;

  if (grade === 0) {
    // Raté : on recommence, la carte revient dans 10 minutes
    lapses += 1;
    reps = 0;
    ease = Math.max(1.3, ease - 0.2);
    return { ease, interval: 0, reps, lapses, due: now + 10 * 60 * 1000 };
  }

  if (reps === 0) interval = grade === 3 ? 3 : 1;
  else if (reps === 1) interval = grade === 3 ? 7 : grade === 1 ? 3 : 6;
  else {
    const mult = grade === 1 ? 1.2 : grade === 3 ? ease * 1.3 : ease;
    interval = Math.round(interval * mult);
  }

  if (grade === 1) ease = Math.max(1.3, ease - 0.15);
  if (grade === 3) ease = ease + 0.15;
  reps += 1;

  return { ease, interval, reps, lapses, due: now + interval * DAY };
}

/** Libellé lisible de l'intervalle qu'on obtiendrait avec cette note. */
export function previewInterval(s: SrsState, grade: Grade): string {
  const next = schedule(s, grade, 0);
  if (next.interval === 0) return "10 min";
  if (next.interval < 30) return `${next.interval} j`;
  if (next.interval < 365) return `${Math.round(next.interval / 30)} mois`;
  return `${(next.interval / 365).toFixed(1)} an`;
}
