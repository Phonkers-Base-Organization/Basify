import { BasifyI18n } from "../locales/index.js";

export class LocalStorageManager {
  // JSON.parse(Spicetify.LocalStorage.get("Basify:data"))
  // Spicetify.LocalStorage.remove("Basify:data")

  static get storage() {
    return Spicetify.LocalStorage;
  }

  static rootKey = "Basify:data";
  static lock = Promise.resolve();

  static createDefaultData() {
    return {
      artistsById: {},
      settings: {
        locale: BasifyI18n.getInitialLocale(),
        skipEnabled: true,
        skipBlockedArtists: true,
        skipWarningArtists: false,
        skipUnknownArtists: false,
        popupEnabled: true,
        popupDurationMs: 3500,
        visibleToastLimit: 3,
        emojiFlags: true,
        formatNowPlayingBar: true,
        formatNowPlayingArtistName: true,
        showNowPlayingArtistStatusShape: true,
        showNowPlayingArtistFlags: true,
        showPlaylistRating: true,
        artistCacheLimit: 50,
      },
    };
  }

  static loadData() {
    try {
      const rawData = LocalStorageManager.storage.get(LocalStorageManager.rootKey);
      if (!rawData) {
        return LocalStorageManager.createDefaultData();
      }
      const parsedData = JSON.parse(rawData);
      const defaultData = LocalStorageManager.createDefaultData();
      return {
        ...defaultData,
        ...parsedData,
        settings: {
          ...defaultData.settings,
          ...(parsedData.settings || {}),
        },
      };
    } catch (error) {
      console.error("Failed to load extension storage:", error);
      return LocalStorageManager.createDefaultData();
    }
  }

  static saveData(data) {
    try {
      LocalStorageManager.storage.set(LocalStorageManager.rootKey, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save extension storage:", error);
    }
  }

  static async updateData(callback) {
    LocalStorageManager.lock = LocalStorageManager.lock
      .then(async () => {
        const data = LocalStorageManager.loadData();
        await callback(data);
        LocalStorageManager.saveData(data);
      })
      .catch((error) => {
        console.error("Storage update failed:", error);
      });
    return LocalStorageManager.lock;
  }

  static getArtist(id) {
    const data = LocalStorageManager.loadData();
    return data.artistsById[id] || null;
  }

  static async saveArtist(artist) {
    const now = Date.now();
    const savedArtist = {
      ...artist,
      updatedAt: now,
      lastUsedAt: now,
    };
    await LocalStorageManager.updateData((data) => {
      data.artistsById[artist.id] = savedArtist;
      LocalStorageManager.trimArtistCache(data);
    });
    return savedArtist;
  }

  static trimArtistCache(data) {
    const limit = data.settings.artistCacheLimit;
    const artists = Object.values(data.artistsById);
    if (artists.length <= limit) return;
    artists.sort((a, b) => {
      const aTime = a.lastUsedAt || a.updatedAt || 0;
      const bTime = b.lastUsedAt || b.updatedAt || 0;
      return bTime - aTime;
    });
    const artistsToKeep = artists.slice(0, limit);
    data.artistsById = {};
    artistsToKeep.forEach((artist) => {
      data.artistsById[artist.id] = artist;
    });
  }

  static async markArtistUsed(id) {
    const now = Date.now();
    let updatedArtist = null;
    await LocalStorageManager.updateData((data) => {
      if (!data.artistsById[id]) return;
      data.artistsById[id].lastUsedAt = now;
      updatedArtist = data.artistsById[id];
    });
    return updatedArtist;
  }

  static getSettings() {
    const data = LocalStorageManager.loadData();
    return data.settings;
  }

  static async updateSettings(newSettings) {
    await LocalStorageManager.updateData((data) => {
      data.settings = {
        ...data.settings,
        ...newSettings,
      };
      LocalStorageManager.trimArtistCache(data);
    });
  }

  static async resetSettings() {
    const defaultSettings = LocalStorageManager.createDefaultData().settings;
    await LocalStorageManager.updateData((data) => {
      data.settings = defaultSettings;
      LocalStorageManager.trimArtistCache(data);
    });
    return LocalStorageManager.getSettings();
  }

  static clearAll() {
    LocalStorageManager.storage.remove(LocalStorageManager.rootKey);
  }
}
