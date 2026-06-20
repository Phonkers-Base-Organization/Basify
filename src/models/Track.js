import { BasifyI18n } from "../locales/index.js";
import { LocalStorageManager } from "../services/storage.js";
import { BLOCKED_DISTRIBUTORS } from "../constants/distributors.js";
import { Artist } from "./Artist.js";
import { DomObserver } from "../utils/domObserver.js";

export class BasifyTrack {
  constructor(data, trackArtists = []) {
    trackArtists = trackArtists || [];
    this.id = data.id;
    this.uri = data.uri;
    this.name = data.name;
    this.albumUri = data.albumUri || null;
    this.imageUrl = data.imageUrl || null;
    this.distributors = data.distributors || [];
    this.artistIds = data.artistIds || trackArtists.map((artist) => artist.id);
    this.artistsById = {};
    trackArtists.forEach((artist) => {
      this.artistsById[artist.id] = artist;
    });
    this.updatedAt = data.updatedAt || Date.now();
    this.lastUsedAt = data.lastUsedAt || Date.now();
  }

  get artists() {
    return Object.values(this.artistsById);
  }

  static async create(spotifyTrack, trackArtists = []) {
    const trackId = spotifyTrack.uri?.split(":")?.[2] || null;
    const cachedTrackData = trackId ? LocalStorageManager.getTrack(trackId) : null;

    if (cachedTrackData) {
      console.log("Loading track from local storage", trackId);
      const updatedTrackData = await LocalStorageManager.markTrackUsed(trackId);
      return new BasifyTrack(updatedTrackData || cachedTrackData, trackArtists);
    }

    const fetchedTrackData = await BasifyTrack.fetch(spotifyTrack, trackArtists);
    const savedTrackData = await LocalStorageManager.saveTrack(fetchedTrackData);
    return new BasifyTrack(savedTrackData, trackArtists);
  }

  static async getTrackArtists(spotifyTrack) {
    const artistsData = spotifyTrack?.artists || [];
    return Promise.all(artistsData.map((a) => Artist.create(a.uri.split(":")[2], a.name)));
  }

  static async createFromNowPlaying(spotifyTrack) {
    try {
      const [trackArtists, artistSpans] = await Promise.all([
        BasifyTrack.getTrackArtists(spotifyTrack),
        DomObserver.waitForNowPlayingArtistSpans(spotifyTrack, 5000).catch(() => null),
      ]);
      const basifyTrack = await BasifyTrack.create(spotifyTrack, trackArtists);
      return { basifyTrack, artistSpans };
    } catch (e) {
      return null;
    }
  }

  static async fetch(spotifyTrack, trackArtists = []) {
    const distributors = await BasifyTrack.getDistributorsFromSpotifyTrack(spotifyTrack).catch(() => []);

    console.log("Requesting track info from Spotify", spotifyTrack.uri.split(":")[2]);

    return {
      id: spotifyTrack.uri?.split(":")?.[2] || null,
      uri: spotifyTrack.uri,
      name: spotifyTrack.name || BasifyI18n.t("unknownTrack"),
      albumUri: spotifyTrack.album?.uri || null,
      imageUrl: BasifyTrack.getTrackImageUrl(spotifyTrack),
      artistIds: trackArtists.map((artist) => artist.id),
      distributors,
    };
  }

  static async createMany(items) {
    const tracksById = {};
    const missingItems = [];

    items.forEach(({ track, trackArtists = [] }) => {
      const id = track.uri?.split(":")?.[2];
      if (!id) return;

      const cachedTrackData = LocalStorageManager.getTrack(id);

      if (cachedTrackData) {
        tracksById[id] = new BasifyTrack(cachedTrackData, trackArtists);
        LocalStorageManager.markTrackUsed(id).catch(() => {});
        return;
      }

      missingItems.push({ track, trackArtists });
    });

    if (!missingItems.length) {
      return tracksById;
    }

    const fetchedTracksData = await Promise.all(
      missingItems.map(({ track, trackArtists }) => BasifyTrack.fetch(track, trackArtists)),
    );

    const savedTracksData = await LocalStorageManager.saveTrack(fetchedTracksData);

    savedTracksData.forEach((trackData, index) => {
      const { trackArtists } = missingItems[index];
      tracksById[trackData.id] = new BasifyTrack(trackData, trackArtists);
    });

    return tracksById;
  }

  static async getDistributorsFromSpotifyTrack(spotifyTrack) {
    const albumUri = spotifyTrack?.album?.uri;
    if (!albumUri) return [];
    try {
      const { getAlbum } = Spicetify.GraphQL.Definitions;
      const response = await Spicetify.GraphQL.Request(getAlbum, {
        uri: albumUri,
        locale: "",
        offset: 0,
        limit: 50,
      });
      const album = response?.data?.albumUnion;
      const distributorTexts = [];
      if (album?.label) {
        distributorTexts.push(album.label);
      }
      (album?.copyright?.items || []).forEach((item) => {
        if (!item?.text) return;
        distributorTexts.push(item.text);
      });
      return [...new Set(distributorTexts.filter(Boolean))];
    } catch (error) {
      console.warn("Basify failed to load album distributor data:", error);
      return [];
    }
  }

