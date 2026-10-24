import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, endFast, fastNote, hms, normaliseActive, normaliseHistory, normalisePlans, planProblem, progressOf, startedHoursAgo, thisWeek, TEMPLATE_PLANS, type Active } from '../fasting/fasting';

const now = new Date(2026, 9, 25, 12, 0, 0);
const sixteen: Active = { name: '16:8', description: '', hours: 16, color: '#90BAEE', startedAt: startedHoursAgo(4, now) };

describe('the timer of a fast', () => {
  it('the time passed, the time left and the share are worked out from the start, not from ticks', () => {
    const p = progressOf(sixteen, now);
    expect(p.elapsedMs).toBe(4 * 3600_000);
    expect(p.remainingMs).toBe(12 * 3600_000);
    expect(p.percent).toBe(25);
    expect(p.done).toBe(false);
  });

  it('the same moment gives the same answer after a restart, a day later or a reload', () => {
    const later = new Date(now.getTime() + 60_000);
    expect(progressOf(sixteen, later)).toEqual(progressOf({ ...sixteen }, later));
  });

  it('after the target the fast is done, and nothing is left', () => {
    const p = progressOf(sixteen, new Date(now.getTime() + 13 * 3600_000));
    expect(p.done).toBe(true);
    expect(p.remainingMs).toBe(0);
    expect(p.percent).toBe(100);
  });

  it('the time reads as hh:mm:ss', () => {
    expect(hms(3_725_000)).toBe('01:02:05');
    expect(hms(-5)).toBe('00:00:00');
  });
});

describe('ending a fast', () => {
  it('a fast that reached its target is completed, one ended before is not', () => {
    expect(endFast(sixteen, new Date(now.getTime() + 12 * 3600_000)).completed).toBe(true);
    const early = endFast(sixteen, now);
    expect(early.completed).toBe(false);
    expect(early.hours).toBe(4);
  });

  it('the note holds the duration in hours, the plan, and the trackers with their values', () => {
    const entry = endFast(sixteen, new Date(now.getTime() + 2 * 3600_000 + 30 * 60_000), 7);
    const settings = { ...DEFAULT_SETTINGS, timeTracker: 'fasting', moodTracker: 'mood' };
    const note = fastNote(settings, entry);
    expect(note).toContain('Just finished 16:8 fast after 6.50 hours.');
    expect(note).toContain('#fasting(06:30:00)');
    expect(note).toContain('#mood(7)');
  });
});

describe('plans and the saved data', () => {
  it('the five plans of v1 are there, and a plan needs a name and 1 to 72 hours', () => {
    expect(TEMPLATE_PLANS.map((p) => p.hours)).toEqual([13, 16, 18, 20, 36]);
    expect(planProblem({ name: ' ', hours: 16 })).toBeTruthy();
    expect(planProblem({ name: 'x', hours: 73 })).toBeTruthy();
    expect(planProblem({ name: 'x', hours: 16 })).toBeNull();
  });

  it('a saved plan or fast that is not well formed is left out', () => {
    expect(normalisePlans([{ id: 'a', name: 'ok', hours: 16 }, { id: 'b', name: '', hours: 16 }])).toHaveLength(1);
    expect(normaliseActive({ name: 'x', startedAt: 'nope' })).toBeNull();
    expect(normaliseActive({ name: 'x', hours: 16, startedAt: now.toISOString() })?.hours).toBe(16);
  });

  it('the history is newest first, and this week counts the completed fasts', () => {
    const history = normaliseHistory([
      { at: new Date(2026, 9, 20, 8).toISOString(), name: 'a', target: 16, hours: 16.5, completed: true },
      { at: new Date(2026, 9, 24, 8).toISOString(), name: 'b', target: 16, hours: 5, completed: false },
    ]);
    expect(history[0].name).toBe('b');
    expect(thisWeek(history, now)).toEqual({ completed: 1, hours: 21.5 });
  });
});
