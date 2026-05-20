<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('backups') }}
    </template>
    <template #actions>
      <VBtn
        color="primary"
        variant="elevated"
        @click="creatingBackup = true">
        <JIcon class="i-mdi:archive-arrow-up uno-mr-2" />
        {{ t('createBackup') }}
      </VBtn>
    </template>
    <template #content>
      <VCol
        md="10"
        class="uno-pb-4 uno-pt-0">
        <VAlert
          v-if="restoring"
          type="warning"
          variant="tonal"
          class="uno-mb-4">
          {{ t('restoreInProgress') }}
        </VAlert>

        <div
          v-if="backups.length === 0"
          class="uno-text-disabled uno-py-8 uno-text-center">
          {{ t('noBackups') }}
        </div>
        <VTable
          v-else
          density="comfortable">
          <thead>
            <tr>
              <th>{{ t('dateCreated') }}</th>
              <th>{{ t('serverVersion') }}</th>
              <th>{{ t('contents') }}</th>
              <th class="uno-text-right">
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="b in backups"
              :key="b.Path ?? ''">
              <td>{{ b.DateCreated ? formatDate(b.DateCreated) : '' }}</td>
              <td>{{ b.ServerVersion }}</td>
              <td class="uno-text-disabled uno-text-xs">
                {{ contentsSummary(b) }}
              </td>
              <td class="uno-text-right">
                <VBtn
                  variant="text"
                  size="small"
                  :disabled="restoring || !b.Path"
                  @click="askRestore(b)">
                  <JIcon class="i-mdi:archive-arrow-down uno-mr-1" />
                  {{ t('restore') }}
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCol>

      <VDialog
        v-model="creatingBackup"
        width="500">
        <VCard>
          <VCardTitle>{{ t('createBackup') }}</VCardTitle>
          <VCardText>
            <VCheckbox
              v-model="newBackup.Database"
              :label="t('backupDatabase')"
              hide-details />
            <VCheckbox
              v-model="newBackup.Metadata"
              :label="t('backupMetadata')"
              hide-details />
            <VCheckbox
              v-model="newBackup.Subtitles"
              :label="t('backupSubtitles')"
              hide-details />
            <VCheckbox
              v-model="newBackup.Trickplay"
              :label="t('backupTrickplay')"
              hide-details />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn @click="creatingBackup = false">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              color="primary"
              :loading="creating"
              @click="submitCreate">
              {{ t('confirm') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <VDialog
        v-model="confirmingRestore"
        width="500">
        <VCard>
          <VCardTitle>{{ t('restoreBackup') }}</VCardTitle>
          <VCardText>
            {{ t('restoreBackupWarning') }}
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn @click="confirmingRestore = false">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              color="error"
              :loading="restoring"
              @click="submitRestore">
              {{ t('restore') }}
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
import type { Api } from '@jellyfin/sdk';
import type { BackupManifestDto, BackupOptionsDto } from '@jellyfin/sdk/lib/generated-client';
import { BackupApi } from '@jellyfin/sdk/lib/generated-client/api/backup-api';
import { format, parseJSON } from 'date-fns';
import { reactive, ref, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const { t } = useTranslation();

/**
 * The SDK ships getters for most APIs in `utils/api/*`, but `BackupApi` is
 * only exposed as a generated class. Mirror the standard wrapper shape so
 * we can keep calling through `remote.sdk.newUserApi(...)`.
 */
const getBackupApi = (api: Api): BackupApi =>
  new BackupApi(api.configuration, undefined, api.axiosInstance);

const backups = shallowRef<BackupManifestDto[]>([]);

/**
 * Pull the current backup list and sort newest-first — the server returns
 * them in filesystem order, which is stable but not chronological on every
 * filesystem.
 */
async function refresh(): Promise<void> {
  try {
    const { data } = await remote.sdk.newUserApi(getBackupApi).listBackups();

    backups.value = [...data].toSorted((a, b) =>
      (b.DateCreated ?? '').localeCompare(a.DateCreated ?? '')
    );
  } catch {
    useSnackbar(t('backupListFailed'), 'error');
  }
}

await refresh();

const creatingBackup = ref(false);
const creating = ref(false);
const newBackup = reactive<BackupOptionsDto>({
  Database: true,
  Metadata: true,
  Subtitles: false,
  Trickplay: false
});

/**
 * Kick off a backup with the currently-toggled options. The server runs
 * it asynchronously and doesn't push a finished event today, so we
 * schedule a list refresh shortly after to surface the new archive.
 */
async function submitCreate(): Promise<void> {
  creating.value = true;

  try {
    await remote.sdk.newUserApi(getBackupApi).createBackup({
      backupOptionsDto: { ...newBackup }
    });
    useSnackbar(t('backupStarted'), 'success');
    creatingBackup.value = false;
    /**
     * The server creates the archive asynchronously; refresh shortly after
     * to pick it up. A WebSocket-driven refresh would be nicer but the
     * server doesn't currently push a backup-finished event.
     */
    setTimeout(() => void refresh(), 3000);
  } catch {
    useSnackbar(t('backupCreateFailed'), 'error');
  } finally {
    creating.value = false;
  }
}

const confirmingRestore = ref(false);
const restoring = ref(false);
const restoreTarget = shallowRef<BackupManifestDto>();

/**
 * Stage a backup for restore and open the confirmation dialog.
 */
function askRestore(b: BackupManifestDto): void {
  restoreTarget.value = b;
  confirmingRestore.value = true;
}

/**
 * Restart the server and apply the staged backup. The API takes the
 * basename, not the full path. The server resolves it against its
 * configured backup directory.
 */
async function submitRestore(): Promise<void> {
  const path = restoreTarget.value?.Path;

  if (!path) {
    return;
  }

  restoring.value = true;

  try {
    /**
     * The API takes the basename, not the full path. The server resolves it
     * against its configured backup directory.
     */
    const archiveFileName = path.split(/[/\\]/).pop() ?? path;

    await remote.sdk.newUserApi(getBackupApi).startRestoreBackup({
      backupRestoreRequestDto: { ArchiveFileName: archiveFileName }
    });
    useSnackbar(t('restoreStarted'), 'success');
    confirmingRestore.value = false;
  } catch {
    useSnackbar(t('restoreFailed'), 'error');
    restoring.value = false;
  }
  /**
   * The server restarts on restore, so we deliberately leave `restoring`
   * truthy; the warning banner stays up until the page reloads.
   */
}

/**
 * Locale-aware date formatter; falls back to the raw ISO string if the
 * input is malformed.
 */
function formatDate(iso: string): string {
  try {
    return format(parseJSON(iso), 'PPpp');
  } catch {
    return iso;
  }
}

/**
 * Comma-separated list of toggles a manifest preserves (Database,
 * Metadata, etc) — translated for display.
 */
function contentsSummary(b: BackupManifestDto): string {
  const opts = b.Options;

  if (!opts) {
    return '';
  }

  const keys: (keyof BackupOptionsDto)[] = ['Database', 'Metadata', 'Subtitles', 'Trickplay'];
  const labels: Record<keyof BackupOptionsDto, string> = {
    Database: t('database'),
    Metadata: t('metadata'),
    Subtitles: t('subtitles'),
    Trickplay: t('trickplay')
  };

  return keys.filter(k => opts[k]).map(k => labels[k]).join(', ');
}
</script>
