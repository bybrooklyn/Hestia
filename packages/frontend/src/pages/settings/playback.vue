<template>
  <SettingsPage>
    <template #title>
      {{ t('playbackSettings') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <p class="text--secondary uno-mb-6">
          {{ t('playbackSettingsDescription') }}
        </p>

        <!-- Preferred Audio Language -->
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('preferredAudioLanguage') }}
        </h3>
        <VSelect
          v-model="audioLangSelect"
          variant="outlined"
          :items="audioLanguages"
          item-title="title"
          item-value="value"
          class="uno-mb-4" />

        <VTextField
          v-if="audioLangSelect === 'custom'"
          v-model="customAudioCode"
          v-bind="codeAttrs"
          variant="outlined"
          label="Custom ISO-639-2 Audio Code (e.g. eng, spa)"
          class="uno-mb-4" />

        <!-- Preferred Subtitle Language -->
        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('preferredSubtitleLanguage') }}
        </h3>
        <VSelect
          v-model="subtitleLangSelect"
          variant="outlined"
          :items="subtitleLanguages"
          item-title="title"
          item-value="value"
          class="uno-mb-4" />

        <VTextField
          v-if="subtitleLangSelect === 'custom'"
          v-model="customSubtitleCode"
          v-bind="codeAttrs"
          variant="outlined"
          label="Custom ISO-639-2 Subtitle Code (e.g. eng, spa)"
          class="uno-mb-4" />

        <!-- Auto-Enable Forced Subtitles -->
        <VSwitch
          :model-value="playbackSettings.state.value.autoEnableForcedSubtitles"
          :label="t('autoEnableForcedSubtitles')"
          class="uno-mb-4"
          @update:model-value="(v: boolean | null) => playbackSettings.state.value.autoEnableForcedSubtitles = v ?? false" />

        <!-- Default Playback Quality -->
        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('defaultPlaybackQuality') }}
        </h3>
        <VSelect
          :model-value="playbackSettings.state.value.defaultQuality"
          variant="outlined"
          :items="qualityOptions"
          item-title="title"
          item-value="value"
          class="uno-mb-4"
          @update:model-value="playbackSettings.state.value.defaultQuality = $event ?? undefined" />

        <!-- Default Playback Speed -->
        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('defaultPlaybackSpeed') }}
        </h3>
        <VSelect
          :model-value="playbackSettings.state.value.defaultSpeed"
          variant="outlined"
          :items="speedOptions"
          item-title="title"
          item-value="value"
          class="uno-mb-4"
          @update:model-value="playbackSettings.state.value.defaultSpeed = $event ?? 1.0" />
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { playbackSettings } from '#/store/settings/playback.ts';

const { t } = useTranslation();

const codeAttrs = { maxlength: '3' } as Record<string, string>;

const audioLanguages = computed(() => [
  { title: t('any'), value: 'any' },
  { title: 'English', value: 'eng' },
  { title: 'Spanish (Español)', value: 'spa' },
  { title: 'French (Français)', value: 'fra' },
  { title: 'German (Deutsch)', value: 'deu' },
  { title: 'Italian (Italiano)', value: 'ita' },
  { title: 'Portuguese (Português)', value: 'por' },
  { title: 'Japanese (日本語)', value: 'jpn' },
  { title: 'Chinese (中文)', value: 'zho' },
  { title: 'Russian (Русский)', value: 'rus' },
  { title: 'Custom ISO-639 Code...', value: 'custom' }
]);

const subtitleLanguages = computed(() => [
  { title: t('any'), value: 'any' },
  { title: t('disabled'), value: 'none' },
  { title: 'English', value: 'eng' },
  { title: 'Spanish (Español)', value: 'spa' },
  { title: 'French (Français)', value: 'fra' },
  { title: 'German (Deutsch)', value: 'deu' },
  { title: 'Italian (Italiano)', value: 'ita' },
  { title: 'Portuguese (Português)', value: 'por' },
  { title: 'Japanese (日本語)', value: 'jpn' },
  { title: 'Chinese (中文)', value: 'zho' },
  { title: 'Russian (Русский)', value: 'rus' },
  { title: 'Custom ISO-639 Code...', value: 'custom' }
]);

const qualityOptions = computed(() => [
  { title: 'Auto (Source Quality)', value: undefined },
  { title: '120 Mbps', value: 120_000_000 },
  { title: '80 Mbps', value: 80_000_000 },
  { title: '60 Mbps', value: 60_000_000 },
  { title: '40 Mbps', value: 40_000_000 },
  { title: '20 Mbps', value: 20_000_000 },
  { title: '15 Mbps', value: 15_000_000 },
  { title: '10 Mbps', value: 10_000_000 },
  { title: '5 Mbps', value: 5_000_000 },
  { title: '3 Mbps', value: 3_000_000 },
  { title: '1.5 Mbps', value: 1_500_000 },
  { title: '640 Kbps', value: 640_000 }
]);

const speedOptions = computed(() => [
  { title: '0.5x', value: 0.5 },
  { title: '0.75x', value: 0.75 },
  { title: '1.0x (Normal)', value: 1 },
  { title: '1.25x', value: 1.25 },
  { title: '1.5x', value: 1.5 },
  { title: '1.75x', value: 1.75 },
  { title: '2.0x', value: 2 }
]);

const audioLangSelect = computed({
  get: () => {
    const val = playbackSettings.state.value.preferredAudioLanguage;

    if (['any', 'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'jpn', 'zho', 'rus'].includes(val)) {
      return val;
    }

    return 'custom';
  },
  set: (newVal) => {
    playbackSettings.state.value.preferredAudioLanguage = newVal === 'custom' ? 'eng' : newVal;
  }
});

const customAudioCode = computed({
  get: () => {
    const val = playbackSettings.state.value.preferredAudioLanguage;

    if (['any', 'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'jpn', 'zho', 'rus'].includes(val)) {
      return '';
    }

    return val;
  },
  set: (newVal) => {
    playbackSettings.state.value.preferredAudioLanguage = newVal.toLowerCase().replaceAll(/[^a-z]/g, '').slice(0, 3);
  }
});

const subtitleLangSelect = computed({
  get: () => {
    const val = playbackSettings.state.value.preferredSubtitleLanguage;

    if (['any', 'none', 'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'jpn', 'zho', 'rus'].includes(val)) {
      return val;
    }

    return 'custom';
  },
  set: (newVal) => {
    playbackSettings.state.value.preferredSubtitleLanguage = newVal === 'custom' ? 'eng' : newVal;
  }
});

const customSubtitleCode = computed({
  get: () => {
    const val = playbackSettings.state.value.preferredSubtitleLanguage;

    if (['any', 'none', 'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'jpn', 'zho', 'rus'].includes(val)) {
      return '';
    }

    return val;
  },
  set: (newVal) => {
    playbackSettings.state.value.preferredSubtitleLanguage = newVal.toLowerCase().replaceAll(/[^a-z]/g, '').slice(0, 3);
  }
});
</script>
