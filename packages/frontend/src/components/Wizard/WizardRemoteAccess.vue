<template>
  <div>
    <VCheckbox
      v-model="allowRemoteAccess"
      :label="t('allowRemoteAccess')"
      :disabled="loading" />
    <VCheckbox
      v-model="enableUPNP"
      :label="t('enableUPNP')" />
    <VBtn
      color="secondary"
      variant="elevated"
      :disabled="loading"
      @click="emit('previous-step')">
      {{ t('previous') }}
    </VBtn>
    <VBtn
      :loading="loading"
      color="primary"
      variant="elevated"
      @click="setRemoteAccess">
      {{ t('finish') }}
    </VBtn>
  </div>
</template>

<script setup lang="ts">
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const emit = defineEmits<{
  'step-complete': [];
  'previous-step': [];
}>();

const { t } = useTranslation();

const allowRemoteAccess = ref<boolean | null>(false);
const enableUPNP = ref<boolean | null>(false);
const loading = ref(false);

/**
 * Update settings and continue to next step
 */
async function setRemoteAccess(): Promise<void> {
  loading.value = true;

  const api = remote.sdk.oneTimeSetup(
    remote.auth.currentServer.value?.PublicAddress ?? ''
  );

  try {
    await getStartupApi(api).setRemoteAccess({
      startupRemoteAccessDto: {
        EnableRemoteAccess: allowRemoteAccess.value ?? false,
        EnableAutomaticPortMapping: enableUPNP.value ?? false
      }
    });

    emit('step-complete');
  } catch (error) {
    console.error(error);
    useSnackbar(t('setRemoteError'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>
