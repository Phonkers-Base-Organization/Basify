import { LocalStorageManager } from "../services/storage.js";
import { ArtistInfoSectionRenderer } from "./ArtistInfo.js";

export class NowPlayingThemeOverlayRenderer {
  static styleElementId = "basify-now-playing-theme-overlay-style";
  static overlayElementId = "basify-now-playing-theme-overlay";

  static applyFromTrack(track) {
    const settings = LocalStorageManager.getSettings();
    if (!settings.formatNowPlayingBar) {
      NowPlayingThemeOverlayRenderer.clear();
      return;
    }
    const themeStatus = track.getTrackTheme();
    if (!themeStatus) {
      NowPlayingThemeOverlayRenderer.clear();
      return;
    }
    NowPlayingThemeOverlayRenderer.apply(themeStatus);
  }

  static apply(themeStatus) {
    const nowPlayingBar = NowPlayingThemeOverlayRenderer.getNowPlayingBar();
    const themeColor = ArtistInfoSectionRenderer.badges[themeStatus].bg;
    if (!nowPlayingBar || !themeColor) return;
    NowPlayingThemeOverlayRenderer.injectStyles();
    let overlay = nowPlayingBar.querySelector(`#${NowPlayingThemeOverlayRenderer.overlayElementId}`);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = NowPlayingThemeOverlayRenderer.overlayElementId;
      overlay.setAttribute("aria-hidden", "true");
      nowPlayingBar.prepend(overlay);
    }
    overlay.dataset.status = themeStatus;
    overlay.style.setProperty("--basify-now-playing-color", themeColor);
  }

  static clear() {
    document.getElementById(NowPlayingThemeOverlayRenderer.overlayElementId)?.remove();
  }

  static getNowPlayingBar() {
    return document.querySelector("div.Root__now-playing-bar");
  }

  static injectStyles() {
    if (document.getElementById(NowPlayingThemeOverlayRenderer.styleElementId)) return;
    const style = document.createElement("style");
    style.id = NowPlayingThemeOverlayRenderer.styleElementId;
    style.textContent = `
      .Root__now-playing-bar { position: relative; isolation: isolate; overflow: hidden; }
      .Root__now-playing-bar #basify-now-playing-theme-overlay { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.82; mix-blend-mode: screen; contain: strict; background: radial-gradient(circle at left center, color-mix(in srgb, var(--basify-now-playing-color) 95%, transparent) 0%, color-mix(in srgb, var(--basify-now-playing-color) 75%, transparent) 8%, transparent 22%), radial-gradient(circle at right center, color-mix(in srgb, var(--basify-now-playing-color) 95%, transparent) 0%, color-mix(in srgb, var(--basify-now-playing-color) 75%, transparent) 8%, transparent 22%), linear-gradient(90deg, color-mix(in srgb, var(--basify-now-playing-color) 45%, transparent) 0%, transparent 28%, transparent 72%, color-mix(in srgb, var(--basify-now-playing-color) 45%, transparent) 100%); }
      .Root__now-playing-bar > :not(#basify-now-playing-theme-overlay) { position: relative; z-index: 1; }
      .Root__now-playing-bar #basify-now-playing-theme-overlay[data-status="approved"], .Root__now-playing-bar #basify-now-playing-theme-overlay[data-status="pride"], .Root__now-playing-bar #basify-now-playing-theme-overlay[data-status="base"] { opacity: 0.68; }
      .Root__now-playing-bar #basify-now-playing-theme-overlay[data-status="unknown"], .Root__now-playing-bar #basify-now-playing-theme-overlay[data-status="noInfo"] { opacity: 0.58; }
    `;
    document.head.appendChild(style);
  }
}
