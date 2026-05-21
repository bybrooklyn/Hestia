<template>
  <JTooltip
    position="top"
    :text="t('next')">
    <VBtn
      v-bind="$attrs"
      icon
      :disabled="!playbackManager.nextItem.value"
      @click="playbackManager.setNextItem">
      <JIcon
        v-bind="$attrs"
        class="i-mdi:skip-next" />
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { playbackManager } from '#/store/playback-manager.ts';

const { t } = useTranslation();
</script>
