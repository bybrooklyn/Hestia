<template>
  <div>
    <p class="text--secondary uno-mb-4">
      {{ t('librarySetupHint') }}
    </p>

    <VAlert
      v-if="loadError"
      type="warning"
      variant="tonal"
      class="uno-mb-4">
      {{ t('errorLoadingSettingsPage') }}
    </VAlert>

    <div
      v-if="libraries.length === 0"
      class="uno-text-disabled uno-py-4 uno-text-center">
      {{ t('noLibrariesFound') }}
    </div>
    <VList
      v-else
      class="uno-mb-4">
      <VListItem
        v-for="lib in libraries"
        :key="lib.ItemId ?? lib.Name ?? ''"
        :title="lib.Name ?? ''"
        :subtitle="(lib.Locations ?? []).join(', ') || undefined">
        <template #prepend>
          <JIcon class="i-mdi:folder uno-mr-2" />
        </template>
      </VListItem>
    </VList>

    <VBtn
      color="primary"
      variant="elevated"
      :disabled="adding"
      class="uno-mb-4"
      @click="addDialog = true">
      <JIcon class="i-mdi:plus uno-mr-2" />
      {{ t('addLibrary') }}
    </VBtn>

    <VDialog
      v-model="addDialog"
      width="640"
      scrollable>
      <VCard>
        <VCardTitle>{{ t('addLibrary') }}</VCardTitle>
        <VCardText>
          <VTextField
            v-model="newLibrary.name"
            :label="t('name')"
            variant="outlined" />
          <VSelect
            v-model="newLibrary.collectionType"
            :label="t('type')"
            :items="collectionTypeItems"
            item-title="title"
            item-value="value"
            variant="outlined" />
          <div
            v-for="(path, idx) in newLibrary.paths"
            :key="idx"
            class="uno-flex uno-items-center uno-gap-2">
            <VTextField
              :model-value="path"
              :label="t('folderPath')"
              variant="outlined"
              class="uno-flex-1"
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
            @click="newLibrary.paths.push('')">
            <JIcon class="i-mdi:plus uno-mr-1" />
            {{ t('addFolder') }}
          </VBtn>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            :disabled="adding"
            @click="addDialog = false">
            {{ t('cancel') }}
          </VBtn>
          <VBtn
            color="primary"
            :loading="adding"
            :disabled="!canAddLibrary"
            @click="addLibrary">
            {{ t('add') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <div class="uno-mt-4 uno-flex uno-justify-end uno-gap-2">
      <VBtn
        color="secondary"
        variant="elevated"
        :disabled="adding"
        @click="emit('previous-step')">
        {{ t('previous') }}
      </VBtn>
      <VBtn
        color="primary"
        variant="elevated"
        :disabled="adding"
        @click="emit('step-complete')">
        {{ t('next') }}
      </VBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type VirtualFolderInfo, CollectionTypeOptions } from '@jellyfin/sdk/lib/generated-client';
import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const emit = defineEmits<{
  'step-complete': [];
  'previous-step': [];
}>();

const { t } = useTranslation();

const libraries = shallowRef<VirtualFolderInfo[]>([]);
const loadError = shallowRef<unknown>();
const adding = ref(false);
const addDialog = ref(false);
const newLibrary = reactive<{
  name: string;
  collectionType: CollectionTypeOptions | undefined;
  paths: string[];
}>({
  name: '',
  collectionType: undefined,
  paths: ['']
});

const collectionTypeItems = computed(() => [
  { title: t('mixed'), value: undefined },
  ...Object.values(CollectionTypeOptions).map(value => ({
    title: value.charAt(0).toUpperCase() + value.slice(1),
    value
  }))
]);

const canAddLibrary = computed(() =>
  newLibrary.name.trim().length > 0
  && newLibrary.paths.some(p => p.trim().length > 0)
);

/**
 * Refresh the list. The wizard uses the just-authenticated admin token, so
 * any post-admin-create call has the right credentials; on the very first
 * load (before AdminAccount completes) this returns an empty list, which
 * is fine.
 */
async function refresh(): Promise<void> {
  try {
    const { data } = await remote.sdk.newUserApi(getLibraryStructureApi).getVirtualFolders();

    libraries.value = data;
    loadError.value = undefined;
  } catch (error) {
    loadError.value = error;
    console.error('[wizard/library] failed to load libraries', error);
  }
}

/**
 * Submit the in-dialog form. Mirrors `pages/settings/libraries.vue`'s
 * `addVirtualFolder` payload so a library created here is identical to one
 * created from the admin page later.
 */
async function addLibrary(): Promise<void> {
  adding.value = true;

  try {
    const paths = newLibrary.paths.map(p => p.trim()).filter(Boolean);

    await remote.sdk.newUserApi(getLibraryStructureApi).addVirtualFolder({
      name: newLibrary.name.trim(),
      collectionType: newLibrary.collectionType,
      paths,
      refreshLibrary: true
    });
    useSnackbar(t('libraryAdded'), 'success');
    addDialog.value = false;
    newLibrary.name = '';
    newLibrary.collectionType = undefined;
    newLibrary.paths = [''];
    await refresh();
  } catch (error) {
    console.error('[wizard/library] failed to add library', error);
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    adding.value = false;
  }
}

onMounted(() => {
  void refresh();
});
</script>
