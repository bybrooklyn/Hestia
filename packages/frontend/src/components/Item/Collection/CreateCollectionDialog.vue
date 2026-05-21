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
        {{ t('createCollection') }}
      </VCardTitle>
      <VDivider />
      <VCardText>
        <VTextField
          v-model="name"
          :label="t('name')"
          :rules="[requiredRule]"
          autofocus />
        <p
          v-if="seedItemIds.length > 0"
          class="text--secondary text-caption">
          {{ t('createCollectionSeed', { count: seedItemIds.length }) }}
        </p>
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
          :disabled="!isValid"
          @click="create">
          {{ t('create') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { getCollectionApi } from '@jellyfin/sdk/lib/utils/api/collection-api';
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const { seedItemIds = [] } = defineProps<{
  /**
   * If provided, the new collection is created with these items as its
   * initial members. Used by `ITEM-3` so "Add to → New collection"
   * creates and populates in one round-trip rather than create-then-add.
   */
  seedItemIds?: string[];
}>();

const emit = defineEmits<{
  close: [];
  created: [collectionId: string];
}>();

const { t } = useTranslation();
const model = ref(true);
const loading = ref(false);
const name = ref('');

/**
 * The dialog matches server-side validation: name must be non-empty
 * after trimming whitespace.
 */
const isValid = computed(() => name.value.trim().length > 0);
const requiredRule = (v: string): true | string =>
  v.trim().length > 0 || t('required');

/**
 * Create the collection. On success emit `created` with the new id so
 * the parent (e.g. `AddToCollectionDialog`) can chain a follow-up
 * action like seeding additional items.
 */
async function create(): Promise<void> {
  if (!isValid.value) {
    return;
  }

  loading.value = true;

  try {
    const { data } = await remote.sdk.newUserApi(getCollectionApi).createCollection({
      name: name.value.trim(),
      ids: seedItemIds
    });

    useSnackbar(t('collectionCreated'), 'success');

    if (data.Id) {
      emit('created', data.Id);
    }

    model.value = false;
  } catch (error) {
    console.error(error);
    useSnackbar(t('anErrorHappened'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>
