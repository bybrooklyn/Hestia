<template>
  <JTooltip
    :text="$t('playbackSettings')"
    position="top">
    <VBtn
      icon
      class="uno-self-center">
      <JIcon class="i-mdi:cog" />
      <VMenu
        v-model="menuModel"
        :close-on-content-click="false"
        :transition="'slide-y-transition'"
        location="top">
        <VCard min-width="300">
          <VCardText>
            <VRow
              v-if="mediaSources.length > 1"
              align="center">
              <VCol :cols="4">
                <label>{{ $t('version') }}</label>
              </VCol>
              <VCol :cols="8">
                <VSelect
                  v-model="mediaSourceIndex"
                  density="comfortable"
                  :items="mediaSources"
                  item-title="title"
                  item-value="value"
                  hide-details />
              </VCol>
            </VRow>
            <VRow align="center">
              <VCol :cols="4">
                <label>{{ $t('quality') }}</label>
              </VCol>
              <VCol :cols="8">
                <VSelect
                  v-model="maxStreamingBitrate"
                  density="comfortable"
                  :items="qualityItems"
                  item-title="title"
                  item-value="value"
                  hide-details />
              </VCol>
            </VRow>
            <VRow align="center">
              <VCol :cols="4">
                <label>{{ $t('audio') }}</label>
              </VCol>
              <VCol :cols="8">
                <MediaStreamSelector
                  v-if="playbackManager.currentItemAudioTracks.value"
                  :media-streams="playbackManager.currentItemAudioTracks.value"
                  type="Audio"
                  :default-stream-index="playbackManager.currentAudioTrack.value?.Index"
                  @input="playbackManager.currentAudioTrack.value = $event ?? -1" />
              </VCol>
            </VRow>
            <VRow
              v-if="playbackManager.isVideo.value && !$vuetify.display.smAndUp"
              align="center">
              <VCol :cols="4">
                <label>{{ $t('subtitles') }}</label>
              </VCol>
              <VCol :cols="8">
                <MediaStreamSelector
                  v-if="playbackManager.currentItemSubtitleTracks.value"
                  :media-streams="playbackManager.currentItemSubtitleTracks.value"
                  type="Subtitle"
                  :default-stream-index="
                    playbackManager.currentSubtitleTrack.value?.Index
                  "
                  @input="playbackManager.currentSubtitleTrack.value = $event ?? -1" />
              </VCol>
            </VRow>
            <VRow
              v-if="playbackManager.isVideo.value && !$vuetify.display.smAndUp"
              align="center">
              <VCol :cols="4">
                <label>Secondary Subtitle</label>
              </VCol>
              <VCol :cols="8">
                <MediaStreamSelector
                  v-if="playbackManager.currentItemSubtitleTracks.value"
                  :media-streams="playbackManager.currentItemSubtitleTracks.value"
                  type="Subtitle"
                  :default-stream-index="
                    playbackManager.currentSecondarySubtitleTrack.value?.Index
                  "
                  @input="playbackManager.currentSecondarySubtitleTrack.value = $event ?? -1" />
              </VCol>
            </VRow>
            <VRow align="center">
              <VCol :cols="4">
                <label>{{ $t('speed') }}</label>
              </VCol>
              <VCol :cols="8">
                <VCombobox
                  v-model="playbackSpeed"
                  density="comfortable"
                  :items="playbackItems"
                  item-title="title"
                  item-value="speed"
                  :prefix
                  :rules="validationRules"
                  @update:focused="onFocus" />
              </VCol>
            </VRow>
            <VRow
              v-if="playbackManager.isVideo.value"
              align="center">
              <VCol :cols="4">
                <label>{{ $t('mediaInfoAspectRatio') }}</label>
              </VCol>
              <VCol
                :cols="8"
                class="text-right">
                <VSelect
                  v-model="playerElement.state.value.fitMode"
                  :items="fitModeItems"
                  item-title="title"
                  item-value="value"
                  density="comfortable"
                  hide-details />
              </VCol>
            </VRow>
            <VRow
              v-if="playbackManager.isVideo.value"
              align="center">
              <VCol :cols="6">
                <label>Audio Delay (ms)</label>
              </VCol>
              <VCol
                :cols="6"
                class="text-right">
                <VTextField
                  v-model.number="playbackManager.audioOffset.value"
                  type="number"
                  density="compact"
                  hide-details
                  variant="outlined"
                  :step="50" />
              </VCol>
            </VRow>
            <VRow
              v-if="playbackManager.isVideo.value"
              align="center">
              <VCol :cols="6">
                <label>Subtitle Delay (ms)</label>
              </VCol>
              <VCol
                :cols="6"
                class="text-right">
                <VTextField
                  v-model.number="playbackManager.subtitleOffset.value"
                  type="number"
                  density="compact"
                  hide-details
                  variant="outlined"
                  :step="50" />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VMenu>
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client';
import { computed, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isObj, isStr, isUndef } from '@jellyfin-vue/shared/validation';
import { playbackManager } from '#/store/playback-manager.ts';
import { playerElement } from '#/store/player-element.ts';
import {
  getAudioQualityOptions,
  getVideoQualityOptions
} from '#/utils/quality-options.ts';

