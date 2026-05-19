<template>
  <SettingsPage>
    <template #title>
      {{ $t('experimental') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <!--
          VSwitch's model is `boolean | null` (it allows an indeterminate
          state); bind explicitly and coerce back to a plain boolean.
        -->
        <VSwitch
          :model-value="experimentalSettings.state.value.pausedOverlay"
          :label="$t('pausedInfoOverlay')"
          @update:model-value="experimentalSettings.state.value.pausedOverlay = $event ?? false" />
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { experimentalSettings } from '#/store/settings/experimental.ts';
</script>
