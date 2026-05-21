<template>
  <JTooltip
    position="top"
    :text="t('fastForward')">
    <VBtn
      v-bind="$attrs"
      icon
      @click="playbackManager.skipForward">
      <JIcon
        v-bind="$attrs"
        class="i-mdi:fast-forward-15" />
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { playbackManager } from '#/store/playback-manager.ts';

const { t } = useTranslation();
</script>
