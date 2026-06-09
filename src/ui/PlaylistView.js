import { Artist } from "../models/Artist.js";
import { LocalStorageManager } from "../services/storage.js";
import { NowPlayingArtistRenderer } from "./NowPlayingArtist.js";
import { ArtistInfoSectionRenderer } from "./ArtistInfo.js";
import { BasifyI18n } from "../locales/index.js";
import { banSvg, warningSvg, unknownSvg } from "../constants/icons.js";
import { DomObserver } from "../utils/domObserver.js";

export class PlaylistViewRenderer {
  static styleElementId = "basify-playlist-view-style";
  static observer = null;
  static eventsRegistered = false;

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

  static async calculatePlaylistRating(playlistId) {
    try {
      const playlistUri = "spotify:playlist:" + playlistId;
      let allTracks = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      console.log(`[Basify] Requesting metadata for playlist: ${playlistId}`);

      while (hasMore) {
        const contents = await Spicetify.Platform.PlaylistAPI.getContents(playlistUri, { offset, limit }).catch(
          () => null,
        );
        if (!contents || !contents.items || contents.items.length === 0) {
          hasMore = false;
          break;
        }

        allTracks = allTracks.concat(contents.items);
        offset += limit;

        if (contents.items.length < limit) {
          hasMore = false;
        }
      }

      if (allTracks.length === 0) {
        console.warn("[Basify] PlaylistAPI returned no tracks, trying fallback.");
        return null;
      }

      console.log(`[Basify] Loaded ${allTracks.length} tracks. Extracting artists...`);

      const uniqueArtistIds = new Set();
      allTracks.forEach((item) => {
        const trackData = item.track || item;
        if (!trackData) return;

        (trackData.artists || []).forEach((artist) => {
          const id = artist.uri?.split?.(":")?.[2];
          if (id) uniqueArtistIds.add(id);
        });
      });

      const artistIdsArray = Array.from(uniqueArtistIds);
      console.log(`[Basify] Found ${artistIdsArray.length} unique artists. Resolving...`);

      const artists = await Promise.all(artistIdsArray.map((id) => Artist.create(id)));

      const blockedArtistIds = new Set();
      artists.forEach((artist) => {
        const labels = artist.labels || [];
        if (labels.includes("blocked")) {
          blockedArtistIds.add(artist.id);
        }
      });

      let blockedCount = 0;
      allTracks.forEach((item) => {
        const trackData = item.track || item;
        if (!trackData) return;

        const hasBlockedArtist = (trackData.artists || []).some((artist) => {
          const id = artist.uri?.split?.(":")?.[2];
          return blockedArtistIds.has(id);
        });
        if (hasBlockedArtist) {
          blockedCount++;
        }
      });

      const percentage = allTracks.length > 0 ? Math.round((blockedCount / allTracks.length) * 100) : 0;
      console.log(`[Basify] Safety Rating calculated: ${percentage}% (${blockedCount}/${allTracks.length})`);

      return {
        percentage,
        blockedCount,
        totalCount: allTracks.length,
      };
    } catch (e) {
      console.error("[Basify] calculatePlaylistRating failed:", e);
      return null;
    }
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

  static async renderRatingCard(playlistId) {
    try {
      const settings = LocalStorageManager.getSettings();
      if (!settings.showPlaylistRating) {
        document.getElementById("basify-playlist-rating-card")?.remove();
        return;
      }

      console.log(`[Basify] Attempting to render rating card for: ${playlistId}`);
      const rating = await PlaylistViewRenderer.calculatePlaylistRating(playlistId);
      if (!rating) return;

      const header = await DomObserver.waitForElement(".main-entityHeader-headerText", 5000);
      if (!header) {
        console.warn("[Basify] Header text container not found.");
        return;
      }

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

      header.appendChild(card);

      requestAnimationFrame(() => {
        const fillPath = card.querySelector(".basify-gauge-fill");
        const percentageText = card.querySelector(".basify-gauge-percentage");

        if (fillPath && percentageText) {
          fillPath.style.strokeDashoffset = String(dashOffset);
          PlaylistViewRenderer.animateCounter(percentageText, rating.percentage, 800);
        }
      });

      console.log("[Basify] Rating card successfully injected into DOM.");
    } catch (e) {
      console.error("[Basify] renderRatingCard failed:", e);
    }
  }

  static async scanRows() {
    const rows = document.querySelectorAll('div[role="row"]');
    const settings = LocalStorageManager.getSettings();

    rows.forEach(async (row) => {
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

      try {
        const artists = await Promise.all(artistIds.map((id) => Artist.create(id)));
        let shouldSkipRow = false;

        artists.forEach((artist, index) => {
          const link = artistLinks[index];
          if (!link) return;

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

        if (shouldSkipRow && settings.skipEnabled) {
          row.classList.add("basify-blocked-row");
        }
      } catch (e) {
        row.removeAttribute("data-basify-processed");
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
    `;
    document.head.appendChild(style);
  }
}
