<template>
  <span v-bind="baseProps">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { getBaseProps } from '#/util/props.ts';

const attrs = useAttrs();
/**
 * `getBaseProps` returns Vue's `mergeProps` shape (untyped record); v-bind
 * on a span wants a stricter `HTMLAttributes` shape that we can't satisfy
 * without erasing the optional values, so cast via `any` rather than ship
 * a misleading partial type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseProps = computed(() => getBaseProps(attrs) as any);
</script>
