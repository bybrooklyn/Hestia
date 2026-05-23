<template>
  <VContainer
    class="uno-flex uno-flex-wrap uno-items-center !uno-h-full"
    fluid>
    <VRow justify="center">
      <VCol
        v-if="!currentUser && !loginAsOther && publicUsers.length"
        sm="10"
        md="7"
        lg="5">
        <h1 class="text-h4 uno-mb-6 uno-text-center">
          {{ $t('selectUser') }}
        </h1>
        <VRow
          align="center"
          justify="center">
          <VCol
            v-for="publicUser in publicUsers"
            :key="publicUser.Id"
            cols="auto">
            <UserCard
              :user="publicUser"
              @connect="setCurrentUser" />
          </VCol>
        </VRow>
        <VRow
          align="center"
          justify="center"
          dense
          class="uno-mt-6">
          <VCol
            cols="11"
            sm="6"
            class="uno-flex uno-justify-center">
            <VBtn
              block
              size="large"
              variant="elevated"
              @click="loginAsOther = true">
              {{ $t('manualLogin') }}
            </VBtn>
          </VCol>
          <VCol
            cols="11"
            sm="6"
            class="uno-flex uno-justify-center">
            <VBtn
              v-if="jsonConfig.allowServerSelection"
              block
              to="/server/select"
              size="large"
              variant="elevated">
              {{ $t('changeServer') }}
            </VBtn>
          </VCol>
        </VRow>
        <VRow
          align="center"
          justify="center"
          dense
          class="uno-mt-4">
          <VCol
            cols="11"
            class="uno-flex uno-justify-center">
            <VBtn
              block
              size="large"
              variant="outlined"
              color="secondary"
              @click="startQuickConnect">
              {{ $t('quickConnect') }}
            </VBtn>
          </VCol>
        </VRow>
      </VCol>
      <VCol
        v-else-if="
          currentUser ||
            loginAsOther ||
            (publicUsers.length === 0 && $remote.auth.currentServer.value?.ServerName)
        "
        sm="6"
        md="6"
        lg="5">
        <h1
          v-if="currentUser"
          class="text-h4 uno-mb-3 uno-text-center">
          {{ $t('loginAs', { name: currentUser.Name }) }}
        </h1>
        <h1
          v-else
          class="text-h4 uno-text-center">
          {{ $t('login') }}
        </h1>
        <h5 class="text--disabled uno-mb-3 uno-text-center">
          {{ $remote.auth.currentServer.value?.ServerName }}
        </h5>
        <LoginForm
          :user="currentUser"
          :disabled="!isConnectedToServer"
          @change="resetCurrentUser" />
        <div class="uno-mt-4 uno-flex uno-justify-center">
          <VBtn
            v-if="!currentUser"
            variant="text"
            color="secondary"
            @click="startQuickConnect">
            {{ $t('quickConnect') }}
          </VBtn>
        </div>
        <p
          v-if="disclaimer"
          class="text-p uno-mt-6 uno-text-center">
          <JSafeHtml :html="disclaimer" />
        </p>
      </VCol>
    </VRow>

    <!-- Quick Connect Dialog -->
    <VDialog
      v-model="showQuickConnectDialog"
      max-width="450"
      persistent>
      <VCard class="uno-rounded-xl uno-p-6 !uno-border !uno-border-slate-800 !uno-bg-slate-900/80 !uno-backdrop-blur-md">
        <VCardTitle class="text-h5 uno-mb-4 uno-text-center uno-font-bold">
          {{ t('quickConnect') }}
        </VCardTitle>
        <VCardText class="uno-text-center">
          <div
            v-if="quickConnectLoading"
            class="uno-flex uno-flex-col uno-items-center uno-gap-4">
            <VProgressCircular
              indeterminate
              color="primary" />
            <span class="uno-text-slate-300">{{ t('loading') }}</span>
          </div>
          <div
            v-else
            class="uno-flex uno-flex-col uno-items-center uno-gap-4">
            <p class="text-body-1 uno-text-slate-300">
              {{ t('quickConnectInstructions') }}
            </p>
            <div class="uno-border uno-border-primary/20 uno-rounded-lg uno-bg-primary/10 uno-px-6 uno-py-3 uno-text-4xl uno-text-primary uno-font-bold uno-tracking-widest uno-font-mono">
              {{ quickConnectCode }}
            </div>
            <div class="uno-mt-2 uno-flex uno-items-center uno-gap-2 uno-text-sm uno-text-slate-400">
              <VProgressCircular
                indeterminate
                size="16"
                width="2"
                color="secondary" />
              <span>{{ t('quickConnectWaiting') }}</span>
            </div>
          </div>
        </VCardText>
        <VCardActions class="uno-mt-4 uno-justify-center">
          <VBtn
            variant="tonal"
            color="error"
            @click="cancelQuickConnect">
            {{ t('cancel') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>

<route lang="yaml">
meta:
  layout:
    name: server
</route>

<script setup lang="ts">
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { ref, shallowRef, computed, watch, onBeforeUnmount } from 'vue';
import { useTranslation } from 'i18next-vue';
import { getQuickConnectApi } from '@jellyfin/sdk/lib/utils/api/quick-connect-api';
import { fetchIndexPage } from '#/utils/items.ts';
import { remote } from '#/plugins/remote/index.ts';
import { jsonConfig } from '#/utils/external-config.ts';
import { usePageTitle } from '#/composables/page-title.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { isConnectedToServer } from '#/store/index.ts';

const { t } = useTranslation();

usePageTitle(() => t('login'));

const disclaimer = computed(() => remote.auth.currentServer.value?.BrandingOptions.LoginDisclaimer);
const publicUsers = computed(() => remote.auth.currentServer.value?.PublicUsers ?? []);

const loginAsOther = shallowRef(false);
const currentUser = ref<UserDto>();

// Quick Connect reactive state
const showQuickConnectDialog = ref(false);
const quickConnectCode = ref('');
const quickConnectSecret = ref('');
const quickConnectLoading = ref(false);
let quickConnectPollInterval: ReturnType<typeof setInterval> | undefined;

/**
 * Initiates the Quick Connect sign-in flow.
 */
async function startQuickConnect() {
  quickConnectLoading.value = true;
  showQuickConnectDialog.value = true;

  try {
    const { data } = await getQuickConnectApi(remote.sdk.api!).initiateQuickConnect();

    if (data.Code && data.Secret) {
      quickConnectCode.value = data.Code;
      quickConnectSecret.value = data.Secret;
      startPollingQuickConnect(data.Secret);
    } else {
      useSnackbar(t('quickConnectAuthorizationFailed'), 'error');
      showQuickConnectDialog.value = false;
    }
  } catch {
    useSnackbar(t('quickConnectAuthorizationFailed'), 'error');
    showQuickConnectDialog.value = false;
  } finally {
    quickConnectLoading.value = false;
  }
}

/**
 * Starts polling the Quick Connect state.
 */
function startPollingQuickConnect(secret: string) {
  if (quickConnectPollInterval) {
    clearInterval(quickConnectPollInterval);
  }

  /**
   * Polls the Quick Connect state until authenticated or failed.
   */
  async function pollState() {
    try {
      const { data } = await getQuickConnectApi(remote.sdk.api!).getQuickConnectState({ secret });
      const rawData = data as unknown as { Authenticated: boolean; User: UserDto; AccessToken: string };

      if (rawData.Authenticated) {
        clearInterval(quickConnectPollInterval);
        quickConnectPollInterval = undefined;

        useSnackbar(t('quickConnectAuthorized'), 'success');

        remote.auth.loginWithToken(rawData.User, rawData.AccessToken);
        await fetchIndexPage();
        showQuickConnectDialog.value = false;
      }
    } catch {
      clearInterval(quickConnectPollInterval);
      quickConnectPollInterval = undefined;
      useSnackbar(t('quickConnectAuthorizationFailed'), 'error');
      showQuickConnectDialog.value = false;
    }
  }

  quickConnectPollInterval = setInterval(() => {
    void pollState();
  }, 3000);
}

/**
 * Cancels the Quick Connect flow and clears timers/secrets.
 */
function cancelQuickConnect() {
  if (quickConnectPollInterval) {
    clearInterval(quickConnectPollInterval);
    quickConnectPollInterval = undefined;
  }

  showQuickConnectDialog.value = false;
  quickConnectCode.value = '';
  quickConnectSecret.value = '';
}

onBeforeUnmount(() => {
  if (quickConnectPollInterval) {
    clearInterval(quickConnectPollInterval);
  }
});

/**
 * Sets the current user for public user login
 */
async function setCurrentUser(user: UserDto): Promise<void> {
  if (!user.HasPassword && user.Name) {
    // If the user doesn't have a password, avoid showing the password form
    await remote.auth.loginUser(user.Name, '');
  } else {
    currentUser.value = user;
  }
}

/**
 * Resets the currently selected user
 */
function resetCurrentUser(): void {
  currentUser.value = undefined;
  loginAsOther.value = false;
}

watch(isConnectedToServer, () => {
  if (!isConnectedToServer.value) {
    useSnackbar(t('noServerConnection'), 'error');
  }
});
</script>
