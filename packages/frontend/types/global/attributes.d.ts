/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
import type { hideDirective } from '#/plugins/directives.ts';

declare module 'vue' {
  export interface AllowedComponentProps {
    [key: `data${string}`]: string;
  }

  export interface ComponentCustomProps {
    // Allow any data-* attr on Vue components
    [key: `data${string}`]: string;
    /**
     * Vuetify components don't surface DOM event handlers in their prop
     * types — `@click` on a `<VBtn>` compiles to an `onClick` prop that
     * vue-tsc then rejects (TS2353). Listing the handlers we actually
     * use here lets the templates compile under `strictTemplates`
     * without per-call-site casts.
     */
    /**
     * Use a permissive signature: `@click="someAsyncFn"` regularly wires
     * handlers whose signature doesn't take the DOM event, and Vue
     * tolerates that at runtime. Pinning to `(e: MouseEvent) => void`
     * would just re-introduce the same TS2322 noise we're muting.
     */
    onClick?: (...args: never[]) => unknown;
    onDblclick?: (...args: never[]) => unknown;
    onMousedown?: (...args: never[]) => unknown;
    onMouseup?: (...args: never[]) => unknown;
    onMouseenter?: (...args: never[]) => unknown;
    onMouseleave?: (...args: never[]) => unknown;
    onContextmenu?: (...args: never[]) => unknown;
    onFocus?: (...args: never[]) => unknown;
    onBlur?: (...args: never[]) => unknown;
    onInput?: (...args: never[]) => unknown;
    onChange?: (...args: never[]) => unknown;
    onKeydown?: (...args: never[]) => unknown;
    onKeyup?: (...args: never[]) => unknown;
    onTouchstart?: (...args: never[]) => unknown;
    onTouchend?: (...args: never[]) => unknown;
    onTouchmove?: (...args: never[]) => unknown;
    onDragstart?: (...args: never[]) => unknown;
    onDragend?: (...args: never[]) => unknown;
    onDragover?: (...args: never[]) => unknown;
    onDrop?: (...args: never[]) => unknown;
    /**
     * Vuetify's `VTextField` accepts a native `step` attribute when
     * `type="number"`, but it isn't declared on the prop type.
     */
    step?: string | number;
  }

  export interface HTMLAttributes {
    // Allow any data-* attr on HTML elements
    [key: `data${string}`]: string;
  }

  export interface GlobalDirectives {
    vHide: hideDirective;
  }
}

/**
 * Experimental / vendor-specific browser APIs accessed via `globalThis`.
 * `queryLocalFonts` is part of the Local Font Access API (Chromium-only,
 * gated behind a permission). `webapis` is the Tizen / Samsung TV bridge
 * used by `utils/playback-profiles/`.
 */
declare global {
  interface Window {
    queryLocalFonts?: () => Promise<FontFace[]>;
    webapis?: {
      productinfo?: {
        isUdPanelSupported?: () => boolean;
        is8KPanelSupported?: () => boolean;
      };
    };
  }

  /** Mirror the additions onto the global scope so `globalThis.x` resolves. */
  var queryLocalFonts: Window['queryLocalFonts'];
  var webapis: Window['webapis'];
}
