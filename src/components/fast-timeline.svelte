<script lang="ts">
  // The progress of a fast along a timeline, for the medium and large widgets: a smooth bar that fills from the start
  // to the end, with a glowing head, quarter marks, and the start and end times at its ends.
  let {
    percent,
    color,
    time,
    sub,
    startsAt,
    endsAt,
  }: { percent: number; color: string; time: string; sub: string; startsAt: Date; endsAt: Date } = $props();

  const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const share = $derived(Math.max(0, Math.min(100, percent)));
  const marks = [25, 50, 75];
</script>

<div class="timeline" style="--accent: {color}" role="img" aria-label="{percent} percent of the fast">
  <div class="top">
    <p class="time">{time}</p>
    <p class="sub">{sub}</p>
  </div>

  <div class="track">
    <div class="fill" style="width: {share}%"></div>
    {#each marks as m (m)}
      <span class="mark" style="left: {m}%"></span>
    {/each}
    {#if share > 0 && share < 100}
      <span class="head" style="left: {share}%"></span>
    {/if}
  </div>

  <div class="ends">
    <span>{clock(startsAt)}</span>
    <span class="pct">{Math.round(share)}%</span>
    <span>{clock(endsAt)}</span>
  </div>
</div>

<style>
  .timeline { width: 100%; padding: 4px 2px 0; }
  .top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .time { margin: 0; font-size: calc(26px * var(--scale)); font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
  .sub { margin: 0; font-size: calc(13px * var(--scale)); color: var(--muted); }

  .track {
    position: relative;
    height: 16px;
    margin: 12px 0 8px;
    border-radius: 999px;
    background: var(--fill);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
  }
  /* the filled part: a gradient from a soft tint of the colour to the full colour, with a glow */
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    min-width: 0;
    border-radius: 999px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 45%, transparent), var(--accent));
    box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 55%, transparent);
    transition: width 1s linear;
  }
  .fill::after {
    /* a soft highlight along the top of the bar */
    content: '';
    position: absolute;
    inset: 2px 6px auto 6px;
    height: 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.35);
  }
  .mark {
    position: absolute;
    top: 3px;
    bottom: 3px;
    width: 1px;
    background: color-mix(in srgb, var(--muted) 45%, transparent);
  }
  /* the head: a white dot with a coloured ring, pulsing softly */
  .head {
    position: absolute;
    top: 50%;
    width: 22px;
    height: 22px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 35%, transparent), 0 2px 8px rgba(0, 0, 0, 0.3);
    animation: pulse 2s ease-in-out infinite;
    transition: left 1s linear;
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 30%, transparent), 0 2px 8px rgba(0, 0, 0, 0.3); }
    50% { box-shadow: 0 0 0 9px color-mix(in srgb, var(--accent) 12%, transparent), 0 2px 8px rgba(0, 0, 0, 0.3); }
  }

  .ends { display: flex; justify-content: space-between; align-items: center; font-size: calc(13px * var(--scale)); color: var(--muted); font-variant-numeric: tabular-nums; }
  .pct { font-weight: 600; color: var(--text); }

  @media (prefers-reduced-motion: reduce) {
    .fill, .head { transition: none; }
    .head { animation: none; }
  }
</style>
