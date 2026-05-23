/**
 * Session-lived memo for `fetchIndexPage()`.
 *
 * The default layout (`layouts/default.vue`) needs the user's library
 * views for the nav drawer, and `pages/index.vue` needs the full
 * carousel / next-up / latest-per-library set. Both used to call
 * `fetchIndexPage()` independently, issuing identical
 * `getUserViews` + `getLatestMedia` requests twice on a cold home-page
 * visit (`PERFORMANCE_NOTES.md` §1 P3).
 *
 * This composable returns a single shared Promise: the first call kicks
 * off the fetch, every subsequent call awaits the same Promise. Cleared
 * on logout via `remote.auth.onBeforeLogout` and exposes `refreshIndexPage()`
 * for explicit re-fetch (e.g., after the WebSocket `LibraryChanged` event
 * already watched by `store/dbs/api/index.ts`).
 */
import { fetchIndexPageSections, type IndexPageQueries } from '#/utils/items.ts';
import { useLibraryViews } from '#/composables/use-library-views.ts';
import { remote } from '#/plugins/remote/index.ts';

let cached: Promise<IndexPageQueries> | undefined;

remote.auth.onBeforeLogout(() => {
  cached = undefined;
});

/**
 * Returns the cached full home-page query bundle, kicking off the fetch on
 * first call. Shares the library-views Promise with `useLibraryViews()` so
 * the drawer and the home page never duplicate `getUserViews`.
 */
export function useIndexPage(): Promise<IndexPageQueries> {
  cached ??= (async () => {
    const views = await useLibraryViews();
    const sections = await fetchIndexPageSections(views);

    return { views, ...sections };
  })();

  return cached;
}

/**
 * Discard the memoized result so the next `useIndexPage` call re-fetches.
 * Use after server-side mutations (library scan, item deletion) that
 * invalidate the cached views.
 */
export function refreshIndexPage(): void {
  cached = undefined;
}
