/** Collects per-exercise typing telemetry. Created when an exercise appears on screen. */
export class KeystrokeTimer {
  private readonly startedAt = performance.now();
  private firstKeyAt: number | null = null;
  private lastKeyAt: number | null = null;
  private longestPause = 0;
  private keystrokes = 0;
  private backspaces = 0;

  key(key: string): void {
    const now = performance.now();
    if (this.lastKeyAt === null) this.firstKeyAt = now;
    else this.longestPause = Math.max(this.longestPause, now - this.lastKeyAt);
    this.lastKeyAt = now;
    this.keystrokes += 1;
    if (key === 'Backspace' || key === 'Delete') this.backspaces += 1;
  }

  snapshot() {
    return {
      firstKeyMs: this.firstKeyAt === null ? null : Math.round(this.firstKeyAt - this.startedAt),
      totalMs: Math.round(performance.now() - this.startedAt),
      longestPauseMs: Math.round(this.longestPause),
      keystrokes: this.keystrokes,
      backspaces: this.backspaces,
    };
  }
}
