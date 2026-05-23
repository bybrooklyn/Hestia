<template>
  <ItemCols>
    <template #left>
      <VRow
        justify="center"
        justify-md="start">
        <VCol
          cols="7"
          md="3">
          <ItemCard :item="item" />
        </VCol>
        <VCol
          cols="12"
          md="9">
          <h1
            class="text-h4"
            :class="{ 'uno-text-center': !$vuetify.display.mdAndUp }">
            {{ item?.Name }}
          </h1>
          <div
            class="text-caption text-h4 uno-mt-2 uno-font-medium"
            :class="{ 'uno-text-center': !$vuetify.display.mdAndUp }">
            <MediaInfo
              v-if="item"
              :item="item"
              runtime
              ends-at />
          </div>
          <VRow
            class="uno-my-4 uno-items-center"
            :class="{
              'uno-justify-center': !$vuetify.display.mdAndUp,
              'uno-ml-0': $vuetify.display.mdAndUp
            }">
            <PlayButton
              v-if="item"
              :item="item"
              class="uno-mr-2" />
            <PlayButton
              v-if="item"
              :item="item"
              shuffle
              class="uno-mr-2" />
            <LikeButton
              v-if="item"
              :item="item"
              class="uno-mr-2" />
            <VBtn
              icon
              variant="tonal"
              color="error"
              class="uno-mr-2"
              @click="deletePlaylist">
              <JIcon class="i-mdi:delete-outline" />
            </VBtn>
          </VRow>
        </VCol>
      </VRow>

      <!-- Playlist Tracks Table -->
      <div class="uno-mt-8">
        <VCard v-if="playlistTracks.length > 0" class="!uno-bg-slate-900/60 !uno-backdrop-blur-md !uno-border !uno-border-slate-800 uno-rounded-xl">
          <VTable
            density="compact"
            class="playlist-table uno-select-none !uno-bg-transparent">
            <thead>
              <tr>
                <th
                  style="width: 4em"
                  class="text-center pr-0"
                  scope="col">
                  #
                </th>
                <th
                  style="width: 3em"
                  class="pr-0 pl-0"
                  scope="col" />
                <th scope="col">
                  {{ t('title') }}
                </th>
                <th
                  style="width: 12em"
                  scope="col">
                  {{ t('album') }}
                </th>
                <th
                  style="width: 6.5em"
                  class="text-center"
                  scope="col">
                  <JIcon class="i-mdi:clock-outline" />
                </th>
              </tr>
            </thead>
            <tbody ref="tableBody">
              <template
                v-for="(track, index) in playlistTracks"
                :key="track.PlaylistItemId || track.Id">
                <JHover v-slot="{ isHovering }">
                  <tr
                    class="playlist-row uno-cursor-grab active:uno-cursor-grabbing"
                    :class="{ 'text-primary': isPlaying(track) }">
                    <td
                      style="width: 4em"
                      class="pr-0 text-center">
                      <span v-if="isHovering">
                        <JIcon class="i-mdi:drag-horizontal uno-text-slate-400" />
                      </span>
                      <span v-else>{{ index + 1 }}</span>
                    </td>
                    <td
                      style="width: 3em"
                      class="pr-0 pl-0 text-center">
                      <LikeButton :item="track" />
                    </td>
                    <td>
                      <div class="d-flex align-center">
                        <span class="uno-font-semibold">{{ track.Name }}</span>
                        <div
                          v-if="track.Artists && track.Artists.length > 0"
                          class="ml-3 uno-text-slate-400 uno-text-xs">
                          {{ track.Artists.join(', ') }}
                        </div>
                        <VSpacer />
                        <ItemMenu
                          v-show="isHovering"
                          :item="track"
                          :playlist-id="itemId"
                          @removed="onItemRemoved" />
                      </div>
                    </td>
                    <td class="uno-truncate uno-max-w-xs uno-text-slate-400 uno-text-sm">
                      {{ track.Album || '—' }}
                    </td>
                    <td class="text-center uno-text-slate-400">
                      {{ formatTicks(track.RunTimeTicks || 0) }}
                    </td>
                  </tr>
                </JHover>
              </template>
            </tbody>
          </VTable>
        </VCard>

        <div v-else class="uno-text-center uno-py-12">
          <div class="uno-flex uno-justify-center uno-mb-4">
            <div class="uno-bg-slate-800/50 uno-text-slate-400 uno-p-4 uno-rounded-full uno-border uno-border-slate-700/50">
              <div class="i-mdi:playlist-music uno-text-4xl" />
            </div>
          </div>
          <h1 class="text-h5 uno-text-slate-400">
            {{ t('playlistEmpty') }}
          </h1>
        </div>
      </div>
    </template>
  </ItemCols>
