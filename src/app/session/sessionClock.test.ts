import { describe, expect, it } from 'vitest';
import { SessionClock } from '@/app/session/sessionClock';

const at = (seconds: number) => new Date(seconds * 1000);

describe('SessionClock', () => {
  it('counts wall-clock time when never paused', () => {
    const clock = new SessionClock(at(0));
    expect(clock.elapsedMs(at(90))).toBe(90_000);
  });

  it('stops counting while paused', () => {
    const clock = new SessionClock(at(0));
    clock.pause(at(60));
    expect(clock.paused).toBe(true);
    expect(clock.elapsedMs(at(600))).toBe(60_000);
  });

  it('leaves paused time out after resuming', () => {
    const clock = new SessionClock(at(0));
    clock.pause(at(60));
    clock.resume(at(360));
    expect(clock.paused).toBe(false);
    expect(clock.elapsedMs(at(400))).toBe(100_000);
  });

  it('adds up several pauses', () => {
    const clock = new SessionClock(at(0));
    clock.pause(at(10));
    clock.resume(at(20));
    clock.pause(at(30));
    clock.resume(at(50));
    expect(clock.elapsedMs(at(60))).toBe(30_000);
  });

  it('ignores a second pause and a resume without a pause', () => {
    const clock = new SessionClock(at(0));
    clock.resume(at(5));
    clock.pause(at(10));
    clock.pause(at(20));
    clock.resume(at(30));
    expect(clock.elapsedMs(at(40))).toBe(20_000);
  });
});
