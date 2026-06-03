import { BasifyI18n } from "../locales/index.js";
import { LocalStorageManager } from "../services/storage.js";
import { ArtistInfoSectionRenderer } from "./ArtistInfo.js";

export class SkipToastRenderer {
  static styleElementId = "basify-skip-toast-style";
  static containerClassName = "basify-skip-toast-container";
  static toastTimeouts = new WeakMap();
  static skippedTracksBuffer = [];
  static flushTimeoutId = null;

  static async bufferTrack(track) {
    SkipToastRenderer.skippedTracksBuffer.push(track);
    if (SkipToastRenderer.flushTimeoutId) {
      clearTimeout(SkipToastRenderer.flushTimeoutId);
    }
    SkipToastRenderer.flushTimeoutId = setTimeout(() => {
      SkipToastRenderer.flushBuffer();
    }, 1200);
  }

  static async flushBuffer() {
    const tracks = [...SkipToastRenderer.skippedTracksBuffer];
    SkipToastRenderer.skippedTracksBuffer = [];
    SkipToastRenderer.flushTimeoutId = null;
    if (tracks.length === 0) return;

    const settings = LocalStorageManager.getSettings();
    if (!settings.popupEnabled) return;

    SkipToastRenderer.injectStyles();
    const lastTrack = tracks[tracks.length - 1];
    const dominantColor = await lastTrack.getDominantColor();
    const container = SkipToastRenderer.createContainer();

    let toast;
    if (tracks.length === 1) {
      toast = SkipToastRenderer.createToast(lastTrack, dominantColor);
    } else {
      toast = SkipToastRenderer.createMultiToast(tracks, dominantColor);
    }

    toast.dataset.createdAt = String(Date.now());
    SkipToastRenderer.removeExtraToastsBeforeAppend(container);
    container.appendChild(toast);
    SkipToastRenderer.updateToastStack(container);

    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    SkipToastRenderer.scheduleToastRemoval(toast);
  }

  static scheduleToastRemoval(toast) {
    const existingTimeoutId = SkipToastRenderer.toastTimeouts.get(toast);
    if (existingTimeoutId) {
      clearTimeout(existingTimeoutId);
    }
    const durationMs = SkipToastRenderer.getToastDurationMs();
    const createdAt = Number(toast.dataset.createdAt) || Date.now();
    const ageMs = Date.now() - createdAt;
    const remainingMs = Math.max(0, durationMs - ageMs);
    const timeoutId = setTimeout(() => {
      SkipToastRenderer.removeToast(toast);
    }, remainingMs);
    SkipToastRenderer.toastTimeouts.set(toast, timeoutId);
  }

  static applySettings(settings, changedSettings = {}) {
    if (!settings.popupEnabled) {
      SkipToastRenderer.clearAll();
      return;
    }
    const container = document.querySelector(
      `.${SkipToastRenderer.containerClassName}`,
    );
    if (!container) return;
    if (Object.hasOwn(changedSettings, "popupDurationMs")) {
      const toasts = Array.from(
        container.querySelectorAll(".basify-skip-toast"),
      );
      toasts.forEach((toast) => {
        SkipToastRenderer.scheduleToastRemoval(toast);
      });
    }
    if (Object.hasOwn(changedSettings, "visibleToastLimit")) {
      SkipToastRenderer.removeExtraToastsBeforeAppend(container);
      SkipToastRenderer.updateToastStack(container);
    }
  }

  static removeExtraToastsBeforeAppend(container) {
    const maxToastCount = SkipToastRenderer.getVisibleToastLimit() + 1;
    const toasts = Array.from(container.querySelectorAll(".basify-skip-toast"));
    while (toasts.length >= maxToastCount) {
      const oldestToast = toasts.shift();
      SkipToastRenderer.removeToast(oldestToast, false);
    }
  }

