<script lang="ts">
  import { fasting } from '../fasting/state.svelte';
  import FastRing from '../components/fast-ring.svelte';
  import { hms, progressOf, thisWeek } from '../fasting/fasting';
  import { shortDate } from '../format';

  let { edit, create, back }: { edit: (id: string) => void; create: () => void; back: () => void } = $props();

  // the clock of the screen: it only redraws, the timer itself is worked out from the start
  let now = $state(new Date());
  $effect(() => {
    const id = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(id);
  });

  const progress = $derived(fasting.active ? progressOf(fasting.active, now) : null);
  const week = $derived(thisWeek(fasting.history, now));
  const recent = $derived(fasting.history.slice(0, 5));
  const endsText = (d: Date) => d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
</script>

{#if fasting.summary}
  <section class="card done">
    <p class="caption">{fasting.summary.completed ? 'Fast complete' : 'Fast ended early'}</p>
    <h2>{fasting.summary.name}</h2>
    <p class="big">{fasting.summary.hours.toFixed(1)} of {fasting.summary.target} hours</p>
    {#if fasting.summary.mood !== undefined}<p class="muted">Mood {fasting.summary.mood} of 10</p>{/if}
    {#if fasting.logged}
      <p class="notice">Logged to your timeline.</p>
    {:else if fasting.settings.askBeforeLog}
      <button class="primary" onclick={() => fasting.logSession()}>Log to timeline</button>
    {/if}
  </section>
  <button class="ghost" onclick={() => fasting.dismissSummary()}>Done</button>
{:else if fasting.active && progress}
  <section class="card running" style="--accent: {fasting.active.color}">
    <p class="caption">{fasting.active.name}</p>
    <FastRing
      percent={progress.percent}
      color={fasting.active.color}
      label={fasting.active.name}
      time={progress.done ? 'Target reached' : hms(progress.remainingMs)}
      sub={progress.done ? `${fasting.active.hours} hours done` : 'to go'}
    />
    <p class="muted centre-text">Started {shortDate(fasting.active.startedAt)} · ends {endsText(progress.endsAt)}</p>
    <p class="muted centre-text small">Started later than that?</p>
    <div class="chips">
      <button onclick={() => fasting.moveStartBack(0.5)}>30 min earlier</button>
      <button onclick={() => fasting.moveStartBack(1)}>1 h earlier</button>
      <button onclick={() => fasting.moveStartBack(2)}>2 h earlier</button>
    </div>
    <button class="primary" onclick={() => fasting.end()}>{progress.done ? 'End fast' : 'End fast now'}</button>
  </section>
{:else}
  <h2>Plans</h2>
  {#each fasting.plans as plan (plan.id)}
    <section class="card plan">
      <button class="plan-main" onclick={() => fasting.start(plan)}>
        <span class="dot" style="background: {plan.color}"></span>
        <span class="text"><span class="title">{plan.name}</span><span class="muted">{plan.hours} hours{plan.description ? ` · ${plan.description}` : ''}</span></span>
        <span class="start">Start</span>
      </button>
      <button class="link" onclick={() => edit(plan.id)}>Edit</button>
    </section>
  {:else}
    <p class="muted pad">No plans yet. Make one with the hours you want to fast.</p>
  {/each}
  <button class="ghost" onclick={create}>New plan</button>
{/if}

{#if !fasting.active && !fasting.summary}
  <h2>This week</h2>
  <section class="card">
    <p class="big">{week.completed} <span class="muted">completed</span></p>
    <p class="muted">{week.hours} hours fasted</p>
  </section>
  {#if recent.length}
    <h2>Recent</h2>
    <section class="card">
      {#each recent as e (e.at)}
        <div class="row"><span>{shortDate(e.at)} · {e.name}</span><span class="muted">{e.hours.toFixed(1)} h{e.completed ? '' : ' · early'}</span></div>
      {/each}
    </section>
    <button class="link" onclick={() => fasting.clearHistory()}>Clear the history</button>
  {/if}
{/if}

<button class="link" onclick={back}>Settings</button>

<style>
  h2 { margin: 16px 0 6px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 10px 0; }
  .caption { margin: 0; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; text-align: center; }
  .big { margin: 4px 0 0; font-size: calc(24px * var(--scale)); font-weight: 700; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); margin: 4px 0; }
  .small { font-size: calc(13px * var(--scale)); }
  .centre-text { text-align: center; }
  .pad { padding: 12px 0; }
  .plan { padding: 8px 12px; }
  .plan-main { display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 0; border: 0; background: transparent; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
  .dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
  .text { display: flex; flex: 1; flex-direction: column; min-width: 0; }
  .title { font-weight: 600; }
  .start { color: var(--tint); font-weight: 600; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 6px 0 10px; }
  .chips button { padding: 7px 12px; border: 0; border-radius: 10px; background: var(--fill); color: var(--text); font: inherit; font-size: calc(14px * var(--scale)); cursor: pointer; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid var(--line); }
  .row:first-child { border-top: 0; }
  .primary { display: block; width: 100%; margin-top: 10px; padding: 14px; border: 0; border-radius: 14px; background: var(--tint); color: var(--on-tint); font: inherit; font-size: calc(17px * var(--scale)); font-weight: 600; cursor: pointer; }
  .ghost { display: block; width: 100%; margin-top: 8px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
  .link { display: block; margin: 8px auto 0; padding: 6px; border: 0; background: transparent; color: var(--tint); font: inherit; cursor: pointer; }
  .done .notice { color: var(--good); font-weight: 600; }
  h2:first-of-type { margin-top: 4px; }
</style>
