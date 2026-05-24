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

        <VCard
          variant="outlined"
          class="uno-mb-6">
          <VCardText>
            <VImg
              v-if="brandingSettings.SplashscreenEnabled"
              :src="splashscreenUrl"
              :aspect-ratio="16 / 9"
              cover
              class="uno-bg-surface-variant uno-mb-4">
              <template #error>
                <div class="uno-text-disabled uno-h-full uno-flex uno-items-center uno-justify-center">
                  {{ $t('noCustomSplashscreen') }}
                </div>
              </template>
            </VImg>
            <VAlert
              v-else
              type="info"
              variant="tonal"
              class="uno-mb-4">
              {{ $t('splashscreenDisabledHint') }}
            </VAlert>

            <JFileUpload
              ref="splashscreenUploadRef"
              v-model="selectedSplashscreen"
              type="dropzone"
              accept="image/*"
              :disabled="!brandingSettings.SplashscreenEnabled" />

            <div class="uno-mt-4 uno-flex uno-flex-wrap uno-gap-2">
              <VBtn
                color="primary"
                :disabled="!brandingSettings.SplashscreenEnabled || !selectedSplashscreen"
                :loading="uploadingSplashscreen"
                @click="uploadSplashscreen">
                <JIcon class="i-mdi:upload uno-mr-2" />
                {{ $t('uploadCustomImage') }}
              </VBtn>
              <VBtn
                color="error"
                variant="outlined"
                :disabled="!brandingSettings.SplashscreenEnabled"
                :loading="deletingSplashscreen"
                @click="deleteSplashscreen">
                <JIcon class="i-mdi:delete-outline uno-mr-2" />
                {{ $t('deleteCustomImage') }}
              </VBtn>
            </div>
          </VCardText>
        </VCard>

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
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getBrandingApi } from '@jellyfin/sdk/lib/utils/api/branding-api';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import type { ImageApiUploadCustomSplashscreenRequest } from '@jellyfin/sdk/lib/generated-client/api/image-api';
import type { AxiosRequestConfig } from 'axios';
import { SomeItemSelectedRule } from '@jellyfin-vue/shared/validation';
import { watchDeep } from '@vueuse/core';
import { useTranslation } from 'i18next-vue';
import { useApi } from '#/composables/apis.ts';
import { taskManager } from '#/store/task-manager.ts';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { useConfirmDialog } from '#/composables/use-confirm-dialog.ts';

interface JFileUploadExpose {
  readSelectedFileAsBase64: () => Promise<string | undefined>;
}

const { t } = useTranslation();
const tasks = new Map<number, string>();
const signal = shallowRef(false);
const selectedSplashscreen = ref<File | undefined>();
const splashscreenUploadRef = ref<JFileUploadExpose>();
const uploadingSplashscreen = shallowRef(false);
const deletingSplashscreen = shallowRef(false);
const splashscreenRevision = shallowRef(Date.now());
const splashscreenUrl = computed(() =>
  remote.sdk.newUserApi(getImageApi).getSplashscreenImageUrl({
    tag: String(splashscreenRevision.value)
  })
);
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

/**
 * Upload the selected splashscreen image through the SDK image endpoint.
 */
async function uploadSplashscreen(): Promise<void> {
  if (!selectedSplashscreen.value) {
    useSnackbar(t('failedToReadImage'), 'error');

    return;
  }

  const body = await splashscreenUploadRef.value?.readSelectedFileAsBase64();

  if (!body) {
    useSnackbar(t('failedToReadImage'), 'error');

    return;
  }

  const payload: ImageApiUploadCustomSplashscreenRequest = {
    body: body as unknown as File
  };
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': selectedSplashscreen.value.type
    }
  };

  uploadingSplashscreen.value = true;

  try {
    await remote.sdk.newUserApi(getImageApi).uploadCustomSplashscreen(payload, config);
    selectedSplashscreen.value = undefined;
    splashscreenRevision.value = Date.now();
    useSnackbar(t('imageUploadedSuccessfully'), 'success');
  } catch {
    useSnackbar(t('imageUploadFailed'), 'error');
  } finally {
    uploadingSplashscreen.value = false;
  }
}

/**
 * Delete the active custom splashscreen image after confirmation.
 */
async function deleteSplashscreen(): Promise<void> {
  await useConfirmDialog(async () => {
    deletingSplashscreen.value = true;

    try {
      await remote.sdk.newUserApi(getImageApi).deleteCustomSplashscreen();
      splashscreenRevision.value = Date.now();
      useSnackbar(t('imageDeletedSuccessfully'), 'success');
    } catch {
      useSnackbar(t('failedToDeleteImage'), 'error');
    } finally {
      deletingSplashscreen.value = false;
    }
  }, {
    title: t('deleteCustomImage'),
    text: t('deleteCustomImageConfirm'),
    confirmText: t('delete')
  });
}

onScopeDispose(() => {
  for (const [,id] of tasks) {
    taskManager.finishTask(id);
  }
});
</script>
