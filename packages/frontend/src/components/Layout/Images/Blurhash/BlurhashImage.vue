<template>
  <JOverlay>
    <JImg
      class="uno-h-full uno-w-full"
      :src="imageUrl"
      :alt="item.Name ?? $t('unknown')"
      :priority="priority"
      v-bind="$attrs">
      <template #placeholder>
        <JOverlay>
          <BlurhashCanvas
            v-if="hash"
            :hash="hash"
            :width="width"
            :height="height"
            :punch="punch"
            class="uno-h-full uno-w-full">
            <BlurhashImageIcon
              :item="item"
              class="uno-z--1" />
          </BlurhashCanvas>
          <BlurhashImageIcon
            v-else
            :item="item" />
        </JOverlay>
      </template>
    </JImg>
  </JOverlay>
</template>

<script setup lang="ts">
import {
  type BaseItemDto,
  type BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { getBlurhash, getImageInfo } from '#/utils/images.ts';

const { item, width, height, punch, type = ImageType.Primary, imageWidth, priority } = defineProps<{
  item: BaseItemDto | BaseItemPerson;
  /** Blurhash canvas pixel width (NOT the requested server image width). */
  width?: number;
  /** Blurhash canvas pixel height. */
  height?: number;
  punch?: number;
  type?: ImageType;
  /**
   * Hint the server-side image width. Caps the URL so card-sized images
   * don't download full-resolution masters. Passed through to `getImageInfo`.
   */
  imageWidth?: number;
  /**
   * Forward to `JImg`. Use for hero/backdrop callers; default off so grid
   * cards stay lazy.
   */
  priority?: boolean;
}>();

const imageUrl = computed(() => getImageInfo(item, {
  preferThumb: type === ImageType.Thumb,
  preferBanner: type === ImageType.Banner,
  preferLogo: type === ImageType.Logo,
  preferBackdrop: type === ImageType.Backdrop,
  inheritThumb: false,
  width: imageWidth
}).url);
const hash = computed(() => getBlurhash(item, type));
</script>
