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
        <VCard
          min-width="320"
          class="playback-settings-menu">
          <VList
            v-if="!activePanel"
            density="compact">
            <VListItem
              v-if="mediaSources.length > 1"
              :title="$t('version')"
              :subtitle="selectedMediaSourceTitle"
              @click="activePanel = 'version'">
              <template #prepend>
                <JIcon class="i-mdi:content-duplicate uno-w-10" />
              </template>
              <template #append>
                <JIcon class="i-mdi:chevron-right" />
              </template>
            </VListItem>
            <VListItem
              :title="$t('quality')"
              :subtitle="selectedQualityTitle"
              @click="activePanel = 'quality'">
              <template #prepend>
                <JIcon class="i-mdi:speedometer uno-w-10" />
              </template>
              <template #append>
                <JIcon class="i-mdi:chevron-right" />
              </template>
            </VListItem>
            <VListItem
              :title="$t('audio')"
              :subtitle="selectedAudioTitle"
              :disabled="!playbackManager.currentItemAudioTracks.value?.length"
              @click="activePanel = 'audio'">
              <template #prepend>
                <JIcon class="i-mdi:surround-sound uno-w-10" />
              </template>
              <template #append>
                <JIcon class="i-mdi:chevron-right" />
              </template>
            </VListItem>
            <VListItem
              v-if="playbackManager.isVideo.value"
              :title="$t('subtitles')"
              :subtitle="selectedSubtitleTitle"
              :disabled="!playbackManager.currentItemSubtitleTracks.value?.length"
              @click="activePanel = 'subtitles'">
              <template #prepend>
                <JIcon class="i-mdi:closed-caption-outline uno-w-10" />
              </template>
              <template #append>
                <JIcon class="i-mdi:chevron-right" />
              </template>
            </VListItem>
            <VListItem
              :title="$t('speed')"
              :subtitle="selectedSpeedTitle"
              @click="activePanel = 'speed'">
              <template #prepend>
                <JIcon class="i-mdi:play-speed uno-w-10" />
              </template>
              <template #append>
                <JIcon class="i-mdi:chevron-right" />
              </template>
            </VListItem>
            <VListItem
              v-if="playbackManager.isVideo.value"
              :title="$t('mediaInfoAspectRatio')"
              :subtitle="selectedFitModeTitle"
              @click="activePanel = 'aspect'">
              <template #prepend>
                <JIcon class="i-mdi:aspect-ratio uno-w-10" />
              </template>
              <template #append>
                <JIcon class="i-mdi:chevron-right" />
              </template>
            </VListItem>
            <VListItem
              v-if="playbackManager.isVideo.value"
              :title="t('audioVideoSync')"
              :subtitle="syncSummary"
              @click="activePanel = 'sync'">
              <template #prepend>
                <JIcon class="i-mdi:tune-variant uno-w-10" />
              </template>
              <template #append>
                <JIcon class="i-mdi:chevron-right" />
              </template>
            </VListItem>
          </VList>
          <template v-else>
            <div class="settings-panel-header text-subtitle-2 uno-font-semibold">
              <VBtn
                icon
                size="small"
                @click="activePanel = undefined">
                <JIcon class="i-mdi:chevron-left" />
              </VBtn>
              <span>{{ activePanelTitle }}</span>
            </div>
            <VDivider />
            <VList
              v-if="activePanel === 'version'"
              density="compact">
              <VListItem
                v-for="source in mediaSources"
                :key="source.value"
                :title="source.title"
                @click="selectMediaSource(source.value)">
                <template
                  v-if="source.value === mediaSourceIndex"
                  #prepend>
                  <JIcon class="i-mdi:check uno-w-10" />
                </template>
              </VListItem>
            </VList>
            <VList
              v-else-if="activePanel === 'quality'"
              density="compact">
              <VListItem
                v-for="quality in qualityItems"
                :key="quality.value"
                :title="quality.title"
                @click="selectQuality(quality.value)">
                <template
                  v-if="quality.value === maxStreamingBitrate"
                  #prepend>
                  <JIcon class="i-mdi:check uno-w-10" />
                </template>
              </VListItem>
            </VList>
            <VCardText v-else-if="activePanel === 'audio'">
              <MediaStreamSelector
                v-if="playbackManager.currentItemAudioTracks.value"
                :media-streams="playbackManager.currentItemAudioTracks.value"
                type="Audio"
                :default-stream-index="playbackManager.currentAudioTrack.value?.Index"
                @input="playbackManager.currentAudioTrack.value = $event ?? -1" />
            </VCardText>
            <VCardText v-else-if="activePanel === 'subtitles'">
              <div class="text-caption text--secondary uno-mb-1 uno-font-semibold">
                {{ t('primarySubtitle') }}
              </div>
              <MediaStreamSelector
                v-if="playbackManager.currentItemSubtitleTracks.value"
                :media-streams="playbackManager.currentItemSubtitleTracks.value"
                type="Subtitle"
                :default-stream-index="
                  playbackManager.currentSubtitleTrack.value?.Index
                "
                @input="playbackManager.currentSubtitleTrack.value = $event ?? -1" />
              <div class="text-caption text--secondary uno-mb-1 uno-mt-4 uno-font-semibold">
                {{ t('secondarySubtitle') }}
              </div>
              <MediaStreamSelector
                v-if="playbackManager.currentItemSubtitleTracks.value"
                :media-streams="playbackManager.currentItemSubtitleTracks.value"
                type="Subtitle"
                :default-stream-index="
                  playbackManager.currentSecondarySubtitleTrack.value?.Index
                "
                @input="playbackManager.currentSecondarySubtitleTrack.value = $event ?? -1" />
            </VCardText>
            <VCardText v-else-if="activePanel === 'speed'">
              <VCombobox
                v-model="playbackSpeed"
                density="compact"
                :items="playbackItems"
                item-title="title"
                item-value="speed"
                :prefix
                :rules="validationRules"
                @update:focused="onFocus" />
            </VCardText>
            <VList
              v-else-if="activePanel === 'aspect'"
              density="compact">
              <VListItem
                v-for="mode in fitModeItems"
                :key="mode.value"
                :title="mode.title"
                @click="selectFitMode(mode.value)">
                <template
                  v-if="mode.value === playerElement.state.value.fitMode"
                  #prepend>
                  <JIcon class="i-mdi:check uno-w-10" />
                </template>
              </VListItem>
            </VList>
            <VCardText v-else-if="activePanel === 'sync'">
              <VTextField
                :model-value="playbackManager.audioOffset.value"
                type="number"
                density="compact"
                hide-details
                variant="outlined"
                :step="50"
                :label="t('audioDelay')"
                @update:model-value="v => playbackManager.audioOffset.value = Number(v) || 0" />
              <VTextField
                class="uno-mt-3"
                :model-value="playbackManager.subtitleOffset.value"
                type="number"
                density="compact"
                hide-details
                variant="outlined"
                :step="50"
                :label="t('subtitleDelay')"
                @update:model-value="v => playbackManager.subtitleOffset.value = Number(v) || 0" />
            </VCardText>
          </template>
        </VCard>
      </VMenu>
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client';
import { computed, shallowRef, watch } from 'vue';
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

