<template>
  <div
    ref="container"
    class="lyrics-view uno-flex uno-flex-col uno-items-center uno-overflow-y-auto"
    role="list"
    :aria-label="$t('lyrics')">
    <template v-if="lines.length > 0">
      <div
        v-for="(line, index) in lines"
        :key="index"
        :ref="el => setLineRef(el, index)"
        role="listitem"
        :data-active="String(index === activeIndex)"
        class="lyrics-line uno-w-full uno-px-4 uno-py-2 uno-text-center"
        @click="seekTo(line)">
        {{ line.text }}
      </div>
    </template>
    <div
      v-else
      class="uno-text-disabled uno-flex uno-flex-1 uno-items-center uno-justify-center">
      {{ loading ? $t('loading') : $t('noLyricsFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { type ComponentPublicInstance, computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { getLyricsApi } from '@jellyfin/sdk/lib/utils/api/lyrics-api';
import { isNil } from '@jellyfin-vue/shared/validation';
import { remote } from '#/plugins/remote/index.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { msToTicks, ticksToMs } from '#/utils/time.ts';

interface ParsedLine {
  text: string;
  /** Start time in ticks (10⁻⁷ s). `undefined` for unsynced lines. */
  start: number | undefined;
}

const container = useTemplateRef<HTMLElement>('container');
const lineEls = shallowRef<(HTMLElement | undefined)[]>([]);
const lines = ref<ParsedLine[]>([]);
const loading = ref(false);

/**
 * Index of the line whose `start` is the latest one before the current playback
 * time. Returns -1 when nothing is highlightable (no lines, all unsynced, or
 * playback hasn't reached the first line).
 */
const activeIndex = computed(() => {
  if (lines.value.length === 0) {
    return -1;
  }

  const currentTicks = msToTicks(playbackManager.currentTime.value * 1000);
  let last = -1;

  for (const [i, line] of lines.value.entries()) {
    if (!isNil(line.start) && line.start <= currentTicks) {
      last = i;
    } else if (!isNil(line.start)) {
      break;
    }
  }

  return last;
});

/**
 * Track per-line DOM refs so the active line can be scrolled into view.
 * Vue's `:ref` binding hands us either an element or a component instance.
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
function setLineRef(el: Element | ComponentPublicInstance | null, index: number): void {
  lineEls.value[index] = (el as HTMLElement | null) ?? undefined;
}

/**
 * Seek the player to a clicked line's start time. No-op for unsynced lines.
 */
function seekTo(line: ParsedLine): void {
  if (!isNil(line.start)) {
    playbackManager.currentTime.value = ticksToMs(line.start) / 1000;
  }
}

/**
 * Fetch the current item's lyrics, normalising the response into a flat list
 * (`Cues` are folded into their parent `Text`).
 */
async function fetchLyrics(itemId: string | undefined): Promise<void> {
  lines.value = [];
  lineEls.value = [];

  if (!itemId || playbackManager.currentItem.value?.HasLyrics !== true) {
    return;
  }

  loading.value = true;

  try {
    const { data } = await remote.sdk.newUserApi(getLyricsApi).getLyrics({ itemId });

    lines.value = (data.Lyrics ?? []).map(l => ({
      text: l.Text ?? '',
      start: l.Start ?? undefined
    }));
  } catch {
    lines.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => playbackManager.currentItemId.value,
  id => void fetchLyrics(id),
  { immediate: true }
);

watch(activeIndex, async (index) => {
  if (index < 0 || !container.value) {
    return;
  }

  await nextTick();

  const el = lineEls.value[index];

  if (el) {
    const target = el.offsetTop - container.value.clientHeight / 2 + el.clientHeight / 2;

    container.value.scrollTo({ top: target, behavior: 'smooth' });
  }
});
</script>

<style scoped>
.lyrics-view {
  height: 65vh;
  width: min(80vw, 700px);
  scroll-behavior: smooth;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
}

.lyrics-line {
  font-size: 1.4rem;
  line-height: 1.6;
  color: rgb(255 255 255 / 0.45);
  transition: color 0.2s ease, transform 0.2s ease, font-weight 0.2s ease;
  cursor: pointer;
}

.lyrics-line[data-active='true'] {
  color: rgb(255 255 255 / 1);
  font-weight: 600;
  transform: scale(1.05);
}
</style>
