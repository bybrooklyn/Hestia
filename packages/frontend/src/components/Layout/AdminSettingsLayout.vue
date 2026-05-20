<template>
  <VContainer
    fluid
    class="uno-px-0 uno-py-0">
    <VRow no-gutters>
      <!-- Desktop sidebar: inline column -->
      <VCol
        v-if="!display.mobile.value"
        cols="auto"
        class="admin-sidebar">
        <VList
          nav
          density="compact">
          <template
            v-for="(section, i) in adminSections"
            :key="`admin-section-${i}`">
            <VDivider
              v-if="i > 0"
              class="uno-my-2" />
            <VListItem
              v-for="item in section"
              :key="item.name"
              :to="item.link"
              :disabled="!item.link"
              :title="item.name">
              <template #prepend>
                <JIcon
                  class="uno-min-w-8"
                  :class="item.icon" />
              </template>
            </VListItem>
          </template>
        </VList>
      </VCol>
      <VCol>
        <!-- Mobile menu trigger -->
        <div
          v-if="display.mobile.value"
          class="uno-px-4 uno-pt-2">
          <VBtn
            variant="text"
            :prepend-icon="undefined"
            @click="drawer = true">
            <JIcon class="i-mdi:menu uno-mr-2" />
            {{ $t('settings') }}
          </VBtn>
        </div>
        <SettingsPage>
          <template
            v-if="$slots.title"
            #title>
            <slot name="title" />
          </template>
          <template
            v-if="$slots.actions"
            #actions>
            <slot name="actions" />
          </template>
          <template #content>
            <slot name="content" />
          </template>
        </SettingsPage>
      </VCol>
    </VRow>
    <!-- Mobile sidebar: temporary drawer on the right (the global library
         drawer is on the left, so the right keeps them visually distinct). -->
    <VNavigationDrawer
      v-if="display.mobile.value"
      v-model="drawer"
      temporary
      location="right">
      <VList
        nav
        density="compact">
        <template
          v-for="(section, i) in adminSections"
          :key="`admin-section-mobile-${i}`">
          <VDivider
            v-if="i > 0"
            class="uno-my-2" />
          <VListItem
            v-for="item in section"
            :key="item.name"
            :to="item.link"
            :disabled="!item.link"
            :title="item.name"
            @click="drawer = false">
            <template #prepend>
              <JIcon
                class="uno-min-w-8"
                :class="item.icon" />
            </template>
          </VListItem>
        </template>
      </VList>
    </VNavigationDrawer>
  </VContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDisplay } from 'vuetify';
import { useAdminSections } from '#/composables/use-admin-sections.ts';

const display = useDisplay();
const adminSections = useAdminSections();
const drawer = ref(false);
</script>

<style scoped>
.admin-sidebar {
  width: 260px;
  min-width: 260px;
  border-right: 1px solid rgb(var(--v-border-color) / var(--v-border-opacity));
}
</style>
