<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('notifications') }}
    </template>
    <template #content>
      <VCol
        md="10"
        class="uno-pb-4 uno-pt-0">
        <VAlert
          v-if="loadError"
          type="error"
          variant="tonal"
          class="uno-mb-4">
          {{ t('errorLoadingSettingsPage') }}
        </VAlert>
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('notificationServices') }}
        </h3>
        <div
          v-if="services.length === 0"
          class="uno-text-disabled uno-py-4">
          {{ t('noNotificationServices') }}
        </div>
        <VList v-else>
          <VListItem
            v-for="s in services"
            :key="s.Id ?? s.Name ?? ''"
            :title="s.Name ?? ''">
            <template #prepend>
              <JIcon class="i-mdi:bell-ring uno-mr-3" />
            </template>
          </VListItem>
        </VList>

        <h3 class="uno-mb-2 uno-mt-6 uno-text-lg uno-font-bold">
          {{ t('notificationTypes') }}
        </h3>
        <div
          v-if="types.length === 0"
          class="uno-text-disabled uno-py-4">
          {{ t('noNotificationTypes') }}
        </div>
        <VTable
          v-else
          density="comfortable">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('category') }}</th>
              <th class="uno-text-right">
                {{ t('enabled') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(nt, i) in types"
              :key="`${nt.Type ?? ''}-${i}`">
              <td>{{ nt.Name }}</td>
              <td class="uno-text-disabled">
                {{ nt.Category }}
              </td>
              <td class="uno-text-right">
                <JIcon
                  :class="nt.Enabled ? 'i-mdi:check uno-text-success' : 'i-mdi:close uno-text-disabled'" />
              </td>
            </tr>
          </tbody>
        </VTable>

        <p class="uno-text-disabled uno-mt-6 uno-text-sm">
          {{ t('notificationsPluginHint') }}
        </p>
      </VCol>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import type { NameIdPair } from '@jellyfin/sdk/lib/generated-client';
import type { NotificationTypeInfo } from '@jellyfin/sdk/lib/generated-client/models/notification-type-info';
import { shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';

const { t } = useTranslation();

const loadError = shallowRef<unknown>();
const services = shallowRef<NameIdPair[]>([]);
const types = shallowRef<NotificationTypeInfo[]>([]);

/**
 * The SDK ships `notifications-api.d.ts` but not its `.js` companion, so we
 * can't instantiate the generated class at runtime. Hit the endpoints
 * directly via the axios instance — same pattern `playback-manager.ts`
 * uses for `/MediaSegments`, the other endpoint missing from `utils/api/`.
 */
const axios = remote.sdk.api?.axiosInstance;

try {
  const [servicesRes, typesRes] = await Promise.all([
    axios?.get<NameIdPair[]>('/Notifications/Services'),
    axios?.get<NotificationTypeInfo[]>('/Notifications/Types')
  ]);

  services.value = servicesRes?.data ?? [];
  types.value = typesRes?.data ?? [];
} catch (error) {
  loadError.value = error;
  console.error('[settings/notifications] failed to load notification data', error);
}
</script>
