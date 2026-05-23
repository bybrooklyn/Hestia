<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('logsAndActivity') }}
    </template>
    <template #content>
      <VCol
        v-if="loadError"
        md="12"
        class="uno-pb-2 uno-pt-0">
        <VAlert
          type="error"
          variant="tonal">
          {{ t('errorLoadingSettingsPage') }}
        </VAlert>
      </VCol>
      <VCol
        md="12"
        class="uno-pb-2 uno-pt-0">
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ t('logs') }}
        </h3>
        <VCheckbox
          :model-value="serverConfig.EnableSlowResponseWarning"
          :label="t('slowResponseWarning')"
          density="compact"
          hide-details
          @update:model-value="v => { serverConfig = { ...serverConfig, EnableSlowResponseWarning: v ?? false }; onConfigEdit(); }" />
        <VTextField
          :model-value="serverConfig.SlowResponseThresholdMs"
          :label="t('slowResponseThreshold')"
          :hint="t('slowResponseThresholdHint')"
          :disabled="!serverConfig.EnableSlowResponseWarning"
          type="number"
          variant="outlined"
          density="compact"
          persistent-hint
          class="uno-mt-3"
          @update:model-value="v => { serverConfig = { ...serverConfig, SlowResponseThresholdMs: Number(v) || 0 }; onConfigEdit(); }" />
      </VCol>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <JTransition group>
          <h3
            key="logs-title"
            class="uno-mb-2 uno-text-lg uno-font-bold">
            {{ t('logFiles') }}
          </h3>
          <VList
            v-if="logs.length"
            key="log-list"
            lines="two"
            class="uno-mb-2">
            <VListItem
              v-for="file in logs"
              :key="file.Name ?? undefined"
              :title="file.Name ?? undefined"
              :subtitle="getFormattedLogDate(file.DateModified)"
              @click="openLog(file)">
              <template #prepend>
                <VAvatar>
                  <JIcon class="i-mdi:file" />
                </VAvatar>
              </template>
              <template #append>
                <JIcon class="i-mdi:chevron-right" />
              </template>
            </VListItem>
          </VList>
          <VCard v-else>
            <VCardTitle>
              {{ t('noLogsFound') }}
            </VCardTitle>
          </VCard>
        </JTransition>
      </VCol>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <JTransition group>
          <div
            key="activity-header"
            class="uno-mb-2 uno-flex uno-items-center uno-justify-between">
            <h3 class="uno-text-lg uno-font-bold">
              {{ t('activity') }}
            </h3>
            <VBtnToggle
              v-model="activityFilter"
              mandatory
              density="compact"
              divided
              variant="outlined"
              @update:model-value="activityPage = 0">
              <VBtn
                size="small"
                value="all">
                {{ t('all') }}
              </VBtn>
              <VBtn
                size="small"
                value="user">
                {{ t('userEvents') }}
              </VBtn>
              <VBtn
                size="small"
                value="system">
                {{ t('systemEvents') }}
              </VBtn>
            </VBtnToggle>
          </div>
          <VList
            v-if="activityList.length"
            key="activity-list"
            lines="two"
            class="uno-mb-2">
            <VListItem
              v-for="activity in activityList"
              :key="activity.Id"
              :title="activity.Name"
              :subtitle="activity.ShortOverview ?? undefined">
              <template #prepend>
                <VAvatar :color="getColorFromSeverity(activity.Severity)">
                  <JIcon :class="getIconFromActivityType(activity.Type)" />
                </VAvatar>
              </template>
              <template #append>
                <VListItemSubtitle class="text-capitalize-first-letter">
                  {{ getFormattedActivityDate(activity.Date) }}
                </VListItemSubtitle>
              </template>
            </VListItem>
          </VList>
          <VCard v-else>
            <VCardTitle>
              {{ t('noActivityFound') }}
            </VCardTitle>
          </VCard>
          <div
            key="activity-pagination"
            class="uno-mt-2 uno-flex uno-items-center uno-justify-between">
            <VBtn
              variant="text"
              size="small"
              :disabled="activityPage === 0"
              @click="activityPage = Math.max(0, activityPage - 1)">
              <JIcon class="i-mdi:chevron-left uno-mr-1" />
              {{ t('previous') }}
            </VBtn>
            <span class="text-caption text--secondary">
              {{ activityPage + 1 }} / {{ totalPages }}
            </span>
            <VBtn
              variant="text"
              size="small"
              :disabled="activityPage + 1 >= totalPages"
              @click="activityPage = activityPage + 1">
              {{ t('next') }}
              <JIcon class="i-mdi:chevron-right uno-ml-1" />
            </VBtn>
          </div>
        </JTransition>
      </VCol>
      <VDialog
        :model-value="!!viewingLog"
        width="900"
        scrollable
        @update:model-value="closeLog">
        <VCard>
          <VCardTitle class="uno-flex uno-items-center uno-justify-between">
            <span class="uno-truncate">{{ viewingLog?.Name }}</span>
            <div class="uno-flex uno-gap-1">
              <VBtn
                icon
                size="small"
                :disabled="loadingLogContent || !logContent"
                @click="copyLog">
                <JIcon class="i-mdi:content-copy" />
                <VTooltip
                  activator="parent"
                  location="bottom">
                  {{ t('copyToClipboard') }}
                </VTooltip>
              </VBtn>
              <VBtn
                icon
                size="small"
                :disabled="loadingLogContent"
                @click="downloadLog">
                <JIcon class="i-mdi:download" />
                <VTooltip
                  activator="parent"
                  location="bottom">
                  {{ t('download') }}
                </VTooltip>
              </VBtn>
              <VBtn
                icon
                size="small"
                @click="closeLog">
                <JIcon class="i-mdi:close" />
              </VBtn>
            </div>
          </VCardTitle>
          <VCardText style="max-height: 70vh; overflow: auto;">
            <div
              v-if="loadingLogContent"
              class="uno-text-disabled uno-py-8 uno-text-center">
              {{ t('loading') }}
            </div>
            <pre
              v-else
              class="uno-overflow-auto uno-whitespace-pre uno-text-xs uno-font-mono">{{ logContent }}</pre>
          </VCardText>
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
import { type ActivityLogEntry, type LogFile, LogLevel, type ServerConfiguration } from '@jellyfin/sdk/lib/generated-client';
import { getActivityLogApi } from '@jellyfin/sdk/lib/utils/api/activity-log-api';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { format, formatRelative, parseJSON } from 'date-fns';
import { computed, shallowRef, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useTranslation } from 'i18next-vue';
import { useTheme } from 'vuetify';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { useDateFns } from '#/composables/use-datefns.ts';

