<template>
  <AdminSettingsLayout>
    <template #title>
      {{ $t('serverSettings') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsGeneral') }}
        </h3>

        <VTextField
          v-model="serverSettings.ServerName"
          :label="$t('serverName')" />

        <VSelect
          v-model="serverSettings.UICulture"
          variant="outlined"
          :label="$t('preferredLanguage')"
          :rules="SomeItemSelectedRule"
          item-title="Name"
          item-value="Value"
          :items="culturesList" />

        <VCheckbox
          :model-value="serverSettings.QuickConnectAvailable"
          :label="$t('enableQuickConnect')"
          @update:model-value="v => serverSettings!.QuickConnectAvailable = v ?? false" />

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsPaths') }}
        </h3>

        <VTextField
          v-model="serverSettings.CachePath"
          :label="$t('cachePath')" />

        <VTextField
          v-model="serverSettings.MetadataPath"
          :label="$t('metadataPath')" />

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsBranding') }}
        </h3>

        <VTextField
          v-model="brandingSettings.LoginDisclaimer"
          :label="$t('loginDisclaimer')" />

        <VCheckbox
          :model-value="brandingSettings.SplashscreenEnabled"
          :label="$t('enableSplashScreen')"
          @update:model-value="v => brandingSettings!.SplashscreenEnabled = v ?? false" />

        <VTextarea
          v-model="brandingSettings.CustomCss"
          :label="$t('customCss')"
          :hint="$t('customCssHint')"
          persistent-hint
          rows="6"
          variant="outlined"
          class="uno-font-mono" />

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsPerformance') }}
        </h3>

        <VTextField
          :model-value="serverSettings.LibraryScanFanoutConcurrency"
          :label="$t('parallelLibraryScanLimit')"
          type="number"
          @update:model-value="v => serverSettings!.LibraryScanFanoutConcurrency = Number(v) || 0" />

        <VTextField
          :model-value="serverSettings.ParallelImageEncodingLimit"
          :label="$t('parallelImageEncodingLimit')"
          type="number"
          @update:model-value="v => serverSettings!.ParallelImageEncodingLimit = Number(v) || 0" />
      </VCol>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { onScopeDispose, shallowRef, watch } from 'vue';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getBrandingApi } from '@jellyfin/sdk/lib/utils/api/branding-api';
import { SomeItemSelectedRule } from '@jellyfin-vue/shared/validation';
import { watchDeep } from '@vueuse/core';
import { useApi } from '#/composables/apis.ts';
import { taskManager } from '#/store/task-manager.ts';
import { remote } from '#/plugins/remote/index.ts';

const tasks = new Map<number, string>();
const signal = shallowRef(false);
const [
  { data: culturesList },
  { data: serverSettings },
  { data: brandingSettings }
] = await Promise.all([
  useApi(getLocalizationApi, 'getLocalizationOptions')(),
  useApi(getConfigurationApi, 'getConfiguration')(),
  useApi(getBrandingApi, 'getBrandingOptions')()
]);

const { loading: l1 } = await useApi(
  getConfigurationApi,
  () => signal.value ? 'updateConfiguration' : undefined,
  { skipCache: { request: true }, globalLoading: false }
)(() => ({
  serverConfiguration: serverSettings.value
}));
const { loading: l2 } = await useApi(
  getConfigurationApi,
  () => signal.value ? 'updateNamedConfiguration' : undefined,
  { skipCache: { request: true }, globalLoading: false }
)(() => ({
  key: 'branding',
  body: JSON.stringify(brandingSettings.value)
}));

watch([l1, l2], (newvals) => {
  for (let idx = 0; idx < newvals.length; idx++) {
    if (newvals[idx] && !tasks.has(idx)) {
      tasks.set(idx, taskManager.startConfigSync());
    } else {
      const taskId = tasks.get(idx);

      if (taskId) {
        taskManager.finishTask(taskId);
        tasks.delete(idx);
      }
    }
  }
});

watchDeep([serverSettings, brandingSettings], () => signal.value = true, { once: true });

/**
 * Keep the cached `currentServer.BrandingOptions` in sync with edits so the
 * `useServerCustomCss` composable (and any other branding consumers, e.g.
 * the login-screen disclaimer) picks up changes immediately. `currentServer`
 * caches a snapshot taken at server-registration time; it doesn't refresh
 * automatically when the form auto-saves new branding to the server.
 */
watchDeep(brandingSettings, () => {
  if (remote.auth.currentServer.value) {
    remote.auth.currentServer.value.BrandingOptions = { ...brandingSettings.value };
  }
});

onScopeDispose(() => {
  for (const [,id] of tasks) {
    taskManager.finishTask(id);
  }
});
</script>
