<template>
  <VDialog
    width="auto"
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    @after-leave="emit('close')">
    <VCard
      class="pa-3"
      min-width="320">
      <VCardTitle class="text-center">
        {{ t('searchSubtitles') }}
      </VCardTitle>
      <VDivider />
      <VRow class="uno-mt-2 uno-px-2">
        <VCol cols="8">
          <VTextField
            v-model="language"
            :label="t('languageThreeLetterCode')"
            :hint="t('languageThreeLetterCodeHint')"
            :counter="3"
            persistent-hint />
        </VCol>
        <VCol
          cols="4"
          class="uno-flex uno-items-center">
          <VBtn
            color="primary"
            :loading="searching"
            :disabled="!isValidLanguage"
            @click="search">
            {{ t('search') }}
          </VBtn>
        </VCol>
      </VRow>
      <VDivider class="uno-my-2" />
      <div class="results uno-min-h-40 uno-overflow-y-auto">
        <VList
          v-if="results.length > 0"
          lines="two">
          <VListItem
            v-for="result in results"
            :key="result.Id ?? ''"
            :title="result.Name ?? ''"
            :subtitle="formatRow(result)">
            <template #append>
              <VBtn
                size="small"
                color="primary"
                variant="outlined"
                :loading="downloadingId === result.Id"
                @click="download(result)">
                {{ t('download') }}
              </VBtn>
            </template>
          </VListItem>
        </VList>
        <div
          v-else-if="hasSearched && !searching"
          class="text-center text--secondary uno-py-4">
          {{ t('noResultsFound') }}
        </div>
        <div
          v-else-if="!searching"
          class="text-center text--secondary uno-py-4">
          {{ t('subtitleSearchPrompt') }}
        </div>
      </div>
      <VCardActions
        class="d-flex"
        :class="{
          'justify-end': !$vuetify.display.mobile,
          'justify-center': $vuetify.display.mobile
        }">
        <VBtn
          variant="flat"
          color="secondary"
          @click="model = false">
          {{ t('close') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import type {
  BaseItemDto,
  RemoteSubtitleInfo
} from '@jellyfin/sdk/lib/generated-client';
import { getSubtitleApi } from '@jellyfin/sdk/lib/utils/api/subtitle-api';
import { computed, ref, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const { item } = defineProps<{
  item: BaseItemDto;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useTranslation();
const model = ref(true);
const language = ref('eng');
const results = shallowRef<RemoteSubtitleInfo[]>([]);
const searching = ref(false);
const downloadingId = ref<string | undefined>();
const hasSearched = ref(false);

/**
 * The Jellyfin subtitle API takes ISO 639-2 (three-letter) language
 * codes. Anything else returns 400 — easier to gate the button than
 * surface the error.
 */
const isValidLanguage = computed(() => /^[a-z]{3}$/i.test(language.value.trim()));

/**
 * Compact metadata row under each result: provider, frame rate (when
 * present) and an "AI translated" / "machine translated" / "forced"
 * flag when set.
 */
function formatRow(info: RemoteSubtitleInfo): string {
  const parts: string[] = [];

  if (info.ProviderName) {
    parts.push(info.ProviderName);
  }

  if (info.FrameRate) {
    parts.push(`${info.FrameRate.toFixed(2)} fps`);
  }

  if (info.Forced) {
    parts.push(t('subtitleForced'));
  }

  if (info.MachineTranslated || info.AiTranslated) {
    parts.push(t('subtitleAutoTranslated'));
  }

  return parts.join(' • ');
}

/**
 * Search the OpenSubtitles / OMDB providers configured on the server
 * for matching subtitle files in the chosen language.
 */
async function search(): Promise<void> {
  if (!item.Id || !isValidLanguage.value) {
    return;
  }

  searching.value = true;
  hasSearched.value = true;

  try {
    const { data } = await remote.sdk.newUserApi(getSubtitleApi).searchRemoteSubtitles({
      itemId: item.Id,
      language: language.value.trim().toLowerCase()
    });

    results.value = data;
  } catch (error) {
    console.error(error);
    useSnackbar(t('anErrorHappened'), 'error');
    results.value = [];
  } finally {
    searching.value = false;
  }
}

/**
 * Queue a download for the chosen remote subtitle. The server fetches
 * the file asynchronously so a successful response only confirms the
 * request was accepted.
 */
async function download(info: RemoteSubtitleInfo): Promise<void> {
  if (!item.Id || !info.Id) {
    return;
  }

  downloadingId.value = info.Id;

  try {
    await remote.sdk.newUserApi(getSubtitleApi).downloadRemoteSubtitles({
      itemId: item.Id,
      subtitleId: info.Id
    });
    useSnackbar(t('subtitleDownloadQueued'), 'success');
  } catch (error) {
    console.error(error);
    useSnackbar(t('anErrorHappened'), 'error');
  } finally {
    downloadingId.value = undefined;
  }
}
</script>

<style scoped>
.results {
  max-height: 50vh;
}
</style>
