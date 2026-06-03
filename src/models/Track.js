import { BasifyI18n } from "../locales/index.js";
import { LocalStorageManager } from "../services/storage.js";
import { BLOCKED_DISTRIBUTORS } from "../constants/distributors.js";

export class BasifyTrack {
  constructor(spotifyTrack, trackArtists, distributors = []) {
    this.raw = spotifyTrack;
    this.uri = spotifyTrack.uri;
    this.id = spotifyTrack.uri?.split(":")?.[2] || null;
    this.name = spotifyTrack.name || BasifyI18n.t("unknownTrack");
    this.artistsById = {};
    trackArtists.forEach((artist) => {
      this.artistsById[artist.id] = artist;
    });
    this.distributors = distributors;
  }

  get artists() {
    return Object.values(this.artistsById);
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
      const normalizedBlockedDistributor =
        BasifyTrack.normalizeDistributorName(blockedDistributor);
      return this.distributors.some((distributorText) => {
        const normalizedDistributorText =
          BasifyTrack.normalizeDistributorName(distributorText);
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

    console.log(`[Basify] Analyzing track: ${this.name}`);
    console.log(`[Basify] Track distributors:`, this.distributors);

    const blockedDistros = this.getBlockedDistributors();
    if (settings.skipBlockedArtists && blockedDistros.length > 0) {
      console.log(`[Basify] Found blocked distributor:`, blockedDistros);
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

    console.log(`[Basify] Filter settings:`, skipLabelSettings);

    this.artists.forEach((artist) => {
      const labels = this.getArtistLabels(artist);
      console.log(`[Basify] Artist: ${artist.name}, Labels:`, labels);
      labels.forEach((label) => {
        if (skipLabelSettings[label]) {
          console.log(
            `[Basify] Label "${label}" matches skip filter for ${artist.name}`,
          );
          reasons.push({ type: "artist", artist, label });
        }
      });
    });

    return reasons;
  }

  getTrackTheme() {
    if (this.isDistributorBlocked()) return "blocked";
    const labels = this.artists.flatMap((artist) =>
      this.getArtistLabels(artist),
    );
    const priority = [
      "blocked",
      "pride",
      "base",
      "approved",
      "unknown",
      "noInfo",
    ];
    return priority.find((themeStatus) => labels.includes(themeStatus)) || null;
  }

  async getDominantColor() {
    const imageUrl = BasifyTrack.getTrackImageUrl(this.raw);
    if (!imageUrl) return null;
    return BasifyTrack.extractDominantColorFromImage(imageUrl);
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