const { t } = useTranslation();

const theme = useTheme();

type ActivityFilter = 'all' | 'user' | 'system';

const PAGE_SIZE = 25;

/**
 * Return a UI colour given log severity
 */
function getColorFromSeverity(severity: LogLevel | undefined): string {
  switch (severity) {
    case LogLevel.Trace: {
      return theme.current.value.colors.success;
    }
    case LogLevel.Debug: {
      return theme.current.value.colors.accent ?? '';
    }
    case LogLevel.Information: {
      return theme.current.value.colors.info;
    }
    case LogLevel.Warning: {
      return theme.current.value.colors.warning;
    }
    case LogLevel.Error: {
      return theme.current.value.colors.error;
    }
    case LogLevel.Critical: {
      return theme.current.value.colors.secondary;
    }
    default: {
      return theme.current.value.colors.primary;
    }
  }
}

/**
 * Gets an icon given an activity type
 */
function getIconFromActivityType(
  type: string | undefined | null
) {
  switch (type) {
    case 'SessionStarted': {
      return 'i-mdi:login';
    }
    case 'SessionEnded': {
      return 'i-mdi:logout';
    }
    case 'UserPasswordChanged': {
      return 'i-mdi:lock';
    }
    case 'VideoPlayback': {
      return 'i-mdi:play';
    }
    case 'VideoPlaybackStopped': {
      return 'i-mdi-stop';
    }
    default: {
      return 'i-mdi:help';
    }
  }
}

/**
 * Format activitydates
 */
function getFormattedActivityDate(date: string | undefined): string | undefined {
  return date
    ? useDateFns(formatRelative, parseJSON(date), new Date())
    : undefined;
}

/**
 * Format log dates
 */
function getFormattedLogDate(date: string | undefined): string | undefined {
  return date ? useDateFns(format, parseJSON(date), 'Ppp') : undefined;
}

/**
 * Creates a link to the given type of log file
 */
function getLogFileLink(name: string): string | undefined {
  return remote.sdk.api?.basePath && remote.auth.currentUserToken.value
    ? `${remote.sdk.api.basePath}/System/Logs/Log?name=${name}&api_key=${remote.auth.currentUserToken.value}`
    : undefined;
}

const loadError = shallowRef<unknown>();
const logs = shallowRef<LogFile[]>([]);
const activityList = shallowRef<ActivityLogEntry[]>([]);
const activityTotal = shallowRef(0);
const activityFilter = shallowRef<ActivityFilter>('all');
const activityPage = shallowRef(0);
const serverConfig = shallowRef<ServerConfiguration>({});
/**
 * Auto-save is disabled until the user touches a field, mirroring the
 * server.vue / transcoding.vue pattern: the first edit flips this flag, the
 * debounced watch fires from then on.
 */
const configDirty = shallowRef(false);

const totalPages = computed(() =>
  activityTotal.value === 0 ? 1 : Math.ceil(activityTotal.value / PAGE_SIZE)
);

/**
 * Map the UI filter to the `hasUserId` query parameter the server expects:
 * `true` keeps only entries with a user attached, `false` keeps only the
 * server's own events. `undefined` returns both.
 */
