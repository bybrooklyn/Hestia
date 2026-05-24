<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('transcodingAndStreaming') }}
    </template>
    <template #content>
      <VCol
        md="8"
        class="uno-pb-4 uno-pt-0">
        <VAlert
          v-if="loadError"
          type="error"
          variant="tonal"
          class="uno-mb-4">
          {{ t('errorLoadingSettingsPage') }}
        </VAlert>
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

        <VTextField
          v-if="encoding.HardwareAccelerationType === HardwareAccelerationType.Vaapi"
          :model-value="encoding.VaapiDevice ?? ''"
          variant="outlined"
          :label="t('vaapiDevice')"
          :hint="t('vaapiDeviceHint')"
          persistent-hint
          @update:model-value="v => encoding!.VaapiDevice = v || null" />

        <VTextField
          v-if="encoding.HardwareAccelerationType === HardwareAccelerationType.Qsv"
          :model-value="encoding.QsvDevice ?? ''"
          variant="outlined"
          :label="t('qsvDevice')"
          :hint="t('qsvDeviceHint')"
          persistent-hint
          @update:model-value="v => encoding!.QsvDevice = v || null" />

        <template v-if="isHardwareAccelerationEnabled">
          <h4 class="uno-mb-2 uno-mt-4 uno-text-base uno-font-bold">
            {{ t('hardwareDecoding') }}
          </h4>
          <VCheckbox
            v-for="codec in availableCodecs"
            :key="codec.codec"
            :model-value="enabledHardwareCodecs.includes(codec.codec)"
            :label="codec.name"
            hide-details
            @update:model-value="v => setHardwareCodec(codec.codec, v ?? false)" />
          <VCheckbox
            v-if="supportsHevcVp9Depth"
            :model-value="encoding.EnableDecodingColorDepth10Hevc"
            label="HEVC 10-bit"
            hide-details
            @update:model-value="v => encoding!.EnableDecodingColorDepth10Hevc = v ?? false" />
          <VCheckbox
            v-if="supportsHevcVp9Depth"
            :model-value="encoding.EnableDecodingColorDepth10Vp9"
            label="VP9 10-bit"
            hide-details
            @update:model-value="v => encoding!.EnableDecodingColorDepth10Vp9 = v ?? false" />
          <VCheckbox
            v-if="supportsHevcRext"
            :model-value="encoding.EnableDecodingColorDepth10HevcRext"
            label="HEVC RExt 8/10-bit"
            hide-details
            @update:model-value="v => encoding!.EnableDecodingColorDepth10HevcRext = v ?? false" />
          <VCheckbox
            v-if="supportsHevcRext"
            :model-value="encoding.EnableDecodingColorDepth12HevcRext"
            label="HEVC RExt 12-bit"
            hide-details
            @update:model-value="v => encoding!.EnableDecodingColorDepth12HevcRext = v ?? false" />
          <VCheckbox
            v-if="encoding.HardwareAccelerationType === HardwareAccelerationType.Nvenc"
            :model-value="encoding.EnableEnhancedNvdecDecoder"
            :label="t('enableEnhancedNvdecDecoder')"
            hide-details
            @update:model-value="v => encoding!.EnableEnhancedNvdecDecoder = v ?? false" />
          <VCheckbox
            v-if="encoding.HardwareAccelerationType === HardwareAccelerationType.Qsv"
            :model-value="encoding.PreferSystemNativeHwDecoder"
            :label="t('preferSystemNativeHwDecoder')"
            hide-details
            @update:model-value="v => encoding!.PreferSystemNativeHwDecoder = v ?? false" />

          <h4 class="uno-mb-2 uno-mt-4 uno-text-base uno-font-bold">
            {{ t('hardwareEncoding') }}
          </h4>
          <VCheckbox
            :model-value="encoding.EnableHardwareEncoding"
            :label="t('enableHardwareEncoding')"
            hide-details
            @update:model-value="v => encoding!.EnableHardwareEncoding = v ?? false" />
          <VCheckbox
            v-if="supportsIntelLowPowerEncoding"
            :model-value="encoding.EnableIntelLowPowerH264HwEncoder"
            :label="t('enableIntelLowPowerH264HwEncoder')"
            hide-details
            @update:model-value="v => encoding!.EnableIntelLowPowerH264HwEncoder = v ?? false" />
          <VCheckbox
            v-if="supportsIntelLowPowerEncoding"
            :model-value="encoding.EnableIntelLowPowerHevcHwEncoder"
            :label="t('enableIntelLowPowerHevcHwEncoder')"
            hide-details
            @update:model-value="v => encoding!.EnableIntelLowPowerHevcHwEncoder = v ?? false" />
        </template>

        <h4 class="uno-mb-2 uno-mt-4 uno-text-base uno-font-bold">
          {{ t('encodingFormatOptions') }}
        </h4>
        <VCheckbox
          :model-value="encoding.AllowHevcEncoding"
          :label="t('allowHevcEncoding')"
          hide-details
          @update:model-value="v => encoding!.AllowHevcEncoding = v ?? false" />
        <VCheckbox
          :model-value="encoding.AllowAv1Encoding"
          :label="t('allowAv1Encoding')"
          hide-details
          @update:model-value="v => encoding!.AllowAv1Encoding = v ?? false" />

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

        <VTextField
          :model-value="remoteClientBitrateLimitMbps"
          variant="outlined"
          type="number"
          :label="t('remoteBitrateLimit')"
          @update:model-value="v => remoteClientBitrateLimitMbps = Number(v) || 0" />

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
          :model-value="trickplay.EnableHwEncoding"
          :label="t('trickplayEnableHwEncoding')"
          @update:model-value="v => trickplay!.EnableHwEncoding = v ?? false" />

        <VCheckbox
          :model-value="trickplay.EnableKeyFrameOnlyExtraction"
          :label="t('trickplayKeyFrameOnly')"
          :hint="t('trickplayKeyFrameOnlyHint')"
          persistent-hint
          @update:model-value="v => trickplay!.EnableKeyFrameOnlyExtraction = v ?? false" />

        <VRow class="uno-mt-2">
          <VCol cols="6">
            <VSelect
              :model-value="trickplay.ScanBehavior"
              variant="outlined"
              :items="trickplayScanBehaviorOptions"
              item-title="title"
              item-value="value"
              :label="t('trickplayScanBehavior')"
              @update:model-value="v => trickplay!.ScanBehavior = v" />
          </VCol>
          <VCol cols="6">
            <VSelect
              :model-value="trickplay.ProcessPriority"
              variant="outlined"
              :items="processPriorityOptions"
              item-title="title"
              item-value="value"
              :label="t('processPriority')"
              @update:model-value="v => trickplay!.ProcessPriority = v" />
          </VCol>
        </VRow>

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

        <VTextField
          :model-value="trickplay.WidthResolutions?.join(',') ?? ''"
          variant="outlined"
          :label="t('trickplayWidthResolutions')"
          :hint="t('commaSeparatedNumbers')"
          persistent-hint
          @update:model-value="v => trickplay!.WidthResolutions = numberList(v)" />

        <VRow class="uno-mt-2">
          <VCol cols="6">
            <VTextField
              :model-value="trickplay.TileWidth"
              variant="outlined"
              type="number"
              :label="t('trickplayTileWidth')"
              @update:model-value="v => trickplay!.TileWidth = Number(v) || 0" />
          </VCol>
          <VCol cols="6">
            <VTextField
              :model-value="trickplay.TileHeight"
              variant="outlined"
              type="number"
              :label="t('trickplayTileHeight')"
              @update:model-value="v => trickplay!.TileHeight = Number(v) || 0" />
          </VCol>
        </VRow>

        <VRow>
          <VCol cols="6">
            <VTextField
              :model-value="trickplay.Qscale"
              variant="outlined"
              type="number"
              :label="t('trickplayQscale')"
              @update:model-value="v => trickplay!.Qscale = Number(v) || 0" />
          </VCol>
          <VCol cols="6">
            <VTextField
              :model-value="trickplay.ProcessThreads"
              variant="outlined"
              type="number"
              :label="t('trickplayThreads')"
              @update:model-value="v => trickplay!.ProcessThreads = Number(v) || 0" />
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
import { type EncodingOptions, type ServerConfiguration, type TrickplayOptions, EncoderPreset, HardwareAccelerationType, ProcessPriorityClass, TrickplayScanBehavior } from '@jellyfin/sdk/lib/generated-client';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue';
import { watchDeep } from '@vueuse/core';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useApi } from '#/composables/apis.ts';
import { taskManager } from '#/store/task-manager.ts';

