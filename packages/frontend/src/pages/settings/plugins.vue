<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('plugins') }}
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
        <VTabs v-model="tab">
          <VTab value="installed">
            {{ t('installed') }}
          </VTab>
          <VTab value="catalog">
            {{ t('catalog') }}
          </VTab>
          <VTab value="repositories">
            {{ t('repositories') }}
          </VTab>
        </VTabs>

        <VTabsWindow
          v-model="tab"
          class="uno-mt-4">
          <!-- == PLG-1: installed plugins == -->
          <VTabsWindowItem value="installed">
            <div
              v-if="plugins.length === 0"
              class="uno-text-disabled uno-py-8 uno-text-center">
              {{ t('noPluginsInstalled') }}
            </div>
            <VTable
              v-else
              density="comfortable">
              <thead>
                <tr>
                  <th>{{ t('name') }}</th>
                  <th>{{ t('version') }}</th>
                  <th>{{ t('status') }}</th>
                  <th class="uno-text-right">
                    {{ t('actions') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="plugin in plugins"
                  :key="`${plugin.Id ?? ''}-${plugin.Version ?? ''}`">
                  <td>
                    <div class="uno-font-medium">
                      {{ plugin.Name }}
                    </div>
                    <div
                      v-if="plugin.Description"
                      class="uno-text-disabled uno-text-xs">
                      {{ plugin.Description }}
                    </div>
                  </td>
                  <td class="uno-text-xs">
                    {{ plugin.Version }}
                  </td>
                  <td class="uno-text-xs">
                    {{ statusLabel(plugin.Status) }}
                  </td>
                  <td class="uno-whitespace-nowrap uno-text-right">
                    <VBtn
                      v-if="plugin.ConfigurationFileName"
                      variant="text"
                      size="small"
                      :disabled="!plugin.Id"
                      @click="openConfig(plugin)">
                      <JIcon class="i-mdi:cog-outline uno-mr-1" />
                      {{ t('configure') }}
                    </VBtn>
                    <VBtn
                      v-if="plugin.Status === 'Disabled'"
                      variant="text"
                      size="small"
                      :disabled="!plugin.Id || !plugin.Version"
                      @click="enablePlugin(plugin)">
                      <JIcon class="i-mdi:check uno-mr-1" />
                      {{ t('enable') }}
                    </VBtn>
                    <VBtn
                      v-else-if="plugin.Status === 'Active'"
                      variant="text"
                      size="small"
                      :disabled="!plugin.Id || !plugin.Version"
                      @click="disablePlugin(plugin)">
                      <JIcon class="i-mdi:close uno-mr-1" />
                      {{ t('disable') }}
                    </VBtn>
                    <VBtn
                      v-if="plugin.CanUninstall"
                      variant="text"
                      size="small"
                      color="error"
                      :disabled="!plugin.Id || !plugin.Version"
                      @click="confirmUninstall(plugin)">
                      <JIcon class="i-mdi:delete-outline uno-mr-1" />
                      {{ t('uninstall') }}
                    </VBtn>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VTabsWindowItem>

          <!-- == PLG-2: catalog == -->
          <VTabsWindowItem value="catalog">
            <div
              v-if="packages.length === 0"
              class="uno-text-disabled uno-py-8 uno-text-center">
              {{ t('noPluginsInCatalog') }}
            </div>
            <template v-else>
              <div
                v-for="(group, category) in groupedPackages"
                :key="category"
                class="uno-mb-6">
                <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
                  {{ category }}
                </h3>
                <VTable density="comfortable">
                  <thead>
                    <tr>
                      <th>{{ t('name') }}</th>
                      <th>{{ t('owner') }}</th>
                      <th>{{ t('version') }}</th>
                      <th class="uno-text-right">
                        {{ t('actions') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="pkg in group"
                      :key="pkg.guid ?? pkg.name ?? ''">
                      <td>
                        <div class="uno-font-medium">
                          {{ pkg.name }}
                        </div>
                        <div
                          v-if="pkg.description"
                          class="uno-text-disabled uno-text-xs">
                          {{ pkg.description }}
                        </div>
                      </td>
                      <td class="uno-text-xs">
                        {{ pkg.owner }}
                      </td>
                      <td class="uno-text-xs">
                        {{ pkg.versions?.[0]?.version }}
                      </td>
                      <td class="uno-whitespace-nowrap uno-text-right">
                        <VBtn
                          v-if="isInstalled(pkg)"
                          variant="text"
                          size="small"
                          disabled>
                          <JIcon class="i-mdi:check uno-mr-1" />
                          {{ t('installed') }}
                        </VBtn>
                        <VBtn
                          v-else
                          variant="text"
                          size="small"
                          @click="installPackage(pkg)">
                          <JIcon class="i-mdi:download uno-mr-1" />
                          {{ t('install') }}
                        </VBtn>
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </div>
            </template>
          </VTabsWindowItem>

          <!-- == PLG-4: repositories == -->
          <VTabsWindowItem value="repositories">
            <div class="uno-mb-3 uno-flex uno-justify-end">
              <VBtn
                color="primary"
                variant="elevated"
                @click="addRepoDialog = true">
                <JIcon class="i-mdi:plus uno-mr-2" />
                {{ t('addRepository') }}
              </VBtn>
            </div>
            <div
              v-if="repositories.length === 0"
              class="uno-text-disabled uno-py-8 uno-text-center">
              {{ t('noRepositories') }}
            </div>
            <VTable
              v-else
              density="comfortable">
              <thead>
                <tr>
                  <th>{{ t('name') }}</th>
                  <th>{{ t('repositoryUrl') }}</th>
                  <th>{{ t('enabled') }}</th>
                  <th class="uno-text-right">
                    {{ t('actions') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(repo, idx) in repositories"
                  :key="`${repo.Url ?? ''}-${idx}`">
                  <td class="uno-font-medium">
                    {{ repo.Name }}
                  </td>
                  <td class="uno-text-xs">
                    {{ repo.Url }}
                  </td>
                  <td class="uno-text-xs">
                    <VCheckbox
                      :model-value="repo.Enabled ?? true"
                      hide-details
                      density="compact"
                      @update:model-value="v => toggleRepository(idx, v ?? false)" />
                  </td>
                  <td class="uno-text-right">
                    <VBtn
                      variant="text"
                      size="small"
                      color="error"
                      @click="removeRepository(idx)">
                      <JIcon class="i-mdi:delete-outline" />
                    </VBtn>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VTabsWindowItem>
        </VTabsWindow>
      </VCol>

      <!-- == Add repository dialog == -->
      <VDialog
        v-model="addRepoDialog"
        width="540">
        <VCard>
          <VCardTitle>{{ t('addRepository') }}</VCardTitle>
          <VCardText>
            <VTextField
              v-model="newRepo.Name"
              variant="outlined"
              :label="t('repositoryName')" />
            <VTextField
              v-model="newRepo.Url"
              variant="outlined"
              :label="t('repositoryUrl')" />
            <VCheckbox
              v-model="newRepo.Enabled"
              :label="t('enabled')"
              hide-details />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn @click="addRepoDialog = false">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              color="primary"
              :loading="savingRepos"
              :disabled="!newRepo.Name?.trim() || !newRepo.Url?.trim()"
              @click="submitAddRepository">
              {{ t('save') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <!-- == PLG-3: per-plugin config dialog == -->
      <VDialog
        v-model="configDialog"
        width="720"
        scrollable>
        <VCard v-if="configPlugin">
          <VCardTitle>
            {{ t('pluginConfiguration') }} — {{ configPlugin.Name }}
          </VCardTitle>
          <VCardText style="min-height: 360px">
            <p class="uno-text-disabled uno-mb-2 uno-text-xs">
              {{ t('pluginConfigurationHint') }}
            </p>
            <div
              v-if="configMissing"
              class="uno-text-disabled uno-py-8 uno-text-center">
              {{ t('noPluginConfiguration') }}
            </div>
            <VTextarea
              v-else
              v-model="configJson"
              variant="outlined"
              rows="16"
              auto-grow
              :error="!configJsonValid"
              :messages="configJsonValid ? '' : t('invalidJson')"
              class="uno-font-mono" />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn @click="configDialog = false">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              v-if="!configMissing"
              color="primary"
              :loading="savingConfig"
              :disabled="!configJsonValid"
              @click="submitConfig">
              {{ t('save') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { type PackageInfo, type PluginInfo, type RepositoryInfo, PluginStatus } from '@jellyfin/sdk/lib/generated-client';
import { getPluginsApi } from '@jellyfin/sdk/lib/utils/api/plugins-api';
import { getPackageApi } from '@jellyfin/sdk/lib/utils/api/package-api';
import { computed, ref, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { useConfirmDialog } from '#/composables/use-confirm-dialog.ts';

const { t } = useTranslation();

const tab = ref<'installed' | 'catalog' | 'repositories'>('installed');

const plugins = shallowRef<PluginInfo[]>([]);
const packages = shallowRef<PackageInfo[]>([]);
const repositories = ref<RepositoryInfo[]>([]);
const loadError = shallowRef<unknown>();

/**
 * Pull installed plugins. Sorted by name for stable display.
 */
async function refetchPlugins(): Promise<void> {
  try {
    const { data } = await remote.sdk.newUserApi(getPluginsApi).getPlugins();

    plugins.value = data.toSorted((a, b) => (a.Name ?? '').localeCompare(b.Name ?? ''));
  } catch (error) {
    loadError.value = error;
    useSnackbar(t('unexpectedError'), 'error');
  }
}

/**
 * Pull the available catalog. Server applies the enabled-repositories filter.
 */
async function refetchPackages(): Promise<void> {
  try {
    const { data } = await remote.sdk.newUserApi(getPackageApi).getPackages();

    packages.value = data;
  } catch (error) {
    loadError.value = error;
    useSnackbar(t('unexpectedError'), 'error');
  }
}

/**
 * Pull repositories.
 */
async function refetchRepositories(): Promise<void> {
  try {
    const { data } = await remote.sdk.newUserApi(getPackageApi).getRepositories();

    repositories.value = data;
  } catch (error) {
    loadError.value = error;
    useSnackbar(t('unexpectedError'), 'error');
  }
}

await Promise.all([refetchPlugins(), refetchPackages(), refetchRepositories()]);

const groupedPackages = computed(() => {
  const groups: Record<string, PackageInfo[]> = {};

  for (const pkg of packages.value) {
    const category = pkg.category ?? t('miscellaneous');

    groups[category] ??= [];
    groups[category].push(pkg);
  }

  for (const list of Object.values(groups)) {
    list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }

  return groups;
});

const installedGuids = computed(() => {
  const ids = new Set<string>();

  for (const plugin of plugins.value) {
    if (plugin.Id) {
      ids.add(plugin.Id.toLowerCase());
    }
  }

  return ids;
});

/**
 * Catalog rows compare against installed plugins by GUID (case-insensitive,
 * since the server normalizes assembly GUIDs differently across endpoints).
 */
function isInstalled(pkg: PackageInfo): boolean {
  return !!pkg.guid && installedGuids.value.has(pkg.guid.toLowerCase());
}

/**
 * Map server PluginStatus values to user-visible labels.
 */
function statusLabel(status: PluginStatus | undefined): string {
  switch (status) {
    case PluginStatus.Active: { return t('pluginStatusActive'); }
    case PluginStatus.Restart: { return t('pluginStatusRestart'); }
    case PluginStatus.Deleted: { return t('pluginStatusDeleted'); }
    case PluginStatus.Superseded:
    case PluginStatus.Superceded: { return t('pluginStatusSuperseded'); }
    case PluginStatus.Malfunctioned: { return t('pluginStatusMalfunctioned'); }
    case PluginStatus.NotSupported: { return t('pluginStatusNotSupported'); }
    case PluginStatus.Disabled: { return t('pluginStatusDisabled'); }
    default: { return status ?? ''; }
  }
}

/**
 * == Enable / disable / uninstall ==
 */
async function enablePlugin(plugin: PluginInfo): Promise<void> {
  if (!plugin.Id || !plugin.Version) {
    return;
  }

  try {
    await remote.sdk.newUserApi(getPluginsApi).enablePlugin({ pluginId: plugin.Id, version: plugin.Version });
    useSnackbar(t('pluginEnabled'), 'success');
    await refetchPlugins();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  }
}

/**
 * Disable a running plugin until next restart.
 */
async function disablePlugin(plugin: PluginInfo): Promise<void> {
  if (!plugin.Id || !plugin.Version) {
    return;
  }

  try {
    await remote.sdk.newUserApi(getPluginsApi).disablePlugin({ pluginId: plugin.Id, version: plugin.Version });
    useSnackbar(t('pluginDisabled'), 'success');
    await refetchPlugins();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  }
}

/**
 * Prompt before uninstalling, since removal also clears plugin settings.
 */
async function confirmUninstall(plugin: PluginInfo): Promise<void> {
  if (!plugin.Id || !plugin.Version || !plugin.Name) {
    return;
  }

  await useConfirmDialog(
    async () => {
      try {
        await remote.sdk.newUserApi(getPluginsApi).uninstallPluginByVersion({
          pluginId: plugin.Id!,
          version: plugin.Version!
        });
        useSnackbar(t('pluginUninstalled'), 'success');
        await refetchPlugins();
      } catch {
        useSnackbar(t('unexpectedError'), 'error');
      }
    },
    {
      title: t('uninstall'),
      text: t('uninstallPluginConfirm', { name: plugin.Name })
    }
  );
}

/**
 * == Catalog install ==
 *
 * Installs the latest version of the package. The server resolves the
 * actual repository / version against its current repository list.
 */
async function installPackage(pkg: PackageInfo): Promise<void> {
  if (!pkg.name) {
    return;
  }

  try {
    await remote.sdk.newUserApi(getPackageApi).installPackage({
      name: pkg.name,
      assemblyGuid: pkg.guid,
      version: pkg.versions?.[0]?.version,
      repositoryUrl: pkg.versions?.[0]?.repositoryUrl
    });
    useSnackbar(t('pluginInstalled'), 'success');
    await refetchPlugins();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  }
}

/**
 * == Repositories ==
 *
 * `setRepositories` is a replace, not a patch — we always send the
 * full list back after editing in-memory.
 */
const addRepoDialog = ref(false);
const savingRepos = ref(false);

type RepoForm = Omit<RepositoryInfo, 'Enabled'> & { Enabled?: boolean | null };

const newRepo = ref<RepoForm>({ Name: '', Url: '', Enabled: true });

/**
 * Replace the repository list and re-pull the catalog. `setRepositories`
 * is the only persistence endpoint — there's no add/remove API.
 */
async function persistRepositories(next: RepositoryInfo[]): Promise<void> {
  savingRepos.value = true;

  try {
    await remote.sdk.newUserApi(getPackageApi).setRepositories({ repositoryInfo: next });
    repositories.value = next;
    useSnackbar(t('repositoriesUpdated'), 'success');
    void refetchPackages();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    savingRepos.value = false;
  }
}

/**
 * Append the form values as a new repository and persist.
 */
async function submitAddRepository(): Promise<void> {
  const trimmed: RepositoryInfo = {
    Name: newRepo.value.Name?.trim() ?? '',
    Url: newRepo.value.Url?.trim() ?? '',
    Enabled: newRepo.value.Enabled ?? true
  };

  await persistRepositories([...repositories.value, trimmed]);
  addRepoDialog.value = false;
  newRepo.value = { Name: '', Url: '', Enabled: true };
}

/**
 * Drop the repository at `idx` and persist the rest.
 */
async function removeRepository(idx: number): Promise<void> {
  const next = repositories.value.filter((_, i) => i !== idx);

  await persistRepositories(next);
}

/**
 * Toggle enabled state for a repository row.
 */
async function toggleRepository(idx: number, enabled: boolean): Promise<void> {
  const next = repositories.value.map((repo, i) => (i === idx ? { ...repo, Enabled: enabled } : repo));

  await persistRepositories(next);
}

/**
 * == Per-plugin configuration dialog ==
 *
 * The server returns plugin configuration as an opaque JSON object — each
 * plugin defines its own schema. The minimum viable editor is a raw JSON
 * text area with client-side parse validation; the server rejects malformed
 * payloads anyway, so we don't try to be cleverer than that.
 */
const configDialog = ref(false);
const configPlugin = shallowRef<PluginInfo | undefined>();
const configJson = ref('');
const configMissing = ref(false);
const savingConfig = ref(false);

const configJsonValid = computed(() => {
  if (configMissing.value) {
    return true;
  }

  try {
    JSON.parse(configJson.value);

    return true;
  } catch {
    return false;
  }
});

/**
 * Open the configuration editor. If the server returns 404 (plugin has no
 * registered configuration), surface a friendly message instead of an error.
 */
async function openConfig(plugin: PluginInfo): Promise<void> {
  if (!plugin.Id) {
    return;
  }

  configPlugin.value = plugin;
  configMissing.value = false;
  configJson.value = '';

  try {
    const { data } = await remote.sdk.newUserApi(getPluginsApi).getPluginConfiguration({ pluginId: plugin.Id });

    configJson.value = JSON.stringify(data, undefined, 2);
  } catch {
    configMissing.value = true;
  }

  configDialog.value = true;
}

/**
 * Persist the edited configuration. Validated client-side as JSON.
 */
async function submitConfig(): Promise<void> {
  if (!configPlugin.value?.Id || !configJsonValid.value) {
    return;
  }

  savingConfig.value = true;

  try {
    /*
     * updatePluginConfiguration takes the raw object as the request body;
     * pass it through the second positional `options.data` argument since
     * the generated wrapper doesn't expose a body parameter.
     */
    await remote.sdk.newUserApi(getPluginsApi).updatePluginConfiguration(
      { pluginId: configPlugin.value.Id },
      { data: JSON.parse(configJson.value) }
    );
    useSnackbar(t('pluginConfigurationUpdated'), 'success');
    configDialog.value = false;
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    savingConfig.value = false;
  }
}
</script>
