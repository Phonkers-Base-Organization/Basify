import { Artist } from "../models/Artist.js";
import { Playlist } from "../models/Playlist.js";
import { BasifyTrack } from "../models/Track.js";
import { LocalStorageManager } from "../services/storage.js";
import { NowPlayingArtistRenderer } from "./NowPlayingArtist.js";
import { ArtistInfoSectionRenderer } from "./ArtistInfo.js";
import { BasifyI18n } from "../locales/index.js";
import { banSvg, warningSvg, unknownSvg } from "../constants/icons.js";

export class PlaylistViewRenderer {
  static styleElementId = "basify-playlist-view-style";
  static observer = null;
  static eventsRegistered = false;
  static inFlightPlaylists = new Map();
  static currentPlaylist = null;

  static start() {
    PlaylistViewRenderer.injectStyles();
    PlaylistViewRenderer.registerGlobalInterceptors();

    if (PlaylistViewRenderer.observer) {
      PlaylistViewRenderer.observer.disconnect();
    }

    PlaylistViewRenderer.observer = new MutationObserver(() => {
      PlaylistViewRenderer.scanRows();
    });

    const mainView = document.querySelector(".main-view-container");
    if (mainView) {
      PlaylistViewRenderer.observer.observe(mainView, {
        childList: true,
        subtree: true,
      });
      PlaylistViewRenderer.scanRows();
    }
  }

  static stop() {
    if (PlaylistViewRenderer.observer) {
      PlaylistViewRenderer.observer.disconnect();
      PlaylistViewRenderer.observer = null;
    }
    PlaylistViewRenderer.currentPlaylist = null;
  }

