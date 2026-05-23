<template>
  <div>
    <VTextField
      v-model="serverName"
      :loading="loading"
      variant="outlined"
      :label="t('serverName')"
      :rules="RequiredRule"
      :disabled="loading" />
    <VSelect
      v-model="uiCulture"
      :loading="loading"
      variant="outlined"
      :label="t('preferredLanguage')"
      :rules="SomeItemSelectedRule"
      item-title="Name"
      item-value="Value"
      :items="culturesList"
      :disabled="loading" />
    <VBtn
      color="primary"
      variant="elevated"
      :loading="loading"
      :disabled="loading || !serverName.trim()"
      @click="setLanguage">
      {{ t('next') }}
    </VBtn>
  </div>
</template>

<script setup lang="ts">
import type {
  LocalizationOption,
  StartupConfigurationDto
} from '@jellyfin/sdk/lib/generated-client';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { onMounted, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { SomeItemSelectedRule } from '@jellyfin-vue/shared/validation';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const emit = defineEmits<{
  'step-complete': [];
}>();

const { t, i18next } = useTranslation();

const serverName = ref('');
const uiCulture = ref('en-US');
const culturesList = ref<LocalizationOption[]>([]);
const initialConfig = ref<StartupConfigurationDto>();
const loading = ref(false);
const RequiredRule = [
  (v: string): boolean | string => !!v.trim() || t('required')
];

/**
 * Load the intiial server information
 */
onMounted(async () => {
  loading.value = true;

  const api = remote.sdk.oneTimeSetup(
    remote.auth.currentServer.value?.PublicAddress ?? ''
  );

  try {
    const [
      { data: config },
      { data: systemInfo },
      { data: localizationOptions }
    ] = await Promise.all([
      getStartupApi(api).getStartupConfiguration(),
      getSystemApi(api).getPublicSystemInfo(),
      getLocalizationApi(api).getLocalizationOptions()
    ]);

    initialConfig.value = config;
    serverName.value = config.ServerName ?? systemInfo.ServerName ?? '';
    uiCulture.value = initialConfig.value.UICulture ?? 'en-US';
    culturesList.value = localizationOptions;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
});

/**
 * Set the language locale of the server
 */
async function setLanguage(): Promise<void> {
  loading.value = true;

  const api = remote.sdk.oneTimeSetup(
    remote.auth.currentServer.value?.PublicAddress ?? ''
  );

  try {
    await i18next.changeLanguage(uiCulture.value);
    await getStartupApi(api).updateInitialConfiguration({
      startupConfigurationDto: {
        ...initialConfig.value,
        ServerName: serverName.value.trim(),
        UICulture: uiCulture.value
      }
    });

    emit('step-complete');
  } catch (error) {
    console.error(error);
    useSnackbar(t('setLanguageError'), 'error');
  }

  loading.value = false;
}
</script>
