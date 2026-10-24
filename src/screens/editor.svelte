<script lang="ts">
  import { fasting } from '../fasting/state.svelte';
  import { MAX_HOURS, MIN_HOURS, type Plan } from '../fasting/fasting';

  let { plan, isNew, done }: { plan: Plan | null; isNew: boolean; done: () => void } = $props();

  const COLOURS = ['#C47ADA', '#90BAEE', '#75BAFA', '#FBE66E', '#F5B969', '#55b7a4', '#FF6961', '#3366ff'];
  // svelte-ignore state_referenced_locally
  let draft = $state<Plan>(plan ? { ...plan } : { id: `p${Date.now().toString(36)}`, name: '', description: '', hours: 16, color: COLOURS[0] });
  let problem = $state<string | null>(null);

  const save = () => {
    problem = fasting.savePlan(draft);
    if (!problem) done();
  };
  const remove = async () => {
    if (await fasting.deletePlan(draft.id)) done();
  };
</script>

<h2>{isNew ? 'New plan' : 'Edit plan'}</h2>

<section class="card">
  <label class="field"><span class="muted">Name</span><input class="input" bind:value={draft.name} placeholder="My fast" /></label>
  <label class="field"><span class="muted">Description</span><textarea class="input" rows="2" bind:value={draft.description}></textarea></label>
  <div class="stepper">
    <span>Hours</span>
    <div class="controls">
      <button aria-label="Fewer hours" disabled={draft.hours <= MIN_HOURS} onclick={() => (draft.hours = Math.max(MIN_HOURS, draft.hours - 1))}>−</button>
      <span class="count">{draft.hours}</span>
      <button aria-label="More hours" disabled={draft.hours >= MAX_HOURS} onclick={() => (draft.hours = Math.min(MAX_HOURS, draft.hours + 1))}>+</button>
    </div>
  </div>
</section>

<h2>Colour</h2>
<section class="card swatches">
  {#each COLOURS as c (c)}
    <button class="swatch" class:picked={draft.color === c} style="background: {c}" aria-label="Use this colour" onclick={() => (draft.color = c)}></button>
  {/each}
</section>

{#if problem}<p class="problem">{problem}</p>{/if}
<button class="primary" onclick={save}>Save</button>
<div class="row-buttons">
  {#if !isNew}<button class="ghost danger" onclick={remove}>Delete</button>{/if}
  <button class="ghost" onclick={done}>Cancel</button>
</div>

<style>
  h2 { margin: 14px 0 6px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .card { padding: 12px 16px; border-radius: 16px; background: var(--card); }
  .field { display: flex; flex-direction: column; gap: 4px; padding: 6px 0; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
  .input { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 0; border-radius: 12px; background: var(--card-inner, var(--fill)); color: var(--text); font: inherit; }
  .stepper { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }
  .controls { display: flex; align-items: center; gap: 14px; }
  .controls button { width: 38px; height: 38px; border: 0; border-radius: 50%; background: var(--fill); color: var(--text); font-size: calc(18px * var(--scale)); cursor: pointer; }
  .controls button:disabled { opacity: 0.35; }
  .count { min-width: 36px; text-align: center; font-size: calc(20px * var(--scale)); font-weight: 700; }
  .swatches { display: flex; flex-wrap: wrap; gap: 10px; }
  .swatch { width: 30px; height: 30px; border: 0; border-radius: 50%; cursor: pointer; }
  .swatch.picked { outline: 2px solid var(--text); outline-offset: 2px; }
  .problem { color: var(--danger); font-weight: 600; }
  .primary { display: block; width: 100%; margin-top: 14px; padding: 14px; border: 0; border-radius: 14px; background: var(--tint); color: var(--on-tint); font: inherit; font-weight: 600; cursor: pointer; }
  .row-buttons { display: flex; gap: 8px; margin-top: 8px; }
  .ghost { flex: 1; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
  .danger { color: var(--danger); }
</style>
