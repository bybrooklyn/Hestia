<template>
  <VContainer
    class="uno-flex uno-flex-wrap uno-items-center !uno-h-full"
    fluid>
    <VRow justify="center">
      <VCol
        sm="8"
        md="6"
        lg="4">
        <VCard class="uno-rounded-xl uno-p-8 !uno-border !uno-border-slate-800 !uno-bg-slate-900/80 !uno-backdrop-blur-md">
          <h1 class="text-h4 uno-mb-6 uno-text-center uno-font-bold">
            {{ t('resetPassword') }}
          </h1>

          <!-- Step 1: Request Password Reset -->
          <VForm
            v-if="step === 1"
            v-model="valid"
            @submit.prevent="requestReset">
            <p class="uno-mb-6 uno-text-center uno-text-slate-300">
              {{ t('forgotPasswordHelp') }}
            </p>
            <VTextField
              v-model="username"
              variant="outlined"
              :label="t('username')"
              :rules="usernameRules"
              autofocus
              class="uno-mb-6" />
            <VRow no-gutters>
              <VCol class="uno-mr-2">
                <VBtn
                  block
                  size="large"
                  variant="outlined"
                  to="/server/login">
                  {{ t('back') }}
                </VBtn>
              </VCol>
              <VCol>
                <VBtn
                  block
                  size="large"
                  color="primary"
                  :disabled="!valid"
                  :loading="loading">
                  {{ t('submit') }}
                </VBtn>
              </VCol>
            </VRow>
          </VForm>

          <!-- Step 2: Input PIN -->
          <VForm
            v-else-if="step === 2"
            v-model="validPin"
            @submit.prevent="submitPin">
            <p class="uno-mb-4 uno-text-center uno-text-slate-300">
              {{ t('forgotPasswordPinHelp', { file: pinFile || 'passwordreset.txt' }) }}
            </p>
            <VTextField
              v-model="pin"
              variant="outlined"
              :label="t('pin')"
              :rules="pinRules"
              autofocus
              class="uno-mb-6" />
            <VRow no-gutters>
              <VCol class="uno-mr-2">
                <VBtn
                  block
                  size="large"
                  variant="outlined"
                  @click="step = 1">
                  {{ t('back') }}
                </VBtn>
              </VCol>
              <VCol>
                <VBtn
                  block
                  size="large"
                  color="primary"
                  :disabled="!validPin"
                  :loading="loading">
                  {{ t('submit') }}
                </VBtn>
              </VCol>
            </VRow>
          </VForm>

          <!-- Step 3: Success -->
          <div
            v-else-if="step === 3"
            class="uno-text-center">
            <div class="uno-mb-4 uno-flex uno-justify-center">
              <div class="uno-border uno-border-green-500/20 uno-rounded-full uno-bg-green-500/10 uno-p-4 uno-text-green-500">
                <div class="i-mdi:check-circle-outline uno-text-4xl" />
              </div>
            </div>
            <p class="uno-mb-6 uno-text-slate-200">
              {{ t('forgotPasswordSuccess') }}
            </p>
            <VBtn
              block
              size="large"
              color="primary"
              to="/server/login">
              {{ t('backToSignIn') }}
            </VBtn>
          </div>

          <!-- Contact Admin -->
          <div
            v-else-if="step === 'contact-admin'"
            class="uno-text-center">
            <div class="uno-mb-4 uno-flex uno-justify-center">
              <div class="uno-border uno-border-amber-500/20 uno-rounded-full uno-bg-amber-500/10 uno-p-4 uno-text-amber-500">
                <div class="i-mdi:alert-circle-outline uno-text-4xl" />
              </div>
            </div>
            <p class="uno-mb-6 uno-text-slate-200">
              {{ t('forgotPasswordContactAdmin') }}
            </p>
            <VBtn
              block
              size="large"
              color="primary"
              to="/server/login">
              {{ t('backToSignIn') }}
            </VBtn>
          </div>

          <!-- In Network Required -->
          <div
            v-else-if="step === 'in-network-required'"
            class="uno-text-center">
            <div class="uno-mb-4 uno-flex uno-justify-center">
              <div class="uno-border uno-border-red-500/20 uno-rounded-full uno-bg-red-500/10 uno-p-4 uno-text-red-500">
                <div class="i-mdi:wifi-off uno-text-4xl" />
              </div>
            </div>
            <p class="uno-mb-6 uno-text-slate-200">
              {{ t('forgotPasswordInNetworkRequired') }}
            </p>
            <VBtn
              block
              size="large"
              color="primary"
              to="/server/login">
              {{ t('backToSignIn') }}
            </VBtn>
          </div>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<route lang="yaml">
meta:
  layout:
    name: server
</route>

<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { remote } from '#/plugins/remote/index.ts';
import { usePageTitle } from '#/composables/page-title.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const { t } = useTranslation();

usePageTitle(() => t('resetPassword'));

const step = ref<number | string>(1);
const username = shallowRef('');
const pin = shallowRef('');
const pinFile = shallowRef('');
const loading = shallowRef(false);

const valid = shallowRef<boolean | null>(false);
const validPin = shallowRef<boolean | null>(false);

const usernameRules = [
  (v: string): boolean | string => !!v.trim() || t('required')
];

const pinRules = [
  (v: string): boolean | string => !!v.trim() || t('required')
];

/**
 * Request a password reset for the specified username.
 */
async function requestReset() {
  if (!remote.sdk.api) {
    useSnackbar(t('noServerConnection'), 'error');

    return;
  }

  loading.value = true;

  try {
    const { data } = await getUserApi(remote.sdk.api).forgotPassword({
      forgotPasswordDto: {
        EnteredUsername: username.value.trim()
      }
    });

    switch (data.Action) {
      case 'PinCode': {
        pinFile.value = data.PinFile ?? 'passwordreset.txt';
        step.value = 2;
        break;
      }
      case 'ContactAdmin': {
        step.value = 'contact-admin';
        break;
      }
      case 'InNetworkRequired': {
        step.value = 'in-network-required';
        break;
      }
      default: {
        useSnackbar(t('unexpectedError'), 'error');
      }
    }
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    loading.value = false;
  }
}

/**
 * Submit the password reset PIN code.
 */
async function submitPin() {
  if (!remote.sdk.api) {
    useSnackbar(t('noServerConnection'), 'error');

    return;
  }

  loading.value = true;

  try {
    const { data } = await getUserApi(remote.sdk.api).forgotPasswordPin({
      forgotPasswordPinDto: {
        Pin: pin.value.trim()
      }
    });

    if (data.Success) {
      useSnackbar(t('forgotPasswordSuccess'), 'success');
      step.value = 3;
    } else {
      useSnackbar(t('quickConnectAuthorizationFailed'), 'error');
    }
  } catch {
    useSnackbar(t('quickConnectAuthorizationFailed'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>
