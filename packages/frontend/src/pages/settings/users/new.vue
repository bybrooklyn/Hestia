<template>
  <AdminSettingsLayout>
    <template #title>
      {{ t('newUser') }}
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
        <VForm @submit.prevent="createUser">
          <VTextField
            v-model="name"
            variant="outlined"
            :label="t('name')" />
          <VTextField
            v-model="password"
            variant="outlined"
            :label="t('password')"
            type="password" />

          <h3 class="uno-mb-2 uno-mt-4 uno-text-lg uno-font-bold">
            {{ t('libraryAccess') }}
          </h3>
          <VCheckbox
            v-model="canAccessAllLibraries"
            :label="t('allLibraries')"
            hide-details />
          <VCard
            v-if="!canAccessAllLibraries"
            :title="t('libraries')"
            variant="tonal"
            class="uno-mt-2">
            <VCheckbox
              v-for="library in libraries?.Items"
              :key="library.Id"
              v-model="accessableLibraries"
              :label="library.Name!"
              :value="library.Id"
              hide-details
              class="uno-px-4" />
            <div class="text-warning uno-px-4 uno-py-2">
              {{ t('libraryAccessNote') }}
            </div>
          </VCard>

          <div class="uno-mt-6 uno-flex uno-justify-end">
            <VBtn
              color="primary"
              variant="elevated"
              :loading="loading"
              @click="createUser">
              {{ t('newUser') }}
            </VBtn>
          </div>
        </VForm>
      </VCol>
    </template>
  </AdminSettingsLayout>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { useRouter } from 'vue-router';
import { remote } from '#/plugins/remote/index.ts';

const { t } = useTranslation();

const anchorAttrs = { target: '_blank', rel: 'noreferrer noopener' } as Record<string, string>;
const router = useRouter();
const name = ref('');
const password = ref('');
const canAccessAllLibraries = ref<boolean | null>(true);
const accessableLibraries = ref<string[] | null>([]);
const loading = ref(false);

const libraries = (
  await remote.sdk.newUserApi(getLibraryApi).getMediaFolders({ isHidden: false })
).data;

/**
 * Creates a new user
 */
async function createUser(): Promise<void> {
  try {
    loading.value = true;

    // Create the user
    const res = (await remote.sdk.newUserApi(getUserApi).createUserByName({
      createUserByName: {
        Name: name.value,
        Password: password.value
      }
    })).data;

    // Set the library access policy
    await remote.sdk.newUserApi(getUserApi).updateUserPolicy({
      userId: res.Id ?? '',
      userPolicy: {
        ...res.Policy!,
        EnableAllFolders: canAccessAllLibraries.value ?? false,
        ...(!canAccessAllLibraries.value && {
          EnabledFolders: accessableLibraries.value ?? []
        })
      }
    });

    await router.push(`/settings/users/${res.Id}`);
  } catch {} finally {
    loading.value = false;
  }
}
</script>