  getBlockedDistributors() {
    return BLOCKED_DISTRIBUTORS.filter((blockedDistributor) => {
      const normalizedBlockedDistributor = BasifyTrack.normalizeDistributorName(blockedDistributor);
      return this.distributors.some((distributorText) => {
        const normalizedDistributorText = BasifyTrack.normalizeDistributorName(distributorText);
        return normalizedDistributorText.includes(normalizedBlockedDistributor);
      });
    });
  }

  isDistributorBlocked() {
    return this.getBlockedDistributors().length > 0;
  }

  getArtistLabels(artist) {
    return artist.labels.length ? artist.labels : ["noInfo"];
  }

  shouldSkipTrack() {
    const settings = LocalStorageManager.getSettings();
    if (!settings.skipEnabled) return false;
    return this.getSkipReasons().length > 0;
  }

  getSkipReasons() {
    const settings = LocalStorageManager.getSettings();
    const reasons = [];
    const blockedDistros = this.getBlockedDistributors();
    if (settings.skipBlockedArtists && blockedDistros.length > 0) {
      blockedDistros.forEach((distributor) => {
        reasons.push({
          type: "distributor",
          name: distributor,
          label: "blockedDistributor",
        });
      });
    }

    const skipLabelSettings = {
      blocked: settings.skipBlockedArtists,
      warning: settings.skipWarningArtists,
      unknown: settings.skipUnknownArtists,
    };

    this.artists.forEach((artist) => {
      const labels = this.getArtistLabels(artist);
      labels.forEach((label) => {
        if (skipLabelSettings[label]) {
          reasons.push({ type: "artist", artist, label });
        }
      });
    });

    return reasons;
  }

  getTrackDominantStatus() {
    if (this.isDistributorBlocked()) return "blocked";
    const allLabels = this.artists.flatMap((artist) => this.getArtistLabels(artist));
    if (allLabels.includes("blocked")) return "blocked";
    if (allLabels.includes("warning")) return "warning";
    if (allLabels.includes("unknown")) return "unknown";
    if (allLabels.every((l) => l === "noInfo")) return "noInfo";
    return "clean";
  }

  getTrackTheme() {
    if (this.isDistributorBlocked()) return "blocked";
    const labels = this.artists.flatMap((artist) => this.getArtistLabels(artist));
    const priority = ["blocked", "pride", "base", "approved", "unknown", "noInfo"];
    return priority.find((themeStatus) => labels.includes(themeStatus)) || null;
  }

  async getDominantColor() {
    if (!this.imageUrl) return null;
    return BasifyTrack.extractDominantColorFromImage(this.imageUrl);
  }

  static getTrackImageUrl(spotifyTrack) {
    const imageUri =
      spotifyTrack?.images?.[0]?.url ||
      spotifyTrack?.album?.images?.[0]?.url ||
      spotifyTrack?.metadata?.image_xlarge_url ||
      spotifyTrack?.metadata?.image_large_url ||
      spotifyTrack?.metadata?.image_url;
    if (!imageUri) return null;
    if (imageUri.startsWith("https://")) return imageUri;
    const imageId = imageUri.split(":")?.[2];
    if (!imageId) return null;
    return `https://i.scdn.co/image/${imageId}`;
  }

  static extractDominantColorFromImage(imageUrl) {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageUrl;
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 48;
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          context.drawImage(image, 0, 0, size, size);
          const pixels = context.getImageData(0, 0, size, size).data;
          const colorBuckets = new Map();
          for (let i = 0; i < pixels.length; i += 4) {
            const a = pixels[i + 3];
            if (a < 128) continue;
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const brightness = (r + g + b) / 3;
            if (brightness < 25 || brightness > 235) continue;
            const q = (v) => Math.min(255, Math.round(v / 24) * 24);
            const key = `${q(r)},${q(g)},${q(b)}`;
            colorBuckets.set(key, (colorBuckets.get(key) || 0) + 1);
          }
          let dominantColor = null;
          let dominantCount = 0;
          colorBuckets.forEach((count, color) => {
            if (count > dominantCount) {
              dominantColor = color;
              dominantCount = count;
            }
          });
          if (!dominantColor) {
            resolve(null);
            return;
          }
          const [r, g, b] = dominantColor.split(",").map(Number);
          resolve(BasifyTrack.rgbToHex(r, g, b));
        } catch (e) {
          resolve(null);
        }
      };
      image.onerror = () => resolve(null);
    });
  }

  static rgbToHex(r, g, b) {
    return `#${[r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  }

  static normalizeDistributorName(v) {
    return String(v)
      .toLowerCase()
      .replace(/[©℗]/gu, "")
      .replace(/\b\d{4}\b/gu, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/gu, " ")
      .trim();
  }
}
