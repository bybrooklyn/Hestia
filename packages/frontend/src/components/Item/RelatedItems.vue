<template>
  <div v-if="!vertical">
    <SwiperSection
      :title="t('youMayAlsoLike')"
      :items="relatedItems" />
  </div>
  <div v-else-if="vertical && relatedItems.length">
    <h2
      class="text-h6 text-sm-h5">
      <slot>
        {{ t('youMayAlsoLike') }}
      </slot>
    </h2>
    <VList
      bg-color="transparent"
      lines="two">
      <div>
        <VListItem
          v-for="relatedItem in relatedItems"
          :key="relatedItem.Id"
          :to="getItemDetailsLink(relatedItem)"
          :title="relatedItem.Name ?? ''"
          :subtitle="relatedItem.ProductionYear ?? ''">
          <template #prepend>
            <VAvatar>
              <VAvatar color="card">
                <BlurhashImage :item="relatedItem" />
              </VAvatar>
            </VAvatar>
          </template>
        </VListItem>
      </div>
    </VList>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { useTranslation } from 'i18next-vue';
import { getItemDetailsLink } from '#/utils/items.ts';

const { relatedItems, vertical } = defineProps<{
  relatedItems: BaseItemDto[];
  vertical?: boolean;
}>();

const { t } = useTranslation();
</script>
