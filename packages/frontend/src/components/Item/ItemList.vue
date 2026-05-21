<template>
  <div v-if="items.length">
    <VList
      bg-color="transparent"
      lines="two">
      <VListItem
        v-for="item in items"
        :key="item.Id"
        :to="getItemDetailsLink(item)"
        :title="item.Name ?? ''"
        :subtitle="subtitle(item)">
        <template #prepend>
          <VAvatar
            size="64"
            rounded="0">
            <BlurhashImage :item="item" />
          </VAvatar>
        </template>
        <template #append>
          <ItemMenu :item="item" />
        </template>
      </VListItem>
    </VList>
  </div>
  <VRow
    v-else
    justify="center">
    <div class="text-center uno-py-8">
      <slot>
        <h1 class="text-h5">
          {{ $t('noResultsFound') }}
        </h1>
      </slot>
    </div>
  </VRow>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemDetailsLink } from '#/utils/items.ts';

const { items } = defineProps<{
  items: BaseItemDto[];
}>();

/**
 * Compact subtitle for the list view — joins production year and
 * runtime where present so the row carries enough information to
 * disambiguate items without the visual real estate of the grid view.
 */
function subtitle(item: BaseItemDto): string {
  const parts: string[] = [];

  if (item.ProductionYear) {
    parts.push(String(item.ProductionYear));
  }

  if (item.Type === 'MusicAlbum' && item.AlbumArtist) {
    parts.push(item.AlbumArtist);
  } else if (item.Type === 'Audio' && item.Artists?.length) {
    parts.push(item.Artists.join(', '));
  } else if (item.Type === 'Episode' && item.SeriesName) {
    parts.push(item.SeriesName);
  }

  return parts.join(' • ');
}
</script>
