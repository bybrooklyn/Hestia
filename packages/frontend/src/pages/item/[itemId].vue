<template>
  <ItemCols>
    <template #left>
      <VRow
        justify="center"
        justify-md="start">
        <VCol
          cols="6"
          md="3">
          <ItemCard
            :item="item"
            priority />
        </VCol>
        <VCol
          cols="12"
          md="9">
          <h1
            class="text-h5 text-sm-h4"
            :class="{ 'uno-text-center': !$vuetify.display.mdAndUp }">
            {{ item.Name }}
          </h1>
          <h2
            v-if="item.OriginalTitle && item.OriginalTitle !== item.Name"
            class="text-subtitle-1"
            :class="{ 'uno-text-center': !$vuetify.display.mdAndUp }">
            {{ item.OriginalTitle }}
          </h2>
          <h3
            v-if="currentSeries"
            class="text-h6 font-weight-heavy"
            :class="{'uno-text-center': !$vuetify.display.mdAndUp }">
            <RouterLink
              class="link uno-mt-1 uno-block uno-truncate uno-p-0 uno-font-medium"
              :to="getItemDetailsLink(currentSeries)">
              {{ currentSeries.Name }}
            </RouterLink>
          </h3>
          <div
            class="text-h4 text-caption uno-mt-2 uno-font-medium"
            :class="{ 'uno-text-center': !$vuetify.display.mdAndUp }">
            <MediaInfo
              :item="item"
              year
              runtime
              rating
              ends-at />
          </div>
          <VRow
            class="uno-my-4 uno-items-center"
            :class="{
              'uno-justify-center': !$vuetify.display.mdAndUp,
              'uno-ml-0': $vuetify.display.mdAndUp
            }">
            <VBtn
              v-if="item.Type === 'PhotoAlbum' && firstPhoto"
              class="uno-mr-2"
              color="primary"
              variant="elevated"
              :to="`/photo/${firstPhoto.Id}`">
              <JIcon class="i-mdi:image uno-mr-2" />
              {{ $t('viewPhotos') }}
            </VBtn>
            <VBtn
              v-else-if="item.Type === 'Photo'"
              class="uno-mr-2"
              color="primary"
              variant="elevated"
              :to="`/photo/${item.Id}`">
              <JIcon class="i-mdi:image uno-mr-2" />
              {{ $t('viewPhotos') }}
            </VBtn>
            <PlayButton
              v-else
              class="uno-mr-2"
              :item="item"
              :media-source-index="currentSourceIndex"
              :video-track-index="currentVideoTrack"
              :audio-track-index="currentAudioTrack"
              :subtitle-track-index="currentSubtitleTrack" />
            <LikeButton
              :item="item"
              class="uno-mr-2" />
            <MarkPlayedButton
              :item="item"
              class="uno-mr-2" />
            <ItemMenu
              :item="item"
              :media-source-index="currentSourceIndex" />
          </VRow>
          <VCol
            cols="12"
            md="10">
            <VRow
              v-if="item && item.GenreItems && item.GenreItems.length"
              align="center">
              <VCol
                :cols="12"
                :sm="2"
                class="uno-truncate uno-px-0">
                <label class="text--secondary">{{ $t('genres') }}</label>
              </VCol>
              <VCol
                class="uno-px-0"
                :cols="12"
                :sm="10">
                <VSlideGroup>
                  <VSlideGroupItem
                    v-for="(genre, index) in item.GenreItems"
                    :key="`genre-${genre.Id}`">
                    <VChip
                      size="small"
                      link
                      :class="{ 'uno-ml-2': index > 0 }"
                      :to="`/genre/${genre.Id}?type=${item.Type}`">
                      {{ genre.Name }}
                    </VChip>
                  </VSlideGroupItem>
                </VSlideGroup>
              </VCol>
            </VRow>
            <VRow
              v-if="item && item.Studios && item.Studios.length"
              align="center">
              <VCol
                :cols="12"
                :sm="2"
                class="uno-truncate uno-px-0">
                <label class="text--secondary">{{ $t('studios') }}</label>
              </VCol>
              <VCol
                class="uno-px-0"
                :cols="12"
                :sm="10">
                <VSlideGroup>
                  <VSlideGroupItem
                    v-for="(studio, index) in item.Studios"
                    :key="`studio-${studio.Id}`">
                    <VChip
                      size="small"
                      link
                      :class="{ 'uno-ml-2': index > 0 }"
                      :to="`/studio/${studio.Id}?type=${item.Type}`">
                      {{ studio.Name }}
                    </VChip>
                  </VSlideGroupItem>
                </VSlideGroup>
              </VCol>
            </VRow>
            <VRow
              v-if="item && item.Tags && item.Tags.length"
              align="center">
              <VCol
                :cols="12"
                :sm="2"
                class="uno-truncate uno-px-0">
                <label class="text--secondary">{{ $t('tags') }}</label>
              </VCol>
              <VCol
                class="uno-px-0"
                :cols="12"
                :sm="10">
                <VSlideGroup>
                  <VSlideGroupItem
                    v-for="(tag, index) in item.Tags"
                    :key="`tag-${tag}`">
                    <VChip
                      size="small"
                      link
                      :class="{ 'uno-ml-2': index > 0 }"
                      :to="`/tag/${encodeURIComponent(tag)}?type=${item.Type}`">
                      {{ tag }}
                    </VChip>
                  </VSlideGroupItem>
                </VSlideGroup>
              </VCol>
            </VRow>
            <VRow
              v-if="item && directors.length && !$vuetify.display.smAndUp"
              align="center">
              <VCol
                :cols="12"
                :sm="2"
                class="mt-sm-3 py-sm-0 uno-truncate uno-px-0">
                <label class="text--secondary">{{ $t('directing') }}</label>
              </VCol>
              <VCol
                class="uno-px-0"
                :cols="12"
                :sm="10">
                <VSlideGroup>
                  <VSlideGroupItem
                    v-for="director in directors"
                    :key="director.Id">
                    <VChip
                      size="small"
                      link
                      :to="getItemDetailsLink(director, 'Person')">
                      {{ director.Name }}
                    </VChip>
                  </VSlideGroupItem>
                </VSlideGroup>
              </VCol>
            </VRow>
            <VRow
              v-if="item && writers.length && !$vuetify.display.smAndUp"
              align="center">
              <VCol
                :cols="12"
                :sm="2"
                class="mt-sm-3 py-sm-0 uno-truncate uno-px-0">
                <label class="text--secondary">{{ $t('writing') }}</label>
              </VCol>
              <VCol
                class="uno-px-0"
                :cols="12"
                :sm="10">
                <VSlideGroup>
                  <VSlideGroupItem
                    v-for="writer in writers"
                    :key="writer.Id">
                    <VChip
                      size="small"
                      link
                      :to="getItemDetailsLink(writer, 'Person')">
                      {{ writer.Name }}
                    </VChip>
                  </VSlideGroupItem>
                </VSlideGroup>
              </VCol>
            </VRow>
            <div
              v-if="item && item.MediaSources && item.MediaSources.length"
              class="mt-2">
              <VRow
                v-if="item.MediaSources.length > 1"
                align="center">
                <VCol
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 uno-truncate uno-px-0">
                  <label class="text--secondary">{{ $t('version') }}</label>
                </VCol>
                <VCol
                  class="uno-px-0"
                  :cols="12"
                  :sm="10">
                  <MediaSourceSelector
                    :sources="item.MediaSources"
                    :default-source-index="currentSourceIndex"
                    @input="
                      (index) =>
                        (currentSource = item.MediaSources?.[index] ?? {})
                    " />
                </VCol>
              </VRow>
              <VRow align="center">
                <VCol
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 uno-truncate uno-px-0">
                  <label class="text--secondary">{{ $t('video') }}</label>
                </VCol>
                <VCol
                  class="uno-px-0"
                  :cols="12"
                  :sm="10">
                  <MediaStreamSelector
                    v-if="currentSource.MediaStreams"
                    :key="currentSource.Id || ''"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Video')
                    "
                    type="Video"
                    @input="(trackIndex) => (currentVideoTrack = trackIndex)" />
                </VCol>
              </VRow>
              <VRow align="center">
                <VCol
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 uno-truncate uno-px-0">
                  <label class="text--secondary">{{ $t('audio') }}</label>
                </VCol>
                <VCol
                  class="uno-px-0"
                  :cols="12"
                  :sm="10">
                  <MediaStreamSelector
                    v-if="currentSource.MediaStreams"
                    :key="currentSource.Id || ''"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Audio')
                    "
                    type="Audio"
                    @input="(trackIndex) => (currentAudioTrack = trackIndex)" />
                </VCol>
              </VRow>
              <VRow align="center">
                <VCol
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 uno-truncate uno-px-0">
                  <label class="text--secondary">{{ $t('subtitles') }}</label>
                </VCol>
                <VCol
                  class="uno-px-0"
                  :cols="12"
                  :sm="10">
                  <MediaStreamSelector
                    v-if="currentSource.MediaStreams"
                    :key="currentSource.Id || ''"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Subtitle')
                    "
                    type="Subtitle"
                    @input="
                      (trackIndex) => (currentSubtitleTrack = trackIndex)
                    " />
                </VCol>
              </VRow>
            </div>
            <div
              v-else-if="
                item &&
                  item.MediaType === 'Video' &&
                  (!item.MediaSources || item.MediaSources.length === 0)
              "
              class="text-h5 uno-my-4">
              {{ $t('NoMediaSourcesAvailable') }}
            </div>
          </VCol>
          <div>
            <p
              v-if="item.Taglines && item.Taglines.length"
              class="text-subtitle-1 uno-truncate">
              {{ item.Taglines[0] }}
            </p>
            <p
              v-if="item.Overview"
              class="item-overview">
              <JSafeHtml
                :html="item.Overview"
                markdown />
            </p>
          </div>
        </VCol>
      </VRow>
      <VRow v-if="item.Chapters && item.Chapters.length > 0">
        <VCol cols="12">
          <h2 class="text-h6 text-sm-h5 uno-mb-2">
            {{ $t('chapters') }}
          </h2>
          <VSlideGroup show-arrows>
            <VSlideGroupItem
              v-for="(chapter, index) in item.Chapters"
              :key="`chapter-${index}`">
              <button
                type="button"
                class="chapter-card uno-mr-3 uno-text-left"
                @click="playFromChapter(chapter, index)">
                <JImg
                  v-if="chapter.ImageTag"
                  :alt="chapter.Name ?? ''"
                  :src="
                    getItemImageUrl(item.Id ?? '', ImageType.Chapter, {
                      tag: chapter.ImageTag,
                      imageIndex: index
                    })
                  "
                  class="chapter-thumb uno-rounded-md">
                  <template #placeholder>
                    <div class="chapter-thumb chapter-placeholder uno-flex uno-items-center uno-justify-center">
                      <JIcon class="i-mdi:movie-open-outline uno-text-2xl" />
                    </div>
                  </template>
                </JImg>
                <div
                  v-else
                  class="chapter-thumb chapter-placeholder uno-flex uno-items-center uno-justify-center uno-rounded-md">
                  <JIcon class="i-mdi:movie-open-outline uno-text-2xl" />
                </div>
                <div class="text-subtitle-2 uno-mt-1 uno-truncate">
                  {{ chapter.Name || $t('chapterN', { n: index + 1 }) }}
                </div>
                <div class="text--secondary text-caption">
                  {{ formatTicks(chapter.StartPositionTicks ?? 0) }}
                </div>
              </button>
            </VSlideGroupItem>
          </VSlideGroup>
        </VCol>
      </VRow>
      <VRow v-if="specialFeatures.length > 0">
        <VCol cols="12">
          <h2 class="text-h6 text-sm-h5 uno-mb-2">
            {{ $t('specialFeatures') }}
          </h2>
          <VSlideGroup show-arrows>
            <VSlideGroupItem
              v-for="extra in specialFeatures"
              :key="extra.Id">
              <div class="trailer-card uno-mr-3">
                <ItemCard
                  :item="extra"
                  text
                  overlay />
              </div>
            </VSlideGroupItem>
          </VSlideGroup>
        </VCol>
      </VRow>
      <VRow v-if="localTrailers.length > 0 || remoteTrailers.length > 0">
        <VCol cols="12">
          <h2 class="text-h6 text-sm-h5 uno-mb-2">
            {{ $t('trailers') }}
          </h2>
          <VSlideGroup
            v-if="localTrailers.length > 0"
            show-arrows
            class="uno-mb-2">
            <VSlideGroupItem
              v-for="trailer in localTrailers"
              :key="trailer.Id">
              <div class="trailer-card uno-mr-3">
                <ItemCard
                  :item="trailer"
                  text
                  overlay />
              </div>
            </VSlideGroupItem>
          </VSlideGroup>
          <div
            v-if="remoteTrailers.length > 0"
            class="uno-flex uno-flex-wrap uno-gap-2">
            <!--
              We use a native <a> here (not the VBtn `href` prop) because
              VBtn doesn't type the `rel`/`target` attributes, and we want
              both for safe external navigation.
            -->
            <a
              v-for="(trailer, index) in remoteTrailers"
              :key="`remote-trailer-${index}`"
              :href="trailer.Url ?? undefined"
              rel="noopener noreferrer"
              target="_blank"
              class="trailer-external-link">
              <VBtn
                variant="outlined"
                size="small">
                <JIcon class="i-mdi:open-in-new uno-mr-1" />
                {{ trailer.Name || $t('trailer') }}
              </VBtn>
            </a>
          </div>
        </VCol>
      </VRow>
      <VRow>
        <VCol
          v-if="item.Type === 'BoxSet'"
          cols="12">
          <CollectionTabs :items="childItems" />
        </VCol>
        <VCol cols="12">
          <RelatedItems :related-items="relatedItems" />
        </VCol>
      </VRow>
    </template>
    <template #right>
      <div v-if="crew.length">
        <h2 class="text-h6 text-sm-h5">
          {{ $t('crew') }}
        </h2>
        <PeopleList :items="crew" />
      </div>
      <div v-if="actors.length">
        <h2 class="text-h6 text-sm-h5">
          {{ $t('cast') }}
        </h2>
        <PeopleList :items="actors" />
      </div>
    </template>
  </ItemCols>
