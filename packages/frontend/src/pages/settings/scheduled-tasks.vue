<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('scheduledTasks') }}
    </template>
    <template #content>
      <VCol
        md="10"
        class="uno-pb-4 uno-pt-0">
        <div
          v-if="visibleTasks.length === 0"
          class="uno-text-disabled uno-py-8 uno-text-center">
          {{ t('loading') }}
        </div>
        <template v-else>
          <div
            v-for="(group, category) in groupedTasks"
            :key="category"
            class="uno-mb-6">
            <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
              {{ category }}
            </h3>
            <VTable density="comfortable">
              <thead>
                <tr>
                  <th>{{ t('name') }}</th>
                  <th>{{ t('lastRun') }}</th>
                  <th>{{ t('runtime') }}</th>
                  <th class="uno-text-right">
                    {{ t('actions') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="task in group"
                  :key="task.Id ?? ''">
                  <td>
                    <div class="uno-font-medium">
                      {{ task.Name }}
                    </div>
                    <div
                      v-if="task.Description"
                      class="uno-text-xs uno-text-disabled">
                      {{ task.Description }}
                    </div>
                    <div
                      v-if="task.State === 'Running'"
                      class="uno-mt-1">
                      <VProgressLinear
                        :model-value="task.CurrentProgressPercentage ?? 0"
                        height="4"
                        color="primary"
                        rounded />
                    </div>
                  </td>
                  <td class="uno-text-xs">
                    {{ formatLastRun(task) }}
                  </td>
                  <td class="uno-text-xs uno-text-disabled">
                    {{ formatDuration(task) }}
                  </td>
                  <td class="uno-text-right">
                    <VBtn
                      v-if="task.State === 'Running'"
                      variant="text"
                      size="small"
                      color="error"
                      :disabled="!task.Id"
                      @click="stopTask(task.Id!)">
                      <JIcon class="i-mdi:stop uno-mr-1" />
                      {{ t('stop') }}
                    </VBtn>
                    <VBtn
                      v-else
                      variant="text"
                      size="small"
                      :disabled="!task.Id"
                      @click="runTask(task.Id!)">
                      <JIcon class="i-mdi:play uno-mr-1" />
                      {{ t('runNow') }}
                    </VBtn>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </div>
        </template>
      </VCol>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client';
import { getScheduledTasksApi } from '@jellyfin/sdk/lib/utils/api/scheduled-tasks-api';
import { formatDistanceToNow, parseJSON } from 'date-fns';
import { computed, onScopeDispose, shallowRef, watch } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const { t } = useTranslation();

const tasks = shallowRef<TaskInfo[]>([]);

const visibleTasks = computed(() => tasks.value.filter(task => !task.IsHidden));
const groupedTasks = computed(() => {
  const groups: Record<string, TaskInfo[]> = {};

  for (const task of visibleTasks.value) {
    const category = task.Category ?? t('miscellaneous');

    groups[category] ??= [];
    groups[category].push(task);
  }

  for (const list of Object.values(groups)) {
    list.sort((a, b) => (a.Name ?? '').localeCompare(b.Name ?? ''));
  }

  return groups;
});

/**
 * Re-pull the task list from the server. Falls back silently on transient
 * failure so a flaky network doesn't blank the UI.
 */
async function refetch(): Promise<void> {
  try {
    const { data } = await remote.sdk.newUserApi(getScheduledTasksApi).getTasks({
      isHidden: false
    });

    tasks.value = data;
  } catch {
    // leave previous list intact
  }
}

await refetch();

/**
 * Trigger a task immediately.
 */
async function runTask(id: string): Promise<void> {
  try {
    await remote.sdk.newUserApi(getScheduledTasksApi).startTask({ taskId: id });
    void refetch();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  }
}

/**
 * Request that a running task stop.
 */
async function stopTask(id: string): Promise<void> {
  try {
    await remote.sdk.newUserApi(getScheduledTasksApi).stopTask({ taskId: id });
    void refetch();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  }
}

/**
 * Format the last execution result line.
 */
function formatLastRun(task: TaskInfo): string {
  const last = task.LastExecutionResult;

  if (!last?.EndTimeUtc) {
    return '—';
  }

  const status = last.Status ? `${last.Status} · ` : '';

  return `${status}${formatDistanceToNow(parseJSON(last.EndTimeUtc), { addSuffix: true })}`;
}

/**
 * Format the elapsed duration of the last run, in seconds.
 */
function formatDuration(task: TaskInfo): string {
  const { StartTimeUtc, EndTimeUtc } = task.LastExecutionResult ?? {};

  if (!StartTimeUtc || !EndTimeUtc) {
    return '';
  }

  const ms = parseJSON(EndTimeUtc).getTime() - parseJSON(StartTimeUtc).getTime();

  return ms < 1000 ? `${ms} ms` : `${Math.round(ms / 1000)} s`;
}

/**
 * Live updates: the socket already subscribes to `ScheduledTasksInfo` on
 * connect (see `socket.ts`). Listen for those frames and overwrite the
 * local list; fall back to a slow poll while the socket is disconnected so
 * the UI doesn't go stale.
 */
watch(remote.socket.message, () => {
  const msg = remote.socket.message.value;

  if (msg?.MessageType !== 'ScheduledTasksInfo' || !Array.isArray(msg.Data)) {
    return;
  }

  tasks.value = msg.Data as TaskInfo[];
});

const { pause: stopPoll, resume: startPoll } = useIntervalFn(
  () => void refetch(),
  10_000,
  { immediate: false }
);

watch(() => remote.socket.isConnected.value, (connected) => {
  if (connected) {
    stopPoll();
  } else {
    startPoll();
  }
}, { immediate: true });

onScopeDispose(() => stopPoll());
</script>
