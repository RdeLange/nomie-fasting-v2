<script lang="ts">
  // The progress of a fast as a ring: the share of the target that has passed, and the time left in the middle.
  let { percent, color, label, time, sub }: { percent: number; color: string; label: string; time: string; sub: string } = $props();

  const R = 52;
  const C = 2 * Math.PI * R;
</script>

<div class="ring" role="img" aria-label="{label}: {percent} percent of the fast">
  <svg viewBox="0 0 120 120">
    <circle cx="60" cy="60" r={R} class="track" />
    <circle cx="60" cy="60" r={R} class="arc" stroke={color} stroke-linecap={percent > 0 ? "round" : "butt"} stroke-dasharray="{(Math.min(percent, 100) / 100) * C} {C}" />
  </svg>
  <div class="centre">
    <p class="percent">{percent}%</p>
    <p class="time">{time}</p>
    <p class="sub">{sub}</p>
  </div>
</div>

<style>
  /* the ring fits both ways: the width of the widget, and its height less the header line and the margins */
  .ring { position: relative; width: min(64vw, 240px, 58vh); aspect-ratio: 1; margin: 0 auto; }
  svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .track { fill: none; stroke: var(--fill); stroke-width: 9; }
  .arc { fill: none; stroke-width: 9; transition: stroke-dasharray 0.6s ease; }
  .centre { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  /* the text follows the width of the ring, so a small ring keeps its time inside */
  .ring { container-type: inline-size; }
  .percent { margin: 0; font-size: calc(clamp(9px, 6cqw, 14px) * var(--scale)); font-weight: 600; color: var(--muted); }
  .time { margin: 2px 0; font-size: calc(clamp(10px, 15cqw, 26px) * var(--scale)); font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .sub { margin: 0; font-size: calc(clamp(9px, 6.5cqw, 13px) * var(--scale)); color: var(--muted); }
  @media (prefers-reduced-motion: reduce) { .arc { transition: none; } }
</style>
