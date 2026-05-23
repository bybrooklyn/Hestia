<template>
  <div v-if="items && items.length > 0">
    <VTabs
      v-model="currentTab"
      class="mb-3"
      bg-color="transparent">
      <VTab
        v-for="(baseItems, type) in children"
        :key="type"
        :value="type">
        {{ type }} ({{ baseItems?.length ?? '' }})
      </VTab>
    </VTabs>
    <VWindow
      v-model="currentTab"
      class="bg-transparent">
      <VWindowItem
        v-for="(baseItems, type) in children"
        :key="type"
        :value="type">
        <VContainer>
          <!-- <SkeletonItemGrid
            v-if="loading"
            :view-type="item.Type" /> -->
          <ItemGrid
            :items="baseItems ?? []" />
        </VContainer>
      </VWindowItem>
    </VWindow>
  </div>
  <div
    v-else
    class="uno-py-12 uno-text-center">
    <div class="uno-mb-4 uno-flex uno-justify-center">
      <div class="uno-border uno-border-slate-700/50 uno-rounded-full uno-bg-slate-800/50 uno-p-4 uno-text-slate-400">
        <div class="i-mdi:folder-open-outline uno-text-4xl" />
      </div>
    </div>
    <h1 class="text-h5 uno-text-slate-400">
      {{ $t('collectionEmpty') }}
    </h1>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { computed, shallowRef } from 'vue';

const { items } = defineProps<{
  items: BaseItemDto[];
}>();

const currentTab = shallowRef(0);
const children = computed(() => Object.groupBy(items, ({ Type }) => Type!));
</script>
