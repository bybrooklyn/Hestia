<template>
  <JTooltip
    position="top"
    :text="$t('queue')">
    <VBtn
      icon
      class="uno-self-center">
      <JIcon class="i-mdi:playlist-play" />
      <VMenu
        v-model="menuModel"
        :close-on-content-click="closeOnClick"
        :transition="'slide-y-transition'"
        :width="listWidth"
        location="top">
        <VCard>
          <VList>
            <VListItem :title="sourceText">
              <template #prepend>
                <VAvatar>
                  <BlurhashImage
                    v-if="playbackManager.initiator.value"
                    :item="playbackManager.initiator.value" />
                  <JIcon
                    v-else
                    :class="modeIcon" />
                </VAvatar>
              </template>
              <template #subtitle>
                {{ getTotalEndsAtTime(playbackManager.queue.value) }} -
                {{
                  $t('queueItems', {
                    items: playbackManager.queueLength.value
                  })
                }}
              </template>
            </VListItem>
          </VList>
          <VDivider />
          <VList class="queue-area">
            <DraggableQueue />
          </VList>
          <VSpacer />
          <VCardActions>
            <JTooltip
              position="top"
              :text="$t('clearQueue')">
              <VBtn
                icon
                @click="playbackManager.stop">
                <JIcon class="i-mdi:playlist-remove" />
              </VBtn>
            </JTooltip>
            <JTooltip
              position="top"
              :text="$t('saveAsPlaylist')">
              <VBtn
                icon
                :disabled="playbackManager.queueLength.value === 0"
                @click="savingPlaylist = true">
                <JIcon class="i-mdi:content-save" />
              </VBtn>
            </JTooltip>
            <VSpacer />
          </VCardActions>
        </VCard>
      </VMenu>
    </VBtn>
  </JTooltip>
  <VDialog
    v-model="savingPlaylist"
    width="400">
    <VCard>
      <VCardTitle>{{ $t('saveAsPlaylist') }}</VCardTitle>
      <VCardText>
        <VForm @submit.prevent="savePlaylist">
          <VTextField
            v-model="playlistName"
            autofocus
            variant="outlined"
            :label="$t('name')" />
        </VForm>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn @click="savingPlaylist = false">
          {{ $t('cancel') }}
        </VBtn>
        <VBtn
          color="primary"
          :loading
          :disabled="playlistName.trim() === ''"
          @click="savePlaylist">
          {{ $t('confirm') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { JTooltip } from '@jellyfin-vue/ui-toolkit/components';
import { getTotalEndsAtTime } from '#/utils/time.ts';
import { InitMode, playbackManager } from '#/store/playback-manager.ts';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const { size = 40, closeOnClick } = defineProps<{
  size?: number;
  closeOnClick?: boolean;
}>();

const { t } = useTranslation();

/**
 * DraggableQueue pulls sortablejs (~37 KiB). Wrap it async so the dependency
 * loads when the queue menu first opens, not on every player chrome render.
 */
const DraggableQueue = defineAsyncComponent(() =>
  import('#/components/Playback/DraggableQueue.vue')
);

const menuModel = ref(false);
const listWidth = computed(() => `${size}vw`);
const listHeight = computed(() => `${size}vh`);

const sourceText = computed(() => {
  /**
   * The initiator is whatever the user clicked play on — an album, library,
   * playlist, search result, person, etc. Whenever we have its name, use it;
   * fall back to "unknown" only if no initiator was recorded.
   */
  const initiatorName = playbackManager.initiator.value?.Name;
  const substitution = { item: initiatorName };

  switch (playbackManager.playbackInitMode.value) {
    case InitMode.Unknown: {
      return t('unknown');
    }
    case InitMode.Item: {
      return initiatorName ? t('playingFrom', substitution) : t('unknown');
    }
    case InitMode.Shuffle: {
      return t('playinginShuffle');
    }
    case InitMode.ShuffleItem: {
      return initiatorName
        ? t('playingItemInShuffle', substitution)
        : t('playinginShuffle');
    }
  }
});

const modeIcon = computed(() =>
  playbackManager.playbackInitMode.value === InitMode.Shuffle
    ? 'i-mdi:shuffle'
    : 'i-mdi:playlist-music'
);

const savingPlaylist = ref(false);
const playlistName = ref('');
const loading = ref(false);

/**
 * Persist the current queue as a server-side playlist owned by the current
 * user. Uses MediaType `Audio`/`Video` to match the queue's media kind.
 */
async function savePlaylist(): Promise<void> {
  const name = playlistName.value.trim();
  const ids = playbackManager.queue.value
    .map(item => item.Id)
    .filter((id): id is string => Boolean(id));

  if (name === '' || ids.length === 0) {
    return;
  }

  loading.value = true;

  try {
    await remote.sdk.newUserApi(getPlaylistsApi).createPlaylist({
      createPlaylistDto: {
        Name: name,
        Ids: ids,
        UserId: remote.auth.currentUserId.value,
        MediaType: playbackManager.isVideo.value ? 'Video' : 'Audio'
      }
    });

    useSnackbar(t('playlistCreated', { item: name }), 'success');
    playlistName.value = '';
    savingPlaylist.value = false;
  } catch {
    useSnackbar(t('playlistCreateFailed'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.queue-area {
  min-height: v-bind(listHeight);
  max-height: v-bind(listHeight);
}
</style>