</template>

<script setup lang="ts">
import {
  ImageType,
  type BaseItemPerson,
  type ChapterInfo,
  type MediaSourceInfo
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getItemDetailsLink, getMediaStreams } from '#/utils/items.ts';
import { getItemImageUrl } from '#/utils/images.ts';
import { getItemizedSelect } from '#/utils/forms.ts';
import { useBaseItem } from '#/composables/apis.ts';
import { useItemBackdrop } from '#/composables/backdrop.ts';
import { useItemPageTitle } from '#/composables/page-title.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { formatTicks } from '#/utils/time.ts';

const route = useRoute('/genre/[itemId]');

const [
  { data: item },
  { data: relatedItems },
  { data: childItems },
  { data: localTrailers },
  { data: specialFeatures }
] = await Promise.all([
  useBaseItem(getUserLibraryApi, 'getItem')(() => ({
    itemId: route.params.itemId
  })),
  useBaseItem(getLibraryApi, 'getSimilarItems')(() => ({
    itemId: route.params.itemId,
    limit: 12
  })),
  useBaseItem(getItemsApi, 'getItems')(() => ({
    parentId: route.params.itemId
  })),
  useBaseItem(getUserLibraryApi, 'getLocalTrailers')(() => ({
    itemId: route.params.itemId
  })),
  useBaseItem(getUserLibraryApi, 'getSpecialFeatures')(() => ({
    itemId: route.params.itemId
  }))
]);

