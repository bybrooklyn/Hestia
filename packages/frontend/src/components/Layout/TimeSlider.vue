<template>
  <div class="time-slider-wrapper uno-relative">
    <VSlider
      v-model="sliderValue"
      hide-details
      :max="runtime"
      thumb-label
      validate-on="input"
      @start="clicked = true"
      @end="onRelease">
      <template #prepend>
        {{ formatTime(playbackManager.currentTime.value) }}
      </template>
      <template #thumb-label>
        {{ formatTime(sliderValue) }}
      </template>
      <template #append>
        {{ formatTime(runtime) }}
      </template>
    </VSlider>
    <div
      v-if="chapters.length > 0"
      class="chapter-markers">
      <JTooltip
        v-for="chapter in chapters"
        :key="chapter.position"
        :text="chapter.name"
        position="top">
        <div
          class="chapter-marker"
          :style="{ left: `${chapter.position}%` }" />
      </JTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { playbackManager } from '#/store/playback-manager.ts';
import { formatTime, ticksToMs } from '#/utils/time.ts';

const currentInput = ref(0);
const clicked = ref(false);
const runtime = computed(() => playbackManager.currentItemRuntime.value / 1000);
const sliderValue = computed({
  get() {
    return clicked.value ? currentInput.value : playbackManager.currentTime.value;
  },
  set(newValue) {
    currentInput.value = newValue;
  }
});

const chapters = computed(() => {
  const items = playbackManager.currentItem.value?.Chapters;
  const totalMs = playbackManager.currentItemRuntime.value;

  if (!items || items.length <= 1 || totalMs <= 0) {
    return [];
  }

  return items
    .filter(ch => ch.StartPositionTicks !== undefined && ch.StartPositionTicks > 0)
    .map(ch => ({
      name: ch.Name ?? '',
      position: (ticksToMs(ch.StartPositionTicks) / totalMs) * 100
    }));
});

/**
 * Once the user releases the slider, change the time of the playbackManager with whatever
 * input value was provided by the user
 */
function onRelease(): void {
  playbackManager.currentTime.value = currentInput.value;
  clicked.value = false;
}
</script>

<style scoped>
.time-slider-wrapper {
  position: relative;
}

.chapter-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.chapter-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 3px;
  height: 14px;
  border-radius: 1.5px;
  background: rgb(255 255 255 / 0.65);
  pointer-events: auto;
  cursor: pointer;
  transition: background 0.15s ease, height 0.15s ease;
}

.chapter-marker:hover {
  background: rgb(var(--j-theme-color-primary));
  height: 18px;
}
</style>
