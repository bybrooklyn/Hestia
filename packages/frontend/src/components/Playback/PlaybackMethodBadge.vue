<template>
  <JTooltip
    v-if="playbackManager.playMethod.value"
    :text="reasonsText"
    position="bottom">
    <VChip
      size="small"
      variant="flat"
      label
      :color="playbackManager.playMethod.value === 'Transcode' ? 'warning' : 'success'">
      {{ label }}
    </VChip>
  </JTooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { playbackManager } from '#/store/playback-manager.ts';

const { t } = useTranslation();

/**
 * Human-readable label for the current playback method.
 */
const label = computed(() => {
  switch (playbackManager.playMethod.value) {
    case 'DirectPlay': {
      return t('directPlay');
    }
    case 'DirectStream': {
      return t('directStream');
    }
    case 'Transcode': {
      return t('transcoding');
    }
    default: {
      return '';
    }
  }
});

/**
 * Transcode reasons, humanised from the server enum (e.g. `VideoCodecNotSupported`
 * -> `Video Codec Not Supported`), shown as a tooltip on the badge. Empty when
 * not transcoding, in which case JTooltip renders the bare chip.
 */
const reasonsText = computed(() => {
  if (playbackManager.playMethod.value !== 'Transcode') {
    return '';
  }

  return playbackManager.transcodeReasons.value
    .map(reason => reason.replaceAll(/([A-Z])/gu, ' $1').trim())
    .join(', ');
});
</script>
