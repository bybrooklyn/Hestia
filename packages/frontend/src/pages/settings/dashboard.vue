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
          {{ t('activeTranscodes') }}
          <span class="uno-text-disabled uno-ml-2 uno-text-sm">
            ({{ transcodingSessions.length }})
          </span>
        </h3>
        <div
          v-if="transcodingSessions.length === 0"
          class="uno-text-disabled uno-py-4">
          {{ t('noActiveTranscodes') }}
        </div>
        <VList
          v-else
          class="transcodes"
          lines="three">
          <VListItem
            v-for="s in transcodingSessions"
            :key="`transcode-${s.Id ?? ''}`"
            :title="s.UserName ?? t('unknown')">
            <template #prepend>
              <JIcon
                class="i-mdi:transit-transfer uno-mr-3 uno-text-xl" />
            </template>
            <template #subtitle>
              <div class="uno-text-xs">
                {{ transcodeSummary(s) }}
              </div>
              <div
                v-if="transcodeReasons(s).length > 0"
                class="uno-text-disabled uno-mt-1 uno-text-xs">
                {{ transcodeReasons(s).join(', ') }}
              </div>
              <VProgressLinear
                v-if="s.TranscodingInfo?.CompletionPercentage != null"
                class="uno-mt-1"
                :model-value="s.TranscodingInfo.CompletionPercentage"
                color="primary"
                height="3" />
            </template>
          </VListItem>
        </VList>

        <h3 class="uno-mb-2 uno-mt-6 uno-text-lg uno-font-bold">
          {{ t('activeSessions') }}
          <span class="uno-text-disabled uno-ml-2 uno-text-sm">
            ({{ sessions.length }})
          </span>
        </h3>
        <div
          v-if="sessions.length === 0"
          class="uno-text-disabled uno-py-4">
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
import { computed, onScopeDispose, shallowRef, watch } from 'vue';
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

/**
 * Pull the current session list from the server. Errors leave the existing
 * `sessions` value untouched so a transient blip doesn't blank the UI.
 */
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

  if (msg?.MessageType !== 'Sessions' || !Array.isArray(msg.Data)) {
    return;
  }

  sessions.value = (msg.Data as SessionInfoDto[]).filter(
    s => s.IsActive !== false
  );
});

const { pause: stopPoll, resume: startPoll } = useIntervalFn(
  () => void refetchSessions(),
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

/**
 * Sessions currently transcoding — derived from the same list as DASH-2,
 * no extra API call. Useful as a quick-glance monitor for server load.
 */
const transcodingSessions = computed(() =>
  sessions.value.filter(s => s.TranscodingInfo)
);

/**
 * Compact one-line summary of an active transcode: container, codec
 * changes (direct vs re-encode), resolution, framerate, bitrate.
 */
function transcodeSummary(s: SessionInfoDto): string {
  const t_info = s.TranscodingInfo;

  if (!t_info) {
    return '';
  }

  const parts: string[] = [];

  if (t_info.Container) {
    parts.push(t_info.Container.toUpperCase());
  }

  if (t_info.VideoCodec) {
    parts.push(`${t_info.IsVideoDirect ? 'direct' : ''} v:${t_info.VideoCodec}`.trim());
  }

  if (t_info.AudioCodec) {
    parts.push(`${t_info.IsAudioDirect ? 'direct' : ''} a:${t_info.AudioCodec}`.trim());
  }

  if (t_info.Width && t_info.Height) {
    parts.push(`${t_info.Width}×${t_info.Height}`);
  }

  if (t_info.Framerate) {
    parts.push(`${t_info.Framerate.toFixed(2)} fps`);
  }

  if (t_info.Bitrate) {
    parts.push(`${(t_info.Bitrate / 1_000_000).toFixed(1)} Mbps`);
  }

  return parts.join(' · ');
}

/**
 * Reason strings the server attached to the transcode (e.g.
 * `VideoCodecNotSupported`). Returns an empty array if absent.
 */
function transcodeReasons(s: SessionInfoDto): string[] {
  /**
   * The SDK mistypes TranscodeReasons as an empty enum; at runtime it's an
   * array of reason strings (mirrors the same fix in playback-manager.ts).
   */
  return (s.TranscodingInfo?.TranscodeReasons as string[] | undefined) ?? [];
}

/**
 * Build the subtitle line shown under each session: now-playing item
 * (with series prefix if any), then `client · device`. Falls back to
 * `client · device` (or device type) when nothing is playing.
 */
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