function hasUserIdParam(): boolean | undefined {
  switch (activityFilter.value) {
    case 'user': { return true; }
    case 'system': { return false; }
    default: { return undefined; }
  }
}

/**
 * Refetch the activity entries for the current page + filter. Wrapped in
 * try/catch so a transient failure doesn't blank the panel.
 */
async function refetchActivity(): Promise<void> {
  try {
    const { data } = await remote.sdk.newUserApi(getActivityLogApi).getLogEntries({
      startIndex: activityPage.value * PAGE_SIZE,
      limit: PAGE_SIZE,
      hasUserId: hasUserIdParam()
    });

    activityList.value = data.Items ?? [];
    activityTotal.value = data.TotalRecordCount ?? 0;
  } catch (error) {
    console.error('[settings/logs-and-activity] failed to refetch activity', error);
  }
}

try {
  const [logsRes, activityRes, configRes] = await Promise.all([
    remote.sdk.newUserApi(getSystemApi).getServerLogs(),
    remote.sdk.newUserApi(getActivityLogApi).getLogEntries({
      startIndex: 0,
      limit: PAGE_SIZE
    }),
    remote.sdk.newUserApi(getConfigurationApi).getConfiguration()
  ]);

  logs.value = logsRes.data;
  activityList.value = activityRes.data.Items ?? [];
  activityTotal.value = activityRes.data.TotalRecordCount ?? 0;
  serverConfig.value = configRes.data;
} catch (error) {
  loadError.value = error;
  console.error('[settings/logs-and-activity] failed to load logs/activity', error);
}

watch([activityPage, activityFilter], () => {
  void refetchActivity();
});

/**
 * Persist the server-configuration edits. Debounced so a rapid sequence of
 * checkbox toggles or number-field increments collapses into a single save.
 * Fail-soft: a snackbar surfaces transient errors but the local state stays
 * editable so the user can retry.
 */
const saveConfig = useDebounceFn(async () => {
  try {
    await remote.sdk.newUserApi(getConfigurationApi).updateConfiguration({
      serverConfiguration: serverConfig.value
    });
  } catch (error) {
    console.error('[settings/logs-and-activity] failed to save server configuration', error);
    useSnackbar(t('unexpectedError'), 'error');
  }
}, 600);

watch(serverConfig, () => {
  if (!configDirty.value) {
    return;
  }

  void saveConfig();
}, { deep: true });

/**
 * Mark the config dirty the first time the user edits a field, then trigger
 * the debounced save immediately so the very first edit also persists.
 */
function onConfigEdit(): void {
  if (!configDirty.value) {
    configDirty.value = true;
    void saveConfig();
  }
}

const viewingLog = shallowRef<LogFile>();
const logContent = shallowRef('');
const loadingLogContent = shallowRef(false);

/**
 * Open the log-detail dialog and fetch the file's contents. The SDK types
 * `getLogFile` as returning a `File`, but axios at runtime parses the
 * response as text — cast the data accordingly.
 */
async function openLog(file: LogFile): Promise<void> {
  if (!file.Name) {
    return;
  }

  viewingLog.value = file;
  logContent.value = '';
  loadingLogContent.value = true;

  try {
    const { data } = await remote.sdk.newUserApi(getSystemApi).getLogFile({ name: file.Name });

    /**
     * The SDK types this response as `File`, but axios at runtime parses
     * `text/plain` into a string. Treat anything non-string as a fallback
     * (Blob → text via `.text()`-equivalent isn't worth here — the server
     * only returns plain text for log files).
     */
    logContent.value = typeof data === 'string' ? data : '';
  } catch (error) {
    console.error('[settings/logs-and-activity] failed to open log file', error);
    useSnackbar(t('viewLogFailed'), 'error');
    viewingLog.value = undefined;
  } finally {
    loadingLogContent.value = false;
  }
}

/**
 * Close the log-detail dialog and release the cached contents so a large
 * file doesn't pin memory after viewing.
 */
function closeLog(): void {
  viewingLog.value = undefined;
  logContent.value = '';
}

/**
 * Copy the current log contents to the clipboard.
 */
async function copyLog(): Promise<void> {
  try {
    await navigator.clipboard.writeText(logContent.value);
    useSnackbar(t('copiedToClipboard'), 'success');
  } catch (error) {
    console.error('[settings/logs-and-activity] clipboard write failed', error);
    useSnackbar(t('copyFailed'), 'error');
  }
}

/**
 * Trigger a browser download of the current log file via the existing
 * api_key-authenticated link.
 */
function downloadLog(): void {
  const name = viewingLog.value?.Name;
  const href = name ? getLogFileLink(name) : undefined;

  if (!href) {
    return;
  }

  const link = document.createElement('a');

  link.href = href;
  link.download = name ?? 'log.txt';
  link.click();
}
</script>
