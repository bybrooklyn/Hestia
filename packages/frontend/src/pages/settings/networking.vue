<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('networking') }}
    </template>
    <template #content>
      <VCol
        md="8"
        class="uno-pb-4 uno-pt-0">
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('publicAccess') }}
        </h3>
        <VCheckbox
          v-model="net.EnableRemoteAccess"
          :label="t('allowRemoteAccess')" />
        <VCheckbox
          v-model="net.AutoDiscovery"
          :label="t('autoDiscovery')" />
        <VCheckbox
          v-model="net.EnableUPnP"
          :label="t('enableUpnp')" />
        <VCheckbox
          v-model="net.EnableIPv4"
          :label="t('enableIPv4')" />
        <VCheckbox
          v-model="net.EnableIPv6"
          :label="t('enableIPv6')" />

        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('https') }}
        </h3>
        <VCheckbox
          v-model="net.EnableHttps"
          :label="t('enableHttps')" />
        <VCheckbox
          v-model="net.RequireHttps"
          :label="t('requireHttps')" />
        <VTextField
          v-model="net.CertificatePath"
          :label="t('certificatePath')" />
        <VTextField
          v-model="net.CertificatePassword"
          :label="t('certificatePassword')"
          type="password" />

        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('ports') }}
        </h3>
        <VTextField
          v-model="net.BaseUrl"
          :label="t('baseUrl')" />
        <VRow no-gutters>
          <VCol cols="6">
            <VTextField
              v-model.number="net.InternalHttpPort"
              :label="t('internalHttpPort')"
              type="number"
              class="uno-mr-2" />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model.number="net.InternalHttpsPort"
              :label="t('internalHttpsPort')"
              type="number" />
          </VCol>
        </VRow>
        <VRow no-gutters>
          <VCol cols="6">
            <VTextField
              v-model.number="net.PublicHttpPort"
              :label="t('publicHttpPort')"
              type="number"
              class="uno-mr-2" />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model.number="net.PublicHttpsPort"
              :label="t('publicHttpsPort')"
              type="number" />
          </VCol>
        </VRow>

        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('localNetwork') }}
        </h3>
        <VTextarea
          v-model="localNetworkSubnetsText"
          :label="t('localNetworkSubnets')"
          :hint="t('oneEntryPerLine')"
          persistent-hint
          rows="3"
          variant="outlined" />
        <VTextarea
          v-model="knownProxiesText"
          :label="t('knownProxies')"
          :hint="t('oneEntryPerLine')"
          persistent-hint
          rows="3"
          variant="outlined" />

        <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
          {{ t('remoteIpFilter') }}
        </h3>
        <VTextarea
          v-model="remoteIpFilterText"
          :label="t('remoteIpFilter')"
          :hint="t('oneEntryPerLine')"
          persistent-hint
          rows="3"
          variant="outlined" />
        <VCheckbox
          v-model="net.IsRemoteIPFilterBlacklist"
          :label="t('treatAsBlacklist')" />
      </VCol>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import type { NetworkConfiguration } from '@jellyfin/sdk/lib/generated-client';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { computed, onScopeDispose, shallowRef, watch } from 'vue';
import { watchDeep } from '@vueuse/core';
import { useTranslation } from 'i18next-vue';
import { useApi } from '#/composables/apis.ts';
import { taskManager } from '#/store/task-manager.ts';

const { t } = useTranslation();

/**
 * `getNamedConfiguration` is typed as returning `File` at the API surface,
 * but at runtime axios parses the JSON response. Cast through `unknown` to
 * silence the mismatch.
 */
const { data } = await useApi(getConfigurationApi, 'getNamedConfiguration')(() => ({
  key: 'network'
}));
const net = shallowRef<NetworkConfiguration>(
  data.value as NetworkConfiguration
);

/**
 * Auto-save mirrors server.vue's pattern: the first edit flips the signal,
 * and from then on each change triggers updateNamedConfiguration.
 */
const tasks = new Map<number, string>();
const signal = shallowRef(false);

const { loading } = await useApi(
  getConfigurationApi,
  () => signal.value ? 'updateNamedConfiguration' : undefined,
  { skipCache: { request: true }, globalLoading: false }
)(() => ({
  key: 'network',
  body: JSON.stringify(net.value)
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

watchDeep(net, () => signal.value = true, { once: true });

onScopeDispose(() => {
  for (const [, id] of tasks) {
    taskManager.finishTask(id);
  }
});

/**
 * The DTO stores arrays of strings; the UI edits them as newline-separated
 * blobs. These computed proxies translate between the two so the DTO stays
 * the source of truth and a single watchDeep covers all edits.
 */
function asLines(arr?: string[] | null): string {
  return (arr ?? []).join('\n');
}

/**
 * Inverse of `asLines`: split a textarea blob into a clean list of
 * trimmed, non-empty entries.
 */
function fromLines(s: string): string[] {
  return s.split('\n').map(x => x.trim()).filter(Boolean);
}

const localNetworkSubnetsText = computed({
  get: () => asLines(net.value.LocalNetworkSubnets),
  set: (v) => { net.value = { ...net.value, LocalNetworkSubnets: fromLines(v) }; }
});
const knownProxiesText = computed({
  get: () => asLines(net.value.KnownProxies),
  set: (v) => { net.value = { ...net.value, KnownProxies: fromLines(v) }; }
});
const remoteIpFilterText = computed({
  get: () => asLines(net.value.RemoteIPFilter),
  set: (v) => { net.value = { ...net.value, RemoteIPFilter: fromLines(v) }; }
});
</script>
