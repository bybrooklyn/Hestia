<template>
  <div>
    <VAppBar
      flat
      density="compact"
      :class="useResponsiveClasses('second-toolbar')">
      <span class="text-h6 hidden-sm-and-down">
        {{ studio.Name }}
      </span>
      <VSpacer />
      <PlayButton :item="studio" />
      <VBtn
        class="play-button uno-mr-2"
        min-width="8em"
        variant="outlined"
        :to="`./${studio.Id}/shuffle`">
        {{ $t('shuffleAll') }}
      </VBtn>
    </VAppBar>
    <VContainer class="after-second-toolbar">
      <ItemGrid
        v-if="items.length"
        :items="items" />
      <VRow
        v-else
        justify="center">
        <div class="empty-message uno-text-center">
          <h1 class="text-h5">
            {{ $t('libraryEmpty') }}
          </h1>
        </div>
      </VRow>
    </VContainer>
  </div>
</template>

<script setup lang="ts">
import {
  SortOrder,
  type BaseItemKind
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { isStr } from '@jellyfin-vue/shared/validation';
import { useResponsiveClasses } from '#/composables/use-responsive-classes.ts';
import { useBaseItem } from '#/composables/apis.ts';
import { useItemPageTitle } from '#/composables/page-title.ts';

const route = useRoute('/studio/[itemId]');

const { itemId } = route.params;

const includeItemTypes = computed<BaseItemKind[]>(() => {
  const typesQuery = (route.query.type ?? []) as BaseItemKind[];

  return isStr(typesQuery)
    ? [typesQuery] as BaseItemKind[]
    : typesQuery;
});

const [{ data: studio }, { data: items }] = await Promise.all([
  useBaseItem(getUserLibraryApi, 'getItem')(() => ({
    itemId
  })),
  useBaseItem(getItemsApi, 'getItems')(() => ({
    studioIds: [itemId],
    includeItemTypes: includeItemTypes.value,
    recursive: true,
    sortBy: ['SortName'],
    sortOrder: [SortOrder.Ascending]
  }))
]);

useItemPageTitle(studio);
</script>

<style scoped>
.second-toolbar {
  top: 56px;
}

.second-toolbar.md-and-up {
  top: 64px;
}

.second-toolbar.lg-and-up {
  left: 256px !important;
}

.after-second-toolbar {
  padding-top: 60px;
}

.empty-message {
  padding-top: 4rem;
}
</style>
