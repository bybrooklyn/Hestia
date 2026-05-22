<template>
  <div>
    <VAppBar
      flat
      :class="useResponsiveClasses('second-toolbar')">
      <div class="uno-w-full uno-flex uno-items-center uno-px-4">
        <div class="uno-flex-grow" />
        <VTabs
          v-model="searchTab"
          class="uno-mx-auto">
          <VTab
            :disabled="movies.length <= 0">
            {{ $t('movies') }}
          </VTab>
          <VTab
            :disabled="series.length <= 0">
            {{ $t('shows') }}
          </VTab>
          <VTab
            :disabled="albums.length <= 0">
            {{ $t('albums') }}
          </VTab>
          <VTab
            :disabled="tracks.length <= 0">
            {{ $t('songs') }}
          </VTab>
          <VTab
            :disabled="books.length <= 0">
            {{ $t('books') }}
          </VTab>
          <VTab
            :disabled="people.length <= 0">
            {{ $t('people') }}
          </VTab>
          <VTab
            :disabled="artists.length <= 0">
            {{ $t('artists') }}
          </VTab>
        </VTabs>
        <div class="uno-flex uno-flex-grow uno-justify-end">
          <VBtn
            v-if="searchQuery"
            icon="i-mdi:filter-variant"
            :color="showFilters ? 'primary' : undefined"
            variant="text"
            @click="showFilters = !showFilters" />
        </div>
      </div>
    </VAppBar>
    <VContainer class="after-second-toolbar">
      <!-- Glassmorphic Filter Card -->
      <VExpandTransition>
        <div
          v-if="showFilters && searchQuery"
          class="glass-filter-card uno-mb-6 uno-p-4">
          <VRow>
            <VCol
              cols="12"
              sm="4">
              <VSelect
                v-model="selectedGenre"
                :items="genreOptions"
                :label="t('genre')"
                variant="outlined"
                density="compact"
                hide-details />
            </VCol>
            <VCol
              cols="12"
              sm="4">
              <VSelect
                v-model="selectedYear"
                :items="yearOptions"
                :label="t('year')"
                variant="outlined"
                density="compact"
                hide-details />
            </VCol>
            <VCol
              cols="12"
              sm="4">
              <VSelect
                v-model="selectedSort"
                :items="sortOptions"
                :label="t('sortBy')"
                variant="outlined"
                density="compact"
                hide-details />
            </VCol>
          </VRow>
        </div>
      </VExpandTransition>

      <VRow
        v-if="!searchQuery && recentQueries.length > 0">
        <VCol>
          <div class="uno-mb-3 uno-flex uno-items-center uno-justify-between">
            <h3 class="text-h6">
              {{ $t('recentSearches') }}
            </h3>
            <VBtn
              variant="text"
              size="small"
              @click="clearRecents">
              {{ $t('clear') }}
            </VBtn>
          </div>
          <div class="uno-flex uno-flex-wrap uno-gap-2">
            <VChip
              v-for="q in recentQueries"
              :key="q"
              link
              prepend-icon="i-mdi:history"
              closable
              @click="runSearch(q)"
              @click:close="removeRecent(q)">
              {{ q }}
            </VChip>
          </div>
        </VCol>
      </VRow>
      <VRow v-else>
        <VCol>
          <div
            v-if="filteredItems.length === 0"
            class="glass-filter-card uno-p-6 uno-py-12 uno-text-center">
            <div class="text-h6 text-medium-emphasis uno-mb-4">
              {{ t('libraryEmptyFilters') }}
            </div>
            <VBtn
              color="primary"
              variant="flat"
              @click="resetFilters">
              {{ t('clear') }}
            </VBtn>
          </div>
          <VWindow
            v-else
            v-model="searchTab"
            class="uno-bg-transparent">
            <VWindowItem>
              <ItemGrid :items="movies" />
            </VWindowItem>
            <VWindowItem>
              <ItemGrid :items="series" />
            </VWindowItem>
            <VWindowItem>
              <ItemGrid :items="albums" />
            </VWindowItem>
            <VWindowItem>
              <ItemGrid :items="tracks" />
            </VWindowItem>
            <VWindowItem>
              <ItemGrid :items="books" />
            </VWindowItem>
            <VWindowItem>
              <ItemGrid :items="people" />
            </VWindowItem>
            <VWindowItem>
              <ItemGrid :items="artists" />
            </VWindowItem>
          </VWindow>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<script setup lang="ts">
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';
import { computedAsync, refDebounced, useStorage } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import { defu } from 'defu';
import { apiStore } from '#/store/dbs/api/index.ts';
import { useResponsiveClasses } from '#/composables/use-responsive-classes.ts';
import { useBaseItem } from '#/composables/apis.ts';

