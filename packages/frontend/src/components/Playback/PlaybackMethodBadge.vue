<template>
  <VChip
    v-if="playbackManager.playMethod.value"
    size="small"
    variant="flat"
    label
    :color="playbackManager.playMethod.value === 'Transcode' ? 'warning' : 'success'">
    {{ label }}
  </VChip>
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
</script>
