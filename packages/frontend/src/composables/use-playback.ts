import { useFullscreen, useMagicKeys, whenever } from '@vueuse/core';
import { watch } from 'vue';
import { router } from '#/plugins/router/index.ts';
import { mediaElementRef } from '#/store/index.ts';
import { playbackManager } from '#/store/playback-manager.ts';

/**
 * Watchers and handlers that are common to fullscreen music and video playback
 * pages
 */
export function usePlayback() {
  watch(playbackManager.currentItem, () => {
    if (!playbackManager.currentItem.value) {
      /**
       * Return the user to the page they were on when they pressed play.
       * `router.back()` would rewind browser history one step, which on
       * admin testing often lands on `/settings/dashboard` (or whatever
       * the AppBar last navigated to) rather than the library/item page
       * playback was triggered from. The source route is captured in
       * `playbackManager.play()`.
       */
      void router.replace(playbackManager.sourceRoute.value ?? '/');
    }
  }, { flush: 'sync' });

  /**
   * - iOS's Safari fullscreen API is only available for the video element
   */
  const fullscreen = useFullscreen().isSupported.value
    ? useFullscreen(document.body, { autoExit: true })
    : useFullscreen(mediaElementRef, { autoExit: true });

  const keys = useMagicKeys();

  whenever(keys.space, playbackManager.playPause);
  whenever(keys.k, playbackManager.playPause);
  whenever(keys.right, playbackManager.skipForward);
  whenever(keys.l, playbackManager.skipForward);
  whenever(keys.left, playbackManager.skipBackward);
  whenever(keys.j, playbackManager.skipBackward);
  whenever(keys.f, fullscreen.toggle);
  whenever(keys.m, playbackManager.toggleMute);

  whenever(keys.MediaPause, playbackManager.pause);
  whenever(keys.Pause, playbackManager.pause);
  whenever(keys.MediaPlay, playbackManager.unpause);
  whenever(keys.MediaPlayPause, playbackManager.playPause);
  whenever(keys.MediaStop, playbackManager.stop);
  whenever(keys.Exit, playbackManager.stop);
  whenever(keys.MediaTrackNext, playbackManager.setNextItem);
  whenever(keys.MediaTrackPrevious, playbackManager.setPreviousItem);
  whenever(keys.MediaFastForward, playbackManager.skipForward);
  whenever(keys.MediaRewind, playbackManager.skipBackward);
  whenever(keys.AudioVolumeMute, playbackManager.toggleMute);
  whenever(keys.AudioVolumeUp, playbackManager.volumeUp);
  whenever(keys.AudioVolumeDown, playbackManager.volumeDown);

  return { fullscreen };
}
