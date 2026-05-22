<template>
  <SettingsPage>
    <template #title>
      {{ t('display') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <p class="text--secondary uno-mb-6">
          {{ t('displaySettingsDescription') }}
        </p>

        <!-- Interface Language -->
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('language') }}
        </h3>
        <VSelect
          :model-value="clientSettings.locale.value"
          variant="outlined"
          :items="languageOptions"
          item-title="title"
          item-value="value"
          class="uno-mb-4"
          @update:model-value="clientSettings.locale.value = $event" />

        <!-- Theme Mode -->
        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('theme') }}
        </h3>
        <VSelect
          v-model="themeSelect"
          variant="outlined"
          :items="themeOptions"
          item-title="title"
          item-value="value"
          class="uno-mb-4" />

        <!-- Typography / Font -->
        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('typography') }}
        </h3>
        <VSelect
          :model-value="themeSettings.state.value.typography"
          variant="outlined"
          :items="typographyOptions"
          item-title="title"
          item-value="value"
          class="uno-mb-4"
          @update:model-value="themeSettings.state.value.typography = $event ?? 'default'" />
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { languages } from '@jellyfin-vue/i18n';
import { clientSettings } from '#/store/settings/client.ts';
import { themeSettings } from '#/store/settings/theme.ts';
import { getLocaleNativeName } from '#/utils/i18n.ts';

const { t } = useTranslation();

const languageOptions = computed(() => [
  { title: t('auto'), value: undefined },
  ...languages.map(lang => ({
    title: getLocaleNativeName(lang) ?? lang,
    value: lang
  }))
]);

const themeOptions = computed(() => [
  { title: t('auto'), value: 'auto' },
  { title: t('dark'), value: 'dark' },
  { title: t('light'), value: 'light' }
]);

const typographyOptions = computed(() => [
  { title: t('default'), value: 'default' },
  { title: t('systemFont'), value: 'system' }
]);

const themeSelect = computed<'auto' | 'dark' | 'light'>({
  get: () => {
    if (themeSettings.isAutoTheme.value) {
      return 'auto';
    }

    return themeSettings.currentThemeIsDark.value ? 'dark' : 'light';
  },
  set: (val) => {
    if (val === 'auto') {
      themeSettings.currentTheme.value = undefined;
    } else if (val === 'dark') {
      themeSettings.currentTheme.value = true;
    } else {
      themeSettings.currentTheme.value = false;
    }
  }
});
</script>
