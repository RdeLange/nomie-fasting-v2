<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fasting } from './fasting/state.svelte';
  import FastRing from './components/fast-ring.svelte';
  import FastTimeline from './components/fast-timeline.svelte';
  import { hms, progressOf, type Plan } from './fasting/fasting';
  import { paletteFrom, type Palette } from './palette';
  import { onPrefsChange } from './prefs-live';
  import Home from './screens/home.svelte';
  import Editor from './screens/editor.svelte';
  import Settings from './screens/settings.svelte';

  type View = { name: 'home' } | { name: 'edit'; plan: Plan | null } | { name: 'settings' };

  let view = $state<View>({ name: 'home' });
  let mode = $state<'modal' | 'widget'>('modal');
  let palette = $state<Palette>(paletteFrom(undefined));
  let scale = $state(1);
  let now = $state(new Date());
  let poll: ReturnType<typeof setInterval> | undefined;
  let tick: ReturnType<typeof setInterval> | undefined;
  // the size of the widget: a narrow one shows the ring, a medium or large one the timeline
  let frameWidth = $state(window.innerWidth);
  const TIMELINE_FROM = 280;

  const applyNomieValues = (plugin: any) => {
    if (!plugin?.prefs) return;
    palette = paletteFrom(plugin.prefs);
    scale = plugin.prefs.fontScale || 1;
  };

  const home = () => (view = { name: 'home' });
  const editPlan = (id: string) => {
    const plan = fasting.plans.find((p) => p.id === id) ?? null;
    view = { name: 'edit', plan };
  };

  // The widget has two timers: the clock of the display, every second, and the saved fast, read again every 30 seconds
  // (the modal may have started or ended it)
  const widgetClock = () => {
    stopWidgetClock();
    now = new Date();
    tick = setInterval(() => (now = new Date()), 1000);
    poll = setInterval(() => fasting.reload(), 30_000);
  };
  const stopWidgetClock = () => {
    if (tick) clearInterval(tick);
    if (poll) clearInterval(poll);
  };

  onMount(() => {
    const plugin = new NomiePlugin({
      name: 'Nomie Fasting',
      emoji: '⏲',
      description: 'Intermittent fasting: start a fast, see its progress, and log it to Nomie. A widget shows the fast on the dashboard.',
      uses: ['createNote', 'confirm', 'prompt', 'selectTrackables', 'getStorageItem', 'setStorageItem'],
      version: '2.0',
      addToCaptureMenu: true,
      addToMoreMenu: true,
      addToWidgets: true,
    });
    onPrefsChange(plugin, () => applyNomieValues(plugin));
    plugin.onRegistered(async () => {
      applyNomieValues(plugin);
      if (!fasting.loaded) await fasting.load(plugin);
    });
    plugin.onUIOpened(async () => {
      mode = 'modal';
      applyNomieValues(plugin);
      if (!fasting.loaded) await fasting.load(plugin);
      else await fasting.reload();
    });
    window.addEventListener('resize', () => (frameWidth = window.innerWidth));
    plugin.onWidget(async () => {
      mode = 'widget';
      frameWidth = window.innerWidth;
      applyNomieValues(plugin);
      if (!fasting.loaded) await fasting.load(plugin);
      else await fasting.reload();
      widgetClock();
    });
  });

  onDestroy(stopWidgetClock);

  const widgetProgress = $derived(fasting.active ? progressOf(fasting.active, now) : null);
</script>

<div class="root" class:widget={mode === 'widget'} style="--page: {palette.page}; --card: {palette.card}; --card-inner: {palette.cardInner}; --text: {palette.text}; --muted: {palette.textSecondary}; --line: {palette.separator}; --fill: {palette.fill}; --tint: {palette.tint}; --on-tint: {palette.onTint}; --tint-soft: {palette.tintSoft}; --good: {palette.good}; --danger: {palette.danger}; --scale: {scale};">
  {#if mode === 'widget'}
    {#if !fasting.loaded}
      <p class="muted">Loading…</p>
    {:else if widgetProgress && fasting.active && frameWidth >= TIMELINE_FROM}
      <div class="head"><span aria-hidden="true">⏲</span><span>{fasting.active.name}</span></div>
      <FastTimeline
        percent={widgetProgress.percent}
        color={fasting.active.color}
        time={widgetProgress.done ? 'Target reached' : hms(widgetProgress.remainingMs)}
        sub={widgetProgress.done ? `${fasting.active.hours} hours done` : 'to go'}
        startsAt={new Date(fasting.active.startedAt)}
        endsAt={widgetProgress.endsAt}
      />
    {:else if widgetProgress && fasting.active}
      <div class="head"><span aria-hidden="true">⏲</span><span>{fasting.active.name}</span></div>
      <FastRing
        percent={widgetProgress.percent}
        color={fasting.active.color}
        label={fasting.active.name}
        time={widgetProgress.done ? 'Target reached' : hms(widgetProgress.remainingMs)}
        sub={widgetProgress.done ? `${fasting.active.hours} hours done` : 'to go'}
      />
    {:else}
      <div class="head"><span aria-hidden="true">⏲</span><span>No fast running</span></div>
      <p class="muted">Start a fast in Nomie Fasting. Its progress shows here.</p>
    {/if}
  {:else}
    <header class="top">
      <div class="title"><span aria-hidden="true">⏲</span><h1>Nomie Fasting</h1></div>
    </header>
    {#if !fasting.loaded}
      <p class="muted">Loading…</p>
    {:else if view.name === 'settings'}
      <Settings back={home} />
    {:else if view.name === 'edit'}
      <Editor plan={view.plan} isNew={view.plan === null} done={home} />
    {:else}
      <Home edit={editPlan} create={() => (view = { name: 'edit', plan: null })} back={() => (view = { name: 'settings' })} />
    {/if}
  {/if}
</div>

<style>
  .root { box-sizing: border-box; min-height: 100vh; max-width: 520px; margin: 0 auto; padding: 16px; background: var(--page); color: var(--text); font-size: calc(16px * var(--scale)); line-height: 1.4; }
  /* the widget card is the card colour of the app, and the ring sits on it */
  .root.widget { min-height: 0; height: 100vh; max-width: none; padding: 10px 12px; background: var(--card); font-size: calc(14px * var(--scale)); display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .root.widget p { text-align: center; margin: 4px 0; }
  .top { display: flex; align-items: center; margin-bottom: 8px; }
  .title, .head { display: flex; align-items: center; gap: 8px; }
  .head { font-weight: 600; font-size: calc(14px * var(--scale)); color: var(--muted); }
  h1 { margin: 0; font-size: calc(22px * var(--scale)); font-weight: 700; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
</style>
