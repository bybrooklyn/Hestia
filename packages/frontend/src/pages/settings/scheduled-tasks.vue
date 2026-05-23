<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('scheduledTasks') }}
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
                  <th>{{ t('triggers') }}</th>
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
                      class="uno-text-disabled uno-text-xs">
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
                  <td class="uno-text-disabled uno-text-xs">
                    {{ formatDuration(task) }}
                  </td>
                  <td class="uno-text-xs">
                    {{ summarizeTriggers(task) }}
                  </td>
                  <td class="uno-whitespace-nowrap uno-text-right">
                    <VBtn
                      variant="text"
                      size="small"
                      :disabled="!task.Id"
                      @click="openTriggerEditor(task)">
                      <JIcon class="i-mdi:cog-outline uno-mr-1" />
                      {{ t('editTriggers') }}
                    </VBtn>
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

      <VDialog
        v-model="triggerDialog"
        width="640">
        <VCard v-if="editingTask">
          <VCardTitle>
            {{ t('editTriggers') }} — {{ editingTask.Name }}
          </VCardTitle>
          <VCardText>
            <div
              v-if="editingTriggers.length === 0"
              class="uno-text-disabled uno-py-4 uno-text-center">
              {{ t('noTriggers') }}
            </div>
            <div
              v-for="(trigger, idx) in editingTriggers"
              :key="idx"
              class="uno-mb-3 uno-border uno-border-zinc-700 uno-rounded uno-border-solid uno-p-3">
              <div class="uno-flex uno-flex-wrap uno-items-start uno-gap-3">
                <VSelect
                  :model-value="trigger.Type"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :items="triggerTypeItems"
                  item-title="title"
                  item-value="value"
                  :label="t('triggerType')"
                  class="uno-min-w-40"
                  @update:model-value="v => updateTriggerType(idx, v)" />

                <template v-if="trigger.Type === 'DailyTrigger' || trigger.Type === 'WeeklyTrigger'">
                  <VTextField
                    :model-value="ticksToTimeOfDay(trigger.TimeOfDayTicks)"
                    type="time"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :label="t('timeOfDay')"
                    class="uno-min-w-32"
                    @update:model-value="v => trigger.TimeOfDayTicks = timeOfDayToTicks(v)" />
                </template>

                <VSelect
                  v-if="trigger.Type === 'WeeklyTrigger'"
                  v-model="trigger.DayOfWeek"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :items="dayOfWeekItems"
                  item-title="title"
                  item-value="value"
                  :label="t('dayOfWeek')"
                  class="uno-min-w-36" />

                <template v-if="trigger.Type === 'IntervalTrigger'">
                  <VTextField
                    :model-value="intervalAmount(trigger)"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :label="t('everyN')"
                    class="uno-min-w-24"
                    @update:model-value="v => setIntervalAmount(trigger, v)" />
                  <VSelect
                    :model-value="intervalUnits[idx] ?? 'hours'"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :items="intervalUnitItems"
                    item-title="title"
                    item-value="value"
                    :label="t('intervalUnit')"
                    class="uno-min-w-32"
                    @update:model-value="v => setIntervalUnit(idx, v)" />
                </template>

                <VSpacer />
                <VBtn
                  icon
                  variant="text"
                  size="small"
                  @click="editingTriggers.splice(idx, 1)">
                  <JIcon class="i-mdi:close" />
                </VBtn>
              </div>
              <VTextField
                :model-value="ticksToMinutes(trigger.MaxRuntimeTicks)"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
                class="uno-mt-3"
                :label="t('maxRuntime')"
                @update:model-value="v => trigger.MaxRuntimeTicks = minutesToTicks(v)" />
            </div>

            <VBtn
              variant="text"
              size="small"
              class="uno-mt-2"
              @click="addTrigger">
              <JIcon class="i-mdi:plus uno-mr-1" />
              {{ t('addTrigger') }}
            </VBtn>
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn @click="triggerDialog = false">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              color="primary"
              :loading="savingTriggers"
              @click="submitTriggers">
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
import { type TaskInfo, type TaskTriggerInfo, DayOfWeek, TaskTriggerInfoType } from '@jellyfin/sdk/lib/generated-client';
import { getScheduledTasksApi } from '@jellyfin/sdk/lib/utils/api/scheduled-tasks-api';
import { formatDistanceToNow, parseJSON } from 'date-fns';
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const { t } = useTranslation();

