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
      tracksById: {},
      playlistsById: {},
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
        artistCacheLimit: 100,
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

  static async saveArtist(artistOrArtists) {
    const now = Date.now();
    const isArray = Array.isArray(artistOrArtists);
    const savedArtists = (isArray ? artistOrArtists : [artistOrArtists]).map((artist) => ({
      ...artist,
      updatedAt: now,
      lastUsedAt: now,
    }));
    await LocalStorageManager.updateData((data) => {
      savedArtists.forEach((artist) => {
        data.artistsById[artist.id] = artist;
      });
      LocalStorageManager.trimArtistCache(data);
    });
    return isArray ? savedArtists : savedArtists[0];
  }

  static trimArtistCache(data) {
    const limit = data.settings.artistCacheLimit;
    const artists = Object.values(data.artistsById);
    if (artists.length <= limit) return;

    const protectedArtistIds = new Set();
    Object.values(data.tracksById || {}).forEach((track) => {
      (track.artistIds || []).forEach((artistId) => protectedArtistIds.add(artistId));
    });

    const protectedArtists = [];
    const evictableArtists = [];
    artists.forEach((artist) => {
      if (protectedArtistIds.has(artist.id)) {
        protectedArtists.push(artist);
      } else {
        evictableArtists.push(artist);
      }
    });

    evictableArtists.sort((a, b) => {
      const aTime = a.lastUsedAt || a.updatedAt || 0;
      const bTime = b.lastUsedAt || b.updatedAt || 0;
      return bTime - aTime;
    });

    const remainingSlots = Math.max(0, limit - protectedArtists.length);
    const artistsToKeep = [...protectedArtists, ...evictableArtists.slice(0, remainingSlots)];

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

  static getTrack(id) {
    const data = LocalStorageManager.loadData();
    return data.tracksById[id] || null;
  }

  static async saveTrack(trackOrTracks) {
    const now = Date.now();
    const isArray = Array.isArray(trackOrTracks);
    const savedTracks = (isArray ? trackOrTracks : [trackOrTracks]).map((track) => ({
      ...track,
      updatedAt: now,
      lastUsedAt: now,
    }));
    await LocalStorageManager.updateData((data) => {
      savedTracks.forEach((track) => {
        data.tracksById[track.id] = track;
      });
    });
    return isArray ? savedTracks : savedTracks[0];
  }

  static async markTrackUsed(id) {
    const now = Date.now();
    let updatedTrack = null;
    await LocalStorageManager.updateData((data) => {
      if (!data.tracksById[id]) return;
      data.tracksById[id].lastUsedAt = now;
      updatedTrack = data.tracksById[id];
    });
    return updatedTrack;
  }

  static getPlaylist(id) {
    const data = LocalStorageManager.loadData();
    return data.playlistsById[id] || null;
  }

  static async savePlaylist(playlist) {
    const now = Date.now();
    const savedPlaylist = {
      ...playlist,
      updatedAt: now,
      lastUsedAt: now,
    };
    await LocalStorageManager.updateData((data) => {
      data.playlistsById[playlist.id] = savedPlaylist;
    });
    return savedPlaylist;
  }

  static async markPlaylistUsed(id) {
    const now = Date.now();
    let updatedPlaylist = null;
    await LocalStorageManager.updateData((data) => {
      if (!data.playlistsById[id]) return;
      data.playlistsById[id].lastUsedAt = now;
      updatedPlaylist = data.playlistsById[id];
    });
    return updatedPlaylist;
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
