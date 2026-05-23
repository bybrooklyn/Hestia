<template>
  <div
    ref="rootEl"
    tabindex="0"
    class="photo-viewer uno-relative uno-h-screen uno-w-screen uno-flex uno-flex-col uno-select-none uno-bg-black uno-text-white"
    @keydown="onKeydown"
    @click="toggleControls"
    @mousemove="showControlsTemporarily">
    <!-- Top bar -->
    <JTransition>
      <div
        v-if="showControls"
        class="photo-topbar uno-absolute uno-left-0 uno-right-0 uno-top-0 uno-z-10 uno-flex uno-items-center uno-gap-2 uno-bg-black/60 uno-p-3"
        @click.stop>
        <VBtn
          icon
          variant="text"
          @click="goBack">
          <JIcon class="i-mdi:arrow-left" />
        </VBtn>
        <div class="uno-flex-1 uno-truncate">
          <div class="uno-truncate uno-font-medium">
            {{ current?.Name }}
          </div>
          <div class="uno-text-disabled uno-truncate uno-text-xs">
            {{ position + 1 }} / {{ photos.length }}
          </div>
        </div>
        <JTooltip
          position="bottom"
          :text="slideshowOn ? t('pause') : t('startSlideshow')">
          <VBtn
            icon
            variant="text"
            @click="toggleSlideshow">
            <JIcon :class="slideshowOn ? 'i-mdi:pause' : 'i-mdi:play'" />
          </VBtn>
        </JTooltip>
        <JTooltip
          position="bottom"
          :text="t('details')">
          <VBtn
            icon
            variant="text"
            @click="showInfo = !showInfo">
            <JIcon class="i-mdi:information-outline" />
          </VBtn>
        </JTooltip>
      </div>
    </JTransition>

    <!-- Photo stage -->
    <div class="uno-flex uno-flex-1 uno-items-center uno-justify-center uno-overflow-hidden">
      <JTransition mode="out-in">
        <img
          v-if="current?.Id"
          :key="current.Id"
          :src="photoUrl(current.Id)"
          :alt="current.Name ?? ''"
          class="photo-stage-img uno-max-h-full uno-max-w-full uno-object-contain"
          @click.stop="toggleControls">
      </JTransition>
    </div>

    <!-- Prev / next nav -->
    <JTransition>
      <VBtn
        v-if="showControls && hasPrev"
        icon
        size="x-large"
        variant="text"
        class="photo-nav-btn uno-left-2"
        @click.stop="goPrev">
        <JIcon class="i-mdi:chevron-left" />
      </VBtn>
    </JTransition>
    <JTransition>
      <VBtn
        v-if="showControls && hasNext"
        icon
        size="x-large"
        variant="text"
        class="photo-nav-btn uno-right-2"
        @click.stop="goNext">
        <JIcon class="i-mdi:chevron-right" />
      </VBtn>
    </JTransition>

    <!-- EXIF / info panel -->
    <JTransition>
      <div
        v-if="showInfo && current"
        class="photo-info uno-absolute uno-bottom-0 uno-right-0 uno-top-0 uno-z-10 uno-w-80 uno-overflow-y-auto uno-bg-black/80 uno-p-4"
        @click.stop>
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('details') }}
        </h3>
        <dl class="uno-text-sm uno-space-y-1">
          <template v-if="current.PremiereDate">
            <dt class="uno-text-disabled">
              {{ t('dateTaken') }}
            </dt>
            <dd>{{ formatDate(current.PremiereDate) }}</dd>
          </template>
          <template v-if="current.Width && current.Height">
            <dt class="uno-text-disabled">
              {{ t('dimensions', { width: current.Width, height: current.Height }) }}
            </dt>
          </template>
          <template v-if="current.CameraMake || current.CameraModel">
            <dt class="uno-text-disabled">
              {{ t('camera') }}
            </dt>
            <dd>{{ [current.CameraMake, current.CameraModel].filter(Boolean).join(' ') }}</dd>
          </template>
          <template v-if="current.Overview">
            <dt class="uno-text-disabled uno-mt-3">
              {{ t('overview') }}
            </dt>
            <dd>{{ current.Overview }}</dd>
          </template>
        </dl>
      </div>
    </JTransition>
  </div>
</template>

<route lang="yaml">
meta:
  layout:
    name: fullpage
</route>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { parseJSON } from 'date-fns';
import { useTranslation } from 'i18next-vue';
import { useRoute, useRouter } from 'vue-router';
import { useBaseItem } from '#/composables/apis.ts';
import { getItemImageUrl } from '#/utils/images.ts';

const { t } = useTranslation();
const route = useRoute('/photo/[itemId]');
const router = useRouter();

const rootEl = useTemplateRef<HTMLElement>('rootEl');

/**
 * Load the current photo. If it has a parent, also load the siblings so
 * navigation works as a slideshow. Falls back to a one-item array for
 * standalone photos without a parent album.
 */
const { data: current } = await useBaseItem(getUserLibraryApi, 'getItem')(() => ({
  itemId: route.params.itemId
}));

