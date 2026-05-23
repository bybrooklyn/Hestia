<template>
  <JMain v-if="playbackManager.queue">
    <VAppBar color="transparent">
      <AppBarButtonLayout @click="goBack">
        <template #icon>
          <JIcon class="i-mdi:arrow-left" />
        </template>
      </AppBarButtonLayout>
      <VSpacer />
      <AppBarButtonLayout
        v-for="opt in viewModes"
        :key="opt.value"
        :class="{ 'view-mode-active': viewMode === opt.value }"
        @click="viewMode = opt.value">
        <template #icon>
          <JIcon :class="opt.icon" />
        </template>
      </AppBarButtonLayout>
      <PlaybackSettingsButton />
    </VAppBar>
    <VCol class="uno-px-0">
      <JTransition mode="out-in">
        <Swiper
          v-if="viewMode === 'cover'"
          class="uno-flex uno-select-none uno-items-center uno-justify-center"
          :modules="modules"
          :slides-per-view="4"
          :autoplay="false"
          effect="coverflow"
          :coverflow-effect="coverflowEffect"
          a11y
          centered-slides
          virtual
          @swiper="(swiper) => swiperInstance = swiper"
          @slide-change="onSlideChange">
          <SwiperSlide
            v-for="(item, index) in playbackManager.queue.value"
            :key="`${item.Id}-${index}`"
            :virtual-index="`${item.Id}-${index}`"
            class="uno-flex uno-justify-center">
            <div class="album-cover presentation-height">
              <BlurhashImage :item="item" />
            </div>
          </SwiperSlide>
        </Swiper>
        <MusicVisualizer
          v-else-if="viewMode === 'visualizer'"
          class="presentation-height uno-flex uno-select-none uno-items-center uno-justify-center" />
        <LyricsView
          v-else
          class="presentation-height" />
      </JTransition>
      <VRow class="uno-mt-3 uno-items-center uno-justify-center">
        <VCol cols="6">
          <VRow class="uno-items-center uno-justify-center">
            <VCol>
              <VRow>
                <h1 class="text-h4">
                  {{ playbackManager.currentItem.value?.Name }}
                </h1>
              </VRow>
              <VRow>
                <span class="text-subtitle-1">
                  {{ artistString }}
                </span>
              </VRow>
            </VCol>
            <VCol class="uno-flex uno-justify-end">
              <LikeButton
                v-if="playbackManager.currentItem.value"
                :item="playbackManager?.currentItem.value"
                size="x-large" />
            </VCol>
          </VRow>
          <VRow class="uno-mt-3 uno-items-center uno-justify-center">
            <TimeSlider />
          </VRow>
          <VRow class="uno-items-center uno-justify-center">
            <ShuffleButton size="x-large" />
            <PreviousTrackButton size="x-large" />
            <PreviousChapterButton
              v-if="hasChapters"
              size="x-large" />
            <PlayPauseButton size="x-large" />
            <NextChapterButton
              v-if="hasChapters"
              size="x-large" />
            <NextTrackButton size="x-large" />
            <RepeatButton size="x-large" />
          </VRow>
        </VCol>
      </VRow>
    </VCol>
  </JMain>
</template>

<route lang="yaml">
meta:
  layout:
    name: fullpage
    transition:
      enter: 'slide-y-reverse'
      leave: 'slide-y'
</route>

<script setup lang="ts">
import type SwiperType from 'swiper';
import 'swiper/css';
import { A11y, EffectCoverflow, Virtual } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { computed, defineAsyncComponent, shallowRef, watchEffect, onMounted } from 'vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { router } from '#/plugins/router/index.ts';
import { playbackGuard } from '#/plugins/router/middlewares/playback.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { usePlayback } from '#/composables/use-playback.ts';
import { useItemBackdrop } from '#/composables/backdrop.ts';
import { useItemPageTitle } from '#/composables/page-title.ts';

defineOptions({
  beforeRouteEnter: playbackGuard
});

/**
 * Visualizer pulls audiomotion-analyzer (~30 KiB) only when the user toggles
 * into the visualizer view, instead of on every music playback route mount.
 */
const MusicVisualizer = defineAsyncComponent(() =>
  import('#/components/Playback/MusicVisualizer.vue')
);

/**
 * Return the user to the page they pressed play from, mirroring the
 * stop / queue-empty behaviour in `use-playback.ts`. `router.replace`
 * (rather than `push`) avoids leaving the music page in history so a
 * subsequent browser back doesn't loop right back into playback.
 */
function goBack(): void {
  void router.replace(playbackManager.sourceRoute.value ?? '/');
}

usePlayback();

const modules = [A11y, Virtual, EffectCoverflow];

const coverflowEffect = {
  depth: 500,
  slideShadows: false,
  rotate: 0,
  stretch: -400
};

type ViewMode = 'cover' | 'visualizer' | 'lyrics';

const viewModes: { value: ViewMode; icon: string }[] = [
  { value: 'cover', icon: 'i-dashicons:album' },
  { value: 'visualizer', icon: 'i-mdi:chart-bar' },
  { value: 'lyrics', icon: 'i-mdi:script-text-outline' }
];
const viewMode = shallowRef<ViewMode>('cover');
const artistString = computed(() =>
  playbackManager.currentItem.value?.Artists?.join(', ')
);

/**
 * Show chapter controls when the current item carries a chapter list — the
 * common case is audiobooks (`Type === 'AudioBook'`), but any audio item
 * with usable chapters is fair game. `TimeSlider` already renders the
 * chapter markers and handles click-to-seek for any item with chapters,
 * so this just gates the prev/next-chapter OSD buttons.
 */
const hasChapters = computed(() =>
  (playbackManager.currentItem.value?.Chapters?.length ?? 0) > 1
);

const swiperInstance = shallowRef<SwiperType>();

onMounted(() => {
  if (swiperInstance.value) {
    swiperInstance.value.update();
  }
});

useItemBackdrop(playbackManager.currentItem, 0.75);
useItemPageTitle(playbackManager.currentItem);

watchEffect(() => {
  if (swiperInstance.value && !isNil(playbackManager.currentItemIndex.value)) {
    swiperInstance.value.slideTo(playbackManager.currentItemIndex.value);
  }
}
);

/**
 * Handle slide changes
 */
function onSlideChange(): void {
  const index = swiperInstance.value?.activeIndex ?? 0;

  playbackManager.currentItemIndex.value = index;
}
</script>

<style scoped>
.album-cover {
  position: relative;
  min-width: 65vh;
  width: 65vh;
}

.presentation-height {
  height: 65vh;
}

.view-mode-active :deep(.j-icon) {
  color: rgb(var(--j-theme-color-primary));
}
</style>