const remoteTrailers = computed(() => item.value.RemoteTrailers ?? []);

/**
 * For PhotoAlbum items, the first photo is the entry point for the
 * viewer / slideshow. The album page itself stays as a folder listing —
 * the new button drives users into the dedicated viewer route instead.
 */
const firstPhoto = computed(() =>
  childItems.value.find(child => child.Type === 'Photo')
);

const { data: currentSeries } = await useBaseItem(getUserLibraryApi, 'getItem')(() => ({
  itemId: item.value.SeriesId ?? ''
}));

const selectedSource = ref<MediaSourceInfo>();
const currentVideoTrack = ref<number>();
const currentAudioTrack = ref<number>();
const currentSubtitleTrack = ref<number>();

const crew = computed<BaseItemPerson[]>(() =>
  (item.value.People ?? []).filter(person =>
    ['Director', 'Writer'].includes(person.Type ?? '')
  )
);

const actors = computed<BaseItemPerson[]>(() =>
  (item.value.People ?? []).filter(person => person.Type === 'Actor').slice(0, 10)
);

const directors = computed<BaseItemPerson[]>(() =>
  crew.value.filter(person => person.Type === 'Director')
);

const writers = computed<BaseItemPerson[]>(() =>
  crew.value.filter(person => person.Type === 'Writer')
);

