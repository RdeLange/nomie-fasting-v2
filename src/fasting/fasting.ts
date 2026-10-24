// The fasting: the plans, the timer of the fast that runs, its history, and the note when it ends.
// Every time is a full timestamp (ISO), so the timer is right after a restart, a new day, or a time change in the device.

export type Plan = {
  id: string;
  name: string;
  description: string;
  // the length of the fast, in hours
  hours: number;
  color: string;
};

// The fast that is running. Only one can run at a time.
export type Active = {
  name: string;
  description: string;
  hours: number;
  color: string;
  // when the fast started (ISO); it can be moved earlier, when the user forgot to start it
  startedAt: string;
};

export type Entry = {
  // when the fast ended (ISO)
  at: string;
  name: string;
  // the target, and the hours that were fasted
  target: number;
  hours: number;
  // false when the fast was ended before its target
  completed: boolean;
  mood?: number;
};

export type Settings = {
  // the tracker of the fasting time (timer) and of the mood; a tag, or null
  timeTracker: string | null;
  moodTracker: string | null;
  // the text of the log. <fast> is the plan and <duration> the hours.
  logEntry: string;
  askBeforeLog: boolean;
};

export const HISTORY_LIMIT = 200;
export const MAX_HOURS = 72;
export const MIN_HOURS = 1;

export const DEFAULT_SETTINGS: Settings = {
  timeTracker: null,
  moodTracker: null,
  logEntry: 'Just finished <fast> fast after <duration> hours.',
  askBeforeLog: true,
};

// The plans of the start: the five of v1
export const TEMPLATE_PLANS: Array<Omit<Plan, 'id'>> = [
  { name: 'Circadian rhythm', description: 'From sunset to morning, the rhythm of the body’s own clock.', hours: 13, color: '#C47ADA' },
  { name: '16:8 intermittent', description: 'A 16 hour fast with an 8 hour window to eat.', hours: 16, color: '#90BAEE' },
  { name: '18:6 intermittent', description: 'An 18 hour fast with a 6 hour window to eat.', hours: 18, color: '#75BAFA' },
  { name: '20:4 intermittent', description: 'A 20 hour fast, with one meal a day.', hours: 20, color: '#FBE66E' },
  { name: '36 hour fast', description: 'The monk fast. Many do it once a week at most.', hours: 36, color: '#F5B969' },
];

const isColour = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

export const planProblem = (p: Pick<Plan, 'name' | 'hours'>): string | null => {
  if (!p.name.trim()) return 'Give the plan a name.';
  if (!Number.isFinite(p.hours) || p.hours < MIN_HOURS || p.hours > MAX_HOURS) return `A fast is between ${MIN_HOURS} and ${MAX_HOURS} hours.`;
  return null;
};

export const normalisePlans = (saved: unknown): Plan[] => {
  if (!Array.isArray(saved)) return [];
  return saved.flatMap((p: any): Plan[] => {
    if (typeof p?.id !== 'string' || planProblem({ name: String(p.name ?? ''), hours: Number(p.hours) })) return [];
    return [{ id: p.id, name: String(p.name).trim(), description: String(p.description ?? ''), hours: Number(p.hours), color: isColour(p.color) ? p.color : '#C47ADA' }];
  });
};

export const normaliseActive = (saved: any): Active | null => {
  if (!saved || typeof saved.startedAt !== 'string' || isNaN(Date.parse(saved.startedAt))) return null;
  return {
    name: String(saved.name ?? 'Fast'),
    description: String(saved.description ?? ''),
    hours: Number(saved.hours) || 16,
    color: isColour(saved.color) ? saved.color : '#C47ADA',
    startedAt: saved.startedAt,
  };
};

export const normaliseHistory = (saved: unknown): Entry[] => {
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((e: any) => typeof e?.at === 'string' && !isNaN(Date.parse(e.at)) && typeof e.name === 'string')
    .map((e: any) => ({ at: e.at, name: e.name, target: Number(e.target) || 0, hours: Number(e.hours) || 0, completed: e.completed === true, mood: typeof e.mood === 'number' ? e.mood : undefined }))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, HISTORY_LIMIT);
};

export const normaliseSettings = (saved: any): Settings => ({
  timeTracker: typeof saved?.timeTracker === 'string' && saved.timeTracker ? saved.timeTracker : null,
  moodTracker: typeof saved?.moodTracker === 'string' && saved.moodTracker ? saved.moodTracker : null,
  logEntry: typeof saved?.logEntry === 'string' ? saved.logEntry : DEFAULT_SETTINGS.logEntry,
  askBeforeLog: typeof saved?.askBeforeLog === 'boolean' ? saved.askBeforeLog : true,
});

// The progress of a fast at `now`: the time that has passed, the time left, and the share of the target
export const progressOf = (active: Active, now: Date) => {
  const targetMs = active.hours * 3600_000;
  const elapsedMs = Math.max(0, now.getTime() - Date.parse(active.startedAt));
  const remainingMs = Math.max(0, targetMs - elapsedMs);
  return {
    elapsedMs,
    remainingMs,
    percent: Math.min(100, Math.floor((elapsedMs / targetMs) * 100)),
    done: elapsedMs >= targetMs,
    endsAt: new Date(Date.parse(active.startedAt) + targetMs),
  };
};

// The time as hh:mm:ss, the way a timer tracker takes it
export const hms = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60].map((n) => String(n).padStart(2, '0')).join(':');
};

// The start for "I started this long ago": the hours back from `now`
export const startedHoursAgo = (hours: number, now: Date): string => new Date(now.getTime() - hours * 3600_000).toISOString();

// The fast as it ends: how long it lasted, and whether the target was reached
export const endFast = (active: Active, now: Date, mood?: number): Entry => {
  const { elapsedMs } = progressOf(active, now);
  const hours = Math.round((elapsedMs / 3600_000) * 100) / 100;
  return {
    at: now.toISOString(),
    name: active.name,
    target: active.hours,
    hours,
    completed: hours >= active.hours,
    mood,
  };
};

// The note of a finished fast, as v1 wrote it: the text, the trackers with their values
export const fastNote = (settings: Settings, entry: Entry): string => {
  const text = settings.logEntry.replace('<duration>', entry.hours.toFixed(2)).replace('<fast>', entry.name);
  const lines: string[] = [];
  if (settings.timeTracker) lines.push(`#${settings.timeTracker}(${hms(entry.hours * 3600_000)})`);
  if (settings.moodTracker && entry.mood !== undefined) lines.push(`#${settings.moodTracker}(${entry.mood})`);
  return `Fast ⏲:\n${text}\n\n${lines.join('\n')}`;
};

// The fasts of the week of `now` (from Monday), that were completed, and the hours they took
export const thisWeek = (history: Entry[], now: Date): { completed: number; hours: number } => {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime();
  const inWeek = history.filter((e) => Date.parse(e.at) >= monday);
  return { completed: inWeek.filter((e) => e.completed).length, hours: Math.round(inWeek.reduce((s, e) => s + e.hours, 0) * 10) / 10 };
};
