// The state of the plugin: the plans, the fast that runs, the history and the settings.
// Everything is saved as it changes. The widget reads the same saved data, so it shows the fast the modal started.
import {
  DEFAULT_SETTINGS, endFast, fastNote, normaliseActive, normaliseHistory, normalisePlans, normaliseSettings, planProblem, startedHoursAgo,
  TEMPLATE_PLANS, HISTORY_LIMIT, type Active, type Entry, type Plan, type Settings,
} from './fasting';

class FastingState {
  plugin: any = null;
  loaded = $state(false);
  plans = $state<Plan[]>([]);
  active = $state<Active | null>(null);
  history = $state<Entry[]>([]);
  settings = $state<Settings>(DEFAULT_SETTINGS);

  // the fast that has just ended: waiting for the note, and whether the note was written
  summary = $state<Entry | null>(null);
  logged = $state(false);

  async load(plugin: any): Promise<void> {
    this.plugin = plugin;
    await this.reload();
    const stored = plugin.storage.getItem('plans');
    if (stored === undefined) {
      this.plans = TEMPLATE_PLANS.map((t, i) => ({ ...t, id: `p${i + 1}` }));
      this.save('plans', this.plans);
    }
    this.loaded = true;
  }

  // Reads the saved data again. The widget does this, because the modal may have changed it.
  async reload(): Promise<void> {
    if (!this.plugin) return;
    await this.plugin.storage.init();
    const s = this.plugin.storage;
    this.plans = normalisePlans(s.getItem('plans'));
    this.active = normaliseActive(s.getItem('active'));
    this.history = normaliseHistory(s.getItem('history'));
    this.settings = normaliseSettings(s.getItem('settings'));
  }

  private save(key: string, value: unknown): void {
    this.plugin?.storage.setItem(key, $state.snapshot(value));
  }

  savePlan(plan: Plan): string | null {
    const problem = planProblem(plan);
    if (problem) return problem;
    const next = { ...$state.snapshot(plan), name: plan.name.trim() };
    const exists = this.plans.some((p) => p.id === next.id);
    this.plans = exists ? this.plans.map((p) => (p.id === next.id ? next : p)) : [...this.plans, next];
    this.save('plans', this.plans);
    return null;
  }

  async deletePlan(id: string): Promise<boolean> {
    const res = await this.plugin.confirm('Delete this plan?', 'The plan is removed. Your history is kept.');
    if (!res?.value) return false;
    this.plans = this.plans.filter((p) => p.id !== id);
    this.save('plans', this.plans);
    return true;
  }

  // Starts a fast now, or earlier when the user forgot: `hoursAgo` moves the start back
  start(plan: Plan, hoursAgo = 0): void {
    if (this.active) return;
    this.active = { name: plan.name, description: plan.description, hours: plan.hours, color: plan.color, startedAt: startedHoursAgo(hoursAgo, new Date()) };
    this.save('active', this.active);
  }

  // Moves the start of the running fast back, for when it was started later than it really was
  moveStartBack(hours: number): void {
    if (!this.active) return;
    this.active = { ...this.active, startedAt: new Date(Date.parse(this.active.startedAt) - hours * 3600_000).toISOString() };
    this.save('active', this.active);
  }

  // Ends the running fast. Asks first when it is ended before its target, and asks for the mood when a mood tracker is chosen.
  async end(): Promise<void> {
    if (!this.active) return;
    const now = new Date();
    const entry = endFast(this.active, now);
    if (!entry.completed) {
      const res = await this.plugin.confirm('End the fast early?', `You are at ${entry.hours.toFixed(1)} of ${entry.target} hours. The fast is kept in your history as not completed.`);
      if (!res?.value) return;
    }
    let mood: number | undefined;
    if (this.settings.moodTracker) {
      const res = await this.plugin.prompt('Mood', 'How was the mood during this fast? A number from 1 to 10');
      const n = Math.round(Number(res?.value));
      if (n >= 1 && n <= 10) mood = n;
    }
    const finished = { ...entry, mood };
    this.history = [finished, ...this.history].slice(0, HISTORY_LIMIT);
    this.save('history', this.history);
    this.active = null;
    this.save('active', null);
    this.summary = finished;
    this.logged = false;
    if (!this.settings.askBeforeLog) this.logSession();
  }

  saveSettings(next: Settings): void {
    this.settings = normaliseSettings(next);
    this.save('settings', this.settings);
  }

  logSession(): void {
    if (!this.summary || this.logged) return;
    this.plugin.createNote(fastNote(this.settings, this.summary));
    this.logged = true;
  }

  dismissSummary(): void {
    this.summary = null;
    this.logged = false;
  }

  async clearHistory(): Promise<void> {
    const res = await this.plugin.confirm('Clear the history?', 'The fasts you finished are removed from the plugin. Your timeline is not changed.');
    if (!res?.value) return;
    this.history = [];
    this.save('history', []);
  }
}

export const fasting = new FastingState();