type FitMode = 'contain' | 'cover' | 'fill';
type SettingsPanel = 'version' | 'quality' | 'audio' | 'subtitles' | 'speed' | 'aspect' | 'sync';

const activePanel = shallowRef<SettingsPanel>();

watch(menuModel, (opened) => {
  if (!opened) {
    activePanel.value = undefined;
  }
});

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

const selectedMediaSourceTitle = computed(() =>
  mediaSources.value.find(source => source.value === mediaSourceIndex.value)?.title
  ?? `${t('version')} ${mediaSourceIndex.value + 1}`
);

const selectedQualityTitle = computed(() =>
  qualityItems.value.find(quality => quality.value === maxStreamingBitrate.value)?.title
  ?? t('auto')
);

const selectedAudioTitle = computed(() =>
  playbackManager.currentAudioTrack.value?.DisplayTitle ?? t('auto')
);

const selectedSubtitleTitle = computed(() => {
  const primary = playbackManager.currentSubtitleTrack.value?.DisplayTitle ?? t('disabled');
  const secondary = playbackManager.currentSecondarySubtitleTrack.value?.DisplayTitle;

  return secondary ? `${primary} / ${secondary}` : primary;
});

const fitModeItems = computed<{ title: string; value: FitMode }[]>(() => [
  { title: t('normal'), value: 'contain' },
  { title: t('aspectCover'), value: 'cover' },
  { title: t('aspectFill'), value: 'fill' }
]);

const selectedFitModeTitle = computed(() =>
  fitModeItems.value.find(mode => mode.value === playerElement.state.value.fitMode)?.title
  ?? t('normal')
);

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

const selectedSpeedTitle = computed(() => {
  const speed = playbackManager.playbackSpeed.value;

  return speed === 1 ? t('normal') : `${speed}x`;
});

const syncSummary = computed(() => {
  const audio = playbackManager.audioOffset.value ?? 0;
  const subtitle = playbackManager.subtitleOffset.value ?? 0;

  return audio === 0 && subtitle === 0
    ? t('normal')
    : t('audioVideoSyncSummary', { audio, subtitle });
});

const activePanelTitle = computed(() => {
  switch (activePanel.value) {
    case 'version': {
      return t('version');
    }
    case 'quality': {
      return t('quality');
    }
    case 'audio': {
      return t('audio');
    }
    case 'subtitles': {
      return t('subtitles');
    }
    case 'speed': {
      return t('speed');
    }
    case 'aspect': {
      return t('mediaInfoAspectRatio');
    }
    case 'sync': {
      return t('audioVideoSync');
    }
    default: {
      return t('playbackSettings');
    }
  }
});

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

/**
 * Switches the current media source/version and returns to the top-level settings menu.
 */
function selectMediaSource(index: number): void {
  mediaSourceIndex.value = index;
  activePanel.value = undefined;
}

/**
 * Updates the max streaming bitrate and returns to the top-level settings menu.
 */
function selectQuality(value: number): void {
  maxStreamingBitrate.value = value;
  activePanel.value = undefined;
}

/**
 * Applies the selected video fit mode and returns to the top-level settings menu.
 */
function selectFitMode(mode: FitMode): void {
  playerElement.state.value.fitMode = mode;
  activePanel.value = undefined;
}
</script>

<style scoped>
.playback-settings-menu {
  overflow: hidden;
}

.settings-panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0.25rem 0.5rem;
}
</style>
