<template>
  <VContainer
    class="!uno-h-full"
    fluid>
    <VRow justify="center">
      <VCol
        cols="12"
        sm="12"
        md="12"
        xl="8">
        <VStepper
          v-model="wizardStage"
          class="!uno-bg-transparent">
          <VStepperHeader>
            <VStepperItem
              :complete="wizardStage > 1"
              :value="1"
              :editable="maxWizardStage > 0">
              {{ t('languageLocale') }}
            </VStepperItem>

            <VDivider />

            <VStepperItem
              :complete="wizardStage > 2"
              :value="2"
              :editable="maxWizardStage > 1">
              {{ t('administratorAccount') }}
            </VStepperItem>

            <VDivider />

            <VStepperItem
              :complete="wizardStage > 3"
              :value="3"
              :editable="maxWizardStage > 2">
              {{ t('libraries') }}
            </VStepperItem>

            <VDivider />

            <VStepperItem
              :complete="wizardStage > 4"
              :value="4"
              :editable="maxWizardStage > 3">
              {{ t('preferredMetadataLanguage') }}
            </VStepperItem>

            <VDivider />

            <VStepperItem
              :complete="wizardStage > 5"
              :value="5"
              :editable="maxWizardStage > 4">
              {{ t('remoteAccess') }}
            </VStepperItem>

            <VDivider />

            <VStepperItem
              :complete="wizardStage > 6"
              :value="6"
              :editable="maxWizardStage > 5">
              {{ t('finish') }}
            </VStepperItem>
          </VStepperHeader>

          <VStepperWindow>
            <VStepperWindowItem
              key="1-content"
              :value="1">
              <WizardLanguage
                class="uno-pt-4"
                @step-complete="nextStep" />
            </VStepperWindowItem>

            <VStepperWindowItem
              key="2-content"
              :value="2">
              <WizardAdminAccount
                class="uno-pt-4"
                @step-complete="nextStep"
                @previous-step="previousStep" />
            </VStepperWindowItem>

            <VStepperWindowItem
              key="3-content"
              :value="3">
              <WizardLibrary
                class="uno-pt-4"
                @step-complete="nextStep"
                @previous-step="previousStep" />
            </VStepperWindowItem>

            <VStepperWindowItem
              key="4-content"
              :value="4">
              <WizardMetadata
                class="uno-pt-4"
                @step-complete="nextStep"
                @previous-step="previousStep" />
            </VStepperWindowItem>

            <VStepperWindowItem
              key="5-content"
              :value="5">
              <WizardRemoteAccess
                class="uno-pt-4"
                @step-complete="nextStep"
                @previous-step="previousStep" />
            </VStepperWindowItem>

            <VStepperWindowItem
              key="6-content"
              :value="6">
              <WizardFinish
                class="uno-pt-4"
                @previous-step="previousStep" />
            </VStepperWindowItem>
          </VStepperWindow>
        </VStepper>
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
import { ref } from 'vue';
import { useTranslation } from 'i18next-vue';

const { t } = useTranslation();

const wizardStage = ref<number>(1);
const maxWizardStage = ref<number>(1);

/**
 * Advance the stepper. `completeWizard` now lives on the dedicated finish
 * step (`WizardFinish`), so this just bumps the index. The final step's
 * Finish button calls `getStartupApi(api).completeWizard()` directly.
 */
function nextStep(): void {
  wizardStage.value += 1;

  if (wizardStage.value > maxWizardStage.value) {
    maxWizardStage.value = wizardStage.value;
  }
}

/**
 * Change wizard step backwards
 */
function previousStep(): void {
  wizardStage.value -= 1;
}
</script>
