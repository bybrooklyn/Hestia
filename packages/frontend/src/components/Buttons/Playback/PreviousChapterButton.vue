<template>
  <JTooltip
    position="top"
    :text="t('previousChapter')">
    <VBtn
      v-bind="$attrs"
      icon
      :disabled="chapters.length === 0"
      @click="jumpToPreviousChapter">
      <JIcon
        v-bind="$attrs"
        class="i-mdi:skip-previous-circle-outline" />
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { playbackManager } from '#/store/playback-manager.ts';
import { msToTicks } from '#/utils/time.ts';

const { t } = useTranslation();

const chapters = computed(() => playbackManager.currentItem.value?.Chapters ?? []);

/**
 * Jellyfin-web / VLC convention: a short press inside the first ~2 s of the
 * current chapter jumps to the previous chapter; later in the chapter it
 * restarts the current one. The 2 s threshold lets the user double-tap
 * to skip back across chapters quickly without an extra modifier.
 */
function jumpToPreviousChapter(): void {
  const nowTicks = msToTicks(playbackManager.currentTime.value * 1000);
  const grace = msToTicks(2000);
  const target = chapters.value
    .toReversed()
    .find(ch => (ch.StartPositionTicks ?? 0) <= nowTicks - grace);

  playbackManager.currentTime.value = target
    ? (target.StartPositionTicks ?? 0) / 10_000_000
    : 0;
}
</script>
