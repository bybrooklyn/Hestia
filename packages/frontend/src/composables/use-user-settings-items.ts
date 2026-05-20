/**
 * Single source of truth for the personal-settings entries shown both in
 * the settings hub (`pages/settings/index.vue`) and in the bottom group of
 * the admin sidebar (`components/Layout/AdminSettingsLayout.vue`).
 *
 * Entries with `link: undefined` are surfaced but disabled — they
 * correspond to capabilities in PARITY.md that don't yet have a page
 * (Home Screen, Playback, Media Players).
 */
import { computed, type ComputedRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import type { AdminMenuItem } from '#/composables/use-admin-sections.ts';

export type UserSettingsItem = AdminMenuItem;

/**
 * Reactive user-settings registry. The shape mirrors `useAdminSections`'
 * `AdminMenuItem` so both lists can be rendered with the same item
 * template in the sidebar.
 */
export function useUserSettingsItems(): ComputedRef<UserSettingsItem[]> {
  const { t } = useTranslation();

  return computed<UserSettingsItem[]>(() => [
    {
      icon: 'i-mdi:account',
      name: t('account'),
      description: t('accountSettingsDescription'),
      link: '/settings/account'
    },
    {
      icon: 'i-mdi:home',
      name: t('homeScreen'),
      description: t('homeScreenSettingsDescription'),
      link: undefined
    },
    {
      icon: 'i-mdi:play-pause',
      name: t('playback'),
      description: t('playbackSettingsDescription'),
      link: undefined
    },
    {
      icon: 'i-mdi:disc-player',
      name: t('mediaPlayers'),
      description: t('mediaPlayersSettingsDescription'),
      link: undefined
    },
    {
      icon: 'i-mdi:subtitles',
      name: t('subtitles'),
      description: t('subtitlesSettingsDescription'),
      link: '/settings/subtitles'
    },
    {
      icon: 'i-mdi:flask',
      name: t('experimental'),
      description: t('experimentalSettingsDescription'),
      link: '/settings/experimental'
    }
  ]);
}