  static registerGlobalInterceptors() {
    if (PlaylistViewRenderer.eventsRegistered) return;
    PlaylistViewRenderer.eventsRegistered = true;

    document.addEventListener(
      "dblclick",
      (e) => {
        const settings = LocalStorageManager.getSettings();
        if (!settings.skipEnabled) return;

        const row = e.target.closest(".basify-blocked-row");
        if (row) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      true,
    );

    document.addEventListener(
      "click",
      (e) => {
        const settings = LocalStorageManager.getSettings();
        if (!settings.skipEnabled) return;

        const row = e.target.closest(".basify-blocked-row");
        if (!row) return;

        const playButton = e.target.closest('button[aria-label*="Play"], button[aria-label*="play"]');
        const indexCell = e.target.closest(".main-trackList-rowSectionIndex");

        if (playButton || indexCell) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      true,
    );
  }

  static isPlaylistPageActive(playlistId) {
    const pathParts = Spicetify.Platform.History.location.pathname.split("/");
    return pathParts[1] === "playlist" && pathParts[2] === playlistId;
  }

  static apply(headerElement, playlistId) {
    const settings = LocalStorageManager.getSettings();
    document.getElementById("basify-playlist-rating-card")?.remove();
    document.getElementById("basify-playlist-rating-skeleton")?.remove();
    if (!settings.showPlaylistRating) return;

    PlaylistViewRenderer.injectStyles();
    PlaylistViewRenderer.renderSkeleton(headerElement);

    let loadPromise = PlaylistViewRenderer.inFlightPlaylists.get(playlistId);
    if (!loadPromise) {
      loadPromise = Playlist.create(playlistId, () => PlaylistViewRenderer.isPlaylistPageActive(playlistId)).finally(
        () => PlaylistViewRenderer.inFlightPlaylists.delete(playlistId),
      );
      PlaylistViewRenderer.inFlightPlaylists.set(playlistId, loadPromise);
    }

    loadPromise
      .then((playlist) => {
        if (!PlaylistViewRenderer.isPlaylistPageActive(playlistId)) return;
        PlaylistViewRenderer.currentPlaylist = playlist;
        document.getElementById("basify-playlist-rating-skeleton")?.remove();
        PlaylistViewRenderer.renderRatingCard(headerElement, playlist);
        document
          .querySelectorAll("[data-basify-processed]")
          .forEach((el) => el.removeAttribute("data-basify-processed"));
      })
      .catch(() => {
        document.getElementById("basify-playlist-rating-skeleton")?.remove();
      });
  }

  static renderSkeleton(headerElement) {
    const skeleton = document.createElement("div");
    skeleton.id = "basify-playlist-rating-skeleton";
    skeleton.className = "basify-playlist-rating-skeleton";
    skeleton.innerHTML = `
      <div class="basify-skeleton-gauge"></div>
      <div class="basify-skeleton-text">
        <div class="basify-skeleton-line" style="width: 120px;"></div>
        <div class="basify-skeleton-line" style="width: 180px;"></div>
      </div>
    `;
    headerElement.appendChild(skeleton);
    return skeleton;
  }

  static animateCounter(element, targetValue, durationMs = 800) {
    const startTime = performance.now();
    const startValue = 0;

    function update(currentTime) {
      const elapsedTime = currentTime - startTime;
      if (elapsedTime >= durationMs) {
        element.textContent = `${targetValue}%`;
        return;
      }

      const progress = elapsedTime / durationMs;
      const easeProgress = progress * (2 - progress);
      const currentValue = Math.round(startValue + easeProgress * (targetValue - startValue));

      element.textContent = `${currentValue}%`;
      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  static renderRatingCard(headerElement, playlist) {
    const rating = playlist.rating;
    if (!rating) return;

    document.getElementById("basify-playlist-rating-card")?.remove();

    const card = document.createElement("div");
    card.id = "basify-playlist-rating-card";
    card.className = "basify-playlist-rating-card";

    const dashArray = 126;
    const dashOffset = dashArray - (rating.percentage / 100) * dashArray;

    let strokeColor = "#1ed760";
    if (rating.percentage > 9) strokeColor = "#f5c542";
    if (rating.percentage > 29) strokeColor = "#ff4d4d";

    const locale = LocalStorageManager.getSettings().locale;
    const ratingText = locale === "uk" ? "Рейтинг безпеки" : "Safety Rating";
    const subText =
      locale === "uk"
        ? `${rating.blockedCount} з ${rating.totalCount} треків заблоковано`
        : `${rating.blockedCount} of ${rating.totalCount} tracks blocked`;

    card.innerHTML = `
      <div class="basify-gauge-wrapper">
        <svg viewBox="0 0 100 55" width="100" height="55">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10" stroke-linecap="round" />
          <path class="basify-gauge-fill" d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="${strokeColor}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashArray}" />
        </svg>
        <div class="basify-gauge-percentage">0%</div>
      </div>
      <div class="basify-rating-text-container">
        <div class="basify-rating-title">${ratingText}</div>
        <div class="basify-rating-subtext">${subText}</div>
      </div>
    `;

    headerElement.appendChild(card);

    requestAnimationFrame(() => {
      const fillPath = card.querySelector(".basify-gauge-fill");
      const percentageText = card.querySelector(".basify-gauge-percentage");

      if (fillPath && percentageText) {
        fillPath.style.strokeDashoffset = String(dashOffset);
        PlaylistViewRenderer.animateCounter(percentageText, rating.percentage, 800);
      }
    });
  }

  static async scanRows() {
    const rows = document.querySelectorAll('div[role="row"]');
    const settings = LocalStorageManager.getSettings();

    const candidates = [];
    const uniqueArtistsById = {};

    rows.forEach((row) => {
      const artistLinks = row.querySelectorAll('a[href^="/artist/"]');
      if (!artistLinks.length) return;

      const artistIds = Array.from(artistLinks).map((link) => link.pathname.split("/")[2]);
      const artistIdsString = artistIds.join(",");

      if (row.dataset.basifyProcessed === artistIdsString) return;
      row.dataset.basifyProcessed = artistIdsString;

      row.classList.remove("basify-blocked-row");
      row.querySelectorAll(".basify-playlist-status-icon-wrapper").forEach((el) => {
        el.removeEventListener("mouseenter", PlaylistViewRenderer.showTooltip);
        el.removeEventListener("mouseleave", PlaylistViewRenderer.hideTooltip);
        el.remove();
      });

      artistLinks.forEach((link) => {
        link.classList.remove("basify-now-playing-artist-name");
        link.style.removeProperty("--basify-artist-status-color");
      });

      artistIds.forEach((id) => {
        if (!uniqueArtistsById[id]) uniqueArtistsById[id] = { id, name: null };
      });

      candidates.push({ row, artistLinks, artistIds });
    });

    if (!candidates.length) return;

    let artistsById;
    try {
      artistsById = await Artist.createMany(Object.values(uniqueArtistsById));
    } catch (e) {
      candidates.forEach(({ row }) => row.removeAttribute("data-basify-processed"));
      return;
    }

    const playlist = PlaylistViewRenderer.currentPlaylist;
    const pathParts = Spicetify.Platform.History.location.pathname.split("/");
    const trackIds = pathParts[1] === "playlist" && playlist?.id === pathParts[2] ? playlist.trackIds : null;

    candidates.forEach(({ row, artistLinks, artistIds }) => {
      let shouldSkipRow = false;

      artistIds.forEach((id, index) => {
        const artist = artistsById[id];
        const link = artistLinks[index];
        if (!link || !artist) return;

        const labels = artist.labels.length ? artist.labels : ["noInfo"];
        const priority = ["blocked", "warning", "unknown", "pride", "base", "approved", "noInfo"];
        const dominantLabel = priority.find((l) => labels.includes(l)) || "noInfo";
        const statusStyle = NowPlayingArtistRenderer.statusStyles[dominantLabel];

        if (settings.formatNowPlayingArtistName && statusStyle?.color) {
          link.classList.add("basify-now-playing-artist-name");
          link.style.setProperty("--basify-artist-status-color", statusStyle.color);
        }

        if (dominantLabel === "blocked" || dominantLabel === "warning" || dominantLabel === "unknown") {
          const wrapper = document.createElement("span");
          wrapper.className = "basify-playlist-status-icon-wrapper";

          const iconSpan = document.createElement("span");
          iconSpan.className = "basify-playlist-status-icon";
          iconSpan.style.color = statusStyle.color;

          const badgeConfig =
            ArtistInfoSectionRenderer.badges[dominantLabel] || ArtistInfoSectionRenderer.badges.noInfo;
          const labelText = BasifyI18n.t(badgeConfig.textKey);

          const locale = LocalStorageManager.getSettings().locale;
          const description = locale === "uk" ? artist.description : artist.descriptionEn;

          let tooltipText = `${labelText} (${artist.name})`;
          if (description) {
            tooltipText += ` - ${description}`;
          }
          wrapper.dataset.tooltipText = tooltipText;

          let iconSvg = unknownSvg;
          if (dominantLabel === "blocked") {
            iconSvg = banSvg;
          } else if (dominantLabel === "warning") {
            iconSvg = warningSvg;
          }

          iconSpan.innerHTML = iconSvg;
          const svgElement = iconSpan.querySelector("svg");
          if (svgElement) {
            svgElement.setAttribute("width", "12");
            svgElement.setAttribute("height", "12");
            svgElement.style.marginLeft = "0";
          }

          wrapper.appendChild(iconSpan);
          wrapper.addEventListener("mouseenter", PlaylistViewRenderer.showTooltip);
          wrapper.addEventListener("mouseleave", PlaylistViewRenderer.hideTooltip);

          link.parentNode.insertBefore(wrapper, link.nextSibling);
        }

        if (dominantLabel === "blocked") {
          shouldSkipRow = true;
        }
      });

      let trackBlocked = false;
      if (trackIds) {
        const rowIndex = Number(row.getAttribute("aria-rowindex"));
        const trackIndex = rowIndex - 2;
        const trackId = trackIndex >= 0 ? trackIds[trackIndex] : null;
        const trackData = trackId ? LocalStorageManager.getTrack(trackId) : null;
        if (trackData) {
          const basifyTrack = new BasifyTrack(trackData);
          const blockedDistributors = basifyTrack.getBlockedDistributors();
          if (blockedDistributors.length > 0) {
            trackBlocked = true;
            const lastLink = artistLinks[artistLinks.length - 1];
            if (lastLink) {
              const wrapper = document.createElement("span");
              wrapper.className = "basify-playlist-status-icon-wrapper";
              const iconSpan = document.createElement("span");
              iconSpan.className = "basify-playlist-status-icon";
              iconSpan.style.color = NowPlayingArtistRenderer.statusStyles["blocked"].color;
              iconSpan.innerHTML = banSvg;
              const svgEl = iconSpan.querySelector("svg");
              if (svgEl) {
                svgEl.setAttribute("width", "12");
                svgEl.setAttribute("height", "12");
                svgEl.style.marginLeft = "0";
              }
              const locale = LocalStorageManager.getSettings().locale;
              const labelText = locale === "uk" ? "Заблокований дистриб'ютор" : "Blocked distributor";
              wrapper.dataset.tooltipText = `${labelText}: ${blockedDistributors.join(", ")}`;
              wrapper.appendChild(iconSpan);
              wrapper.addEventListener("mouseenter", PlaylistViewRenderer.showTooltip);
              wrapper.addEventListener("mouseleave", PlaylistViewRenderer.hideTooltip);
              lastLink.parentNode.insertBefore(wrapper, lastLink.nextSibling);
            }
          }
        }
      }

      if ((shouldSkipRow || trackBlocked) && settings.skipEnabled) {
        row.classList.add("basify-blocked-row");
      }
    });
  }

  static showTooltip(event) {
    const wrapper = event.currentTarget;
    const text = wrapper.dataset.tooltipText;
    if (!text) return;

    let tooltip = document.getElementById("basify-global-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "basify-global-tooltip";
      tooltip.className = "basify-global-tooltip";
      document.body.appendChild(tooltip);
    }

    tooltip.textContent = text;
    const rect = wrapper.getBoundingClientRect();

    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 6}px`;
    tooltip.classList.add("is-visible");
  }

  static hideTooltip() {
    const tooltip = document.getElementById("basify-global-tooltip");
    if (tooltip) {
      tooltip.classList.remove("is-visible");
    }
  }

  static injectStyles() {
    if (document.getElementById(PlaylistViewRenderer.styleElementId)) return;
    const style = document.createElement("style");
    style.id = PlaylistViewRenderer.styleElementId;
    style.textContent = `
      .basify-blocked-row {
        opacity: 0.35;
        background: rgba(114, 52, 51, 0.05) !important;
        transition: opacity 0.2s ease;
      }
      .basify-blocked-row:hover {
        opacity: 0.75;
      }
      .basify-playlist-status-icon-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
        margin-left: 4px;
      }
      .basify-playlist-status-icon svg {
        display: block;
      }
      .basify-global-tooltip {
        position: fixed;
        transform: translate(-50%, -100%) scale(0.95);
        background: #282828;
        color: #ffffff;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        max-width: 320px;
        white-space: normal;
        line-height: 1.4;
        text-align: center;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        opacity: 0;
        z-index: 999999 !important;
        pointer-events: none;
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: opacity 0.1s cubic-bezier(0.4, 0, 0.2, 1), transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .basify-global-tooltip.is-visible {
        opacity: 1;
        transform: translate(-50%, -100%) scale(1);
      }
      .basify-playlist-rating-card {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 16px;
        padding: 10px 16px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        width: fit-content;
      }
      .basify-gauge-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 55px;
      }
      .basify-gauge-fill {
        transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .basify-gauge-percentage {
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 15px;
        font-weight: 800;
        color: #ffffff;
      }
      .basify-rating-text-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .basify-rating-title {
        font-size: 12px;
        font-weight: 800;
        color: #ffffff;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .basify-playlist-rating-card .basify-rating-title {
        color: #ffffff !important;
      }
      .basify-rating-subtext {
        font-size: 12px;
        font-weight: 500;
        color: var(--spice-subtext);
      }
      .basify-playlist-rating-skeleton {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 16px;
        padding: 10px 16px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        width: fit-content;
      }
      .basify-skeleton-gauge {
        width: 100px;
        height: 55px;
        border-radius: 8px;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.06) 25%,
          rgba(255, 255, 255, 0.12) 50%,
          rgba(255, 255, 255, 0.06) 75%
        );
        background-size: 200% 100%;
        animation: basify-skeleton-shimmer 1.4s ease infinite;
      }
      .basify-skeleton-text {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .basify-skeleton-line {
        height: 12px;
        border-radius: 4px;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.06) 25%,
          rgba(255, 255, 255, 0.12) 50%,
          rgba(255, 255, 255, 0.06) 75%
        );
        background-size: 200% 100%;
        animation: basify-skeleton-shimmer 1.4s ease infinite;
      }
      @keyframes basify-skeleton-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
