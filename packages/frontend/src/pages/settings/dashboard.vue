<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('dashboard') }}
    </template>
    <template #content>
      <VCol
        md="8"
        class="uno-pb-4 uno-pt-0">
        <VAlert
          v-if="systemInfo?.HasPendingRestart"
          type="warning"
          variant="tonal"
          class="uno-mb-4">
          {{ t('restartPending') }}
        </VAlert>
        <VAlert
          v-if="systemInfo?.HasUpdateAvailable"
          type="info"
          variant="tonal"
          class="uno-mb-4">
          {{ t('updateAvailable') }}
        </VAlert>

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('serverOverview') }}
        </h3>
        <VTable
          class="overview"
          density="comfortable">
          <tbody>
            <tr>
              <th>{{ t('server') }}</th>
              <td>{{ systemInfo?.ServerName }}</td>
            </tr>
            <tr>
              <th>{{ t('serverVersion') }}</th>
              <td>{{ systemInfo?.Version }}</td>
            </tr>
            <tr v-if="systemInfo?.OperatingSystemDisplayName || systemInfo?.OperatingSystem">
              <th>{{ t('operatingSystem') }}</th>
              <td>
                {{ systemInfo?.OperatingSystemDisplayName || systemInfo?.OperatingSystem }}
              </td>
            </tr>
            <tr v-if="systemInfo?.SystemArchitecture">
              <th>{{ t('architecture') }}</th>
              <td>{{ systemInfo?.SystemArchitecture }}</td>
            </tr>
            <tr v-if="systemInfo?.CachePath">
              <th>{{ t('cachePath') }}</th>
              <td>{{ systemInfo?.CachePath }}</td>
            </tr>
            <tr v-if="systemInfo?.LogPath">
              <th>{{ t('logPath') }}</th>
              <td>{{ systemInfo?.LogPath }}</td>
            </tr>
            <tr v-if="systemInfo?.InternalMetadataPath">
              <th>{{ t('metadataPath') }}</th>
              <td>{{ systemInfo?.InternalMetadataPath }}</td>
            </tr>
            <tr v-if="systemInfo?.TranscodingTempPath">
              <th>{{ t('transcodePath') }}</th>
              <td>{{ systemInfo?.TranscodingTempPath }}</td>
            </tr>
            <tr v-if="systemInfo?.WebPath">
              <th>{{ t('webClientPath') }}</th>
              <td>{{ systemInfo?.WebPath }}</td>
            </tr>
          </tbody>
        </VTable>
      </VCol>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useTranslation } from 'i18next-vue';
import { useApi } from '#/composables/apis.ts';

const { t } = useTranslation();

/**
 * SystemInfo is a one-shot read — version, paths and encoders don't change
 * during a session. Live data (sessions, transcodes) is layered in by
 * DASH-2 and DASH-3 on top of this overview.
 */
const { data: systemInfo } = await useApi(getSystemApi, 'getSystemInfo')();
</script>

<style scoped>
.overview th {
  width: 1%;
  white-space: nowrap;
  padding-right: 1.5rem !important;
  font-weight: 600;
}
</style>