const tasks = shallowRef<TaskInfo[]>([]);
const loadError = shallowRef<unknown>();

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
    loadError.value = undefined;
  } catch (error) {
    loadError.value = error;
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

/**
 * == Trigger editor ==
 *
 * .NET ticks are 100-nanosecond units. 1 s = 10_000_000 ticks.
 */
const TICKS_PER_MINUTE = 600_000_000;
const TICKS_PER_HOUR = 36_000_000_000;

const triggerDialog = ref(false);
const editingTask = shallowRef<TaskInfo | undefined>();
const editingTriggers = ref<TaskTriggerInfo[]>([]);
const intervalUnits = ref<Record<number, 'minutes' | 'hours'>>({});
const savingTriggers = ref(false);

const triggerTypeItems = computed(() => [
  { title: t('triggerDaily'), value: TaskTriggerInfoType.DailyTrigger },
  { title: t('triggerWeekly'), value: TaskTriggerInfoType.WeeklyTrigger },
  { title: t('triggerInterval'), value: TaskTriggerInfoType.IntervalTrigger },
  { title: t('triggerStartup'), value: TaskTriggerInfoType.StartupTrigger }
]);
const dayOfWeekItems = computed(() => [
  { title: t('dayMonday'), value: DayOfWeek.Monday },
  { title: t('dayTuesday'), value: DayOfWeek.Tuesday },
  { title: t('dayWednesday'), value: DayOfWeek.Wednesday },
  { title: t('dayThursday'), value: DayOfWeek.Thursday },
  { title: t('dayFriday'), value: DayOfWeek.Friday },
  { title: t('daySaturday'), value: DayOfWeek.Saturday },
  { title: t('daySunday'), value: DayOfWeek.Sunday }
]);
const intervalUnitItems = computed(() => [
  { title: t('unitMinutes'), value: 'minutes' as const },
  { title: t('unitHours'), value: 'hours' as const }
]);

/**
 * Snapshot the task's triggers into the editor state. Each trigger is
 * cloned so cancel discards changes cleanly.
 */
function openTriggerEditor(task: TaskInfo): void {
  editingTask.value = task;
  editingTriggers.value = (task.Triggers ?? []).map(trigger => ({ ...trigger }));
  intervalUnits.value = {};

  for (const [idx, trigger] of editingTriggers.value.entries()) {
    intervalUnits.value[idx] = trigger.Type === TaskTriggerInfoType.IntervalTrigger
      && trigger.IntervalTicks !== undefined
      && trigger.IntervalTicks !== null
      && trigger.IntervalTicks % TICKS_PER_HOUR !== 0
      ? 'minutes'
      : 'hours';
  }

  triggerDialog.value = true;
}

/**
 * Append a fresh DailyTrigger at midnight as a starting point.
 */
function addTrigger(): void {
  editingTriggers.value.push({ Type: TaskTriggerInfoType.DailyTrigger, TimeOfDayTicks: 0 });
  intervalUnits.value[editingTriggers.value.length - 1] = 'hours';
}

/**
 * Replace the trigger at `idx` when its type changes, seeding defaults
 * appropriate for the new type and preserving MaxRuntimeTicks.
 */
function updateTriggerType(idx: number, type: TaskTriggerInfoType): void {
  const trigger: TaskTriggerInfo = { Type: type };

  switch (type) {
    case TaskTriggerInfoType.DailyTrigger: {
      trigger.TimeOfDayTicks = 0;

      break;
    }
    case TaskTriggerInfoType.WeeklyTrigger: {
      trigger.TimeOfDayTicks = 0;
      trigger.DayOfWeek = DayOfWeek.Monday;

      break;
    }
    case TaskTriggerInfoType.IntervalTrigger: {
      trigger.IntervalTicks = TICKS_PER_HOUR;
      intervalUnits.value[idx] = 'hours';

      break;
    }
  // No default
  }

  trigger.MaxRuntimeTicks = editingTriggers.value[idx]?.MaxRuntimeTicks;
  editingTriggers.value[idx] = trigger;
}

/**
 * Convert ticks-since-midnight into a `HH:MM` string for an `<input type="time">`.
 */
function ticksToTimeOfDay(ticks: number | null | undefined): string {
  const total = Math.floor((ticks ?? 0) / TICKS_PER_MINUTE);
  const hh = Math.floor(total / 60).toString().padStart(2, '0');
  const mm = (total % 60).toString().padStart(2, '0');

  return `${hh}:${mm}`;
}

/**
 * Parse the `HH:MM` form of a time input back to ticks-since-midnight.
 */
function timeOfDayToTicks(value: string | null): number {
  if (!value) {
    return 0;
  }

  const [h, m] = value.split(':').map(Number);

  return ((h ?? 0) * 60 + (m ?? 0)) * TICKS_PER_MINUTE;
}

/**
 * Convert ticks to whole minutes, or `undefined` when no max runtime is set.
 */
function ticksToMinutes(ticks: number | null | undefined): number | undefined {
  return ticks === undefined || ticks === null ? undefined : Math.round(ticks / TICKS_PER_MINUTE);
}

/**
 * Parse the user-entered minutes back to ticks. Empty / zero clears the value.
 */
function minutesToTicks(value: string | number | null): number | undefined {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : value;

  return n && n > 0 ? n * TICKS_PER_MINUTE : undefined;
}

/**
 * Convert a trigger's IntervalTicks into the user-visible amount in the
 * currently selected unit (minutes or hours).
 */
function intervalAmount(trigger: TaskTriggerInfo): number {
  const idx = editingTriggers.value.indexOf(trigger);
  const unit = intervalUnits.value[idx] ?? 'hours';
  const divisor = unit === 'hours' ? TICKS_PER_HOUR : TICKS_PER_MINUTE;

  return Math.max(1, Math.round((trigger.IntervalTicks ?? divisor) / divisor));
}

/**
 * Apply a new amount in the trigger's currently selected unit.
 */
function setIntervalAmount(trigger: TaskTriggerInfo, value: string | number): void {
  const idx = editingTriggers.value.indexOf(trigger);
  const unit = intervalUnits.value[idx] ?? 'hours';
  const multiplier = unit === 'hours' ? TICKS_PER_HOUR : TICKS_PER_MINUTE;
  const n = Math.max(1, typeof value === 'string' ? Number.parseInt(value, 10) || 1 : value);

  trigger.IntervalTicks = n * multiplier;
}

/**
 * Switch a trigger between minute and hour units, re-deriving the
 * underlying IntervalTicks so the displayed amount stays meaningful.
 */
function setIntervalUnit(idx: number, unit: 'minutes' | 'hours'): void {
  const trigger = editingTriggers.value[idx];

  if (!trigger) {
    return;
  }

  const prevUnit = intervalUnits.value[idx] ?? 'hours';
  const prevDivisor = prevUnit === 'hours' ? TICKS_PER_HOUR : TICKS_PER_MINUTE;
  const amount = Math.max(1, Math.round((trigger.IntervalTicks ?? prevDivisor) / prevDivisor));
  const nextMultiplier = unit === 'hours' ? TICKS_PER_HOUR : TICKS_PER_MINUTE;

  intervalUnits.value[idx] = unit;
  trigger.IntervalTicks = amount * nextMultiplier;
}

/**
 * Compact one-line summary of the triggers for the table column.
 */
function summarizeTriggers(task: TaskInfo): string {
  const triggers = task.Triggers ?? [];

  if (triggers.length === 0) {
    return '—';
  }

  return triggers.map((trigger) => {
    switch (trigger.Type) {
      case TaskTriggerInfoType.DailyTrigger: {
        return `${t('triggerDaily')} ${ticksToTimeOfDay(trigger.TimeOfDayTicks)}`;
      }
      case TaskTriggerInfoType.WeeklyTrigger: {
        return `${trigger.DayOfWeek ?? ''} ${ticksToTimeOfDay(trigger.TimeOfDayTicks)}`;
      }
      case TaskTriggerInfoType.IntervalTrigger: {
        const ticks = trigger.IntervalTicks ?? 0;
        const hours = ticks / TICKS_PER_HOUR;

        return hours >= 1 && Number.isInteger(hours)
          ? `${t('triggerInterval')} ${hours}h`
          : `${t('triggerInterval')} ${Math.round(ticks / TICKS_PER_MINUTE)}m`;
      }
      case TaskTriggerInfoType.StartupTrigger: {
        return t('triggerStartup');
      }
      default: {
        return trigger.Type ?? '';
      }
    }
  }).join(', ');
}

/**
 * Persist the edited trigger list. `updateTask` is a replace, not a merge.
 */
async function submitTriggers(): Promise<void> {
  if (!editingTask.value?.Id) {
    return;
  }

  savingTriggers.value = true;

  try {
    await remote.sdk.newUserApi(getScheduledTasksApi).updateTask({
      taskId: editingTask.value.Id,
      taskTriggerInfo: editingTriggers.value
    });
    useSnackbar(t('triggersUpdated'), 'success');
    triggerDialog.value = false;
    await refetch();
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    savingTriggers.value = false;
  }
}
</script>
