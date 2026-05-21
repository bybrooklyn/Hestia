<template>
  <SettingsPage>
    <template #title>
      {{ $t('homeScreen') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <p class="text--secondary uno-mb-4">
          {{ $t('homeScreenSettingsDescription') }}
        </p>
        <!--
          VSwitch's model is `boolean | null` (Vuetify uses null for an
          indeterminate state); coerce the emitted value back to a plain
          boolean before writing to the store.
        -->
        <VSwitch
          :model-value="homeSettings.state.value.showLibraries"
          :label="$t('showLibrariesRow')"
          :hint="$t('showLibrariesRowHint')"
          persistent-hint
          @update:model-value="homeSettings.state.value.showLibraries = $event ?? false" />
        <VSwitch
          :model-value="homeSettings.state.value.showContinueWatching"
          :label="$t('showContinueWatching')"
          @update:model-value="homeSettings.state.value.showContinueWatching = $event ?? false" />
        <VSwitch
          :model-value="homeSettings.state.value.showNextUp"
          :label="$t('showNextUp')"
          @update:model-value="homeSettings.state.value.showNextUp = $event ?? false" />
        <VSwitch
          :model-value="homeSettings.state.value.showLatestMedia"
          :label="$t('showLatestMedia')"
          @update:model-value="homeSettings.state.value.showLatestMedia = $event ?? false" />
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { homeSettings } from '#/store/settings/home.ts';
</script>