const menuModel = defineModel<boolean>();
const { t } = useTranslation();

/**
 * Streaming quality presets, dynamic per source.
 *
 * Mirrors jellyfin-web's behaviour: only options at or below the source's
 * bitrate are shown, plus a single entry just above it so the user can
 * pick the file's native bitrate. The Auto entry includes a hint of what
 * the cap currently resolves to. For audio, the full preset list is used
 * (no source-aware filtering needed — every audio preset fits).
 */
const qualityItems = computed(() => {
  const source = playbackManager.currentMediaSource.value;
  const currentMax = playbackManager.maxStreamingBitrate.value;
  const autoLabel = t('auto');

  if (playbackManager.isVideo.value) {
    const videoStream = source?.MediaStreams?.find(
      s => s.Type === MediaStreamType.Video
    );

    return getVideoQualityOptions({
      currentMaxBitrate: currentMax,
      videoBitRate: videoStream?.BitRate,
      videoCodec: videoStream?.Codec,
      enableAuto: true,
      autoLabel
    }).map(o => ({ title: o.name, value: o.bitrate }));
  }

  return getAudioQualityOptions({
    currentMaxBitrate: currentMax,
    enableAuto: true,
    autoLabel
  }).map(o => ({ title: o.name, value: o.bitrate }));
});
const maxStreamingBitrate = computed({
  get: () => playbackManager.maxStreamingBitrate.value ?? 0,
  set: (val: number) => {
    playbackManager.maxStreamingBitrate.value = val || undefined;
  }
});

const mediaSources = computed(() =>
  (playbackManager.currentItem.value?.MediaSources ?? []).map((source, index: number) => ({
    title: source.Name ?? `${t('version')} ${index + 1}`,
    value: index
  }))
);
const mediaSourceIndex = computed({
  get: () => playbackManager.currentMediaSourceIndex.value ?? 0,
  set: (val: number) => {
    playbackManager.currentMediaSourceIndex.value = val;
  }
});

const fitModeItems = computed(() => [
  { title: t('normal'), value: 'contain' },
  { title: 'Cover', value: 'cover' },
  { title: 'Fill', value: 'fill' }
]);

const defaultPlaybackSpeeds = Object.freeze([0.5, 0.75, 1, 1.25, 1.5, 2]);

interface PlaybackSpeedItem {
  title: string;
  speed: number;
}

const playbackItems = computed<PlaybackSpeedItem[]>(() => defaultPlaybackSpeeds.map(speed => ({
  title: speed === 1 ? t('normal') : String(speed),
  speed
})));

type PlaybackSpeedValue = string | PlaybackSpeedItem | null;

const _playbackSpeed = shallowRef<PlaybackSpeedValue>();
const playbackSpeed = computed({
  get: () => {
    const playbackSpeedIndex = defaultPlaybackSpeeds.indexOf(playbackManager.playbackSpeed.value);

    if (isUndef(_playbackSpeed.value)) {
      return playbackSpeedIndex === -1 ? String(playbackManager.playbackSpeed.value) : playbackItems.value[playbackSpeedIndex];
    } else {
      return _playbackSpeed.value;
    }
  },
  set: (val: PlaybackSpeedValue) => {
    _playbackSpeed.value = val;

    if (validationRules.every(rule => rule(val) === true)) {
      playbackManager.playbackSpeed.value = isObj(val) ? val.speed : Number(val);
    }
  }
});
const prefix = computed(() => isObj(playbackSpeed.value) && playbackSpeed.value.speed === 1 ? undefined : 'x');

const validationRules = [
  (val: PlaybackSpeedValue): true | string => isObj(val) || isStr(val) || t('required'),
  (val: PlaybackSpeedValue): true | string => isObj(val) || (isStr(val) && !Number.isNaN(Number(val))) || t('mustBeNumber'),
  (val: PlaybackSpeedValue): true | string => {
    const num_val = isObj(val) ? val.speed : Number(val);

    /**
     * Chromium ranges:
     * https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/html/media/html_media_element.cc
     */
    return (num_val >= 0.0625 && num_val <= 16) || t('mustBeInRange', { min: 0.0625, max: 16 });
  }
];

/**
 * Set one of the objects on Combobox's blur
 */
function onFocus(e: boolean): void {
  if (!e) {
    const playbackSpeedIndex = defaultPlaybackSpeeds.indexOf(playbackManager.playbackSpeed.value);

    if (playbackSpeedIndex !== -1) {
      _playbackSpeed.value = playbackItems.value[playbackSpeedIndex];
    }
  }
}
</script>
