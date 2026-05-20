/**
 * Mirrors the server's `BrandingOptions.CustomCss` into a `<style>` element
 * appended to `document.head`. Cleared when no server is active or the CSS
 * is blank. Called once from `App.vue` so the app-wide reactive scope drives
 * the effect.
 */
import { watchEffect } from 'vue';
import { remote } from '#/plugins/remote/index.ts';

const STYLE_ID = 'server-custom-css';

export function useServerCustomCss(): void {
  watchEffect(() => {
    const css = remote.auth.currentServer.value?.BrandingOptions?.CustomCss?.trim() ?? '';
    let el = document.querySelector<HTMLStyleElement>(`style#${STYLE_ID}`);

    if (!css) {
      el?.remove();

      return;
    }

    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      document.head.append(el);
    }

    el.textContent = css;
  });
}
