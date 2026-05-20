<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('notifications') }}
    </template>
    <template #content>
      <VCol
        md="10"
        class="uno-pb-4 uno-pt-0">
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('notificationServices') }}
        </h3>
        <div
          v-if="services.length === 0"
          class="uno-py-4 uno-text-disabled">
          {{ t('noNotificationServices') }}
        </div>
        <VList
          v-else
          density="compact">
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
          class="uno-py-4 uno-text-disabled">
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

        <p class="uno-mt-6 uno-text-sm uno-text-disabled">
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
import type { Api } from '@jellyfin/sdk';
import { NotificationsApi } from '@jellyfin/sdk/lib/generated-client/api/notifications-api';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';

const { t } = useTranslation();

const getNotificationsApi = (api: Api): NotificationsApi =>
  new NotificationsApi(api.configuration, undefined, api.axiosInstance);

const api = remote.sdk.newUserApi(getNotificationsApi);

const [servicesRes, typesRes] = await Promise.all([
  api.getNotificationServices(),
  api.getNotificationTypes()
]);
const services = servicesRes.data;
const types = typesRes.data;
</script>
