<template>
  <SettingsPage>
    <template #title>
      {{ $t('subtitles') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <VSwitch
          :model-value="subtitleSettings.state.value.enabled"
          :label="$t('enableSubtitles')"
          @update:model-value="v => subtitleSettings.state.value.enabled = v ?? false" />
        <FontSelector
          :model-value="subtitleSettings.state.value.fontFamily"
          :label="$t('subtitleFont')"
          :disabled="!subtitleSettings.state.value.enabled"
          @update:model-value="v => { if (typeof v === 'string') { subtitleSettings.state.value.fontFamily = v; } }" />

        <VSlider
          v-model="subtitleSettings.state.value.fontSize"
          :label="$t('fontSize')"
          :min="1"
          :max="4.5"
          :step="0.1"
          :disabled="!subtitleSettings.state.value.enabled" />

        <VSlider
          v-model="subtitleSettings.state.value.positionFromBottom"
          :label="$t('positionFromBottom')"
          :min="0"
          :max="30"
          :step="1"
          :disabled="!subtitleSettings.state.value.enabled" />

        <VCheckbox
          :model-value="subtitleSettings.state.value.backdrop"
          :label="$t('backdrop')"
          :disabled="!subtitleSettings.state.value.enabled"
          @update:model-value="v => subtitleSettings.state.value.backdrop = v ?? false" />

        <VCheckbox
          :model-value="subtitleSettings.state.value.stroke"
          :label="$t('stroke')"
          :disabled="!subtitleSettings.state.value.enabled"
          @update:model-value="v => subtitleSettings.state.value.stroke = v ?? false" />

        <SubtitleTrack
          v-if="subtitleSettings.state.value.enabled"
          preview />
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { subtitleSettings } from '#/store/settings/subtitle.ts';
</script>
