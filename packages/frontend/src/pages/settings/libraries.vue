<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('libraries') }}
    </template>
    <template #actions>
      <VBtn
        color="primary"
        variant="elevated"
        @click="addDialog = true">
        <JIcon class="i-mdi:plus uno-mr-2" />
        {{ t('addLibrary') }}
      </VBtn>
    </template>
    <template #content>
      <VCol
        md="10"
        class="uno-pb-4 uno-pt-0">
        <div
          v-if="libraries.length === 0"
          class="uno-text-disabled uno-py-8 uno-text-center">
          {{ t('noLibrariesFound') }}
        </div>
        <VTable
          v-else
          density="comfortable">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('type') }}</th>
              <th>{{ t('locations') }}</th>
              <th class="uno-text-right">
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="lib in libraries"
              :key="lib.ItemId ?? lib.Name ?? ''">
              <td class="uno-font-medium">
                {{ lib.Name }}
              </td>
              <td class="uno-text-disabled uno-text-xs">
                {{ lib.CollectionType ?? t('mixed') }}
              </td>
              <td class="uno-text-xs">
                <div
                  v-for="loc in lib.Locations"
                  :key="loc">
                  {{ loc }}
                </div>
              </td>
              <td class="uno-text-right">
                <VBtn
                  variant="text"
                  size="small"
                  @click="openRename(lib)">
                  <JIcon class="i-mdi:rename-outline" />
                </VBtn>
                <VBtn
                  variant="text"
                  size="small"
                  :disabled="!lib.Name"
                  @click="refreshLibrary(lib.Name!)">
                  <JIcon class="i-mdi:refresh" />
                </VBtn>
                <VBtn
                  variant="text"
                  size="small"
                  color="error"
                  :disabled="!lib.Name"
                  @click="confirmDelete(lib)">
                  <JIcon class="i-mdi:delete-outline" />
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCol>

      <!-- Add library -->
      <VDialog
        v-model="addDialog"
        width="540">
        <VCard>
          <VCardTitle>{{ t('addLibrary') }}</VCardTitle>
          <VCardText>
            <VTextField
              v-model="newLibrary.name"
              variant="outlined"
              :label="t('name')" />
            <VSelect
              v-model="newLibrary.collectionType"
              variant="outlined"
              :items="collectionTypeItems"
              item-title="title"
              item-value="value"
              :label="t('type')" />
            <div
              v-for="(path, idx) in newLibrary.paths"
              :key="idx"
              class="uno-flex uno-items-center uno-gap-2">
              <VTextField
                :model-value="path"
                variant="outlined"
                :label="t('folderPath')"
                @update:model-value="v => newLibrary.paths[idx] = v ?? ''" />
              <VBtn
                v-if="newLibrary.paths.length > 1"
                icon
                variant="text"
                size="small"
                @click="newLibrary.paths.splice(idx, 1)">
                <JIcon class="i-mdi:close" />
              </VBtn>
            </div>
            <VBtn
              variant="text"
              size="small"
              class="uno-mt-2"
              @click="newLibrary.paths.push('')">
              <JIcon class="i-mdi:plus uno-mr-1" />
              {{ t('addFolder') }}
            </VBtn>
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn @click="addDialog = false">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              color="primary"
              :loading="adding"
              :disabled="!canAdd"
              @click="submitAdd">
              {{ t('save') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <!-- Rename library -->
      <VDialog
        v-model="renameDialog"
        width="420">
        <VCard>
          <VCardTitle>{{ t('renameLibrary') }}</VCardTitle>
          <VCardText>
            <VTextField
              v-model="renameNew"
              variant="outlined"
              :label="t('name')" />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn @click="renameDialog = false">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              color="primary"
              :loading="renaming"
              :disabled="!renameNew.trim() || renameNew === renameTarget"
              @click="submitRename">
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
import type { VirtualFolderInfo } from '@jellyfin/sdk/lib/generated-client';
import { CollectionTypeOptions } from '@jellyfin/sdk/lib/generated-client';
import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { computed, reactive, ref, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { useConfirmDialog } from '#/composables/use-confirm-dialog.ts';

const { t } = useTranslation();

const libraries = shallowRef<VirtualFolderInfo[]>([]);

/**
 * Pull the current library list. Sorted by name for stable display.
 */
async function refetch(): Promise<void> {
  try {
    const { data } = await remote.sdk.newUserApi(getLibraryStructureApi).getVirtualFolders();

    libraries.value = [...data].sort((a, b) => (a.Name ?? '').localeCompare(b.Name ?? ''));
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  }
}

await refetch();

const collectionTypeItems = computed(() => [
  { title: t('mixed'), value: undefined },
  ...Object.values(CollectionTypeOptions).map(value => ({
    title: value.charAt(0).toUpperCase() + value.slice(1),
    value
  }))
]);

/**
 * == Add ==
 */
const addDialog = ref(false);
const adding = ref(false);
const newLibrary = reactive<{
  name: string;
  collectionType: CollectionTypeOptions | undefined;
  paths: string[];
}>({
  name: '',
  collectionType: undefined,
  paths: ['']
});

const canAdd = computed(() =>
  newLibrary.name.trim().length > 0
  && newLibrary.paths.some(p => p.trim().length > 0)
);

async function submitAdd(): Promise<void> {
  adding.value = true;

  try {
    await remote.sdk.newUserApi(getLibraryStructureApi).addVirtualFolder({
      name: newLibrary.name.trim(),
      collectionType: newLibrary.collectionType,
      paths: newLibrary.paths.map(p => p.trim()).filter(Boolean),
      refreshLibrary: true
    });
    useSnackbar(t('libraryAdded'), 'success');
    addDialog.value = false;
    newLibrary.name = '';
    newLibrary.collectionType = undefined;
    newLibrary.paths = [''];
    await refetch();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    adding.value = false;
  }
}

/**
 * == Rename ==
 */
const renameDialog = ref(false);
const renaming = ref(false);
const renameTarget = shallowRef('');
const renameNew = ref('');

function openRename(lib: VirtualFolderInfo): void {
  renameTarget.value = lib.Name ?? '';
  renameNew.value = lib.Name ?? '';
  renameDialog.value = true;
}

async function submitRename(): Promise<void> {
  renaming.value = true;

  try {
    await remote.sdk.newUserApi(getLibraryStructureApi).renameVirtualFolder({
      name: renameTarget.value,
      newName: renameNew.value.trim()
    });
    useSnackbar(t('libraryRenamed'), 'success');
    renameDialog.value = false;
    await refetch();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    renaming.value = false;
  }
}

/**
 * == Delete ==
 */
async function confirmDelete(lib: VirtualFolderInfo): Promise<void> {
  if (!lib.Name) {
    return;
  }

  await useConfirmDialog(
    async () => {
      try {
        await remote.sdk.newUserApi(getLibraryStructureApi).removeVirtualFolder({
          name: lib.Name!,
          refreshLibrary: true
        });
        useSnackbar(t('libraryDeleted'), 'success');
        await refetch();
      } catch {
        useSnackbar(t('unexpectedError'), 'error');
      }
    },
    {
      title: t('deleteLibrary'),
      text: t('deleteLibraryConfirm', { name: lib.Name })
    }
  );
}

/**
 * == Refresh ==
 *
 * Server-wide refresh, scoped to the single library by name through the
 * generic `refreshLibrary` endpoint — there's no per-library refresh in the
 * SDK today, so the user-visible action label is "refresh" but the API
 * triggers a global library scan.
 */
async function refreshLibrary(_name: string): Promise<void> {
  try {
    await remote.sdk.newUserApi(getLibraryApi).refreshLibrary();
    useSnackbar(t('libraryRefreshQueued'), 'success');
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  }
}
</script>
