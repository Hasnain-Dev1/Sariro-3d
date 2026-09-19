/**
 * SARIRO — what a round of any practice game shares (pure)
 * ============================================================================
 * Coins for a right answer: 10, up to 20 for an instant one, multiplied by the
 * streak (×1.5 at two in a row, up to ×5), plus any bonus the game gives for
 * doing it perfectly. A new level every few right answers.
 */

export function coinsFor(secondsLeft: number, patience: number, combo: number, bonus = 0): number {
  const speed = patience > 0 ? Math.max(0, Math.min(1, secondsLeft / patience)) : 0;
  return Math.round((10 + 10 * speed) * Math.min(5, 1 + combo * 0.5)) + bonus;
}

export const levelFor = (done: number, every: number) => 1 + Math.floor(done / every);
