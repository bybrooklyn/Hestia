/**
 * Session-lived memo for `fetchLibraryViews()`.
 *
 * The default layout (`layouts/default.vue`) needs the user's library views
 * for the nav drawer on *every* logged-in route. Pulling them through
 * `useIndexPage()` made the layout wait for the full home-page bundle
 * (resume / next-up / favorites / latest-per-library) before rendering the
 * drawer (PERFORMANCE_NOTES.md P0-C).
 *
 * Pattern mirrors `use-index-page.ts`: first call kicks off the fetch, every
 * subsequent call awaits the same Promise. Cleared on logout via
 * `remote.auth.onBeforeLogout`.
 */
import type { ComputedRef } from 'vue';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { fetchLibraryViews } from '#/utils/items.ts';
import { remote } from '#/plugins/remote/index.ts';

let cached: Promise<ComputedRef<BaseItemDto[]>> | undefined;

remote.auth.onBeforeLogout(() => {
  cached = undefined;
});

/**
 * Returns the cached library-views Promise, kicking off the fetch on first
 * call. Multiple callers within a session share the same Promise.
 */
export function useLibraryViews(): Promise<ComputedRef<BaseItemDto[]>> {
  cached ??= fetchLibraryViews();

  return cached;
}

/**
 * Discard the memoized result so the next `useLibraryViews` call re-fetches.
 */
export function refreshLibraryViews(): void {
  cached = undefined;
}