const selectSources = computed(() =>
  getItemizedSelect(item.value.MediaSources ?? [])
);

const currentSourceIndex = computed(() =>
  selectSources.value.findIndex(el => el.value.Id === currentSource.value.Id)
);

const currentSource = computed({
  get() {
    return selectedSource.value ?? item.value.MediaSources?.[0] ?? {};
  },
  set(newValue) {
    selectedSource.value = newValue;
  }
});

useItemPageTitle(item);
useItemBackdrop(item);

/**
 * Click handler for a chapter card. If the item is already playing,
 * just seek; otherwise queue a fresh playback starting from the chapter's
 * StartPositionTicks (converted to seconds for `play`).
 */
async function playFromChapter(chapter: ChapterInfo, _index: number): Promise<void> {
  const startSeconds = (chapter.StartPositionTicks ?? 0) / 10_000_000;

  if (playbackManager.currentItem.value?.Id === item.value.Id) {
    playbackManager.currentTime.value = startSeconds;

    return;
  }

  await playbackManager.play({
    item: item.value,
    startFromTime: startSeconds
  });
}
</script>

<style scoped>
.chapter-card {
  width: 200px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.chapter-thumb {
  width: 200px;
  height: 112px;
  object-fit: cover;
}

.chapter-placeholder {
  background-color: rgba(var(--j-theme-color-background), 0.4);
}

.trailer-card {
  width: 180px;
}

.trailer-external-link {
  text-decoration: none;
}
</style>
