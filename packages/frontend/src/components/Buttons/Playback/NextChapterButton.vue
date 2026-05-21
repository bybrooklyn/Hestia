<template>
  <JTooltip
    position="top"
    :text="t('nextChapter')">
    <VBtn
      v-bind="$attrs"
      icon
      :disabled="!hasNext"
      @click="jumpToNextChapter">
      <JIcon
        v-bind="$attrs"
        class="i-mdi:skip-next-circle-outline" />
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

const nextChapter = computed(() => {
  const nowTicks = msToTicks(playbackManager.currentTime.value * 1000);

  return chapters.value.find(ch => (ch.StartPositionTicks ?? 0) > nowTicks);
});

const hasNext = computed(() => !!nextChapter.value);

/**
 * Seek to the next chapter's StartPositionTicks. No-op when we're already
 * inside (or past) the last chapter.
 */
function jumpToNextChapter(): void {
  if (nextChapter.value) {
    playbackManager.currentTime.value = (nextChapter.value.StartPositionTicks ?? 0) / 10_000_000;
  }
}
</script>