const route = useRoute();
const router = useRouter();
const { t } = useTranslation();

const showFilters = ref(false);
const selectedGenre = ref('all');
const selectedYear = ref('all');
const selectedSort = ref('relevance');

const searchTab = computed({
  get: () => Number(route.query.tab ?? 0),
  set: (value) => {
    void router.replace(
      defu(
        { query: { tab: String(value) } },
        router.currentRoute.value
      )
    );
  }
});
const searchQuery = computed(() => route.query.q?.toString() ?? '');
const searchDebounced = refDebounced(searchQuery, 400);

/**
 * Persist the user's last queries in `localStorage` so re-running a recent
 * search is one click away. The list is capped at 8, deduped case-insensitively,
 * most-recent first.
 */
const RECENT_LIMIT = 8;
const recentQueries = useStorage<string[]>('search-recent-queries', []);

watch(searchDebounced, (q) => {
  const trimmed = q.trim();

  // Reset filters on new search query
  selectedGenre.value = 'all';
  selectedYear.value = 'all';
  selectedSort.value = 'relevance';

  if (!trimmed) {
    return;
  }

  const lower = trimmed.toLowerCase();
  const filtered = recentQueries.value.filter(
    existing => existing.toLowerCase() !== lower
  );

  recentQueries.value = [trimmed, ...filtered].slice(0, RECENT_LIMIT);
});

/**
 * Re-run a search by pushing the chosen query back into the URL — the
 * existing `searchQuery` computed listens to `route.query.q` and the rest
 * of the pipeline follows.
 */
function runSearch(q: string): void {
  void router.replace(defu({ query: { q } }, router.currentRoute.value));
}

/**
 * Drop a single query from the recents list (close icon on the chip).
 */
function removeRecent(q: string): void {
  recentQueries.value = recentQueries.value.filter(existing => existing !== q);
}

/**
 * Empty the recents list (the "Clear" button next to the heading).
 */
function clearRecents(): void {
  recentQueries.value = [];
}
const itemSearchMethod = computed(() => searchDebounced.value ? 'getItems' : undefined);
const peopleSearchMethod = computed(() => searchDebounced.value ? 'getPersons' : undefined);
const [
  { data: itemSearch },
  { data: peopleSearch }]
  = await Promise.all([
    useBaseItem(getItemsApi, itemSearchMethod, {
      skipCache: { request: true }
    })(() => ({
      searchTerm: searchDebounced.value,
      includeItemTypes: [
        BaseItemKind.Movie,
        BaseItemKind.Series,
        BaseItemKind.Audio,
        BaseItemKind.MusicAlbum,
        BaseItemKind.Book,
        BaseItemKind.MusicArtist,
        BaseItemKind.Person
      ],
      recursive: true
    })),
    useBaseItem(getPersonsApi, peopleSearchMethod, {
      skipCache: { request: true }
    })(() => ({
      searchTerm: searchDebounced.value
    }))
  ]);

const cachedItems = computedAsync(
  async () => await apiStore.findItems(searchDebounced.value),
  [],
  { lazy: true }
);

const items = computed(() => {
  const result = [];

  if (searchDebounced.value) {
    const foundItems = new Set<string>();
    const sources = [itemSearch.value, peopleSearch.value, cachedItems.value];
    let currentSourceIndex = 0;
    let i = 0;

    while (currentSourceIndex < sources.length) {
      const currentArray = sources[currentSourceIndex] ?? [];

      if (i < currentArray.length) {
        const item = currentArray[i];
        const itemId = item?.Id;

        if (itemId && !foundItems.has(itemId)) {
          foundItems.add(itemId);
          result.push(item);
        }

        i++;
      } else {
        // Pasar al siguiente array y reiniciar el índice
        currentSourceIndex++;
        i = 0;
      }
    }
  }

  return result;
});
const availableGenres = computed(() => {
  const genresSet = new Set<string>();

  for (const item of items.value) {
    if (item.Genres) {
      for (const g of item.Genres) {
        if (g) {
          genresSet.add(g);
        }
      }
    }
  }

  return [...genresSet].toSorted((a, b) => a.localeCompare(b));
});

