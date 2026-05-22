<template>
  <span v-bind="baseProps">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { getBaseProps } from '#/util/props.ts';

const attrs = useAttrs();
const baseProps = computed(() => getBaseProps(attrs) as any);
</script>