</template>

<script setup lang="ts">
import { ref, watch, useTemplateRef, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import type SortableType from 'sortablejs';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { isNumber } from '@jellyfin-vue/shared/validation';
import { useBaseItem } from '#/composables/apis.ts';
import { useItemBackdrop } from '#/composables/backdrop.ts';
import { useItemPageTitle } from '#/composables/page-title.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { formatTicks } from '#/utils/time.ts';
import { useConfirmDialog } from '#/composables/use-confirm-dialog.ts';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const route = useRoute();
const router = useRouter();
const { t } = useTranslation();

const refreshTrigger = ref(0);
const itemId = (route.params as { itemId: string }).itemId;

// Fetch details and items concurrently using Promise.all which preserves strict type safety.
const [{ data: item }, { data: childItems }] = await Promise.all([
  useBaseItem(getUserLibraryApi, 'getItem')(() => ({
    itemId
  })),
  useBaseItem(getPlaylistsApi, 'getPlaylistItems')(() => {
    // Access refreshTrigger.value to register dependency
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshTrigger.value;

    return {
      playlistId: itemId,
      userId: remote.auth.currentUserId.value
    };
  })
]);

const playlistTracks = ref<BaseItemDto[]>([]);

watch(childItems, (newVal) => {
  playlistTracks.value = newVal ? [...newVal] : [];
}, { immediate: true });

useItemPageTitle(item);
useItemBackdrop(item);

// Sortable setup
let sortable: SortableType | undefined;
const tableBody = useTemplateRef('tableBody');

/**
 * Destroys the SortableJS instance if it exists.
 */
function destroySortable() {
  if (sortable) {
    sortable.destroy();
    sortable = undefined;
  }
}

watch(tableBody, async (el) => {
  destroySortable();

  if (el) {
    const { default: Sortable } = await import('sortablejs');

    /**
     * The element may have been unmounted while sortablejs was loading.
     */
    if (tableBody.value !== el) {
      return;
    }

    sortable = new Sortable(el, {
      animation: 300,
      handle: '.playlist-row',
      dragoverBubble: true,
      onUpdate(e) {
        const oldIndex = e.oldIndex;
        const newIndex = e.newIndex;

        if (isNumber(oldIndex) && isNumber(newIndex) && oldIndex !== newIndex) {
          const movedTrack = playlistTracks.value[oldIndex];
          const playlistItemId = movedTrack?.PlaylistItemId;

          if (!playlistItemId) {
            return;
          }

          // Optimistic update
          playlistTracks.value.splice(oldIndex, 1);
          playlistTracks.value.splice(newIndex, 0, movedTrack);

          const fromIndex = oldIndex;
          const toIndex = newIndex;

          /**
           * Moves the item on the server and reverts on failure.
           *
           * @param from - The original index of the track.
           * @param to - The new target index of the track.
           */
          async function handleMove(from: number, to: number) {
            try {
              await remote.sdk.newUserApi(getPlaylistsApi).moveItem({
                playlistId: itemId,
                itemId: playlistItemId!,
                newIndex: to
              });
              useSnackbar(t('playlistReordered'), 'success');
            } catch (error) {
              console.error('Failed to move playlist item:', error);

              // Revert changes on error
              playlistTracks.value.splice(to, 1);
              playlistTracks.value.splice(from, 0, movedTrack!);
              useSnackbar(t('unexpectedError'), 'error');
            }
          }

          void handleMove(fromIndex, toIndex);
        }
      }
    });
  }
});

onBeforeUnmount(() => {
  destroySortable();
});

/**
 * Checks if the track is currently playing in the playback manager.
 */
function isPlaying(track: BaseItemDto): boolean {
  return track.Id === playbackManager.currentItem.value?.Id;
}

/**
 * Increments the refresh trigger to reload playlist items.
 */
function onItemRemoved() {
  refreshTrigger.value++;
}

/**
 * Deletes the playlist using standard API store mechanisms.
 */
async function deletePlaylist() {
  if (!item.value?.Id) {
    return;
  }

  await useConfirmDialog(async () => {
    try {
      const { apiStore } = await import('#/store/dbs/api/index.ts');

      await apiStore.itemDelete(item.value.Id!);
      useSnackbar(t('deleteDeviceSuccess'), 'success');
      await router.push('/');
    } catch (error) {
      console.error(error);
      useSnackbar(t('unexpectedError'), 'error');
    }
  }, {
    title: t('deleteItem'),
    text: t('deleteItemDescription')
  });
}
</script>

<style scoped>
.playlist-table :deep(tbody tr:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
}
</style>
