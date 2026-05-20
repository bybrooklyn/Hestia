<template>
  <VTextField
    v-model="searchQuery"
    class="search-input"
    :placeholder="$t('search')"
    density="compact"
    hide-details
    single-line
    @update:focused="focused => focused ? onFocus() : onBlur()">
    <template #prepend-inner>
      <JIcon
        class="i-mdi:magnify" />
    </template>
  </VTextField>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { defu } from 'defu';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const searchQuery = computed({
  get(): string {
    return route.query.q?.toString() ?? '';
  },
  set(value) {
    void router.replace(
      defu(
        { query: { q: value.trim() } },
        router.currentRoute.value
      )
    );
  }
});

/**
 * Push to the search page when the field is focused with an empty query.
 */
async function onFocus(): Promise<void> {
  if (!searchQuery.value) {
    await router.push({ path: '/search' });
  }
}

/**
 * Pop back to the previous route when the field loses focus with an empty query.
 */
function onBlur(): void {
  if (!searchQuery.value && globalThis.history.length) {
    router.back();
  }
}
</script>
