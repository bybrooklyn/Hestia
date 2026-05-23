<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('devices') }}
    </template>
    <template #actions>
      <VBtn
        v-if="devices.length"
        color="error"
        variant="elevated"
        class="ml-a"
        :loading="loading"
        @click="deleteAllDevices">
        {{ t('deleteAll') }}
      </VBtn>
      <VBtn
        v-bind="anchorAttrs"
        variant="elevated"
        href="https://jellyfin.org/docs/general/server/devices.html">
        {{ t('help') }}
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
        <VTable density="comfortable">
          <thead>
            <tr>
              <th
                v-for="{ text, value } in headers"
                :id="value"
                :key="value">
                {{ text }}
              </th>
              <th scope="col">
                <!--for delete button-->
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="device in devices"
              :key="device.Id ?? undefined">
              <td
                v-for="{ value } in headers"
                :key="value">
                {{
                  value === 'DateLastActivity'
                    ? useDateFns(
                      formatRelative,
                      parseJSON(device[value] ?? 'unknown'),
                      new Date()
                    )
                    : value === 'Name'
                      ? (device.CustomName || device.Name)
                      : device[value]
                }}
              </td>
              <td class="uno-text-right">
                <VBtn
                  variant="text"
                  size="small"
                  :disabled="loading || !device.Id"
                  class="uno-mr-2"
                  @click="openEdit(device)">
                  <JIcon class="i-mdi:pencil uno-mr-1" />
                  {{ t('edit') }}
                </VBtn>
                <VBtn
                  color="error"
                  :disabled="loading"
                  @click="confirmDelete = device.Id ?? undefined">
                  {{ t('delete') }}
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCol>
      <VDialog
        width="420"
        :model-value="!isNil(confirmDelete)"
        @update:model-value="confirmDelete = undefined">
        <VCard>
          <VCardText>
            {{ t('deleteConfirm') }}
          </VCardText>
          <VCardActions>
            <VBtn
              color="primary"
              :loading="loading"
              @click="confirmDeletion">
              {{ t('confirm') }}
            </VBtn>
            <VBtn
              :loading="loading"
              @click="confirmDelete = undefined">
              {{ t('cancel') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
      <VDialog
        width="480"
        :model-value="!isNil(editingDevice)"
        @update:model-value="closeEdit">
        <VCard>
          <VCardTitle>{{ t('editDeviceName') }}</VCardTitle>
          <VCardText>
            <VTextField
              v-model="customNameDraft"
              :label="t('customName')"
              :hint="t('customNameHint')"
              :placeholder="editingDevice?.Name ?? ''"
              persistent-hint
              variant="outlined"
              clearable
              @keydown.enter="saveCustomName" />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              :loading="loading"
              @click="closeEdit">
              {{ t('cancel') }}
            </VBtn>
            <VBtn
              color="primary"
              :loading="loading"
              @click="saveCustomName">
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
import type { DeviceInfoDto as DeviceInfo } from '@jellyfin/sdk/lib/generated-client';
import { getDevicesApi } from '@jellyfin/sdk/lib/utils/api/devices-api';
import { formatRelative, parseJSON } from 'date-fns';
import { computed, ref, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { useDateFns } from '#/composables/use-datefns.ts';

const { t } = useTranslation();

const anchorAttrs = { target: '_blank', rel: 'noreferrer noopener' } as Record<string, string>;

const devices = ref<DeviceInfo[]>([]);
const loadError = shallowRef<unknown>();

try {
  devices.value
    = (await remote.sdk.newUserApi(getDevicesApi).getDevices()).data.Items ?? [];
} catch (error) {
  loadError.value = error;
  console.error('[settings/devices] failed to load devices', error);
}

const loading = ref(false);
/** The device id to confirm being deleted (will be 'all' if all are being deleted) */
const confirmDelete = ref<string>();

const headers = computed<{ text: string; value: keyof DeviceInfo }[]>(() => [
  {
    text: t('userName'),
    value: 'LastUserName'
  },
  { text: t('deviceName'), value: 'Name' },
  { text: t('appName'), value: 'AppName' },
  { text: t('appVersion'), value: 'AppVersion' },
  {
    text: t('lastActive'),
    value: 'DateLastActivity'
  }
]);

/**
 * Deletes all remembered devices
 */
async function deleteAllDevices(): Promise<void> {
  loading.value = true;

  try {
    for (const device of devices.value) {
      if (device.Id || remote.sdk.deviceInfo.id === device.Id) {
        await remote.sdk
          .newUserApi(getDevicesApi)
          .deleteDevice({ id: device.Id });
      }
    }

    useSnackbar(t('deleteAllDevicesSuccess'), 'success');

    devices.value
      = (await remote.sdk.newUserApi(getDevicesApi).getDevices()).data.Items
        ?? [];
  } catch (error) {
    useSnackbar(t('deleteAllDevicesError'), 'error');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

/**
 * Deletes the selected device
 */
async function deleteDevice(deviceId: string): Promise<void> {
  loading.value = true;

  try {
    await remote.sdk.newUserApi(getDevicesApi).deleteDevice({ id: deviceId });

    useSnackbar(t('deleteDeviceSuccess'), 'success');

    devices.value
      = (await remote.sdk.newUserApi(getDevicesApi).getDevices()).data.Items
        ?? [];
  } catch (error) {
    useSnackbar(t('deleteDeviceError'), 'error');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

/**
 * Confirms deleteion of a single device or all
 */
async function confirmDeletion(): Promise<void> {
  if (!confirmDelete.value) {
    return;
  }

  await (confirmDelete.value === 'all'
    ? deleteAllDevices()
    : deleteDevice(confirmDelete.value));

  confirmDelete.value = undefined;
}

const editingDevice = shallowRef<DeviceInfo>();
const customNameDraft = ref('');

/**
 * Stage a device for inline rename. Pre-fill the draft with the existing
 * custom name (or empty if none) so blanking the field reverts to the
 * device's reported `Name`.
 */
function openEdit(device: DeviceInfo): void {
  editingDevice.value = device;
  customNameDraft.value = device.CustomName ?? '';
}

/**
 * Close the rename dialog without saving.
 */
function closeEdit(): void {
  editingDevice.value = undefined;
  customNameDraft.value = '';
}

/**
 * Persist the staged `CustomName` via `updateDeviceOptions` and refresh the
 * list so the new label shows in the Name column. Blanking the field sends
 * an empty `CustomName`, which the server treats as "use the reported
 * device name".
 */
async function saveCustomName(): Promise<void> {
  const target = editingDevice.value;

  if (!target?.Id) {
    return;
  }

  loading.value = true;

  try {
    await remote.sdk.newUserApi(getDevicesApi).updateDeviceOptions({
      id: target.Id,
      deviceOptionsDto: { CustomName: customNameDraft.value.trim() }
    });

    useSnackbar(t('renameDeviceSuccess'), 'success');
    closeEdit();

    devices.value
      = (await remote.sdk.newUserApi(getDevicesApi).getDevices()).data.Items
        ?? [];
  } catch (error) {
    useSnackbar(t('renameDeviceError'), 'error');
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>
