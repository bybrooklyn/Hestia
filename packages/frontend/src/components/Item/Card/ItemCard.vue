<template>
  <GenericItemCard
    :progress="progress"
    :shape="shape ?? cardType"
    :overlay="overlay"
    :force-overlay="isMenuOpen"
    :to="cardTitleLink"
    :margin="margin">
    <template #image>
      <BlurhashImage
        :item="item"
        :type="getImageType"
        :image-width="imageWidth"
        :priority="priority" />
    </template>
    <template #upper-content>
      <JProgressCircular
        v-if="!isNil(refreshProgress)"
        :value="refreshProgress"
        :indeterminate="refreshProgress === 0" />
      <WatchedIndicator v-if="item.UserData && item.UserData.Played" />
      <VChip
        v-if="item.UserData && item.UserData.UnplayedItemCount"
        color="primary"
        variant="elevated"
        size="small">
        {{ item.UserData.UnplayedItemCount }}
      </VChip>
    </template>
    <template
      v-if="canPlay(item)"
      #center-content>
      <PlayButton
        fab
        :item="item" />
    </template>
    <template #bottom-content>
      <MarkPlayedButton :item="item" />
      <LikeButton
        v-if="canPlay(item)"
        :item="item" />
      <ItemMenu
        :item="item"
        @active="isMenuOpen = true"
        @inactive="isMenuOpen = false" />
    </template>
    <template
      v-if="text"
      #title>
      <RouterLink
        class="link"
        :to="cardTitleLink">
        {{ cardTitle ?? '' }}
      </RouterLink>
    </template>
    <template
      v-if="text"
      #subtitle>
      <RouterLink
        v-if="cardSubtitleLink"
        class="link"
        :to="cardSubtitleLink">
        {{ cardSubtitle ?? '' }}
      </RouterLink>
      <div v-else>
        {{ cardSubtitle ?? '' }}
      </div>
    </template>
  </GenericItemCard>
</template>

<script setup lang="ts">

import {
  BaseItemKind,
  ImageType,
  type BaseItemDto
} from '@jellyfin/sdk/lib/generated-client';
import { computed, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import {
  CardShapes,
  canPlay,
  getItemDetailsLink,
  getShapeFromItemType
} from '#/utils/items.ts';
import { taskManager } from '#/store/task-manager.ts';

const { item, shape, overlay, text, margin, priority } = defineProps<{
  item: BaseItemDto;
  shape?: CardShapes;
  overlay?: boolean;
  text?: boolean;
  margin?: boolean;
  /**
   * Mark this card's image as a hero / LCP candidate. Forwarded to
   * `BlurhashImage` → `JImg` so the browser fetches it eagerly with
   * `fetchpriority="high"`. Use sparingly — only above-the-fold heroes.
   */
  priority?: boolean;
}>();

const { t } = useTranslation();
const isMenuOpen = shallowRef(false);

const cardType = computed(() => getShapeFromItemType(item.Type));

const cardTitle = computed(() =>
  item.Type === BaseItemKind.Episode
    ? item.SeriesName
    : item.Name
);

/**
 * Returns either a string representing the production year(s) for the current item
 * or the episode name of an item (SX EY - Episode Name)
 * or the album artist
 */
const cardSubtitle = computed(() => {
  switch (item.Type) {
    case BaseItemKind.Episode: {
      return !isNil(item.ParentIndexNumber) && !isNil(item.IndexNumber) && !isNil(item.Name)
        ? `${t('seasonEpisodeAbbrev', {
          seasonNumber: item.ParentIndexNumber,
          episodeNumber: item.IndexNumber
        })} - ${item.Name}`
        : undefined;
    }
    case BaseItemKind.MusicAlbum: {
      return item.AlbumArtist;
    }
    case BaseItemKind.Series: {
      if (item.Status === 'Continuing' && !isNil(item.ProductionYear)) {
        return `${item.ProductionYear} - ${t('present')}`;
      } else if (item.EndDate) {
        const endYear = new Date(item.EndDate).toLocaleString('en-us', {
          year: 'numeric'
        });

        if (String(item.ProductionYear) === endYear) {
          return String(item.ProductionYear);
        }

        return isNil(item.ProductionYear) ? undefined : `${item.ProductionYear} - ${endYear}`;
      }

      break;
    }
    default: {
      return item.ProductionYear;
    }
  }
});

/**
 * Gets a link to be applied to the card title
 *
 * @returns A router link to the item or a related item
 */
const cardTitleLink = computed(() => {
  if (item.Type === BaseItemKind.Episode && item.SeriesId) {
    return getItemDetailsLink({ Id: item.SeriesId }, 'Series');
  }

  return getItemDetailsLink(item);
});

/**
 * Gets a link to be applied to the card subtitle
 *
 * @returns A router link to the parent item or a related item
 */
const cardSubtitleLink = computed(() => {
  if (
    item.Type === BaseItemKind.MusicAlbum
    && item.AlbumArtists?.length
  ) {
    const artist = item.AlbumArtists[0];

    if (artist) {
      return getItemDetailsLink({ Id: artist.Id, Name: artist.Name }, 'MusicArtist');
    }
  } else if (item.Type === BaseItemKind.Episode) {
    return getItemDetailsLink(item);
  }
});

const progress = computed(
  () => item.UserData?.PlayedPercentage ?? undefined
);

const getImageType = computed(() =>
  cardType.value === CardShapes.Thumb ? ImageType.Thumb : ImageType.Primary
);

/**
 * Cap the requested server image width per card shape so grids don't pull
 * full-resolution masters. Numbers chosen to cover 2x DPR for typical card
 * widths (~160px portrait/square, ~240px thumb, ~480px banner).
 */
const imageWidth = computed(() => {
  switch (shape ?? cardType.value) {
    case CardShapes.Banner: {
      return 480;
    }
    case CardShapes.Thumb: {
      return 480;
    }
    default: {
      return 320;
    }
  }
});

/**
 * Gets the library update progress
 */
const refreshProgress = computed(
  () => taskManager.getTask(item.Id ?? '')?.progress
);
</script>
