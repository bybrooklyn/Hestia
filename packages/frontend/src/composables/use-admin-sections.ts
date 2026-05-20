/**
 * Single source of truth for the admin-side entries shown both in the settings
 * hub (`pages/settings/index.vue`) and in the persistent admin sidebar
 * (`components/Layout/AdminSettingsLayout.vue`).
 *
 * Entries with `link: undefined` are surfaced but disabled — they correspond
 * to capabilities in PARITY.md that don't yet have a page. New admin pages
 * are added here as their PARITY entry lands.
 */
import { computed, type ComputedRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import type { RouteLocationRaw } from 'vue-router';

export interface AdminMenuItem {
  icon: string;
  name: string;
  description: string;
  link?: RouteLocationRaw;
}

export type AdminSection = AdminMenuItem[];

export function useAdminSections(): ComputedRef<AdminSection[]> {
  const { t } = useTranslation();

  return computed<AdminSection[]>(() => [
    [
      {
        icon: 'i-mdi:view-dashboard',
        name: t('dashboard'),
        description: t('dashboardSettingsDescription'),
        link: '/settings/dashboard'
      },
      {
        icon: 'i-mdi:server',
        name: t('server'),
        description: t('serverSettingsDescription'),
        link: '/settings/server'
      },
      {
        icon: 'i-mdi:archive',
        name: t('backups'),
        description: t('backupsSettingsDescription'),
        link: '/settings/backups'
      },
      {
        icon: 'i-mdi:devices',
        name: t('devices'),
        description: t('devicesSettingsDescription'),
        link: '/settings/devices'
      },
      {
        icon: 'i-mdi:library-shelves',
        name: t('libraries'),
        description: t('librariesSettingsDescription'),
        link: undefined
      }
    ],
    [
      {
        icon: 'i-mdi:account-multiple',
        name: t('users'),
        description: t('userSettingsDescription'),
        link: '/settings/users'
      },
      {
        icon: 'i-mdi:key-chain',
        name: t('apiKeys'),
        description: t('apiKeysSettingsDescription'),
        link: '/settings/apikeys'
      }
    ],
    [
      {
        icon: 'i-mdi:play-network',
        name: t('transcodingAndStreaming'),
        description: t('transcodingSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:dlna',
        name: t('dlna'),
        description: t('dlnaSettingsDescription'),
        link: '/settings/dlna'
      },
      {
        icon: 'i-mdi:television-classic',
        name: t('liveTv'),
        description: t('liveTvSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:network',
        name: t('networking'),
        description: t('networkingSettingsDescription'),
        link: '/settings/networking'
      }
    ],
    [
      {
        icon: 'i-mdi:puzzle',
        name: t('plugins'),
        description: t('pluginsSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:calendar-clock',
        name: t('scheduledTasks'),
        description: t('scheduledTasksSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:bell',
        name: t('notifications'),
        description: t('notificationsSettingsDescription'),
        link: '/settings/notifications'
      },
      {
        icon: 'i-mdi:text-box',
        name: t('logsAndActivity'),
        description: t('logsAndActivitySettingsDescription'),
        link: '/settings/logs-and-activity'
      }
    ]
  ]);
}