  static updateToastStack(container) {
    const visibleToastLimit = SkipToastRenderer.getVisibleToastLimit();
    const toasts = Array.from(container.querySelectorAll(".basify-skip-toast"));
    toasts.forEach((toast) => {
      toast.classList.remove("is-fading-away");
    });
    if (toasts.length > visibleToastLimit) {
      toasts[0].classList.add("is-fading-away");
    }
  }

  static createContainer() {
    let container = document.querySelector(
      `.${SkipToastRenderer.containerClassName}`,
    );
    if (container) return container;
    container = document.createElement("div");
    container.className = SkipToastRenderer.containerClassName;
    document.body.appendChild(container);
    return container;
  }

  static createToast(track, dominantColor) {
    const toast = document.createElement("div");
    toast.className = "basify-skip-toast";
    SkipToastRenderer.applyDominantColorBackground(toast, dominantColor);
    const header = document.createElement("div");
    header.className = "basify-skip-toast-header";
    const title = document.createElement("div");
    title.className = "basify-skip-toast-title";
    title.textContent = BasifyI18n.t("trackSkipped");
    const closeButton = document.createElement("button");
    closeButton.className = "basify-skip-toast-close";
    closeButton.type = "button";
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => {
      SkipToastRenderer.removeToast(toast);
    });
    header.append(title, closeButton);

    const trackName = document.createElement("button");
    trackName.className = "basify-skip-toast-track";
    trackName.type = "button";
    trackName.textContent = track.name;
    if (track.id) {
      trackName.addEventListener("click", (event) => {
        event.stopPropagation();
        Spicetify.Platform.History.push(`/track/${track.id}`);
      });
    }

    const artistsWrapper = document.createElement("div");
    artistsWrapper.className = "basify-skip-toast-artists";
    const skipReasons = track.getSkipReasons();
    skipReasons.forEach((reason) => {
      if (reason.type === "distributor") {
        artistsWrapper.appendChild(
          SkipToastRenderer.createDistributorReasonRow(
            reason.name,
            reason.label,
          ),
        );
        return;
      }
      artistsWrapper.appendChild(
        SkipToastRenderer.createArtistReasonRow(reason.artist, [reason.label]),
      );
    });

