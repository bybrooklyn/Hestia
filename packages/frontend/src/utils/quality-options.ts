/**
 * Dynamic streaming-quality option builder.
 *
 * Ported from jellyfin-web v10.11.8 `src/components/qualityOptions.js`
 * (`getVideoQualityOptions` / `getAudioQualityOptions`). The picker shows
 * only options at or below the source's bitrate, plus a single "source
 * quality" entry just above it so the user can pick the file's native
 * bitrate without listing every higher preset.
 *
 * The behaviour mirrors upstream so we stay consistent with what users
 * see on the canonical client.
 */

export interface QualityOption {
  /** Display label, e.g. `1080p - 10 Mbps`, `Auto`. */
  name: string;
  /** Streaming bitrate cap in bps. `0` means automatic (source quality). */
  bitrate: number;
  /** Optional resolution hint used by the upstream picker; unused by us. */
  maxHeight?: number;
}

interface VideoQualityInput {
  /** The user's current `maxStreamingBitrate` (bps), or `undefined` for auto. */
  currentMaxBitrate?: number;
  /** Source bitrate in bps (from `MediaStream.BitRate`). */
  videoBitRate?: number | null;
  /** Source video codec (e.g. `hevc`, `av1`, `vp9`, `h264`). */
  videoCodec?: string | null;
  /** Whether to include the "Auto" entry at the top. */
  enableAuto?: boolean;
  /** Translated "Auto" label (we don't have access to i18next at the util level). */
  autoLabel?: string;
}

/**
 * Bitrate presets to choose from, copied verbatim from jellyfin-web.
 * Each entry's bitrate is unique (no duplicates with the same key).
 */
const VIDEO_BITRATES: readonly QualityOption[] = Object.freeze([
  { name: '120 Mbps', maxHeight: 2160, bitrate: 120_000_000 },
  { name: '80 Mbps', maxHeight: 2160, bitrate: 80_000_000 },
  { name: '60 Mbps', maxHeight: 2160, bitrate: 60_000_000 },
  { name: '40 Mbps', maxHeight: 2160, bitrate: 40_000_000 },
  { name: '20 Mbps', maxHeight: 2160, bitrate: 20_000_000 },
  { name: '15 Mbps', maxHeight: 1440, bitrate: 15_000_000 },
  { name: '10 Mbps', maxHeight: 1440, bitrate: 10_000_000 },
  { name: '8 Mbps', maxHeight: 1080, bitrate: 8_000_000 },
  { name: '6 Mbps', maxHeight: 1080, bitrate: 6_000_000 },
  { name: '4 Mbps', maxHeight: 720, bitrate: 4_000_000 },
  { name: '3 Mbps', maxHeight: 720, bitrate: 3_000_000 },
  { name: '1.5 Mbps', maxHeight: 720, bitrate: 1_500_000 },
  { name: '720 kbps', maxHeight: 480, bitrate: 720_000 },
  { name: '420 kbps', maxHeight: 360, bitrate: 420_000 }
]);

const HIGH_EFFICIENCY_CODECS = new Set(['hevc', 'av1', 'vp9']);

/**
 * Build the list of streaming-quality options for the current video source.
 * The source's own bitrate is included as one entry; everything strictly
 * higher is hidden so 720p files don't offer 4K/1440p/1080p options.
 */
export function getVideoQualityOptions(input: VideoQualityInput): QualityOption[] {
  const { currentMaxBitrate, videoCodec, enableAuto, autoLabel = 'Auto' } = input;
  const videoBitRate = input.videoBitRate ?? -1;
  let referenceBitRate = videoBitRate;

  const options: QualityOption[] = [];
  const autoOption: QualityOption = { name: autoLabel, bitrate: 0 };

  if (enableAuto) {
    options.push(autoOption);
  }

  const maxPreset = VIDEO_BITRATES[0]?.bitrate ?? Infinity;

  if (videoBitRate > 0 && videoBitRate < maxPreset) {
    /**
     * Re-encoding from a high-efficiency codec to h264 needs more bitrate to
     * preserve the same perceived quality, so bump the reference for the
     * source-quality fence post.
     */
    if (videoCodec && HIGH_EFFICIENCY_CODECS.has(videoCodec) && referenceBitRate <= 20_000_000) {
      referenceBitRate *= 1.5;
    }

    /**
     * One entry just above the source bitrate — lets the user pick the file's
     * native quality without listing every higher preset.
     */
    const sourceOption = [...VIDEO_BITRATES]
      .filter(c => c.bitrate > referenceBitRate)
      .pop();

    if (sourceOption) {
      options.push(sourceOption);
    }
  }

  for (const c of VIDEO_BITRATES) {
    if (videoBitRate <= 0 || c.bitrate <= referenceBitRate) {
      options.push(c);
    }
  }

  /**
   * If the user already has a `maxStreamingBitrate` set, surface what Auto
   * would currently resolve to as a hint on the Auto entry.
   */
  if (currentMaxBitrate) {
    let selectedIndex = options.length - 1;

    for (let i = 0; i < options.length; i++) {
      const option = options[i];

      if (option && option.bitrate > 0 && option.bitrate <= currentMaxBitrate) {
        selectedIndex = i;
        break;
      }
    }

    const currentOption = options[selectedIndex];

    if (enableAuto && currentOption) {
      autoOption.name = `${autoLabel} (${currentOption.name})`;
    }
  }

  return options;
}

interface AudioQualityInput {
  currentMaxBitrate?: number;
  enableAuto?: boolean;
  autoLabel?: string;
}

const AUDIO_BITRATES: readonly QualityOption[] = Object.freeze([
  { name: '2 Mbps', bitrate: 2_000_000 },
  { name: '1.5 Mbps', bitrate: 1_500_000 },
  { name: '1 Mbps', bitrate: 1_000_000 },
  { name: '320 kbps', bitrate: 320_000 },
  { name: '256 kbps', bitrate: 256_000 },
  { name: '192 kbps', bitrate: 192_000 },
  { name: '128 kbps', bitrate: 128_000 },
  { name: '96 kbps', bitrate: 96_000 },
  { name: '64 kbps', bitrate: 64_000 }
]);

/**
 * Build the list of streaming-quality options for audio playback. Audio
 * doesn't need source-aware filtering: every preset fits any source.
 */
export function getAudioQualityOptions(input: AudioQualityInput): QualityOption[] {
  const { currentMaxBitrate, enableAuto, autoLabel = 'Auto' } = input;

  const options: QualityOption[] = [];
  const autoOption: QualityOption = { name: autoLabel, bitrate: 0 };

  if (enableAuto) {
    options.push(autoOption);
  }

  options.push(...AUDIO_BITRATES);

  if (currentMaxBitrate) {
    let selectedIndex = options.length - 1;

    for (let i = 0; i < options.length; i++) {
      const option = options[i];

      if (option && option.bitrate > 0 && option.bitrate <= currentMaxBitrate) {
        selectedIndex = i;
        break;
      }
    }

    const currentOption = options[selectedIndex];

    if (enableAuto && currentOption) {
      autoOption.name = `${autoLabel} (${currentOption.name})`;
    }
  }

  return options;
}
