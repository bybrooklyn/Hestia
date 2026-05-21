<template>
  <VDialog
    width="auto"
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    @after-leave="emit('close')">
    <VCard
      class="pa-3"
      min-width="320">
      <VCardTitle class="text-center">
        {{ t('addToCollection') }}
      </VCardTitle>
      <VDivider />
      <VCardText>
        <VSelect
          v-model="selectedId"
          :items="collectionOptions"
          item-title="title"
          item-value="value"
          :label="t('collection')"
          :hint="t('addToCollectionHint')"
          persistent-hint />
        <div
          v-if="selectedId === NEW_COLLECTION_VALUE"
          class="uno-mt-2">
          <VBtn
            variant="outlined"
            block
            @click="createDialog = true">
            <JIcon class="i-mdi:plus uno-mr-1" />
            {{ t('createCollection') }}
          </VBtn>
        </div>
      </VCardText>
      <VCardActions
        class="d-flex"
        :class="{
          'justify-end': !$vuetify.display.mobile,
          'justify-center': $vuetify.display.mobile
        }">
        <VBtn
          variant="flat"
          color="secondary"
          @click="model = false">
          {{ t('cancel') }}
        </VBtn>
        <VBtn
          variant="flat"
          color="primary"
          :loading="loading"
          :disabled="!canAdd"
          @click="addToExisting">
          {{ t('add') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
  <CreateCollectionDialog
    v-if="createDialog && item.Id"
    :seed-item-ids="[item.Id]"
    @close="createDialog = false"
    @created="onCreated" />
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getCollectionApi } from '@jellyfin/sdk/lib/utils/api/collection-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { computed, ref, shallowRef, watchEffect } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const { item } = defineProps<{
  item: BaseItemDto;
}>();

const emit = defineEmits<{
  close: [];
}>();

/**
 * Sentinel value used to surface the "create a new collection" option
 * inline with the existing-collection list. The actual id is empty so
 * we can distinguish it from any real collection.
 */
const NEW_COLLECTION_VALUE = '__new__';

const { t } = useTranslation();
const model = ref(true);
const loading = ref(false);
const createDialog = ref(false);
const selectedId = ref<string>(NEW_COLLECTION_VALUE);
const collections = shallowRef<BaseItemDto[]>([]);

/**
 * Fetch the user's existing BoxSets so the picker can list them. We
 * use the same query both jellyfin-web and the suggestions tab use:
 * recursive across the user library, filtered to `Type === 'BoxSet'`.
 */
watchEffect(() => {
  void (async () => {
    try {
      const userId = remote.auth.currentUserId.value;

      if (!userId) {
        return;
      }

      const { data } = await remote.sdk.newUserApi(getItemsApi).getItems({
        userId,
        includeItemTypes: ['BoxSet'],
        recursive: true,
        sortBy: ['SortName']
      });

      collections.value = data.Items ?? [];
    } catch (error) {
      console.error(error);
    }
  })();
});

const collectionOptions = computed(() => [
  { title: t('newCollection'), value: NEW_COLLECTION_VALUE },
  ...collections.value.map(c => ({
    title: c.Name ?? '',
    value: c.Id ?? ''
  }))
]);

const canAdd = computed(() =>
  selectedId.value !== NEW_COLLECTION_VALUE && selectedId.value.length > 0
);

/**
 * Add the current item to the chosen existing collection via
 * `addToCollection`. The "create a new collection" path is handled
 * separately via the nested `CreateCollectionDialog`.
 */
async function addToExisting(): Promise<void> {
  if (!item.Id || !canAdd.value) {
    return;
  }

  loading.value = true;

  try {
    await remote.sdk.newUserApi(getCollectionApi).addToCollection({
      collectionId: selectedId.value,
      ids: [item.Id]
    });
    useSnackbar(t('itemAddedToCollection'), 'success');
    model.value = false;
  } catch (error) {
    console.error(error);
    useSnackbar(t('anErrorHappened'), 'error');
  } finally {
    loading.value = false;
  }
}

/**
 * `CreateCollectionDialog` already seeds the new collection with the
 * current item id (`seedItemIds`), so once it emits `created` we just
 * close this dialog — the item is already attached.
 */
function onCreated(_collectionId: string): void {
  createDialog.value = false;
  model.value = false;
}
</script>