    toast.append(header, trackName, artistsWrapper);
    return toast;
  }

  static createMultiToast(tracks, dominantColor) {
    const toast = document.createElement("div");
    toast.className = "basify-skip-toast basify-multi-skip-toast";
    SkipToastRenderer.applyDominantColorBackground(toast, dominantColor);

    const header = document.createElement("div");
    header.className = "basify-skip-toast-header";
    const title = document.createElement("div");
    title.className = "basify-skip-toast-title";

    const locale = LocalStorageManager.getSettings().locale;
    title.textContent =
      locale === "uk"
        ? `Пропущено ряд треків (${tracks.length})`
        : `Skipped multiple tracks (${tracks.length})`;

    const closeButton = document.createElement("button");
    closeButton.className = "basify-skip-toast-close";
    closeButton.type = "button";
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => {
      SkipToastRenderer.removeToast(toast);
    });
    header.append(title, closeButton);

    const listContainer = document.createElement("div");
    listContainer.className = "basify-skip-toast-list-container";
    listContainer.style.display = "flex";
    listContainer.style.flexDirection = "column";
    listContainer.style.gap = "10px";
    listContainer.style.maxHeight = "240px";
    listContainer.style.overflowY = "auto";
    listContainer.style.paddingRight = "4px";

    tracks.forEach((track) => {
      const trackRow = document.createElement("div");
      trackRow.className = "basify-skip-toast-multi-row";
      trackRow.style.display = "flex";
      trackRow.style.flexDirection = "column";
      trackRow.style.gap = "4px";
      trackRow.style.paddingBottom = "8px";
      trackRow.style.borderBottom = "1px solid rgba(255, 255, 255, 0.08)";

      const nameBtn = document.createElement("button");
      nameBtn.className = "basify-skip-toast-track";
      nameBtn.type = "button";
      nameBtn.textContent = track.name;
      nameBtn.style.fontSize = "14px";
      if (track.id) {
        nameBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          Spicetify.Platform.History.push(`/track/${track.id}`);
        });
      }

      const artistsWrapper = document.createElement("div");
      artistsWrapper.className = "basify-skip-toast-artists";
      const skipReasons = track.getSkipReasons();
      skipReasons.forEach((reason) => {
        if (reason.type === "distributor") {
          artistsWrapper.appendChild(
            SkipToastRenderer.createDistributorReasonRow(
              reason.name,
              reason.label,
            ),
          );
        } else {
          artistsWrapper.appendChild(
            SkipToastRenderer.createArtistReasonRow(reason.artist, [
              reason.label,
            ]),
          );
        }
      });

      trackRow.append(nameBtn, artistsWrapper);
      listContainer.appendChild(trackRow);
    });

    toast.append(header, listContainer);
    return toast;
  }

  static applyDominantColorBackground(toast, dominantColor) {
    if (!dominantColor) return;
    toast.style.background = `linear-gradient(180deg, ${dominantColor} 0%, color-mix(in srgb, ${dominantColor} 45%, var(--spice-card, #181818)) 30%, var(--spice-card, #181818) 80%)`;
    toast.style.backgroundClip = "padding-box";
  }

  static createArtistReasonRow(artist, labels) {
    const row = document.createElement("div");
    row.className = "basify-skip-toast-artist-row";
    const artistName = document.createElement("button");
    artistName.className = "basify-skip-toast-artist-name";
    artistName.type = "button";
    artistName.textContent = artist?.name || BasifyI18n.t("unknownArtist");
    if (artist?.id) {
      artistName.addEventListener("click", (event) => {
        event.stopPropagation();
        Spicetify.Platform.History.push(`/artist/${artist.id}`);
      });
    }
    const badgesWrapper = document.createElement("div");
    badgesWrapper.className = "basify-skip-toast-badges";
    const uniqueLabels = [...new Set(labels)];
    uniqueLabels.forEach((label) => {
      const badge = ArtistInfoSectionRenderer.createTrustBadge(label, artist);
      badge.classList.add("basify-skip-toast-badge");
      badgesWrapper.appendChild(badge);
    });
    row.append(artistName, badgesWrapper);
    return row;
  }

  static createDistributorReasonRow(distributorName, label) {
    const row = document.createElement("div");
    row.className = "basify-skip-toast-artist-row";
    const distributor = document.createElement("div");
    distributor.className = "basify-skip-toast-distributor-name";
    distributor.textContent =
      distributorName || BasifyI18n.t("unknownDistributor");
    const badgesWrapper = document.createElement("div");
    badgesWrapper.className = "basify-skip-toast-badges";
    const badge = ArtistInfoSectionRenderer.createTrustBadge(label);
    badge.classList.add("basify-skip-toast-badge");
    badgesWrapper.appendChild(badge);
    row.append(distributor, badgesWrapper);
    return row;
  }

  static getToastDurationMs() {
    const settings = LocalStorageManager.getSettings();
    return Number(settings.popupDurationMs) || 10000;
  }

  static getVisibleToastLimit() {
    const settings = LocalStorageManager.getSettings();
    return Number(settings.visibleToastLimit) || 3;
  }

  static removeToast(toast, animate = true) {
    if (!toast || toast.classList.contains("is-removing")) return;
    const timeoutId = SkipToastRenderer.toastTimeouts.get(toast);
    if (timeoutId) {
      clearTimeout(timeoutId);
      SkipToastRenderer.toastTimeouts.delete(toast);
    }
    const container = toast.closest(`.${SkipToastRenderer.containerClassName}`);
    if (!animate) {
      toast.remove();
      if (container?.children.length) {
        SkipToastRenderer.updateToastStack(container);
      } else {
        container?.remove();
      }
      return;
    }
    toast.classList.remove("is-visible");
    toast.classList.add("is-removing");
    setTimeout(() => {
      toast.remove();
      if (container?.children.length) {
        SkipToastRenderer.updateToastStack(container);
      } else {
        container?.remove();
      }
    }, 200);
  }

  static clearAll() {
    const container = document.querySelector(
      `.${SkipToastRenderer.containerClassName}`,
    );
    if (!container) return;
    container.querySelectorAll(".basify-skip-toast").forEach((toast) => {
      SkipToastRenderer.removeToast(toast, false);
    });
    container.remove();
  }

  static injectStyles() {
    if (document.getElementById(SkipToastRenderer.styleElementId)) return;
    const style = document.createElement("style");
    style.id = SkipToastRenderer.styleElementId;
    style.textContent = `
      .basify-skip-toast-container { position: fixed; right: 24px; bottom: 112px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; width: fit-content; min-width: 350px; max-width: min(720px, calc(100vw - 48px)); pointer-events: none; }
      .basify-skip-toast { display: flex; flex-direction: column; width: fit-content; gap: 12px; padding: 16px; border-radius: 12px; background: var(--spice-card, #181818); color: var(--spice-text, #ffffff); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.12); opacity: 0; transform: translateY(12px) scale(0.98); transition: opacity 0.2s ease, transform 0.2s ease; pointer-events: auto; overflow: hidden; }
      .basify-skip-toast.is-visible { opacity: 1; transform: translateY(0) scale(1); }
      .basify-skip-toast.is-removing { opacity: 0; transform: translateY(12px) scale(0.98); }
      .basify-skip-toast.is-fading-away { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, transparent 32%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.7) 58%, black 68%, black 100%); mask-image: linear-gradient(to bottom, transparent 0%, transparent 32%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.7) 58%, black 68%, black 100%); }
      .basify-skip-toast-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .basify-skip-toast-title { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45); font-size: 13px; font-weight: 700; color: var(--spice-subtext, #b3b3b3); text-transform: uppercase; letter-spacing: 0.04em; }
      .basify-skip-toast-close { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: 0; border-radius: 50%; background: transparent; color: var(--spice-subtext, #b3b3b3); font-size: 22px; line-height: 1; cursor: pointer; }
      .basify-skip-toast-close:hover { background: rgba(255, 255, 255, 0.08); color: var(--spice-text, #ffffff); }
      .basify-skip-toast-track { border: 0; padding: 0; background: transparent; color: var(--spice-text, #ffffff); font-size: 18px; font-weight: 800; line-height: 1.25; text-align: left; cursor: pointer; }
      .basify-skip-toast-track:hover { color: var(--spice-button, #1ed760); text-decoration: underline; }
      .basify-skip-toast-artists { display: flex; flex-direction: column; gap: 10px; }
      .basify-skip-toast-artist-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px; border-radius: 8px; background: rgba(255, 255, 255, 0.06); }
      .basify-skip-toast-artist-name { min-width: 0; flex: 1; border: 0; padding: 0; background: transparent; color: var(--spice-text, #ffffff); font-size: 14px; font-weight: 800; text-align: left; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
      .basify-skip-toast-artist-name:hover { color: var(--spice-button, #1ed760); text-decoration: underline; }
      .basify-skip-toast-distributor-name { min-width: 0; flex: 1; color: var(--spice-text, #ffffff); font-size: 14px; font-weight: 800; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .basify-skip-toast-badges { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; flex: 0 0 auto; }
      .basify-skip-toast-badge { font-size: 12px !important; padding: 5px 8px !important; }
      .basify-skip-toast-badge svg { width: 16px !important; height: 16px !important; }
      .basify-skip-toast-list-container::-webkit-scrollbar { width: 4px; }
      .basify-skip-toast-list-container::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }
    `;
    document.head.appendChild(style);
  }
}
