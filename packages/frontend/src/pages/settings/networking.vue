<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('networking') }}
    </template>
    <template #actions>
      <VBtn
        color="primary"
        :loading="saving"
        :disabled="!!validationMessage"
        @click="saveNetworking">
        <JIcon class="i-mdi:content-save uno-mr-2" />
        {{ t('save') }}
      </VBtn>
    </template>
    <template #content>
      <VCol
        md="8"
        class="uno-pb-4 uno-pt-0">
        <VAlert
          v-if="loadError"
          type="error"
          variant="tonal"
          class="uno-mb-4">
          {{ t('errorLoadingSettingsPage') }}
        </VAlert>
        <VAlert
          v-if="validationMessage"
          type="error"
          variant="tonal"
          class="uno-mb-4">
          {{ validationMessage }}
        </VAlert>
        <VAlert
          v-if="hasBindAddresses"
          type="warning"
          variant="tonal"
          class="uno-mb-4">
          {{ t('networkBindAddressWarning') }}
        </VAlert>
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
          v-model="localNetworkAddressesText"
          :label="t('localNetworkAddresses')"
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
        <VTextarea
          v-model="publishedServerUriBySubnetText"
          :label="t('publishedServerUriBySubnet')"
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
import { computed, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { useConfirmDialog } from '#/composables/use-confirm-dialog.ts';

const { t } = useTranslation();

type NetForm = Omit<NetworkConfiguration, 'EnableRemoteAccess' | 'AutoDiscovery' | 'EnableUPnP' | 'EnableIPv4' | 'EnableIPv6' | 'EnableHttps' | 'RequireHttps' | 'IsRemoteIPFilterBlacklist' | 'InternalHttpPort' | 'InternalHttpsPort' | 'PublicHttpPort' | 'PublicHttpsPort'> & {
  EnableRemoteAccess?: boolean | null;
  AutoDiscovery?: boolean | null;
  EnableUPnP?: boolean | null;
  EnableIPv4?: boolean | null;
  EnableIPv6?: boolean | null;
  EnableHttps?: boolean | null;
  RequireHttps?: boolean | null;
  IsRemoteIPFilterBlacklist?: boolean | null;
  InternalHttpPort?: number | string;
  InternalHttpsPort?: number | string;
  PublicHttpPort?: number | string;
  PublicHttpsPort?: number | string;
};

const loadError = shallowRef<unknown>();
const saving = shallowRef(false);
const net = shallowRef<NetForm>({});

try {
  const { data } = await remote.sdk.newUserApi(getConfigurationApi).getNamedConfiguration({ key: 'network' });

  net.value = data as unknown as NetForm;
} catch (error) {
  loadError.value = error;
  console.error('[settings/networking] failed to load network configuration', error);
}

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
const localNetworkAddressesText = computed({
  get: () => asLines(net.value.LocalNetworkAddresses),
  set: (v) => { net.value = { ...net.value, LocalNetworkAddresses: fromLines(v) }; }
});
const knownProxiesText = computed({
  get: () => asLines(net.value.KnownProxies),
  set: (v) => { net.value = { ...net.value, KnownProxies: fromLines(v) }; }
});
const publishedServerUriBySubnetText = computed({
  get: () => asLines(net.value.PublishedServerUriBySubnet),
  set: (v) => { net.value = { ...net.value, PublishedServerUriBySubnet: fromLines(v) }; }
});
const remoteIpFilterText = computed({
  get: () => asLines(net.value.RemoteIPFilter),
  set: (v) => { net.value = { ...net.value, RemoteIPFilter: fromLines(v) }; }
});

const hasBindAddresses = computed(() => (net.value.LocalNetworkAddresses ?? []).length > 0);

const validationMessage = computed(() => {
  const publicHttpPort = String(net.value.PublicHttpPort ?? '');
  const publicHttpsPort = String(net.value.PublicHttpsPort ?? '');
  const internalHttpPort = String(net.value.InternalHttpPort ?? '');
  const internalHttpsPort = String(net.value.InternalHttpsPort ?? '');

  if (publicHttpPort && publicHttpsPort && publicHttpPort === publicHttpsPort) {
    return t('publicHttpHttpsPortsMustDiffer');
  }

  if (internalHttpPort && internalHttpsPort && internalHttpPort === internalHttpsPort) {
    return t('internalHttpHttpsPortsMustDiffer');
  }

  if (!net.value.EnableIPv4 && !net.value.EnableIPv6) {
    return t('ipv4OrIpv6Required');
  }

  if (net.value.EnableHttps && !net.value.CertificatePath?.trim()) {
    return t('httpsRequiresCertificatePath');
  }
});

/**
 * Normalize form state to the payload shape expected by the server config API.
 */
function normalizedNetworkConfiguration(): NetworkConfiguration {
  return {
    ...net.value,
    EnableRemoteAccess: net.value.EnableRemoteAccess ?? false,
    AutoDiscovery: net.value.AutoDiscovery ?? false,
    EnableUPnP: net.value.EnableUPnP ?? false,
    EnableIPv4: net.value.EnableIPv4 ?? false,
    EnableIPv6: net.value.EnableIPv6 ?? false,
    EnableHttps: net.value.EnableHttps ?? false,
    RequireHttps: net.value.RequireHttps ?? false,
    IsRemoteIPFilterBlacklist: net.value.IsRemoteIPFilterBlacklist ?? false,
    InternalHttpPort: Number(net.value.InternalHttpPort) || 0,
    InternalHttpsPort: Number(net.value.InternalHttpsPort) || 0,
    PublicHttpPort: Number(net.value.PublicHttpPort) || 0,
    PublicHttpsPort: Number(net.value.PublicHttpsPort) || 0
  };
}

/**
 * Persist the current network configuration.
 */
async function persistNetworking(): Promise<void> {
  saving.value = true;

  try {
    await remote.sdk.newUserApi(getConfigurationApi).updateNamedConfiguration({
      key: 'network',
      body: JSON.stringify(normalizedNetworkConfiguration())
    });
    useSnackbar(t('saved'), 'success');
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    saving.value = false;
  }
}

/**
 * Save networking settings, prompting when bind-address edits are present.
 */
async function saveNetworking(): Promise<void> {
  if (validationMessage.value) {
    useSnackbar(validationMessage.value, 'error');

    return;
  }

  if (hasBindAddresses.value) {
    await useConfirmDialog(persistNetworking, {
      title: t('networkBindAddressWarningTitle'),
      text: t('networkBindAddressWarning'),
      confirmText: t('save'),
      confirmColor: 'primary'
    });

    return;
  }

  await persistNetworking();
}
</script>
