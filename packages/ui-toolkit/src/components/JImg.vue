<template>
  <template v-if="src">
    <link
      v-if="priority && !shown"
      rel="preload"
      as="image"
      :href="src"
      v-bind="{ fetchpriority: 'high' }"
      @load.passive="onLoad"
      @error.passive="onError">
    <JTransition
      v-bind="isObj(transitionProps) ? transitionProps : undefined"
      :disabled="!transitionProps">
      <img
        v-if="shown"
        :src="src"
        :alt="alt"
        class="uno-w-full uno-h-full uno-object-cover"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
        decoding="async"
        v-bind="getBaseProps($attrs)">
      <JOverlay
        v-else
        v-bind="$attrs">
        <!--
          Hidden lazy/eager loader drives the @load -> shown flip without
          injecting an eager preload. When `priority` is false, the browser
          only fetches once this element scrolls into view (native
          loading="lazy"), so off-screen grid cards no longer compete with
          critical resources on cold load.
        -->
        <img
          v-if="!priority"
          :src="src"
          :alt="alt"
          aria-hidden="true"
          class="uno-absolute uno-w-px uno-h-px uno-opacity-0 uno-pointer-events-none"
          loading="lazy"
          fetchpriority="auto"
          decoding="async"
          @load.passive="onLoad"
          @error.passive="onError">
        <slot
          v-if="$slots.placeholder?.({}).length"
          name="placeholder" />
        <slot
          v-else-if="loading"
          name="loading">
          <JProgressCircular
            class="uno-flex uno-items-center uno-justify-center uno-w-full uno-h-full"
            indeterminate />
        </slot>
        <slot
          v-else-if="error"
          name="error">
          <JIcon class="i-mdi:image-broken-variant" />
        </slot>
      </JOverlay>
    </JTransition>
  </template>
  <slot
    v-else-if="$slots.placeholder?.({}).length"
    name="placeholder" />
  <slot v-else />
</template>

<script setup lang="ts">
/**
 * @component
 * Two load paths:
 *
 * - `priority` images inject a `<link rel="preload" as="image">` with
 *   `fetchpriority="high"` (LCP candidates: hero/backdrop, item-detail
 *   poster). The link's `@load` flips `shown` so the visible <img> mounts
 *   from cache.
 * - Non-priority images render a hidden 1px <img loading="lazy"> inside the
 *   placeholder slot. Browser-native lazy loading defers the fetch until the
 *   placeholder scrolls near the viewport; once it loads, `shown` flips and
 *   the visible <img loading="lazy"> mounts (cached, same URL).
 *
 * Visible <img> always uses `decoding="async"` so image decode can't block
 * the main thread during scroll.
 */
import { computed, shallowRef, watch } from 'vue';
import { isObj } from '@jellyfin-vue/shared/validation';
import JIcon from './JIcon.vue';
import JProgressCircular from './JProgressCircular.vue';
import JTransition, { type JTransitionProps } from './JTransition.vue';
import JOverlay from './JOverlay.vue';
import { getBaseProps } from '#/util/props.ts';

/**
 * We don't want <link> to inherit any attributes and the component might not render any
 * element at all, printing unnecessary warnings in development.
 */
defineOptions({
  inheritAttrs: false
});

const { src, alt, once, priority, transitionProps = true } = defineProps<{
  src?: string;
  alt: string;
  /**
   * If this is true, the image won't follow the load procedures after a src change and the image will simply be
   * updated in place without showing any of the slots.
   */
  once?: boolean;
  /**
   * Hero/LCP images that should bypass lazy loading. Adds a high-priority
   * preload hint, sets `loading="eager"`, and uses `fetchpriority="high"`.
   * Off by default — most grid/list cards should stay lazy.
   */
  priority?: boolean;
  /**
   * Transition between the non-default slot and the image. Uses JTransition with its
   * default values (which you can override by passing this prop). If passed false, disables de transition completely.
   *
   * @default true
   */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  transitionProps?: JTransitionProps | boolean;
}>();

const loading = shallowRef(true);
const error = shallowRef(false);
const shown = computed(() => !loading.value && !error.value);

/**
 * Event handler for the loadstart event
 */
function onLoadStart(): void {
  if (!once) {
    loading.value = true;
  }
}

/**
 * Event handler for the load event
 */
function onLoad(): void {
  loading.value = false;
  error.value = false;
}

/**
 * Event handler for the error event
 */
function onError(): void {
  loading.value = false;
  error.value = true;
}

watch(() => src, onLoadStart);
</script>
