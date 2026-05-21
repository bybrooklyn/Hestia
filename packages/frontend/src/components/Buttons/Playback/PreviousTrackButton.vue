<template>
  <JTooltip
    position="top"
    :text="t('previous')">
    <VBtn
      v-bind="$attrs"
      icon
      @click.passive="() => playbackManager.setPreviousItem()"
      @dblclick.passive="() => playbackManager.setPreviousItem(true)">
      <JIcon
        v-bind="$attrs"
        class="i-mdi:skip-previous" />
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { playbackManager } from '#/store/playback-manager.ts';

const { t } = useTranslation();
</script>