const photos = ref<BaseItemDto[]>([]);

/**
 * Resolve the photo list for the navigator. Uses the parent PhotoAlbum's
 * children sorted by SortName so prev/next/slideshow follow album order.
 */
async function loadSiblings(): Promise<void> {
  if (!current.value.ParentId) {
    photos.value = [current.value];

    return;
  }

  const { data } = await useBaseItem(getItemsApi, 'getItems')(() => ({
    parentId: current.value.ParentId ?? '',
    includeItemTypes: ['Photo'],
    sortBy: ['SortName']
  }));

  photos.value = data.value.length > 0 ? data.value : [current.value];
}

await loadSiblings();

const position = computed(() =>
  Math.max(0, photos.value.findIndex(p => p.Id === current.value.Id))
);
const hasPrev = computed(() => position.value > 0);
const hasNext = computed(() => position.value < photos.value.length - 1);

/**
 * Build a sized image URL. Cap at 4K to stay reasonable on the wire while
 * still being sharper than the typical 1080p viewport.
 */
function photoUrl(itemId: string): string {
  return getItemImageUrl(itemId, 'Primary', {
    maxWidth: 3840,
    maxHeight: 2160,
    quality: 90
  }) ?? '';
}

/**
 * Format a server PremiereDate as a locale date string.
 */
function formatDate(iso: string): string {
  try {
    return parseJSON(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

/**
 * == Navigation ==
 */
function goPrev(): void {
  if (!hasPrev.value) {
    return;
  }

  const next = photos.value[position.value - 1];

  if (next?.Id) {
    void router.replace(`/photo/${next.Id}`);
  }
}

/**
 * Advance to the next photo, or stop the slideshow when at the end.
 */
function goNext(): void {
  if (!hasNext.value) {
    if (slideshowOn.value) {
      stopSlideshow();
    }

    return;
  }

  const next = photos.value[position.value + 1];

  if (next?.Id) {
    void router.replace(`/photo/${next.Id}`);
  }
}

/**
 * Return to the parent album, or browser history if there's no parent.
 */
function goBack(): void {
  if (current.value.ParentId) {
    void router.push(`/item/${current.value.ParentId}`);
  } else {
    router.back();
  }
}

/**
 * == Slideshow ==
 *
 * Auto-advances at a fixed 5 s cadence. Stops at the end (does not loop)
 * so the user sees they've reached the last photo.
 */
const SLIDESHOW_INTERVAL_MS = 5000;
const slideshowOn = ref(false);
let slideshowTimer: ReturnType<typeof setInterval> | undefined;

/**
 * Start auto-advancing the photos.
 */
function startSlideshow(): void {
  slideshowOn.value = true;
  slideshowTimer = setInterval(goNext, SLIDESHOW_INTERVAL_MS);
}

/**
 * Cancel the slideshow timer.
 */
function stopSlideshow(): void {
  slideshowOn.value = false;

  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = undefined;
  }
}

/**
 * Flip the slideshow on/off.
 */
function toggleSlideshow(): void {
  if (slideshowOn.value) {
    stopSlideshow();
  } else {
    startSlideshow();
  }
}

onBeforeUnmount(stopSlideshow);

/**
 * == Controls auto-hide ==
 *
 * Show on mouse move / tap; hide after 3 s of idle. Slideshow keeps them
 * hidden to reduce distraction.
 */
const showControls = ref(true);
const showInfo = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Surface the top bar / nav buttons for 3 s, then fade them out.
 */
function showControlsTemporarily(): void {
  showControls.value = true;

  if (hideTimer) {
    clearTimeout(hideTimer);
  }

  hideTimer = setTimeout(() => {
    showControls.value = false;
  }, 3000);
}

/**
 * Click on the photo body toggles control visibility (jellyfin-web parity).
 */
function toggleControls(): void {
  showControls.value = !showControls.value;
}

onMounted(() => {
  rootEl.value?.focus();
  showControlsTemporarily();
});

onBeforeUnmount(() => {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
});

/**
 * Re-fetch sibling list when the route param changes (prev/next pushes a
 * new URL). For album-internal navigation we already have the photo list,
 * but a deep link from elsewhere needs a fresh `loadSiblings()`.
 */
watch(() => route.params.itemId, async () => {
  if (!photos.value.some(p => p.Id === current.value.Id)) {
    await loadSiblings();
  }
});

/**
 * Keyboard shortcuts: arrows navigate, space toggles slideshow, Esc closes.
 */
function onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowLeft': {
      event.preventDefault();
      goPrev();
      break;
    }
    case 'ArrowRight': {
      event.preventDefault();
      goNext();
      break;
    }
    case ' ': {
      event.preventDefault();
      toggleSlideshow();
      break;
    }
    case 'Escape': {
      event.preventDefault();
      goBack();
      break;
    }
    case 'i':
    case 'I': {
      showInfo.value = !showInfo.value;
      break;
    }
    // No default
  }
}
</script>

<style scoped>
.photo-viewer:focus {
  outline: none;
}

.photo-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  background-color: rgba(0, 0, 0, 0.4);
}
</style>
