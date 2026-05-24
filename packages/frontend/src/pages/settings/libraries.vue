<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('libraries') }}
    </template>
    <template #actions>
      <VBtn
        color="primary"
        variant="elevated"
        @click="addDialog = true">
        <JIcon class="i-mdi:plus uno-mr-2" />
        {{ t('addLibrary') }}
      </VBtn>
    </template>
    <template #content>
      <VCol
        md="10"
        class="uno-pb-4 uno-pt-0">
        <VAlert
          v-if="loadError"
          type="error"
          variant="tonal"
          class="uno-mb-4">
          {{ t('errorLoadingSettingsPage') }}
        </VAlert>
        <div
          v-if="libraries.length === 0"
          class="uno-text-disabled uno-py-8 uno-text-center">
          {{ t('noLibrariesFound') }}
        </div>
        <VTable
          v-else
          density="comfortable">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('type') }}</th>
              <th>{{ t('locations') }}</th>
              <th class="uno-text-right">
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="lib in libraries"
              :key="lib.ItemId ?? lib.Name ?? ''">
              <td class="uno-font-medium">
                {{ lib.Name }}
              </td>
              <td class="uno-text-disabled uno-text-xs">
                {{ lib.CollectionType ?? t('mixed') }}
              </td>
              <td class="uno-text-xs">
                <div
                  v-for="loc in lib.Locations"
                  :key="loc">
                  {{ loc }}
                </div>
              </td>
              <td class="uno-text-right">
                <VBtn
                  variant="text"
                  size="small"
                  :disabled="!lib.ItemId"
                  @click="openOptions(lib)">
                  <JIcon class="i-mdi:cog-outline" />
                </VBtn>
                <VBtn
                  variant="text"
                  size="small"
                  @click="openRename(lib)">
                  <JIcon class="i-mdi:rename-outline" />
                </VBtn>
                <VBtn
                  variant="text"
                  size="small"
                  :disabled="!lib.Name"
                  @click="refreshLibrary(lib.Name!)">
                  <JIcon class="i-mdi:refresh" />
                </VBtn>
                <VBtn
                  variant="text"
                  size="small"
                  color="error"
                  :disabled="!lib.Name"
                  @click="confirmDelete(lib)">
                  <JIcon class="i-mdi:delete-outline" />
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>

        <VCard
          variant="outlined"
          class="uno-mt-6">
          <VCardTitle>{{ t('globalLibraryDisplaySettings') }}</VCardTitle>
          <VCardText>
            <VSelect
              v-model="dateAddedBehavior"
              variant="outlined"
              :items="dateAddedBehaviorItems"
              item-title="title"
              item-value="value"
              :label="t('dateAddedBehavior')" />
            <VCheckbox
              :model-value="serverSettings.EnableFolderView"
              :label="t('displayFolderView')"
              hide-details
              @update:model-value="v => serverSettings.EnableFolderView = v ?? false" />
            <VCheckbox
              :model-value="serverSettings.DisplaySpecialsWithinSeasons"
              :label="t('displaySpecialsWithinSeasons')"
              hide-details
              @update:model-value="v => serverSettings.DisplaySpecialsWithinSeasons = v ?? false" />
            <VCheckbox
              :model-value="serverSettings.EnableGroupingMoviesIntoCollections"
              :label="t('groupMoviesIntoCollections')"
              hide-details
              @update:model-value="v => serverSettings.EnableGroupingMoviesIntoCollections = v ?? false" />
            <VCheckbox
              :model-value="serverSettings.EnableGroupingShowsIntoCollections"
              :label="t('groupShowsIntoCollections')"
              hide-details
              @update:model-value="v => serverSettings.EnableGroupingShowsIntoCollections = v ?? false" />
            <VCheckbox
              :model-value="serverSettings.EnableExternalContentInSuggestions"
              :label="t('enableExternalContentInSuggestions')"
              hide-details
              @update:model-value="v => serverSettings.EnableExternalContentInSuggestions = v ?? false" />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              color="primary"
              :loading="savingGlobalDisplay"
              @click="saveGlobalDisplay">
              {{ t('save') }}
            </VBtn>
          </VCardActions>
        </VCard>

        <VCard
          variant="outlined"
          class="uno-mt-6">
          <VCardTitle>{{ t('globalMetadataDefaults') }}</VCardTitle>
          <VCardText>
            <VSelect
              v-model="serverSettings.PreferredMetadataLanguage"
              variant="outlined"
              :items="cultureItems"
              item-title="title"
              item-value="value"
              :label="t('optPreferredMetadataLanguage')" />
            <VSelect
              v-model="serverSettings.MetadataCountryCode"
              variant="outlined"
              :items="countryItems"
              item-title="title"
              item-value="value"
              :label="t('optMetadataCountryCode')" />
            <VTextField
              :model-value="serverSettings.DummyChapterDuration"
              type="number"
              variant="outlined"
              :label="t('dummyChapterDuration')"
              @update:model-value="v => serverSettings.DummyChapterDuration = Number(v) || 0" />
            <VSelect
              v-model="serverSettings.ChapterImageResolution"
              variant="outlined"
              :items="chapterResolutionItems"
              item-title="title"
              item-value="value"
              :label="t('chapterImageResolution')" />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              color="primary"
              :loading="savingGlobalMetadata"
              @click="saveGlobalMetadata">
              {{ t('save') }}
            </VBtn>
          </VCardActions>
        </VCard>

        <VCard
          variant="outlined"
          class="uno-mt-6">
          <VCardTitle>{{ t('globalNfoSettings') }}</VCardTitle>
          <VCardText>
            <VSelect
              v-model="nfoConfig.UserId"
              variant="outlined"
              :items="userItems"
              item-title="title"
              item-value="value"
              :label="t('kodiMetadataUser')" />
            <VCheckbox
              :model-value="nfoConfig.SaveImagePathsInNfo"
              :label="t('saveImagePathsInNfo')"
              hide-details
              @update:model-value="v => nfoConfig.SaveImagePathsInNfo = v ?? false" />
            <VCheckbox
              :model-value="nfoConfig.EnablePathSubstitution"
              :label="t('enablePathSubstitution')"
              hide-details
              @update:model-value="v => nfoConfig.EnablePathSubstitution = v ?? false" />
            <VCheckbox
              :model-value="nfoConfig.EnableExtraThumbsDuplication"
              :label="t('enableExtraThumbsDuplication')"
              hide-details
              @update:model-value="v => nfoConfig.EnableExtraThumbsDuplication = v ?? false" />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              color="primary"
              :loading="savingGlobalNfo"
              @click="saveGlobalNfo">
              {{ t('save') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>

      <!-- Add library -->
      <VDialog
        v-model="addDialog"
        width="540">
        <VCard>
          <VCardTitle>{{ t('addLibrary') }}</VCardTitle>
          <VCardText>
            <VTextField
              v-model="newLibrary.name"
              variant="outlined"
              :label="t('name')" />
            <VSelect
              v-model="newLibrary.collectionType"
              variant="outlined"
              :items="collectionTypeItems"
              item-title="title"
              item-value="value"
              :label="t('type')" />
            <div
              v-for="(path, idx) in newLibrary.paths"
              :key="idx"
              class="uno-flex uno-items-center uno-gap-2">
              <VTextField
                :model-value="path"
                variant="outlined"
                :label="t('folderPath')"
                class="uno-flex-1"
                @update:model-value="v => newLibrary.paths[idx] = v ?? ''" />
              <VBtn
                v-if="newLibrary.paths.length > 1"
                icon
                variant="text"
                size="small"
                @click="newLibrary.paths.splice(idx, 1)">
                <JIcon class="i-mdi:close" />
              </VBtn>
            </div>
            <VBtn
              variant="text"
              size="small"
              class="uno-mt-2"
              @click="newLibrary.paths.push('')">
              <JIcon class="i-mdi:plus uno-mr-1" />
              {{ t('addFolder') }}
            </VBtn>
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn @click="addDialog = false">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              color="primary"
              :loading="adding"
              :disabled="!canAdd"
              @click="submitAdd">
              {{ t('save') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <!-- Rename library -->
      <VDialog
        v-model="renameDialog"
        width="420">
        <VCard>
          <VCardTitle>{{ t('renameLibrary') }}</VCardTitle>
          <VCardText>
            <VTextField
              v-model="renameNew"
              variant="outlined"
              :label="t('name')" />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn @click="renameDialog = false">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              color="primary"
              :loading="renaming"
              :disabled="!renameNew.trim() || renameNew === renameTarget"
              @click="submitRename">
              {{ t('save') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <!-- Library options -->
      <VDialog
        v-model="optionsDialog"
        width="720"
        scrollable>
        <VCard v-if="optionsTarget && options">
          <VCardTitle>
            {{ t('libraryOptions') }} — {{ optionsTarget.Name }}
          </VCardTitle>
          <VTabs v-model="optionsTab">
            <VTab value="display">
              {{ t('displaySettings') }}
            </VTab>
            <VTab value="metadata">
              {{ t('metadataSettings') }}
            </VTab>
            <VTab value="nfo">
              {{ t('nfoSettings') }}
            </VTab>
          </VTabs>
          <VCardText style="min-height: 360px">
            <VTabsWindow v-model="optionsTab">
              <VTabsWindowItem value="display">
                <VCheckbox
                  v-model="options.EnablePhotos"
                  :label="t('optEnablePhotos')"
                  hide-details />
                <VTextField
                  v-model="options.SeasonZeroDisplayName"
                  variant="outlined"
                  density="compact"
                  class="uno-mt-3"
                  :label="t('optSeasonZeroDisplayName')" />
                <VTextField
                  :model-value="options.AutomaticRefreshIntervalDays ?? 0"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :label="t('optAutomaticRefreshIntervalDays')"
                  @update:model-value="v => options!.AutomaticRefreshIntervalDays = Number(v) || 0" />
                <VCheckbox
                  v-model="options.EnableEmbeddedTitles"
                  :label="t('optEnableEmbeddedTitles')"
                  hide-details />
                <VCheckbox
                  v-model="options.EnableEmbeddedExtrasTitles"
                  :label="t('optEnableEmbeddedExtrasTitles')"
                  hide-details />
                <VCheckbox
                  v-model="options.EnableEmbeddedEpisodeInfos"
                  :label="t('optEnableEmbeddedEpisodeInfos')"
                  hide-details />
                <VCheckbox
                  v-model="options.EnableChapterImageExtraction"
                  :label="t('optEnableChapterImageExtraction')"
                  hide-details />
                <VCheckbox
                  v-model="options.ExtractChapterImagesDuringLibraryScan"
                  :label="t('optExtractChapterImagesDuringLibraryScan')"
                  hide-details />
                <VCheckbox
                  v-model="options.EnableTrickplayImageExtraction"
                  :label="t('optEnableTrickplayImageExtraction')"
                  hide-details />
                <VCheckbox
                  v-model="options.ExtractTrickplayImagesDuringLibraryScan"
                  :label="t('optExtractTrickplayImagesDuringLibraryScan')"
                  hide-details />
                <VCheckbox
                  v-model="options.EnableLUFSScan"
                  :label="t('optEnableLUFSScan')"
                  hide-details />
              </VTabsWindowItem>

              <VTabsWindowItem value="metadata">
                <VTextField
                  v-model="options.PreferredMetadataLanguage"
                  variant="outlined"
                  density="compact"
                  :label="t('optPreferredMetadataLanguage')" />
                <VTextField
                  v-model="options.MetadataCountryCode"
                  variant="outlined"
                  density="compact"
                  class="uno-mt-3"
                  :label="t('optMetadataCountryCode')" />
                <VCheckbox
                  v-model="options.EnableRealtimeMonitor"
                  :label="t('optEnableRealtimeMonitor')"
                  hide-details />
                <VCheckbox
                  v-model="options.EnableAutomaticSeriesGrouping"
                  :label="t('optEnableAutomaticSeriesGrouping')"
                  hide-details />
                <VCheckbox
                  v-model="options.AutomaticallyAddToCollection"
                  :label="t('optAutomaticallyAddToCollection')"
                  hide-details />
                <VCheckbox
                  v-model="options.SkipSubtitlesIfEmbeddedSubtitlesPresent"
                  :label="t('optSkipSubtitlesIfEmbeddedSubtitlesPresent')"
                  hide-details />
                <VCheckbox
                  v-model="options.SkipSubtitlesIfAudioTrackMatches"
                  :label="t('optSkipSubtitlesIfAudioTrackMatches')"
                  hide-details />
                <VCheckbox
                  v-model="options.RequirePerfectSubtitleMatch"
                  :label="t('optRequirePerfectSubtitleMatch')"
                  hide-details />
                <VCheckbox
                  v-model="options.PreferNonstandardArtistsTag"
                  :label="t('optPreferNonstandardArtistsTag')"
                  hide-details />
              </VTabsWindowItem>

              <VTabsWindowItem value="nfo">
                <VCheckbox
                  v-model="options.SaveLocalMetadata"
                  :label="t('optSaveLocalMetadata')"
                  hide-details />
                <VCheckbox
                  v-model="options.SaveSubtitlesWithMedia"
                  :label="t('optSaveSubtitlesWithMedia')"
                  hide-details />
                <VCheckbox
                  v-model="options.SaveLyricsWithMedia"
                  :label="t('optSaveLyricsWithMedia')"
                  hide-details />
                <VCheckbox
                  v-model="options.SaveTrickplayWithMedia"
                  :label="t('optSaveTrickplayWithMedia')"
                  hide-details />
              </VTabsWindowItem>
            </VTabsWindow>
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn @click="optionsDialog = false">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              color="primary"
              :loading="savingOptions"
              @click="submitOptions">
              {{ t('save') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { type LibraryOptions, type VirtualFolderInfo, CollectionTypeOptions, ImageResolution } from '@jellyfin/sdk/lib/generated-client';
import type { CountryInfo } from '@jellyfin/sdk/lib/generated-client/models/country-info';
import type { CultureDto } from '@jellyfin/sdk/lib/generated-client/models/culture-dto';
import type { MetadataConfiguration } from '@jellyfin/sdk/lib/generated-client/models/metadata-configuration';
import type { ServerConfiguration } from '@jellyfin/sdk/lib/generated-client/models/server-configuration';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { XbmcMetadataOptions } from '@jellyfin/sdk/lib/generated-client/models/xbmc-metadata-options';
import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { computed, reactive, ref, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { useConfirmDialog } from '#/composables/use-confirm-dialog.ts';

const { t } = useTranslation();

const libraries = shallowRef<VirtualFolderInfo[]>([]);
const loadError = shallowRef<unknown>();
const serverSettings = ref<ServerConfiguration>({});
const metadataConfig = ref<MetadataConfiguration>({});
const nfoConfig = ref<XbmcMetadataOptions>({});
const cultures = shallowRef<CultureDto[]>([]);
const countries = shallowRef<CountryInfo[]>([]);
const users = shallowRef<UserDto[]>([]);
const savingGlobalDisplay = shallowRef(false);
const savingGlobalMetadata = shallowRef(false);
const savingGlobalNfo = shallowRef(false);

/**
 * Pull the current library list. Sorted by name for stable display.
 */
async function refetch(): Promise<void> {
  try {
    const { data } = await remote.sdk.newUserApi(getLibraryStructureApi).getVirtualFolders();

    libraries.value = data.toSorted((a, b) => (a.Name ?? '').localeCompare(b.Name ?? ''));
    loadError.value = undefined;
  } catch (error) {
    loadError.value = error;
    useSnackbar(t('unexpectedError'), 'error');
  }
}

/**
 * Load global library, metadata, NFO, localization, and user options.
 */
async function refetchGlobalSettings(): Promise<void> {
  try {
    const configurationApi = remote.sdk.newUserApi(getConfigurationApi);
    const localizationApi = remote.sdk.newUserApi(getLocalizationApi);
    const userApi = remote.sdk.newUserApi(getUserApi);
    const [
      serverRes,
      metadataRes,
      nfoRes,
      culturesRes,
      countriesRes,
      usersRes
    ] = await Promise.all([
      configurationApi.getConfiguration(),
      configurationApi.getNamedConfiguration({ key: 'metadata' }),
      configurationApi.getNamedConfiguration({ key: 'xbmcmetadata' }),
      localizationApi.getCultures(),
      localizationApi.getCountries(),
      userApi.getUsers({})
    ]);

    serverSettings.value = serverRes.data;
    metadataConfig.value = metadataRes.data as unknown as MetadataConfiguration;
    nfoConfig.value = nfoRes.data as unknown as XbmcMetadataOptions;
    cultures.value = culturesRes.data;
    countries.value = countriesRes.data;
    users.value = usersRes.data;
  } catch (error) {
    loadError.value = error;
    useSnackbar(t('unexpectedError'), 'error');
  }
}

await Promise.all([refetch(), refetchGlobalSettings()]);

const collectionTypeItems = computed(() => [
  { title: t('mixed'), value: undefined },
  ...Object.values(CollectionTypeOptions).map(value => ({
    title: value.charAt(0).toUpperCase() + value.slice(1),
    value
  }))
]);

const dateAddedBehavior = computed<string>({
  get: () => metadataConfig.value.UseFileCreationTimeForDateAdded ? 'file' : 'import',
  set: (value) => {
    metadataConfig.value.UseFileCreationTimeForDateAdded = value === 'file';
  }
});

const dateAddedBehaviorItems = computed(() => [
  { title: t('dateAddedImportTime'), value: 'import' },
  { title: t('dateAddedFileTime'), value: 'file' }
]);

const cultureItems = computed(() => [
  { title: t('none'), value: '' },
  ...cultures.value.map(culture => ({
    title: culture.DisplayName ?? culture.Name ?? culture.TwoLetterISOLanguageName ?? '',
    value: culture.TwoLetterISOLanguageName ?? culture.Name ?? ''
  }))
]);

const countryItems = computed(() => [
  { title: t('none'), value: '' },
  ...countries.value.map(country => ({
    title: country.DisplayName ?? country.Name ?? country.TwoLetterISORegionName ?? '',
    value: country.TwoLetterISORegionName ?? ''
  }))
]);

const chapterResolutionItems = computed(() => Object.values(ImageResolution).map(value => ({
  title: value,
  value
})));

const userItems = computed(() => [
  { title: t('none'), value: '' },
  ...users.value.map(user => ({
    title: user.Name ?? user.Id ?? '',
    value: user.Id ?? ''
  }))
]);

/**
 * Save global library display options split across server and metadata config.
 */
async function saveGlobalDisplay(): Promise<void> {
  savingGlobalDisplay.value = true;

  try {
    const api = remote.sdk.newUserApi(getConfigurationApi);

    await Promise.all([
      api.updateConfiguration({ serverConfiguration: serverSettings.value }),
      api.updateNamedConfiguration({
        key: 'metadata',
        body: JSON.stringify(metadataConfig.value)
      })
    ]);
    useSnackbar(t('saved'), 'success');
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    savingGlobalDisplay.value = false;
  }
}

/**
 * Save global metadata defaults stored on server configuration.
 */
async function saveGlobalMetadata(): Promise<void> {
  savingGlobalMetadata.value = true;

  try {
    await remote.sdk.newUserApi(getConfigurationApi).updateConfiguration({
      serverConfiguration: serverSettings.value
    });
    useSnackbar(t('saved'), 'success');
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    savingGlobalMetadata.value = false;
  }
}

/**
 * Save global Kodi/NFO metadata writer options.
 */
async function saveGlobalNfo(): Promise<void> {
  savingGlobalNfo.value = true;

  try {
    await remote.sdk.newUserApi(getConfigurationApi).updateNamedConfiguration({
      key: 'xbmcmetadata',
      body: JSON.stringify({
        ...nfoConfig.value,
        ReleaseDateFormat: nfoConfig.value.ReleaseDateFormat ?? 'yyyy-MM-dd'
      })
    });
    useSnackbar(t('saved'), 'success');
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    savingGlobalNfo.value = false;
  }
}

// == Add ==
const addDialog = ref(false);
const adding = ref(false);
const newLibrary = reactive<{
  name: string;
  collectionType: CollectionTypeOptions | undefined;
  paths: string[];
}>({
  name: '',
  collectionType: undefined,
  paths: ['']
});

const canAdd = computed(() =>
  newLibrary.name.trim().length > 0
  && newLibrary.paths.some(p => p.trim().length > 0)
);

/**
 * Create a new virtual folder from the Add-dialog form, refresh the list,
 * and reset the form on success.
 */
async function submitAdd(): Promise<void> {
  adding.value = true;

  try {
    await remote.sdk.newUserApi(getLibraryStructureApi).addVirtualFolder({
      name: newLibrary.name.trim(),
      collectionType: newLibrary.collectionType,
      paths: newLibrary.paths.map(p => p.trim()).filter(Boolean),
      refreshLibrary: true
    });
    useSnackbar(t('libraryAdded'), 'success');
    addDialog.value = false;
    newLibrary.name = '';
    newLibrary.collectionType = undefined;
    newLibrary.paths = [''];
    await refetch();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    adding.value = false;
  }
}

// == Rename ==
const renameDialog = ref(false);
const renaming = ref(false);
const renameTarget = shallowRef('');
const renameNew = ref('');

/**
 * Seed the rename dialog with the given library's current name.
 */
function openRename(lib: VirtualFolderInfo): void {
  renameTarget.value = lib.Name ?? '';
  renameNew.value = lib.Name ?? '';
  renameDialog.value = true;
}

/**
 * Send the rename request for the targeted library and refresh the list.
 */
async function submitRename(): Promise<void> {
  renaming.value = true;

  try {
    await remote.sdk.newUserApi(getLibraryStructureApi).renameVirtualFolder({
      name: renameTarget.value,
      newName: renameNew.value.trim()
    });
    useSnackbar(t('libraryRenamed'), 'success');
    renameDialog.value = false;
    await refetch();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    renaming.value = false;
  }
}

/**
 * Prompt the user, then remove the given virtual folder on confirmation.
 */
async function confirmDelete(lib: VirtualFolderInfo): Promise<void> {
  if (!lib.Name) {
    return;
  }

  await useConfirmDialog(
    async () => {
      try {
        await remote.sdk.newUserApi(getLibraryStructureApi).removeVirtualFolder({
          name: lib.Name!,
          refreshLibrary: true
        });
        useSnackbar(t('libraryDeleted'), 'success');
        await refetch();
      } catch {
        useSnackbar(t('unexpectedError'), 'error');
      }
    },
    {
      title: t('deleteLibrary'),
      text: t('deleteLibraryConfirm', { name: lib.Name })
    }
  );
}

/**
 * == Options editor (LIBA-2..4) ==
 *
 * `getVirtualFolders` returns each `VirtualFolderInfo` with its `ItemId`
 * and current `LibraryOptions` already attached, so opening the editor
 * doesn't need an extra fetch. Save round-trips the full `LibraryOptions`
 * payload — `updateLibraryOptions` is a replace, not a merge, so we keep
 * the original options around and overwrite only the fields exposed by
 * the dialog.
 */
type BoolKey
  = | 'EnablePhotos'
    | 'EnableEmbeddedTitles'
    | 'EnableEmbeddedExtrasTitles'
    | 'EnableEmbeddedEpisodeInfos'
    | 'EnableChapterImageExtraction'
    | 'ExtractChapterImagesDuringLibraryScan'
    | 'EnableTrickplayImageExtraction'
    | 'ExtractTrickplayImagesDuringLibraryScan'
    | 'EnableLUFSScan'
    | 'EnableRealtimeMonitor'
    | 'EnableAutomaticSeriesGrouping'
    | 'AutomaticallyAddToCollection'
    | 'SkipSubtitlesIfEmbeddedSubtitlesPresent'
    | 'SkipSubtitlesIfAudioTrackMatches'
    | 'RequirePerfectSubtitleMatch'
    | 'PreferNonstandardArtistsTag'
    | 'SaveLocalMetadata'
    | 'SaveSubtitlesWithMedia'
    | 'SaveLyricsWithMedia'
    | 'SaveTrickplayWithMedia';
type LibraryOptionsForm = Omit<LibraryOptions, BoolKey> & Partial<Record<BoolKey, boolean | null>>;

const optionsDialog = ref(false);
const optionsTab = ref<'display' | 'metadata' | 'nfo'>('display');
const savingOptions = ref(false);
const optionsTarget = shallowRef<VirtualFolderInfo | undefined>();
const options = ref<LibraryOptionsForm | undefined>();

/**
 * Snapshot a library's options into the editor state. The listing response
 * already includes `LibraryOptions`, so no extra fetch is needed.
 */
function openOptions(lib: VirtualFolderInfo): void {
  if (!lib.ItemId) {
    return;
  }

  optionsTarget.value = lib;
  options.value = { ...lib.LibraryOptions };
  optionsTab.value = 'display';
  optionsDialog.value = true;
}

/**
 * Persist the edited library options. `updateLibraryOptions` is a replace,
 * not a merge — we send the full original payload with our edits applied.
 */
async function submitOptions(): Promise<void> {
  if (!optionsTarget.value?.ItemId || !options.value) {
    return;
  }

  savingOptions.value = true;

  try {
    await remote.sdk.newUserApi(getLibraryStructureApi).updateLibraryOptions({
      updateLibraryOptionsDto: {
        Id: optionsTarget.value.ItemId,
        LibraryOptions: options.value as LibraryOptions
      }
    });
    useSnackbar(t('libraryOptionsUpdated'), 'success');
    optionsDialog.value = false;
    await refetch();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    savingOptions.value = false;
  }
}

/**
 * == Refresh ==
 *
 * Server-wide refresh, scoped to the single library by name through the
 * generic `refreshLibrary` endpoint — there's no per-library refresh in the
 * SDK today, so the user-visible action label is "refresh" but the API
 * triggers a global library scan.
 */
async function refreshLibrary(_name: string): Promise<void> {
  try {
    await remote.sdk.newUserApi(getLibraryApi).refreshLibrary();
    useSnackbar(t('libraryRefreshQueued'), 'success');
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  }
}
</script>
