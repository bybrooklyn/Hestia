<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('dashboard') }}
    </template>
    <template #content>
      <VCol
        md="8"
        class="uno-pb-4 uno-pt-0">
        <VAlert
          v-if="systemInfo?.HasPendingRestart"
          type="warning"
          variant="tonal"
          class="uno-mb-4">
          {{ t('restartPending') }}
        </VAlert>
        <VAlert
          v-if="systemInfo?.HasUpdateAvailable"
          type="info"
          variant="tonal"
          class="uno-mb-4">
          {{ t('updateAvailable') }}
        </VAlert>

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('serverOverview') }}
        </h3>
        <VTable
          class="overview"
          density="comfortable">
          <tbody>
            <tr>
              <th>{{ t('server') }}</th>
              <td>{{ systemInfo?.ServerName }}</td>
            </tr>
            <tr>
              <th>{{ t('serverVersion') }}</th>
              <td>{{ systemInfo?.Version }}</td>
            </tr>
            <tr v-if="systemInfo?.OperatingSystemDisplayName || systemInfo?.OperatingSystem">
              <th>{{ t('operatingSystem') }}</th>
              <td>
                {{ systemInfo?.OperatingSystemDisplayName || systemInfo?.OperatingSystem }}
              </td>
            </tr>
            <tr v-if="systemInfo?.SystemArchitecture">
              <th>{{ t('architecture') }}</th>
              <td>{{ systemInfo?.SystemArchitecture }}</td>
            </tr>
            <tr v-if="systemInfo?.CachePath">
              <th>{{ t('cachePath') }}</th>
              <td>{{ systemInfo?.CachePath }}</td>
            </tr>
            <tr v-if="systemInfo?.LogPath">
              <th>{{ t('logPath') }}</th>
              <td>{{ systemInfo?.LogPath }}</td>
            </tr>
            <tr v-if="systemInfo?.InternalMetadataPath">
              <th>{{ t('metadataPath') }}</th>
              <td>{{ systemInfo?.InternalMetadataPath }}</td>
            </tr>
            <tr v-if="systemInfo?.TranscodingTempPath">
              <th>{{ t('transcodePath') }}</th>
              <td>{{ systemInfo?.TranscodingTempPath }}</td>
            </tr>
            <tr v-if="systemInfo?.WebPath">
              <th>{{ t('webClientPath') }}</th>
              <td>{{ systemInfo?.WebPath }}</td>
            </tr>
          </tbody>
        </VTable>

        <h3 class="uno-mb-2 uno-mt-6 uno-text-lg uno-font-bold">
          {{ t('activeSessions') }}
          <span class="uno-ml-2 uno-text-sm uno-text-disabled">
            ({{ sessions.length }})
          </span>
        </h3>
        <div
          v-if="sessions.length === 0"
          class="uno-py-4 uno-text-disabled">
          {{ t('noActiveSessions') }}
        </div>
        <VList
          v-else
          class="sessions"
          lines="two">
          <VListItem
            v-for="s in sessions"
            :key="s.Id ?? ''"
            :title="s.UserName ?? t('unknown')"
            :subtitle="sessionSubtitle(s)">
            <template #prepend>
              <UserImage
                :user="{ Id: s.UserId, PrimaryImageTag: s.UserPrimaryImageTag } as UserDto"
                :size="40" />
            </template>
            <template
              v-if="s.NowPlayingItem"
              #append>
              <VChip
                size="small"
                color="primary"
                variant="tonal">
                {{ t('nowPlaying') }}
              </VChip>
            </template>
            <template #default="{}">
              <VListItemSubtitle>{{ sessionSubtitle(s) }}</VListItemSubtitle>
              <VProgressLinear
                v-if="s.NowPlayingItem && sessionProgress(s) !== undefined"
                class="uno-mt-1"
                :model-value="sessionProgress(s)"
                color="primary"
                height="3" />
            </template>
          </VListItem>
        </VList>
      </VCol>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import type { SessionInfoDto, UserDto } from '@jellyfin/sdk/lib/generated-client';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { useIntervalFn } from '@vueuse/core';
import { onScopeDispose, shallowRef, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { useApi } from '#/composables/apis.ts';
import { remote } from '#/plugins/remote/index.ts';
import { ticksToMs } from '#/utils/time.ts';

const { t } = useTranslation();

/**
 * SystemInfo is a one-shot read — version, paths and encoders don't change
 * during a session. Live data (sessions, transcodes) is layered on top.
 */
const { data: systemInfo } = await useApi(getSystemApi, 'getSystemInfo')();

/**
 * Active sessions. Initial value via the SDK; live updates come from the
 * `Sessions` WebSocket frame (the server already pushes them periodically
 * once `SessionsStart` has been sent, which `plugins/remote/socket.ts`
 * does on connect). A 10-s `useIntervalFn` poll covers the case where the
 * socket is down.
 */
const sessions = shallowRef<SessionInfoDto[]>([]);

async function refetchSessions(): Promise<void> {
  try {
    const { data } = await remote.sdk.newUserApi(getSessionApi).getSessions({
      activeWithinSeconds: 960
    });

    sessions.value = data.filter(s => s.IsActive !== false);
  } catch {
    // leave previous list intact on transient failure
  }
}

await refetchSessions();

watch(remote.socket.message, () => {
  const msg = remote.socket.message.value;

  if (!msg || msg.MessageType !== 'Sessions' || !Array.isArray(msg.Data)) {
    return;
  }

  sessions.value = (msg.Data as SessionInfoDto[]).filter(
    s => s.IsActive !== false
  );
});

const { pause: stopPoll, resume: startPoll } = useIntervalFn(
  refetchSessions,
  10_000,
  { immediate: false }
);

watch(
  () => remote.socket.isConnected.value,
  (connected) => {
    if (connected) {
      stopPoll();
    } else {
      startPoll();
    }
  },
  { immediate: true }
);

onScopeDispose(() => stopPoll());

function sessionSubtitle(s: SessionInfoDto): string {
  const client = [s.Client, s.DeviceName].filter(Boolean).join(' · ');

  if (!s.NowPlayingItem) {
    return client || (s.DeviceType ?? '');
  }

  const item = s.NowPlayingItem;
  const title = [item.SeriesName, item.Name].filter(Boolean).join(' — ')
    || (item.Name ?? t('unknownTitle'));

  return `${title} · ${client}`;
}

/**
 * Returns a percentage [0..100] for the now-playing item's progress, or
 * undefined if either position or runtime are missing.
 */
function sessionProgress(s: SessionInfoDto): number | undefined {
  const item = s.NowPlayingItem;
  const positionTicks = s.PlayState?.PositionTicks;

  if (!item?.RunTimeTicks || !positionTicks) {
    return;
  }

  const ratio = ticksToMs(positionTicks) / ticksToMs(item.RunTimeTicks);

  return Math.max(0, Math.min(100, ratio * 100));
}

</script>

<style scoped>
.overview th {
  width: 1%;
  white-space: nowrap;
  padding-right: 1.5rem !important;
  font-weight: 600;
}
</style>