const { t } = useTranslation();

interface HardwareCodec {
  name: string;
  codec: string;
  types: HardwareAccelerationType[];
}

const CODECS: HardwareCodec[] = [
  { name: 'H264', codec: 'h264', types: [HardwareAccelerationType.Amf, HardwareAccelerationType.Nvenc, HardwareAccelerationType.Qsv, HardwareAccelerationType.Vaapi, HardwareAccelerationType.Rkmpp, HardwareAccelerationType.Videotoolbox, HardwareAccelerationType.V4l2m2m] },
  { name: 'HEVC', codec: 'hevc', types: [HardwareAccelerationType.Amf, HardwareAccelerationType.Nvenc, HardwareAccelerationType.Qsv, HardwareAccelerationType.Vaapi, HardwareAccelerationType.Rkmpp, HardwareAccelerationType.Videotoolbox] },
  { name: 'MPEG1', codec: 'mpeg1video', types: [HardwareAccelerationType.Rkmpp] },
  { name: 'MPEG2', codec: 'mpeg2video', types: [HardwareAccelerationType.Amf, HardwareAccelerationType.Nvenc, HardwareAccelerationType.Qsv, HardwareAccelerationType.Vaapi, HardwareAccelerationType.Rkmpp] },
  { name: 'MPEG4', codec: 'mpeg4', types: [HardwareAccelerationType.Nvenc, HardwareAccelerationType.Rkmpp] },
  { name: 'VC1', codec: 'vc1', types: [HardwareAccelerationType.Amf, HardwareAccelerationType.Nvenc, HardwareAccelerationType.Qsv, HardwareAccelerationType.Vaapi] },
  { name: 'VP8', codec: 'vp8', types: [HardwareAccelerationType.Nvenc, HardwareAccelerationType.Qsv, HardwareAccelerationType.Vaapi, HardwareAccelerationType.Rkmpp, HardwareAccelerationType.Videotoolbox] },
  { name: 'VP9', codec: 'vp9', types: [HardwareAccelerationType.Amf, HardwareAccelerationType.Nvenc, HardwareAccelerationType.Qsv, HardwareAccelerationType.Vaapi, HardwareAccelerationType.Rkmpp, HardwareAccelerationType.Videotoolbox] },
  { name: 'AV1', codec: 'av1', types: [HardwareAccelerationType.Amf, HardwareAccelerationType.Nvenc, HardwareAccelerationType.Qsv, HardwareAccelerationType.Vaapi, HardwareAccelerationType.Rkmpp, HardwareAccelerationType.Videotoolbox] }
];
const HEVC_VP9_HW_DECODING_TYPES = new Set<HardwareAccelerationType>([
  HardwareAccelerationType.Amf,
  HardwareAccelerationType.Nvenc,
  HardwareAccelerationType.Qsv,
  HardwareAccelerationType.Vaapi,
  HardwareAccelerationType.Rkmpp
]);
const HEVC_REXT_DECODING_TYPES = new Set<HardwareAccelerationType>([
  HardwareAccelerationType.Nvenc,
  HardwareAccelerationType.Qsv,
  HardwareAccelerationType.Vaapi
]);

