<template>
  <JTooltip
    position="top"
    :text="playbackManager.isMuted.value ? t('unmute') : t('mute')">
    <VBtn
      v-bind="$attrs"
      icon
      @click="playbackManager.toggleMute">
      <JIcon
        v-bind="$attrs"
        :class="iconClass" />
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { playbackManager } from '#/store/playback-manager.ts';

const { t } = useTranslation();

/**
 * Mirror jellyfin-web / VLC: when muted show the explicit "off" icon
 * regardless of volume level, otherwise pick the icon whose loudspeaker
 * bars match the current volume tier.
 */
const iconClass = computed(() => {
  if (playbackManager.isMuted.value) {
    return 'i-mdi:volume-off';
  }

  const volume = playbackManager.currentVolume.value ?? 0;

  if (volume === 0) {
    return 'i-mdi:volume-mute';
  }

  if (volume < 34) {
    return 'i-mdi:volume-low';
  }

  if (volume < 67) {
    return 'i-mdi:volume-medium';
  }

  return 'i-mdi:volume-high';
});
</script>
