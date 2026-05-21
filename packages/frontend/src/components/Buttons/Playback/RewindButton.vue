<template>
  <JTooltip
    position="top"
    :text="t('rewind')">
    <VBtn
      v-bind="$attrs"
      icon
      @click="playbackManager.skipBackward">
      <JIcon
        v-bind="$attrs"
        class="i-mdi:rewind-15" />
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { playbackManager } from '#/store/playback-manager.ts';

const { t } = useTranslation();
</script>