const loadError = shallowRef<unknown>();
const encoding = ref<EncodingOptions>({});
const trickplay = ref<TrickplayOptions>({});
const serverSettings = ref<ServerConfiguration>({});

/**
 * Three named configurations drive this page:
 *   - `encoding`  → transcoding + streaming (per-server EncodingOptions)
 *   - `trickplay` → trickplay generation (per-server TrickplayOptions)
 * plus the server's main `ServerConfiguration` for resume thresholds.
 *
 * Fetched via direct axios + try/catch (rather than `useApi`) so that a
 * server missing one of the configs doesn't strand the page on Suspense's
 * previous tree — see `composables/apis.ts:449` (never-resolve on failure).
 */
try {
  const api = remote.sdk.newUserApi(getConfigurationApi);
  const [encodingRes, trickplayRes, serverRes] = await Promise.all([
    api.getNamedConfiguration({ key: 'encoding' }),
    api.getNamedConfiguration({ key: 'trickplay' }),
    api.getConfiguration()
  ]);

  serverSettings.value = serverRes.data;
  encoding.value = encodingRes.data as EncodingOptions;
  trickplay.value = serverRes.data.TrickplayOptions ?? trickplayRes.data as TrickplayOptions;
} catch (error) {
  loadError.value = error;
  console.error('[settings/transcoding] failed to load configuration', error);
}

