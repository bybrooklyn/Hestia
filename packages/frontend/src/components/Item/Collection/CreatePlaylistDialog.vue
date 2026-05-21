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
        {{ t('createPlaylist') }}
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
          {{ t('createPlaylistSeed', { count: seedItemIds.length }) }}
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
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const { seedItemIds = [] } = defineProps<{
  /**
   * If provided, the new playlist is created with these items as its
   * initial entries. Used by `ITEM-4` so "Add to → New playlist"
   * creates and populates in one round-trip rather than create-then-add.
   */
  seedItemIds?: string[];
}>();

const emit = defineEmits<{
  close: [];
  created: [playlistId: string];
}>();

const { t } = useTranslation();
const model = ref(true);
const loading = ref(false);
const name = ref('');

/**
 * Matches server-side validation: a playlist needs a non-empty name
 * after trimming whitespace.
 */
const isValid = computed(() => name.value.trim().length > 0);
const requiredRule = (v: string): true | string =>
  v.trim().length > 0 || t('required');

/**
 * Call `createPlaylist`; on success emit `created` with the new id so
 * `AddToPlaylistDialog` can close itself (the item is already attached
 * via the seed-ids round-trip).
 */
async function create(): Promise<void> {
  if (!isValid.value) {
    return;
  }

  loading.value = true;

  try {
    const userId = remote.auth.currentUserId.value;
    const { data } = await remote.sdk.newUserApi(getPlaylistsApi).createPlaylist({
      createPlaylistDto: {
        Name: name.value.trim(),
        Ids: seedItemIds,
        UserId: userId ?? undefined
      }
    });

    useSnackbar(t('playlistCreated', { item: name.value.trim() }), 'success');

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
