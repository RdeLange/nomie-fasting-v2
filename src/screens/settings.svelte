<script lang="ts">
  import { t } from '../i18n/index.svelte';
  import { fasting } from '../fasting/state.svelte';
  import type { Settings } from '../fasting/fasting';

  let { back }: { back: () => void } = $props();

  const update = (patch: Partial<Settings>) => fasting.saveSettings({ ...fasting.settings, ...patch });
  const pick = async (field: 'timeTracker' | 'moodTracker') => {
    const picked = await fasting.plugin.selectTrackables('tracker', false);
    const tag = picked?.[0]?.tracker?.tag;
    if (tag) update({ [field]: tag });
  };
</script>

<section class="card">
  <p class="caption">{t('trackers')}</p>
  <div class="row"><span>{t('fastingTime')}</span><span class="muted">{fasting.settings.timeTracker ? `#${fasting.settings.timeTracker}` : t('none')}</span></div>
  <div class="actions">
    <button class="chip" onclick={() => pick('timeTracker')}>{fasting.settings.timeTracker ? t('change') : t('choose')}</button>
    {#if fasting.settings.timeTracker}<button class="chip danger" onclick={() => update({ timeTracker: null })}>{t('remove')}</button>{/if}
  </div>
  <div class="row"><span>{t('moodTracker')}</span><span class="muted">{fasting.settings.moodTracker ? `#${fasting.settings.moodTracker}` : t('none')}</span></div>
  <div class="actions">
    <button class="chip" onclick={() => pick('moodTracker')}>{fasting.settings.moodTracker ? t('change') : t('choose')}</button>
    {#if fasting.settings.moodTracker}<button class="chip danger" onclick={() => update({ moodTracker: null })}>{t('remove')}</button>{/if}
  </div>
</section>

<section class="card">
  <p class="caption">{t('timeline')}</p>
  <label class="field">
    <span class="muted">{t('logText')}</span>
    <textarea rows="3" value={fasting.settings.logEntry} oninput={(e) => update({ logEntry: e.currentTarget.value })}></textarea>
    <span class="hint">{t('logHint')}</span>
  </label>
  <div class="row">
    <span>{t('askBeforeLog')}</span>
    <button class="toggle" class:on={fasting.settings.askBeforeLog} aria-pressed={fasting.settings.askBeforeLog} aria-label={t('askBeforeLog')} onclick={() => update({ askBeforeLog: !fasting.settings.askBeforeLog })}></button>
  </div>
</section>

<button class="ghost" onclick={back}>{t('back')}</button>

<style>
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 12px 0; }
  .caption { margin: 0 0 6px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid var(--line); }
  .row:first-of-type { border-top: 0; }
  .muted { color: var(--muted); }
  .hint { font-size: calc(13px * var(--scale)); color: var(--muted); }
  .field { display: flex; flex-direction: column; gap: 4px; padding: 10px 0 4px; }
  textarea { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 0; border-radius: 12px; background: var(--card-inner, var(--fill)); color: var(--text); font: inherit; resize: vertical; }
  .actions { display: flex; gap: 8px; padding-bottom: 6px; }
  .chip { padding: 8px 12px; border: 0; border-radius: 10px; background: var(--fill); color: var(--tint-text); font: inherit; cursor: pointer; }
  .chip.danger { color: var(--danger); }
  .toggle { position: relative; width: 50px; height: 30px; border: 0; border-radius: 15px; background: var(--fill); cursor: pointer; flex-shrink: 0; }
  .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; border-radius: 50%; background: #fff; transition: transform 0.15s; }
  .toggle.on { background: var(--tint); }
  .toggle.on::after { transform: translateX(20px); }
  .danger { color: var(--danger); }
  .ghost { display: block; width: 100%; margin-top: 8px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
</style>
