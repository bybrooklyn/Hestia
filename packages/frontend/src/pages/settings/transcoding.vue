<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('transcodingAndStreaming') }}
    </template>
    <template #content>
      <VCol
        md="8"
        class="uno-pb-4 uno-pt-0">
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('transcoding') }}
        </h3>

        <VSelect
          :model-value="encoding.HardwareAccelerationType"
          variant="outlined"
          :items="hardwareAccelOptions"
          item-title="title"
          item-value="value"
          :label="t('hardwareAcceleration')"
          @update:model-value="v => encoding!.HardwareAccelerationType = v" />

        <VSelect
          :model-value="encoding.EncoderPreset"
          variant="outlined"
          :items="encoderPresetOptions"
          item-title="title"
          item-value="value"
          :label="t('encoderPreset')"
          @update:model-value="v => encoding!.EncoderPreset = v" />

        <VRow>
          <VCol cols="6">
            <VTextField
              :model-value="encoding.H264Crf"
              variant="outlined"
              type="number"
              :label="t('h264Crf')"
              @update:model-value="v => encoding!.H264Crf = Number(v) || 0" />
          </VCol>
          <VCol cols="6">
            <VTextField
              :model-value="encoding.H265Crf"
              variant="outlined"
              type="number"
              :label="t('h265Crf')"
              @update:model-value="v => encoding!.H265Crf = Number(v) || 0" />
          </VCol>
        </VRow>

        <VTextField
          :model-value="encoding.EncodingThreadCount"
          variant="outlined"
          type="number"
          :label="t('encodingThreadCount')"
          :hint="t('encodingThreadCountHint')"
          persistent-hint
          @update:model-value="v => encoding!.EncodingThreadCount = Number(v) || 0" />

        <VTextField
          :model-value="encoding.TranscodingTempPath ?? ''"
          variant="outlined"
          :label="t('transcodingTempPath')"
          class="uno-mt-4"
          @update:model-value="v => encoding!.TranscodingTempPath = v || null" />

        <VCheckbox
          :model-value="encoding.EnableAudioVbr"
          :label="t('enableAudioVbr')"
          @update:model-value="v => encoding!.EnableAudioVbr = v ?? false" />

        <VCheckbox
          :model-value="encoding.EnableFallbackFont"
          :label="t('enableFallbackFont')"
          @update:model-value="v => encoding!.EnableFallbackFont = v ?? false" />

        <VTextField
          v-if="encoding.EnableFallbackFont"
          :model-value="encoding.FallbackFontPath ?? ''"
          variant="outlined"
          :label="t('fallbackFontPath')"
          @update:model-value="v => encoding!.FallbackFontPath = v || null" />

        <h3 class="uno-mb-2 uno-mt-6 uno-text-lg uno-font-bold">
          {{ t('streaming') }}
        </h3>

        <VCheckbox
          :model-value="encoding.EnableThrottling"
          :label="t('enableTranscodeThrottling')"
          :hint="t('enableTranscodeThrottlingHint')"
          persistent-hint
          @update:model-value="v => encoding!.EnableThrottling = v ?? false" />

        <VTextField
          v-if="encoding.EnableThrottling"
          :model-value="encoding.ThrottleDelaySeconds"
          variant="outlined"
          type="number"
          :label="t('throttleDelaySeconds')"
          class="uno-mt-4"
          @update:model-value="v => encoding!.ThrottleDelaySeconds = Number(v) || 0" />

        <VCheckbox
          :model-value="encoding.EnableSegmentDeletion"
          :label="t('enableSegmentDeletion')"
          @update:model-value="v => encoding!.EnableSegmentDeletion = v ?? false" />

        <VTextField
          v-if="encoding.EnableSegmentDeletion"
          :model-value="encoding.SegmentKeepSeconds"
          variant="outlined"
          type="number"
          :label="t('segmentKeepSeconds')"
          @update:model-value="v => encoding!.SegmentKeepSeconds = Number(v) || 0" />

        <h3 class="uno-mb-2 uno-mt-6 uno-text-lg uno-font-bold">
          {{ t('resume') }}
        </h3>

        <VRow>
          <VCol cols="6">
            <VTextField
              :model-value="serverSettings.MinResumePct"
              variant="outlined"
              type="number"
              :label="t('minResumePct')"
              @update:model-value="v => serverSettings!.MinResumePct = Number(v) || 0" />
          </VCol>
          <VCol cols="6">
            <VTextField
              :model-value="serverSettings.MaxResumePct"
              variant="outlined"
              type="number"
              :label="t('maxResumePct')"
              @update:model-value="v => serverSettings!.MaxResumePct = Number(v) || 0" />
          </VCol>
        </VRow>

        <VTextField
          :model-value="serverSettings.MinResumeDurationSeconds"
          variant="outlined"
          type="number"
          :label="t('minResumeDurationSeconds')"
          @update:model-value="v => serverSettings!.MinResumeDurationSeconds = Number(v) || 0" />

        <VRow>
          <VCol cols="6">
            <VTextField
              :model-value="serverSettings.MinAudiobookResume"
              variant="outlined"
              type="number"
              :label="t('minAudiobookResume')"
              @update:model-value="v => serverSettings!.MinAudiobookResume = Number(v) || 0" />
          </VCol>
          <VCol cols="6">
            <VTextField
              :model-value="serverSettings.MaxAudiobookResume"
              variant="outlined"
              type="number"
              :label="t('maxAudiobookResume')"
              @update:model-value="v => serverSettings!.MaxAudiobookResume = Number(v) || 0" />
          </VCol>
        </VRow>

        <h3 class="uno-mb-2 uno-mt-6 uno-text-lg uno-font-bold">
          {{ t('trickplay') }}
        </h3>

        <VCheckbox
          :model-value="trickplay.EnableHwAcceleration"
          :label="t('trickplayEnableHwAcceleration')"
          @update:model-value="v => trickplay!.EnableHwAcceleration = v ?? false" />

        <VCheckbox
          :model-value="trickplay.EnableKeyFrameOnlyExtraction"
          :label="t('trickplayKeyFrameOnly')"
          :hint="t('trickplayKeyFrameOnlyHint')"
          persistent-hint
          @update:model-value="v => trickplay!.EnableKeyFrameOnlyExtraction = v ?? false" />

        <VRow class="uno-mt-2">
          <VCol cols="6">
            <VTextField
              :model-value="trickplay.Interval"
              variant="outlined"
              type="number"
              :label="t('trickplayInterval')"
              @update:model-value="v => trickplay!.Interval = Number(v) || 0" />
          </VCol>
          <VCol cols="6">
            <VTextField
              :model-value="trickplay.JpegQuality"
              variant="outlined"
              type="number"
              :label="t('trickplayJpegQuality')"
              @update:model-value="v => trickplay!.JpegQuality = Number(v) || 0" />
          </VCol>
        </VRow>
      </VCol>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import type { EncodingOptions, ServerConfiguration, TrickplayOptions } from '@jellyfin/sdk/lib/generated-client';
