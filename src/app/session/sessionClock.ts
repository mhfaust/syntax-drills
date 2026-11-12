/** Time spent in a session, leaving out the time it was paused. */
export class SessionClock {
  private pausedMs = 0;
  private pausedAt: Date | null = null;

  constructor(private readonly startedAt: Date) {}

  get paused(): boolean {
    return this.pausedAt !== null;
  }

  pause(at: Date): void {
    this.pausedAt ??= at;
  }

  resume(at: Date): void {
    if (!this.pausedAt) return;
    this.pausedMs += at.getTime() - this.pausedAt.getTime();
    this.pausedAt = null;
  }

  elapsedMs(at: Date): number {
    return (this.pausedAt ?? at).getTime() - this.startedAt.getTime() - this.pausedMs;
  }
}
