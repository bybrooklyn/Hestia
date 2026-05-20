<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('dlna') }}
    </template>
    <template #content>
      <VCol
        md="8"
        class="uno-pb-4 uno-pt-0">
        <VCheckbox
          v-model="dlna.EnableServer"
          :label="t('enableDlnaServer')" />
        <VCheckbox
          v-model="dlna.EnablePlayTo"
          :label="t('enableDlnaPlayTo')" />
        <VCheckbox
          v-model="dlna.AutoCreatePlayToProfiles"
          :label="t('autoCreatePlayToProfiles')" />
        <VCheckbox
          v-model="dlna.BlastAliveMessages"
          :label="t('blastAliveMessages')" />
        <VCheckbox
          v-model="dlna.SendOnlyMatchedHost"
          :label="t('sendOnlyMatchedHost')" />
        <VCheckbox
          v-model="dlna.EnableDebugLog"
          :label="t('enableDebugLog')" />
        <VCheckbox
          v-model="dlna.EnablePlayToTracing"
          :label="t('enablePlayToTracing')" />

        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('intervals') }}
        </h3>
        <VTextField
          v-model.number="dlna.ClientDiscoveryIntervalSeconds"
          :label="t('clientDiscoveryIntervalSeconds')"
          type="number" />
        <VTextField
          v-model.number="dlna.AliveMessageIntervalSeconds"
          :label="t('aliveMessageIntervalSeconds')"
          type="number" />

        <VSelect
          v-model="dlna.DefaultUserId"
          :items="userItems"
          item-title="title"
          item-value="value"
          :label="t('defaultUser')"
          clearable />
      </VCol>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import type { DlnaOptions } from '@jellyfin/sdk/lib/generated-client/models/dlna-options';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { computed, onScopeDispose, shallowRef, watch } from 'vue';
import { watchDeep } from '@vueuse/core';
import { useTranslation } from 'i18next-vue';
import { useApi } from '#/composables/apis.ts';
import { taskManager } from '#/store/task-manager.ts';

const { t } = useTranslation();

const [{ data: dlnaRaw }, { data: users }] = await Promise.all([
  useApi(getConfigurationApi, 'getNamedConfiguration')(() => ({ key: 'dlna' })),
  useApi(getUserApi, 'getUsers')()
]);

const dlna = shallowRef<DlnaOptions>(dlnaRaw.value as DlnaOptions);

const userItems = computed(() =>
  users.value.map(u => ({ title: u.Name ?? '', value: u.Id ?? '' }))
);

const tasks = new Map<number, string>();
const signal = shallowRef(false);

const { loading } = await useApi(
  getConfigurationApi,
  () => signal.value ? 'updateNamedConfiguration' : undefined,
  { skipCache: { request: true }, globalLoading: false }
)(() => ({
  key: 'dlna',
  body: JSON.stringify(dlna.value)
}));

watch(loading, (l) => {
  if (l && !tasks.has(0)) {
    tasks.set(0, taskManager.startConfigSync());
  } else if (!l) {
    const id = tasks.get(0);

    if (id) {
      taskManager.finishTask(id);
      tasks.delete(0);
    }
  }
});

watchDeep(dlna, () => signal.value = true, { once: true });

onScopeDispose(() => {
  for (const [, id] of tasks) {
    taskManager.finishTask(id);
  }
});
</script>
