import { LocalStorageManager } from "../services/storage.js";
import { crownSvg, starSvg, unknownSvg } from "../constants/icons.js";

export class NowPlayingArtistRenderer {
  static styleElementId = "basify-now-playing-artist-style";
  static statusStyles = {
    blocked: { color: "#ff4d4d", shape: "square" },
    warning: { color: "#f5c542", shape: "triangle" },
    approved: { color: "#1ed760", shape: "circle" },
    pride: { color: "#4aa3df", shape: "crown" },
    base: { color: "#8f6cff", shape: "star" },
    unknown: { color: "#b3b3b3", shape: "world" },
    noInfo: { color: "#8a8a8a", shape: "world" },
  };

  static statusIcons = {
    crown: crownSvg,
    star: starSvg,
    world: unknownSvg,
  };

  static render(basifyTrack, artistSpans) {
    const settings = LocalStorageManager.getSettings();
    NowPlayingArtistRenderer.injectStyles();
    NowPlayingArtistRenderer.renderArtistSpanGroup(artistSpans.bottomBarArtistSpans, basifyTrack.artists, settings);
    NowPlayingArtistRenderer.renderArtistSpanGroup(artistSpans.sideViewArtistSpans, basifyTrack.artists, settings);
  }

  static renderArtistSpanGroup(artistSpansById, artists, settings) {
    Object.entries(artistSpansById).forEach(([artistId, artistSpan]) => {
      const artist = artists.find((trackArtist) => trackArtist.id === artistId);
      NowPlayingArtistRenderer.resetArtistSpan(artistSpan);
      if (!artist) return;
      const dominantLabel = artist.getDominantLabel();
      const statusStyle = NowPlayingArtistRenderer.statusStyles[dominantLabel];
      const artistLink = artistSpan.querySelector("a") || artistSpan;

      if (settings.formatNowPlayingArtistName && statusStyle?.color) {
        artistLink.classList.add("basify-now-playing-artist-name");
        artistLink.style.setProperty("--basify-artist-status-color", statusStyle.color);
      }
      if (settings.showNowPlayingArtistStatusShape && statusStyle) {
        artistSpan.appendChild(NowPlayingArtistRenderer.createStatusShape(dominantLabel));
      }
      if (settings.showNowPlayingArtistFlags && artist.countries.length) {
        artist.countries.forEach((country) => {
          const flagElement = country.flagImg(settings.emojiFlags, 4, 12, 16);
          flagElement.classList.add("basify-artist-flag");
          artistSpan.appendChild(flagElement);
        });
      }
    });
  }

  static resetArtistSpan(artistSpan) {
    artistSpan.querySelectorAll(".basify-artist-flag").forEach((flag) => flag.remove());
    artistSpan.querySelectorAll(".basify-artist-status-shape").forEach((shape) => shape.remove());
    const artistLink = artistSpan.querySelector("a") || artistSpan;
    artistLink.classList.remove("basify-now-playing-artist-name");
    artistLink.style.removeProperty("--basify-artist-status-color");
  }

  static createStatusShape(label) {
    const statusStyle = NowPlayingArtistRenderer.statusStyles[label] || NowPlayingArtistRenderer.statusStyles.noInfo;
    const shape = document.createElement("span");
    shape.classList.add("basify-artist-status-shape");
    shape.dataset.status = label;
    shape.dataset.shape = statusStyle.shape;
    shape.style.setProperty("--basify-artist-status-color", statusStyle.color);
    const iconSvg = NowPlayingArtistRenderer.statusIcons[statusStyle.shape];
    if (iconSvg) {
      shape.innerHTML = iconSvg;
    }
    return shape;
  }

  static injectStyles() {
    if (document.getElementById(NowPlayingArtistRenderer.styleElementId)) return;
    const style = document.createElement("style");
    style.id = NowPlayingArtistRenderer.styleElementId;
    style.textContent = `
      .basify-now-playing-artist-name { color: var(--basify-artist-status-color) !important; }
      .basify-artist-flag { margin-bottom: 2px; }
      .basify-artist-status-shape { display: inline-block; margin-left: 4px; vertical-align: middle; flex: 0 0 auto; }
      .basify-artist-status-shape[data-shape="square"] { width: 10px; height: 10px; border-radius: 2px; background: var(--basify-artist-status-color); }
      .basify-artist-status-shape[data-shape="circle"] { width: 10px; height: 10px; border-radius: 50%; background: var(--basify-artist-status-color); margin-bottom: 3px; }
      .basify-artist-status-shape[data-shape="triangle"] { width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 10px solid var(--basify-artist-status-color); margin-bottom: 4px; }
      .basify-artist-status-shape[data-shape="crown"], .basify-artist-status-shape[data-shape="star"], .basify-artist-status-shape[data-shape="world"] { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; color: var(--basify-artist-status-color); margin-bottom: 2px; }
      .basify-artist-status-shape[data-shape="crown"] svg, .basify-artist-status-shape[data-shape="star"] svg, .basify-artist-status-shape[data-shape="world"] svg { width: 14px; height: 14px; margin-left: 0 !important; }
    `;
    document.head.appendChild(style);
  }
}
