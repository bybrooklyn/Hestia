<template>
  <div class="playback-stats uno-text-caption uno-absolute uno-rounded uno-px-4 uno-py-3">
    <div class="text-subtitle-2 uno-mb-1">
      {{ $t('playbackStats') }}
    </div>
    <table>
      <tbody>
        <tr
          v-for="row in stats"
          :key="row.label">
          <td class="text--secondary uno-pr-4">
            {{ row.label }}
          </td>
          <td>{{ row.value }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { mediaControls, mediaElementRef } from '#/store/index.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { formatBitRate } from '#/utils/items.ts';

const { t } = useTranslation();

/**
 * Reading `currentTime` ties this panel to the media element's `timeupdate`
 * events, so the live values (dropped frames, buffer) refresh during playback.
 */
const stats = computed(() => {
  const currentTime = playbackManager.currentTime.value;
  const element = mediaElementRef.value;
  const quality = element instanceof HTMLVideoElement
    ? element.getVideoPlaybackQuality()
    : undefined;
  const bufferedRange = mediaControls.buffered.value.find(
    ([start, end]) => currentTime >= start && currentTime <= end
  );
  const bufferAhead = bufferedRange ? Math.round(bufferedRange[1] - currentTime) : 0;
  const video = playbackManager.currentVideoTrack.value;
  const audio = playbackManager.currentAudioTrack.value;
  const source = playbackManager.currentMediaSource.value;
  const join = (...parts: (string | number | undefined)[]) =>
    parts.filter(Boolean).join(' ') || '—';

  return [
    { label: t('playback'), value: playbackManager.playMethod.value ?? '—' },
    {
      label: t('video'),
      value: join(
        video?.Codec?.toUpperCase(),
        video?.Width && video.Height ? `${video.Width}×${video.Height}` : undefined
      )
    },
    {
      label: t('audio'),
      value: join(audio?.Codec?.toUpperCase(), audio?.ChannelLayout ?? undefined)
    },
    {
      label: t('mediaInfoGenericBitrate'),
      value: source?.Bitrate ? formatBitRate(source.Bitrate) : '—'
    },
    {
      label: t('droppedFrames'),
      value: quality ? `${quality.droppedVideoFrames} / ${quality.totalVideoFrames}` : '—'
    },
    { label: t('bufferHealth'), value: `${bufferAhead}s` }
  ];
});
</script>

<style scoped>
.playback-stats {
  top: 5em;
  left: 1em;
  z-index: 10;
  background: rgb(var(--j-theme-color-background), 0.6);
  pointer-events: none;
}
</style>
