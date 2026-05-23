<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('users') }}
    </template>
    <template #actions>
      <VBtn
        v-bind="anchorAttrs"
        variant="elevated"
        href="https://jellyfin.org/docs/general/server/users/">
        {{ t('help') }}
      </VBtn>
    </template>
    <template #content>
      <VCol
        md="10"
        class="uno-pb-4 uno-pt-0">
        <VTabs
          v-model="tab"
          align-tabs="start">
          <VTab :value="1">
            {{ t("profile") }}
          </VTab>
          <VTab :value="2">
            {{ t("access") }}
          </VTab>
          <VTab :value="3">
            {{ t("parentalControl") }}
          </VTab>
          <VTab :value="4">
            {{ t("password") }}
          </VTab>
        </VTabs>
        <VWindow v-model="tab">
          <VWindowItem
            :key="1"
            :value="1">
            <VForm>
              <VContainer>
                <VRow>
                  <VCol>
                    <VTextField
                      v-model="model.Name"
                      :label="t('name')"
                      hide-details />
                  </VCol>
                </VRow>

                <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-font-medium">
                  {{ t('userPermissions') }}
                </h3>
                <VCheckbox
                  v-model="model.IsAdministrator"
                  :label="t('administrator')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.IsDisabled"
                  :label="t('userDisabled')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.IsHidden"
                  :label="t('userHidden')"
                  density="compact"
                  hide-details />

                <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-font-medium">
                  {{ t('authenticationProvider') }}
                </h3>
                <VSelect
                  v-if="authProviders.length"
                  v-model="model.AuthenticationProviderId"
                  :items="authProviders"
                  item-title="Name"
                  item-value="Id"
                  :label="t('authenticationProvider')"
                  variant="outlined"
                  density="compact"
                  hide-details />
                <VSelect
                  v-if="passwordResetProviders.length"
                  v-model="model.PasswordResetProviderId"
                  :items="passwordResetProviders"
                  item-title="Name"
                  item-value="Id"
                  :label="t('passwordResetProvider')"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="uno-mt-3" />

                <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-font-medium">
                  {{ t('userMediaPlayback') }}
                </h3>
                <VCheckbox
                  v-model="model.EnableRemoteAccess"
                  :label="t('allowRemoteConnections')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableLiveTvAccess"
                  :label="t('liveTvAccess')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableLiveTvManagement"
                  :label="t('liveTvManagement')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableMediaPlayback"
                  :label="t('enableMediaPlayback')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableAudioPlaybackTranscoding"
                  :label="t('enableAudioTranscoding')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableVideoPlaybackTranscoding"
                  :label="t('enableVideoTranscoding')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnablePlaybackRemuxing"
                  :label="t('enableRemuxing')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.ForceRemoteSourceTranscoding"
                  :label="t('forceRemoteTranscoding')"
                  density="compact"
                  hide-details />
                <VTextField
                  v-model.number="model.RemoteClientBitrateLimit"
                  :label="t('remoteBitrateLimit')"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="uno-mt-3" />

                <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-font-medium">
                  {{ t('userFeatures') }}
                </h3>
                <VSelect
                  v-model="model.SyncPlayAccess"
                  :items="syncPlayItems"
                  item-title="title"
                  item-value="value"
                  :label="t('syncPlayAccess')"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="uno-mb-3" />
                <VCheckbox
                  v-model="model.EnableContentDeletion"
                  :label="t('enableContentDeletion')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableContentDownloading"
                  :label="t('enableContentDownloading')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableRemoteControlOfOtherUsers"
                  :label="t('enableRemoteControl')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableSharedDeviceControl"
                  :label="t('enableSharedDeviceControl')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableCollectionManagement"
                  :label="t('enableCollectionManagement')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableSubtitleManagement"
                  :label="t('enableSubtitleManagement')"
                  density="compact"
                  hide-details />
                <VCheckbox
                  v-model="model.EnableLyricManagement"
                  :label="t('enableLyricManagement')"
                  density="compact"
                  hide-details />

                <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-font-medium">
                  {{ t('userManagement') }}
                </h3>
                <VTextField
                  v-model.number="model.LoginAttemptsBeforeLockout"
                  :label="t('loginAttemptsBeforeLockout')"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details />
                <VTextField
                  v-model.number="model.MaxActiveSessions"
                  :label="t('maxActiveSessions')"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="uno-mt-3" />
                <div class="text-caption text--secondary uno-mt-2">
                  {{ t('invalidLoginAttempts') }}: {{ invalidLoginAttemptCount }}
                </div>

                <VRow class="uno-mt-4">
                  <VCol>
                    <VBtn
                      :loading="loading"
                      color="error"
                      variant="elevated"
                      @click="deleteUser">
                      {{ t('deleteUser') }}
                    </VBtn>
                  </VCol>
                  <VCol class="uno-text-right">
                    <VBtn
                      :loading="loading"
                      color="primary"
                      variant="elevated"
                      @click="saveProfile">
                      {{ t('save') }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VContainer>
            </VForm>
          </VWindowItem>
          <VWindowItem
            :key="2"
            :value="2">
            <VForm>
              <VContainer>
                <h3 class="text-subtitle-1 uno-mb-2 uno-font-medium">
                  {{ t('libraryAccess') }}
                </h3>
                <VCheckbox
                  v-model="model.CanAccessAllLibraries"
                  :label="t('allLibraries')"
                  density="compact"
                  hide-details />
                <div v-if="!model.CanAccessAllLibraries && libraries">
                  <VCheckbox
                    v-for="library of libraries.Items"
                    :key="library.Id"
                    v-model="model.Folders"
                    :value="library.Id"
                    :label="library.Name!"
                    density="compact"
                    hide-details />
                </div>

                <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-font-medium">
                  {{ t('channelAccess') }}
                </h3>
                <VCheckbox
                  v-model="model.EnableAllChannels"
                  :label="t('allChannels')"
                  density="compact"
                  hide-details />
                <div
                  v-if="!model.EnableAllChannels && channels?.Items?.length"
                  class="uno-pl-2">
                  <VCheckbox
                    v-for="channel of channels.Items"
                    :key="channel.Id"
                    v-model="model.EnabledChannels"
                    :value="channel.Id"
                    :label="channel.Name ?? ''"
                    density="compact"
                    hide-details />
                </div>
                <div
                  v-else-if="!model.EnableAllChannels && !channels?.Items?.length"
                  class="text-caption text--secondary uno-pl-2">
                  {{ t('noChannelsFound') }}
                </div>

                <template v-if="!model.IsAdministrator">
                  <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-font-medium">
                    {{ t('deviceAccess') }}
                  </h3>
                  <VCheckbox
                    v-model="model.EnableAllDevices"
                    :label="t('allDevices')"
                    density="compact"
                    hide-details />
                  <div
                    v-if="!model.EnableAllDevices && devices.length"
                    class="uno-pl-2">
                    <VCheckbox
                      v-for="device of devices"
                      :key="device.Id ?? undefined"
                      v-model="model.EnabledDevices"
                      :value="device.Id"
                      :label="(device.CustomName || device.Name) ?? ''"
                      density="compact"
                      hide-details />
                  </div>
                </template>

                <VRow class="uno-mt-4">
                  <VCol class="uno-text-right">
                    <VBtn
                      :loading="loading"
                      color="primary"
                      variant="elevated"
                      @click="saveAccess">
                      {{ t('save') }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VContainer>
            </VForm>
          </VWindowItem>
          <VWindowItem
            :key="3"
            :value="3">
            <VForm>
              <VContainer>
                <VSelect
                  v-model="model.maxParentalRating"
                  :label="t('maxAllowedRating')"
                  :items="parentalCategories"
                  item-title="label"
                  item-value="id"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  class="uno-mb-2" />
                <VTextField
                  v-model.number="model.MaxParentalSubRating"
                  :label="t('maxParentalSubRating')"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  class="uno-mb-3" />
                <div class="text-caption text-warning uno-mb-4">
                  {{ $t('maxAllowedRatingSubtitle') }}
                </div>

                <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-font-medium">
                  {{ $t('blockUnratedItems') }}
                </h3>
                <VCheckbox
                  v-for="cat of blockingCategories"
                  :key="cat.value"
                  v-model="model.BlockUnratedItems"
                  :label="cat.label"
                  :value="cat.value"
                  density="compact"
                  hide-details />

                <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-flex uno-items-center uno-justify-between uno-font-medium">
                  <span>{{ t('blockTags') }}</span>
                  <VBtn
                    color="secondary"
                    variant="text"
                    size="small"
                    @click="addTagDialogOpen = true">
                    <JIcon class="i-mdi:plus uno-mr-1" />
                    {{ t('addBlockedTag') }}
                  </VBtn>
                </h3>
                <VList
                  v-if="model.BlockedTags.length"
                  density="compact">
                  <VListItem
                    v-for="blockedTag of model.BlockedTags"
                    :key="blockedTag"
                    :title="blockedTag">
                    <template #append>
                      <VBtn
                        icon
                        size="small"
                        variant="text"
                        :disabled="loading"
                        @click="model.BlockedTags = model.BlockedTags.filter(tag => tag !== blockedTag)">
                        <JIcon class="i-mdi:close" />
                      </VBtn>
                    </template>
                  </VListItem>
                </VList>

                <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-flex uno-items-center uno-justify-between uno-font-medium">
                  <span>{{ t('allowedTags') }}</span>
                  <VBtn
                    color="secondary"
                    variant="text"
                    size="small"
                    @click="addAllowedTagDialogOpen = true">
                    <JIcon class="i-mdi:plus uno-mr-1" />
                    {{ t('addAllowedTag') }}
                  </VBtn>
                </h3>
                <VList
                  v-if="model.AllowedTags.length"
                  density="compact">
                  <VListItem
                    v-for="allowedTag of model.AllowedTags"
                    :key="allowedTag"
                    :title="allowedTag">
                    <template #append>
                      <VBtn
                        icon
                        size="small"
                        variant="text"
                        :disabled="loading"
                        @click="model.AllowedTags = model.AllowedTags.filter(tag => tag !== allowedTag)">
                        <JIcon class="i-mdi:close" />
                      </VBtn>
                    </template>
                  </VListItem>
                </VList>

                <h3 class="text-subtitle-1 uno-mb-2 uno-mt-4 uno-flex uno-items-center uno-justify-between uno-font-medium">
                  <span>{{ t('accessSchedules') }}</span>
                  <VBtn
                    color="secondary"
                    variant="text"
                    size="small"
                    @click="addSchedule">
                    <JIcon class="i-mdi:plus uno-mr-1" />
                    {{ t('addSchedule') }}
                  </VBtn>
                </h3>
                <div
                  v-for="(schedule, idx) of model.AccessSchedules"
                  :key="idx"
                  class="uno-mb-2 uno-flex uno-items-center uno-gap-2">
                  <VSelect
                    v-model="schedule.DayOfWeek"
                    :items="dayOfWeekItems"
                    item-title="title"
                    item-value="value"
                    :label="t('dayOfWeek')"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="uno-flex-1" />
                  <VTextField
                    :model-value="schedule.StartHour"
                    :label="t('startHour')"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="max-width: 8rem;"
                    @update:model-value="v => schedule.StartHour = Number(v) || 0" />
                  <VTextField
                    :model-value="schedule.EndHour"
                    :label="t('endHour')"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="max-width: 8rem;"
                    @update:model-value="v => schedule.EndHour = Number(v) || 0" />
                  <VBtn
                    icon
                    size="small"
                    variant="text"
                    :disabled="loading"
                    @click="removeSchedule(idx)">
                    <JIcon class="i-mdi:close" />
                  </VBtn>
                </div>

                <VRow class="uno-mt-4">
                  <VCol class="uno-text-right">
                    <VBtn
                      :loading="loading"
                      color="primary"
                      variant="elevated"
                      @click="saveParentalControl">
                      {{ t('save') }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VContainer>
            </VForm>
          </VWindowItem>
          <VWindowItem
            :key="4"
            :value="4">
            <VForm>
              <VContainer>
                <VRow>
                  <VCol>
                    <VTextField
                      v-if="user.HasPassword"
                      v-model="model.CurrentPassword"
                      :disabled="loading"
                      :label="t('currentPassword')"
                      type="password"
                      hide-details />
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <VTextField
                      v-model="model.Password"
                      :disabled="loading"
                      :label="t('newPassword')"
                      type="password"
                      hide-details />
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <VTextField
                      v-model="model.ConfirmPassword"
                      :disabled="loading"
                      :label="t('confirmPassword')"
                      type="password"
                      hide-details />
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <VBtn
                      v-if="user.HasPassword"
                      :disabled="loading"
                      :loading="loading"
                      variant="elevated"
                      color="error"
                      @click="resetPassword">
                      {{ t('resetPassword') }}
                    </VBtn>
                  </VCol>
                  <VCol class="uno-text-right">
                    <VBtn
                      :disabled="loading"
                      variant="elevated"
                      color="primary"
                      @click="submitPassword">
                      {{ t('save') }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VContainer>
            </VForm>
          </VWindowItem>
        </VWindow>
      </VCol>
      <VDialog
        v-model="addTagDialogOpen"
        width="420">
        <VCol class="add-key-dialog uno-p-0">
          <VCard>
            <VCardTitle>{{ t('addBlockedTag') }}</VCardTitle>
            <VCardActions>
              <VForm
                class="add-key-form"
                @submit.prevent="model.BlockedTags.push(newTagValue); addTagDialogOpen = false; newTagValue = '';">
                <VTextField
                  v-model="newTagValue"
                  variant="outlined"
                  :label="t('tagName')" />
                <VBtn
                  color="primary"
                  :loading="loading"
                  :disabled="newTagValue === ''"
                  @click="model.BlockedTags.push(newTagValue); addTagDialogOpen = false; newTagValue = '';">
                  {{ $t('confirm') }}
                </VBtn>
                <VBtn @click="() => {addTagDialogOpen = false}">
                  {{ $t('cancel') }}
                </VBtn>
              </VForm>
            </VCardActions>
          </VCard>
        </VCol>
      </VDialog>
      <VDialog
        v-model="addAllowedTagDialogOpen"
        width="420">
        <VCol class="add-key-dialog uno-p-0">
          <VCard>
            <VCardTitle>{{ t('addAllowedTag') }}</VCardTitle>
            <VCardActions>
              <VForm
                class="add-key-form"
                @submit.prevent="model.AllowedTags.push(newAllowedTagValue); addAllowedTagDialogOpen = false; newAllowedTagValue = '';">
                <VTextField
                  v-model="newAllowedTagValue"
                  variant="outlined"
                  :label="t('tagName')" />
                <VBtn
                  color="primary"
                  :loading="loading"
                  :disabled="newAllowedTagValue === ''"
                  @click="model.AllowedTags.push(newAllowedTagValue); addAllowedTagDialogOpen = false; newAllowedTagValue = '';">
                  {{ $t('confirm') }}
                </VBtn>
                <VBtn @click="() => {addAllowedTagDialogOpen = false}">
                  {{ $t('cancel') }}
                </VBtn>
              </VForm>
            </VCardActions>
          </VCard>
        </VCol>
      </VDialog>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import {
  type AccessSchedule,
  type BaseItemDtoQueryResult,
  type DeviceInfoDto,
  DynamicDayOfWeek,
  type NameIdPair,
  SyncPlayUserAccessType,
  type UnratedItem,
  type UserDto,
  type UserPolicy
} from '@jellyfin/sdk/lib/generated-client';
import { getChannelsApi } from '@jellyfin/sdk/lib/utils/api/channels-api';
import { getDevicesApi } from '@jellyfin/sdk/lib/utils/api/devices-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { useRoute, useRouter } from 'vue-router';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { useConfirmDialog } from '#/composables/use-confirm-dialog.ts';

interface CurrentUser {
  Name: string;
  CurrentPassword: string;
  Password: string;
  ConfirmPassword: string;
  // Profile / policy
  IsAdministrator: boolean | null;
  IsDisabled: boolean | null;
  IsHidden: boolean | null;
  AuthenticationProviderId: string;
  PasswordResetProviderId: string;
  EnableRemoteAccess: boolean | null;
  EnableLiveTvAccess: boolean | null;
  EnableLiveTvManagement: boolean | null;
  EnableMediaPlayback: boolean | null;
  EnableAudioPlaybackTranscoding: boolean | null;
  EnableVideoPlaybackTranscoding: boolean | null;
  EnablePlaybackRemuxing: boolean | null;
  ForceRemoteSourceTranscoding: boolean | null;
  RemoteClientBitrateLimit: number | string;
  SyncPlayAccess: SyncPlayUserAccessType;
  EnableContentDeletion: boolean | null;
  EnableContentDownloading: boolean | null;
  EnableRemoteControlOfOtherUsers: boolean | null;
  EnableSharedDeviceControl: boolean | null;
  EnableCollectionManagement: boolean | null;
  EnableSubtitleManagement: boolean | null;
  EnableLyricManagement: boolean | null;
  LoginAttemptsBeforeLockout: number | string;
  MaxActiveSessions: number | string;
  // Access
  CanAccessAllLibraries: boolean | null;
  Folders: string[] | null;
  EnableAllChannels: boolean | null;
  EnabledChannels: string[] | null;
  EnableAllDevices: boolean | null;
  EnabledDevices: string[] | null;
  // Parental
  maxParentalRating?: number;
  MaxParentalSubRating?: number | string;
  BlockUnratedItems: UnratedItem[] | null;
  BlockedTags: string[];
  AllowedTags: string[];
  AccessSchedules: AccessSchedule[];
}

const { t } = useTranslation();

const anchorAttrs = { target: '_blank', rel: 'noreferrer noopener' } as Record<string, string>;
const route = useRoute('/settings/users/[id]');
const router = useRouter();

const loading = ref<boolean>(false);
const addTagDialogOpen = ref<boolean>(false);
const newTagValue = ref<string>('');
const addAllowedTagDialogOpen = ref<boolean>(false);
const newAllowedTagValue = ref<string>('');
const user = ref<UserDto>({});
const libraries = ref<BaseItemDtoQueryResult>();
const channels = ref<BaseItemDtoQueryResult>();
const devices = ref<DeviceInfoDto[]>([]);
const authProviders = ref<NameIdPair[]>([]);
const passwordResetProviders = ref<NameIdPair[]>([]);
const parentalCategories = ref<{ label: string; id: number | undefined }[]>([]);
const model = ref<CurrentUser>({
  Name: '',
  CurrentPassword: '',
  Password: '',
  ConfirmPassword: '',
  IsAdministrator: false,
  IsDisabled: false,
  IsHidden: false,
  AuthenticationProviderId: '',
  PasswordResetProviderId: '',
  EnableRemoteAccess: false,
  EnableLiveTvAccess: false,
  EnableLiveTvManagement: false,
  EnableMediaPlayback: true,
  EnableAudioPlaybackTranscoding: true,
  EnableVideoPlaybackTranscoding: true,
  EnablePlaybackRemuxing: true,
  ForceRemoteSourceTranscoding: false,
  RemoteClientBitrateLimit: 0,
  SyncPlayAccess: SyncPlayUserAccessType.CreateAndJoinGroups,
  EnableContentDeletion: false,
  EnableContentDownloading: false,
  EnableRemoteControlOfOtherUsers: false,
  EnableSharedDeviceControl: false,
  EnableCollectionManagement: false,
  EnableSubtitleManagement: false,
  EnableLyricManagement: false,
  LoginAttemptsBeforeLockout: 0,
  MaxActiveSessions: 0,
  CanAccessAllLibraries: false,
  Folders: [],
  EnableAllChannels: true,
  EnabledChannels: [],
  EnableAllDevices: true,
  EnabledDevices: [],
  maxParentalRating: undefined,
  MaxParentalSubRating: undefined,
  BlockUnratedItems: [],
  BlockedTags: [],
  AllowedTags: [],
  AccessSchedules: []
});
const tab = ref<number>(1);
const blockingCategories = computed(() =>
  [
    {
      label: t('books'),
      value: 'Book'
    },
    {
      label: t('channels'),
      value: 'ChannelContent'
    },
    {
      label: t('liveTv'),
      value: 'LiveTvChannel'
    },
    {
      label: t('movies'),
      value: 'Movie'
    },
    {
      label: t('music'),
      value: 'Music'
    },
    {
      label: t('trailer'),
      value: 'Trailer'
    },
    {
      label: t('shows'),
      value: 'Series'
    }]
);

/**
 * Loads all data required for this page. Failures on any of the optional
 * lookups (channels, devices, providers) are swallowed individually so a
 * server without a given feature still renders the editable user form.
 */
async function load(): Promise<void> {
  const { id } = route.params;

  user.value = (await remote.sdk.newUserApi(getUserApi).getUserById({
    userId: id
  })).data;
  initializeUser();
  libraries.value = (await remote.sdk.newUserApi(getLibraryApi).getMediaFolders({ isHidden: false })).data;

  const cats = (await remote.sdk.newUserApi(getLocalizationApi).getParentalRatings()).data;

  for (const cat of cats) {
    if (parentalCategories.value.some(c => c.id === cat.Value!)) {
      parentalCategories.value = parentalCategories.value.map((c) => {
        if (c.id === cat.Value!) {
          return { label: `${c.label}/${cat.Name!}`, id: cat.Value };
        }

        return c;
      });
    } else {
      parentalCategories.value.push({ label: cat.Name!, id: cat.Value! });
    }
  }

  /**
   * Channels / devices / providers are *optional* enrichment — a server
   * without the channels plugin or with locked-down session endpoints
   * shouldn't block the form. Settle individually and swallow failures.
   */
  const [channelsRes, devicesRes, authRes, resetRes] = await Promise.allSettled([
    remote.sdk.newUserApi(getChannelsApi).getChannels({ userId: id }),
    remote.sdk.newUserApi(getDevicesApi).getDevices(),
    remote.sdk.newUserApi(getSessionApi).getAuthProviders(),
    remote.sdk.newUserApi(getSessionApi).getPasswordResetProviders()
  ]);

  if (channelsRes.status === 'fulfilled') {
    channels.value = channelsRes.value.data;
  }

  if (devicesRes.status === 'fulfilled') {
    devices.value = devicesRes.value.data.Items ?? [];
  }

  if (authRes.status === 'fulfilled') {
    authProviders.value = authRes.value.data;
  }

  if (resetRes.status === 'fulfilled') {
    passwordResetProviders.value = resetRes.value.data;
  }
}

await load();

const syncPlayItems = computed(() => [
  { title: t('syncPlayCreateAndJoin'), value: SyncPlayUserAccessType.CreateAndJoinGroups },
  { title: t('syncPlayJoinOnly'), value: SyncPlayUserAccessType.JoinGroups },
  { title: t('syncPlayNone'), value: SyncPlayUserAccessType.None }
]);

const dayOfWeekItems = computed(() => [
  { title: t('dayEveryday'), value: DynamicDayOfWeek.Everyday },
  { title: t('dayWeekday'), value: DynamicDayOfWeek.Weekday },
  { title: t('dayWeekend'), value: DynamicDayOfWeek.Weekend },
  { title: t('daySunday'), value: DynamicDayOfWeek.Sunday },
  { title: t('dayMonday'), value: DynamicDayOfWeek.Monday },
  { title: t('dayTuesday'), value: DynamicDayOfWeek.Tuesday },
  { title: t('dayWednesday'), value: DynamicDayOfWeek.Wednesday },
  { title: t('dayThursday'), value: DynamicDayOfWeek.Thursday },
  { title: t('dayFriday'), value: DynamicDayOfWeek.Friday },
  { title: t('daySaturday'), value: DynamicDayOfWeek.Saturday }
]);

/**
 * Append a default 9-17 schedule to the list. The user can then edit any
 * field inline; persistence happens on Save.
 */
function addSchedule(): void {
  model.value.AccessSchedules = [
    ...model.value.AccessSchedules,
    { DayOfWeek: DynamicDayOfWeek.Everyday, StartHour: 9, EndHour: 17 }
  ];
}

/**
 * Remove the schedule at the given index.
 */
function removeSchedule(idx: number): void {
  model.value.AccessSchedules = model.value.AccessSchedules.filter((_, i) => i !== idx);
}

/**
 * Saves the changed user access — library, channel, and device restrictions
 * all round-trip through `updateUserPolicy`.
 */
async function saveAccess(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUserPolicy({
    userId: user.value.Id,
    userPolicy: {
      ...user.value.Policy as UserPolicy,
      EnableAllFolders: model.value.CanAccessAllLibraries ?? false,
      EnabledFolders: model.value.Folders ?? [],
      EnableAllChannels: model.value.EnableAllChannels ?? true,
      EnabledChannels: model.value.EnabledChannels ?? [],
      EnableAllDevices: model.value.EnableAllDevices ?? true,
      EnabledDevices: model.value.EnabledDevices ?? []
    }
  });
  await refreshData();
  loading.value = false;
}

/**
 * Saves the changed profile. `updateUser` handles the name change;
 * `updateUserPolicy` carries all the policy fields (permissions, access
 * toggles, lockout/session caps, provider IDs).
 */
async function saveProfile(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUser({
    userId: user.value.Id,
    userDto: { ...user.value, Name: model.value.Name }
  });
  await remote.sdk.newUserApi(getUserApi).updateUserPolicy({
    userId: user.value.Id,
    userPolicy: {
      ...user.value.Policy as UserPolicy,
      IsAdministrator: model.value.IsAdministrator ?? false,
      IsDisabled: model.value.IsDisabled ?? false,
      IsHidden: model.value.IsHidden ?? false,
      AuthenticationProviderId: model.value.AuthenticationProviderId,
      PasswordResetProviderId: model.value.PasswordResetProviderId,
      EnableRemoteAccess: model.value.EnableRemoteAccess ?? false,
      EnableLiveTvAccess: model.value.EnableLiveTvAccess ?? false,
      EnableLiveTvManagement: model.value.EnableLiveTvManagement ?? false,
      EnableMediaPlayback: model.value.EnableMediaPlayback ?? true,
      EnableAudioPlaybackTranscoding: model.value.EnableAudioPlaybackTranscoding ?? true,
      EnableVideoPlaybackTranscoding: model.value.EnableVideoPlaybackTranscoding ?? true,
      EnablePlaybackRemuxing: model.value.EnablePlaybackRemuxing ?? true,
      ForceRemoteSourceTranscoding: model.value.ForceRemoteSourceTranscoding ?? false,
      RemoteClientBitrateLimit: Math.max(0, Number(model.value.RemoteClientBitrateLimit) || 0) * 1_000_000,
      SyncPlayAccess: model.value.SyncPlayAccess,
      EnableContentDeletion: model.value.EnableContentDeletion ?? false,
      EnableContentDownloading: model.value.EnableContentDownloading ?? false,
      EnableRemoteControlOfOtherUsers: model.value.EnableRemoteControlOfOtherUsers ?? false,
      EnableSharedDeviceControl: model.value.EnableSharedDeviceControl ?? false,
      EnableCollectionManagement: model.value.EnableCollectionManagement ?? false,
      EnableSubtitleManagement: model.value.EnableSubtitleManagement ?? false,
      EnableLyricManagement: model.value.EnableLyricManagement ?? false,
      LoginAttemptsBeforeLockout: Number(model.value.LoginAttemptsBeforeLockout) || 0,
      MaxActiveSessions: Number(model.value.MaxActiveSessions) || 0
    }
  });
  await refreshData();
  loading.value = false;
}

/**
 * Saves the changed parental control — extends the previous max-rating /
 * blocked-tags save with allowed tags, the parental sub-rating, and access
 * schedules.
 */
async function saveParentalControl(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUserPolicy({
    userId: user.value.Id,
    userPolicy: {
      ...user.value.Policy as UserPolicy,
      MaxParentalRating: model.value.maxParentalRating,
      MaxParentalSubRating: model.value.MaxParentalSubRating === '' || model.value.MaxParentalSubRating === undefined
        ? undefined
        : Number(model.value.MaxParentalSubRating) || undefined,
      BlockUnratedItems: model.value.BlockUnratedItems,
      BlockedTags: model.value.BlockedTags,
      AllowedTags: model.value.AllowedTags,
      AccessSchedules: model.value.AccessSchedules
    }
  });
  await refreshData();
  loading.value = false;
}

/**
 * Saves the changed password
 */
async function submitPassword(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  if (!model.value.Password || model.value.Password !== model.value.ConfirmPassword) {
    useSnackbar(t('bothPasswordsSame'), 'error');

    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUserPassword({ userId: user.value.Id, updateUserPassword: { NewPw: model.value.Password, ...(user.value.HasPassword && { CurrentPw: model.value.CurrentPassword }) } });
  model.value = { ...model.value, CurrentPassword: '', Password: '', ConfirmPassword: '' };
  await refreshData();
  loading.value = false;
}

/**
 * Refreshes the user data
 */
async function refreshData(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  user.value = (await remote.sdk.newUserApi(getUserApi).getUserById({
    userId: user.value.Id
  })).data;
  initializeUser();
}

/**
 * Deletes the user
 */
async function deleteUser(): Promise<void> {
  await useConfirmDialog(async () => {
    await remote.sdk.newUserApi(getUserApi).deleteUser({ userId: user.value.Id! });
    await router.push('/settings/users');
  }, {
    title: t('deleteUser'),
    text: t('deleteUserConfirm'),
    confirmText: t('delete')
  });
}

/**
 * Resets the password
 */
async function resetPassword(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUserPassword({ userId: user.value.Id, updateUserPassword: {
    ResetPassword: true
  } });
  await refreshData();
  loading.value = false;
}

/**
 * Mirror the policy fields back into the editable model. `RemoteClientBitrateLimit`
 * is stored on the server in bits-per-second; the input edits it in Mbps,
 * so divide by 1_000_000 here (the inverse of the saveProfile multiplier).
 */
function initializeUser(): void {
  const policy: UserPolicy = user.value.Policy ?? {} as UserPolicy;

  model.value = {
    ...model.value,
    Name: user.value.Name ?? '',
    IsAdministrator: policy.IsAdministrator ?? false,
    IsDisabled: policy.IsDisabled ?? false,
    IsHidden: policy.IsHidden ?? false,
    AuthenticationProviderId: policy.AuthenticationProviderId ?? '',
    PasswordResetProviderId: policy.PasswordResetProviderId ?? '',
    EnableRemoteAccess: policy.EnableRemoteAccess ?? false,
    EnableLiveTvAccess: policy.EnableLiveTvAccess ?? false,
    EnableLiveTvManagement: policy.EnableLiveTvManagement ?? false,
    EnableMediaPlayback: policy.EnableMediaPlayback ?? true,
    EnableAudioPlaybackTranscoding: policy.EnableAudioPlaybackTranscoding ?? true,
    EnableVideoPlaybackTranscoding: policy.EnableVideoPlaybackTranscoding ?? true,
    EnablePlaybackRemuxing: policy.EnablePlaybackRemuxing ?? true,
    ForceRemoteSourceTranscoding: policy.ForceRemoteSourceTranscoding ?? false,
    RemoteClientBitrateLimit: (policy.RemoteClientBitrateLimit ?? 0) / 1_000_000,
    SyncPlayAccess: policy.SyncPlayAccess ?? SyncPlayUserAccessType.CreateAndJoinGroups,
    EnableContentDeletion: policy.EnableContentDeletion ?? false,
    EnableContentDownloading: policy.EnableContentDownloading ?? false,
    EnableRemoteControlOfOtherUsers: policy.EnableRemoteControlOfOtherUsers ?? false,
    EnableSharedDeviceControl: policy.EnableSharedDeviceControl ?? false,
    EnableCollectionManagement: policy.EnableCollectionManagement ?? false,
    EnableSubtitleManagement: policy.EnableSubtitleManagement ?? false,
    EnableLyricManagement: policy.EnableLyricManagement ?? false,
    LoginAttemptsBeforeLockout: policy.LoginAttemptsBeforeLockout ?? 0,
    MaxActiveSessions: policy.MaxActiveSessions ?? 0,
    CanAccessAllLibraries: policy.EnableAllFolders ?? false,
    Folders: policy.EnabledFolders ?? [],
    EnableAllChannels: policy.EnableAllChannels ?? true,
    EnabledChannels: policy.EnabledChannels ?? [],
    EnableAllDevices: policy.EnableAllDevices ?? true,
    EnabledDevices: policy.EnabledDevices ?? [],
    maxParentalRating: policy.MaxParentalRating ?? undefined,
    MaxParentalSubRating: policy.MaxParentalSubRating ?? undefined,
    BlockUnratedItems: policy.BlockUnratedItems ?? [],
    BlockedTags: policy.BlockedTags ?? [],
    AllowedTags: policy.AllowedTags ?? [],
    AccessSchedules: policy.AccessSchedules ?? []
  };
}

/**
 * Read-only display of the user's recent invalid-login attempt count
 * (lives on the policy at runtime, updated by the server).
 */
const invalidLoginAttemptCount = computed(() => user.value.Policy?.InvalidLoginAttemptCount ?? 0);
</script>
