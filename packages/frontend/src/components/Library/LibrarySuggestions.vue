<template>
  <div>
    <VRow v-if="resumeItems.length > 0">
      <SwiperSection
        :title="$t('continueWatching')"
        :items="resumeItems" />
    </VRow>
    <VRow v-if="nextUpItems.length > 0">
      <SwiperSection
        :title="$t('nextUp')"
        :items="nextUpItems" />
    </VRow>
    <VRow v-if="latestItems.length > 0">
      <SwiperSection
        :title="$t('latestMedia')"
        :items="latestItems" />
    </VRow>
    <VRow
      v-if="resumeItems.length === 0 && nextUpItems.length === 0 && latestItems.length === 0"
      justify="center">
      <div class="text-center uno-py-8">
        <h2 class="text-h5">
          {{ $t('libraryEmpty') }}
        </h2>
      </div>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { computed } from 'vue';
import { useBaseItem } from '#/composables/apis.ts';

const { library } = defineProps<{
  library: BaseItemDto;
}>();

const collectionType = computed(() => library.CollectionType ?? '');
const isTv = computed(() => collectionType.value === 'tvshows');
const supportsResume = computed(() =>
  ['movies', 'tvshows', 'music'].includes(collectionType.value)
);

/**
 * Resume row: limited to the current library via `parentId` so the
 * suggestions tab stays scoped to this library (the global home page
 * already shows server-wide resume items).
 */
const { data: resumeItems } = supportsResume.value
  ? await useBaseItem(getItemsApi, 'getResumeItems')(() => ({
      parentId: library.Id,
      limit: 16
    }))
  : { data: computed<BaseItemDto[]>(() => []) };

const { data: nextUpItems } = isTv.value
  ? await useBaseItem(getTvShowsApi, 'getNextUp')(() => ({
      parentId: library.Id,
      limit: 16
    }))
  : { data: computed<BaseItemDto[]>(() => []) };

const { data: latestItems } = await useBaseItem(getUserLibraryApi, 'getLatestMedia')(() => ({
  parentId: library.Id,
  limit: 16
}));
</script>
