<template>
  <SettingsPage>
    <template #title>
      {{ t('mediaPlayers') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <p class="text--secondary uno-mb-6">
          {{ t('mediaPlayersSettingsDescription') }}
        </p>

        <!-- Skip Forward Duration -->
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('skipForwardDuration') }}
        </h3>
        <VSelect
          :model-value="mediaPlayersSettings.state.value.skipForwardDuration"
          variant="outlined"
          :items="skipOptions"
          item-title="title"
          item-value="value"
          class="uno-mb-4"
          @update:model-value="mediaPlayersSettings.state.value.skipForwardDuration = $event ?? 30" />

        <!-- Skip Backward Duration -->
        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('skipBackwardDuration') }}
        </h3>
        <VSelect
          :model-value="mediaPlayersSettings.state.value.skipBackwardDuration"
          variant="outlined"
          :items="skipOptions"
          item-title="title"
          item-value="value"
          class="uno-mb-4"
          @update:model-value="mediaPlayersSettings.state.value.skipBackwardDuration = $event ?? 10" />

        <!-- Auto Play Next Episode -->
        <VSwitch
          :model-value="mediaPlayersSettings.state.value.autoPlayNextEpisode"
          :label="t('autoPlayNextEpisode')"
          class="uno-mb-4 uno-mt-4"
          @update:model-value="mediaPlayersSettings.state.value.autoPlayNextEpisode = $event ?? false" />
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { mediaPlayersSettings } from '#/store/settings/media-players.ts';

const { t } = useTranslation();

const skipOptions = computed(() => [
  { title: t('seconds', { count: 5 }), value: 5 },
  { title: t('seconds', { count: 10 }), value: 10 },
  { title: t('seconds', { count: 15 }), value: 15 },
  { title: t('seconds', { count: 30 }), value: 30 },
  { title: t('seconds', { count: 60 }), value: 60 },
  { title: t('seconds', { count: 120 }), value: 120 }
]);
</script>