const availableYears = computed(() => {
  const yearsSet = new Set<number>();

  for (const item of items.value) {
    if (item.ProductionYear) {
      yearsSet.add(item.ProductionYear);
    }
  }

  return [...yearsSet].toSorted((a, b) => b - a);
});

const genreOptions = computed(() => {
  const options = [{ title: t('all'), value: 'all' }];

  for (const genre of availableGenres.value) {
    options.push({ title: genre, value: genre });
  }

  return options;
});

const yearOptions = computed(() => {
  const options = [{ title: t('all'), value: 'all' }];

  for (const year of availableYears.value) {
    options.push({ title: String(year), value: String(year) });
  }

  return options;
});

const sortOptions = computed(() => [
  { title: t('relevance'), value: 'relevance' },
  { title: `${t('alphabetical')} (A-Z)`, value: 'alpha-asc' },
  { title: `${t('alphabetical')} (Z-A)`, value: 'alpha-desc' },
  { title: t('newest'), value: 'year-desc' },
  { title: t('oldest'), value: 'year-asc' }
]);

const filteredItems = computed(() => {
  let result = [...items.value];

  if (selectedGenre.value !== 'all') {
    result = result.filter(item =>
      item.Genres?.includes(selectedGenre.value)
    );
  }

  if (selectedYear.value !== 'all') {
    const targetYear = Number(selectedYear.value);

    result = result.filter(item =>
      item.ProductionYear === targetYear
    );
  }

  switch (selectedSort.value) {
    case 'alpha-asc': {
      return result.toSorted((a, b) => {
        const nameA = a.Name ?? '';
        const nameB = b.Name ?? '';

        return nameA.localeCompare(nameB);
      });
    }
    case 'alpha-desc': {
      return result.toSorted((a, b) => {
        const nameA = a.Name ?? '';
        const nameB = b.Name ?? '';

        return nameB.localeCompare(nameA);
      });
    }
    case 'year-desc': {
      return result.toSorted((a, b) => {
        const yA = a.ProductionYear ?? 0;
        const yB = b.ProductionYear ?? 0;

        return yB - yA;
      });
    }
    case 'year-asc': {
      return result.toSorted((a, b) => {
        const yA = a.ProductionYear ?? 0;
        const yB = b.ProductionYear ?? 0;

        return yA - yB;
      });
    }
    default: {
      return result;
    }
  }
});

/**
 * Resets all search filters to their default values.
 */
function resetFilters(): void {
  selectedGenre.value = 'all';
  selectedYear.value = 'all';
  selectedSort.value = 'relevance';
}

const movies = computed(() =>
  filteredItems.value.filter(item => item.Type === BaseItemKind.Movie)
);
const series = computed(() =>
  filteredItems.value.filter(item => item.Type === BaseItemKind.Series)
);
const albums = computed(() =>
  filteredItems.value.filter(item => item.Type === BaseItemKind.MusicAlbum)
);
const tracks = computed(() =>
  filteredItems.value.filter(item => item.Type === BaseItemKind.Audio)
);
const books = computed(() =>
  filteredItems.value.filter(item => item.Type === BaseItemKind.Book)
);
const artists = computed(() =>
  filteredItems.value.filter(item => item.Type === BaseItemKind.MusicArtist)
);
const people = computed(() =>
  filteredItems.value.filter(item => item.Type === BaseItemKind.Person)
);
</script>

<style scoped>
.second-toolbar {
  top: 56px;
}

.second-toolbar.md-and-up {
  top: 64px;
}

.second-toolbar.lg-and-up {
  left: 256px !important;
}

.after-second-toolbar {
  padding-top: 48px;
}

.glass-filter-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
</style>