import { EncoderPreset, HardwareAccelerationType } from '@jellyfin/sdk/lib/generated-client';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { computed, onScopeDispose, shallowRef, watch } from 'vue';
import { watchDeep } from '@vueuse/core';
import { useTranslation } from 'i18next-vue';
import { useApi } from '#/composables/apis.ts';
import { taskManager } from '#/store/task-manager.ts';

const { t } = useTranslation();

/**
 * Three named configurations drive this page:
 *   - `encoding`  → transcoding + streaming (per-server EncodingOptions)
 *   - `trickplay` → trickplay generation (per-server TrickplayOptions)
 * plus the server's main `ServerConfiguration` for resume thresholds.
 */
const [
  { data: encodingRaw },
  { data: trickplayRaw },
  { data: serverSettings }
] = await Promise.all([
  useApi(getConfigurationApi, 'getNamedConfiguration')(() => ({ key: 'encoding' })),
  useApi(getConfigurationApi, 'getNamedConfiguration')(() => ({ key: 'trickplay' })),
  useApi(getConfigurationApi, 'getConfiguration')()
]);

const encoding = shallowRef(encodingRaw.value as EncodingOptions);
const trickplay = shallowRef(trickplayRaw.value as TrickplayOptions);

const hardwareAccelOptions = computed(() => Object.values(HardwareAccelerationType).map(value => ({
  title: value === 'none' ? t('none') : value.toUpperCase(),
  value
})));

const encoderPresetOptions = computed(() => Object.values(EncoderPreset).map(value => ({
  title: value.charAt(0).toUpperCase() + value.slice(1),
  value
})));

const tasks = new Map<number, string>();
const signal = shallowRef(false);

const { loading: l1 } = await useApi(
  getConfigurationApi,
  () => signal.value ? 'updateNamedConfiguration' : undefined,
  { skipCache: { request: true }, globalLoading: false }
)(() => ({ key: 'encoding', body: JSON.stringify(encoding.value) }));
const { loading: l2 } = await useApi(
  getConfigurationApi,
  () => signal.value ? 'updateNamedConfiguration' : undefined,
  { skipCache: { request: true }, globalLoading: false }
)(() => ({ key: 'trickplay', body: JSON.stringify(trickplay.value) }));
const { loading: l3 } = await useApi(
  getConfigurationApi,
  () => signal.value ? 'updateConfiguration' : undefined,
  { skipCache: { request: true }, globalLoading: false }
)(() => ({ serverConfiguration: serverSettings.value }));

watch([l1, l2, l3], (newvals) => {
  for (let idx = 0; idx < newvals.length; idx++) {
    if (newvals[idx] && !tasks.has(idx)) {
      tasks.set(idx, taskManager.startConfigSync());
    } else {
      const taskId = tasks.get(idx);

      if (taskId) {
        taskManager.finishTask(taskId);
        tasks.delete(idx);
      }
    }
  }
});

watchDeep([encoding, trickplay, serverSettings], () => signal.value = true, { once: true });

onScopeDispose(() => {
  for (const [, id] of tasks) {
    taskManager.finishTask(id);
  }
});
</script>