const hardwareAccelOptions = computed(() => Object.values(HardwareAccelerationType).map(value => ({
  title: value === 'none' ? t('none') : value.toUpperCase(),
  value
})));

const encoderPresetOptions = computed(() => Object.values(EncoderPreset).map(value => ({
  title: value.charAt(0).toUpperCase() + value.slice(1),
  value
})));

const hardwareAccelerationType = computed(() =>
  encoding.value.HardwareAccelerationType ?? HardwareAccelerationType.None
);
const isHardwareAccelerationEnabled = computed(() =>
  hardwareAccelerationType.value !== HardwareAccelerationType.None
);
const availableCodecs = computed(() =>
  CODECS.filter(codec => codec.types.includes(hardwareAccelerationType.value))
);
const enabledHardwareCodecs = computed(() =>
  encoding.value.HardwareDecodingCodecs ?? []
);
const supportsHevcVp9Depth = computed(() =>
  HEVC_VP9_HW_DECODING_TYPES.has(hardwareAccelerationType.value)
);
const supportsHevcRext = computed(() =>
  HEVC_REXT_DECODING_TYPES.has(hardwareAccelerationType.value)
);
const supportsIntelLowPowerEncoding = computed(() =>
  hardwareAccelerationType.value === HardwareAccelerationType.Qsv
  || hardwareAccelerationType.value === HardwareAccelerationType.Vaapi
);
const remoteClientBitrateLimitMbps = computed({
  get: () => (serverSettings.value.RemoteClientBitrateLimit ?? 0) / 1_000_000,
  set: (value: number) => {
    serverSettings.value.RemoteClientBitrateLimit = Math.max(0, value) * 1_000_000;
  }
});
const trickplayScanBehaviorOptions = computed(() => Object.values(TrickplayScanBehavior).map(value => ({
  title: t(value === TrickplayScanBehavior.Blocking ? 'blockingScan' : 'nonBlockingScan'),
  value
})));
const processPriorityOptions = computed(() => Object.values(ProcessPriorityClass)
  .filter(value => value !== ProcessPriorityClass.RealTime)
  .map(value => ({
    title: value,
    value
  })));

/**
 * Toggle one codec inside the hardware decoding codec list.
 */
function setHardwareCodec(codec: string, enabled: boolean): void {
  const codecs = new Set<string>();

  for (const value of encoding.value.HardwareDecodingCodecs ?? []) {
    codecs.add(value);
  }

  if (enabled) {
    codecs.add(codec);
  } else {
    codecs.delete(codec);
  }

  encoding.value.HardwareDecodingCodecs = [...codecs];
}

/**
 * Parse comma-separated positive numbers for trickplay resolution lists.
 */
function numberList(value: string): number[] {
  return value
    .split(',')
    .map(v => Number(v.trim()))
    .filter(v => Number.isFinite(v) && v > 0);
}

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
)(() => ({ serverConfiguration: { ...serverSettings.value, TrickplayOptions: trickplay.value } }));

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
