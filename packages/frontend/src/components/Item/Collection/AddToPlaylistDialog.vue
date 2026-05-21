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
        {{ t('addToPlaylist') }}
      </VCardTitle>
      <VDivider />
      <VCardText>
        <VSelect
          v-model="selectedId"
          :items="playlistOptions"
          item-title="title"
          item-value="value"
          :label="t('playlist')"
          :hint="t('addToPlaylistHint')"
          persistent-hint />
        <div
          v-if="selectedId === NEW_PLAYLIST_VALUE"
          class="uno-mt-2">
          <VBtn
            variant="outlined"
            block
            @click="createDialog = true">
            <JIcon class="i-mdi:plus uno-mr-1" />
            {{ t('createPlaylist') }}
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
  <CreatePlaylistDialog
    v-if="createDialog && item.Id"
    :seed-item-ids="[item.Id]"
    @close="createDialog = false"
    @created="onCreated" />
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
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
 * Sentinel value used to surface the "create a new playlist" option
 * inline with the existing-playlist list. The actual id is empty so
 * we can distinguish it from any real playlist.
 */
const NEW_PLAYLIST_VALUE = '__new__';

const { t } = useTranslation();
const model = ref(true);
const loading = ref(false);
const createDialog = ref(false);
const selectedId = ref<string>(NEW_PLAYLIST_VALUE);
const playlists = shallowRef<BaseItemDto[]>([]);

/**
 * Fetch the user's existing playlists for the picker. Note that
 * playlists are user-scoped (not shared across the server), so the
 * `userId` filter is required for accuracy.
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
        includeItemTypes: ['Playlist'],
        recursive: true,
        sortBy: ['SortName']
      });

      playlists.value = data.Items ?? [];
    } catch (error) {
      console.error(error);
    }
  })();
});

const playlistOptions = computed(() => [
  { title: t('newPlaylist'), value: NEW_PLAYLIST_VALUE },
  ...playlists.value.map(p => ({
    title: p.Name ?? '',
    value: p.Id ?? ''
  }))
]);

const canAdd = computed(() =>
  selectedId.value !== NEW_PLAYLIST_VALUE && selectedId.value.length > 0
);

/**
 * Add the current item to the chosen existing playlist via
 * `addItemToPlaylist`. The "create a new playlist" path is handled
 * separately via the nested `CreatePlaylistDialog`.
 */
async function addToExisting(): Promise<void> {
  if (!item.Id || !canAdd.value) {
    return;
  }

  loading.value = true;

  try {
    await remote.sdk.newUserApi(getPlaylistsApi).addItemToPlaylist({
      playlistId: selectedId.value,
      ids: [item.Id],
      userId: remote.auth.currentUserId.value ?? undefined
    });
    useSnackbar(t('itemAddedToPlaylist'), 'success');
    model.value = false;
  } catch (error) {
    console.error(error);
    useSnackbar(t('anErrorHappened'), 'error');
  } finally {
    loading.value = false;
  }
}

/**
 * `CreatePlaylistDialog` already seeds the new playlist with the
 * current item id, so once it emits `created` we just close this
 * dialog — the item is already attached.
 */
function onCreated(_playlistId: string): void {
  createDialog.value = false;
  model.value = false;
}
</script>
