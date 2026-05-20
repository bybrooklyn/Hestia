<template>
  <VContainer :fluid="fluid">
    <VRow v-if="$slots.title">
      <VCol>
        <VRow class="mb-2 mt-4 mx-0 justify-space-between">
          <h2 class="text-h4">
            <slot name="title" />
          </h2>
          <div>
            <slot name="actions" />
          </div>
        </VRow>
      </VCol>
    </VRow>
    <VRow>
      <slot name="content" />
    </VRow>
  </VContainer>
</template>

<script setup lang="ts">
import { useSlots, computed } from 'vue';
import { isStr } from '@jellyfin-vue/shared/validation';
import { usePageTitle } from '#/composables/page-title.ts';

/**
 * When `fluid` is true the underlying `VContainer` drops its centred
 * max-width and spans the full available width. Defaults to `false` so
 * the existing personal-settings pages remain centred; `AdminSettingsLayout`
 * passes `:fluid="true"` so admin pages span the full width to the right
 * of the persistent sidebar.
 */
const { fluid } = defineProps<{
  fluid?: boolean;
}>();

const slots = useSlots();
const pageTitle = computed(() => {
  const slot = slots.title?.({})[0]?.children;

  return isStr(slot) ? slot : undefined;
});

usePageTitle(pageTitle);
</script>
