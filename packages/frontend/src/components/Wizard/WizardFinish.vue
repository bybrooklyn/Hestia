<template>
  <div>
    <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
      {{ t('setupComplete') }}
    </h3>
    <p class="text--secondary uno-mb-4">
      {{ t('setupSummary') }}
    </p>

    <VAlert
      v-if="loadError"
      type="warning"
      variant="tonal"
      class="uno-mb-4">
      {{ t('errorLoadingSettingsPage') }}
    </VAlert>

    <VList
      v-if="summary"
      class="uno-mb-4">
      <VListItem :title="t('serverName')">
        <template #append>
          {{ summary.ServerName ?? '' }}
        </template>
      </VListItem>
      <VListItem :title="t('preferredMetadataLanguage')">
        <template #append>
          {{ summary.PreferredMetadataLanguage ?? '' }}
        </template>
      </VListItem>
      <VListItem :title="t('metadataCountry')">
        <template #append>
          {{ summary.MetadataCountryCode ?? '' }}
        </template>
      </VListItem>
      <VListItem :title="t('libraries')">
        <template #append>
          {{ libraryCount }}
        </template>
      </VListItem>
    </VList>

    <div class="uno-mt-4 uno-flex uno-justify-end uno-gap-2">
      <VBtn
        color="secondary"
        variant="elevated"
        :disabled="finishing"
        @click="emit('previous-step')">
        {{ t('previous') }}
      </VBtn>
      <VBtn
        color="primary"
        variant="elevated"
        :loading="finishing"
        @click="finish">
        {{ t('finish') }}
      </VBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StartupConfigurationDto } from '@jellyfin/sdk/lib/generated-client';
import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { onMounted, ref, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { useRouter } from 'vue-router';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const emit = defineEmits<{
  'previous-step': [];
}>();

const { t } = useTranslation();
const router = useRouter();

const summary = shallowRef<StartupConfigurationDto>();
const libraryCount = ref(0);
const loadError = shallowRef<unknown>();
const finishing = ref(false);

/**
 * Pull the wizard's current `StartupConfigurationDto` (server name +
 * metadata language/country chosen on earlier steps) plus the library
 * count, so the user can review before committing. Fail-soft: if any of
 * the reads error, the summary just shows blank values — the user can
 * still finish.
 */
onMounted(async () => {
  const api = remote.sdk.oneTimeSetup(
    remote.auth.currentServer.value?.PublicAddress ?? ''
  );

  try {
    const [configRes, librariesRes] = await Promise.all([
      getStartupApi(api).getStartupConfiguration(),
      remote.sdk.newUserApi(getLibraryStructureApi).getVirtualFolders()
    ]);

    summary.value = configRes.data;
    libraryCount.value = librariesRes.data.length;
  } catch (error) {
    loadError.value = error;
    console.error('[wizard/finish] failed to load summary', error);
  }
});

/**
 * Call `completeWizard` on the startup API and redirect to the login page,
 * mirroring the pre-WIZ-2 behaviour that lived on the RemoteAccess step.
 */
async function finish(): Promise<void> {
  finishing.value = true;

  try {
    const api = remote.sdk.oneTimeSetup(
      remote.auth.currentServer.value?.PublicAddress ?? ''
    );

    await getStartupApi(api).completeWizard();
    await router.replace('/server/login');
  } catch (error) {
    console.error('[wizard/finish] failed to complete wizard', error);
    useSnackbar(t('completeError'), 'error');
  } finally {
    finishing.value = false;
  }
}
</script>
