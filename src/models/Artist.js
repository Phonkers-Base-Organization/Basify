import { LocalStorageManager } from "../services/storage.js";
import { Country } from "./Country.js";
import { fetchWithRetry } from "../utils/network.js";

export class Artist {
  static baseArtistURL = "open.spotify.com/artist/";
  static apiURL = "https://api.phonkersbase.com/api/v1/artist/all?search=";
  static API_BATCH_SIZE = 50;
  static cacheMaxAgeMs = 24 * 60 * 60 * 1000;
  static labelPriority = ["blocked", "warning", "unknown", "pride", "base", "approved", "noInfo"];

  static isCacheStale(artistData) {
    return !artistData?.updatedAt || Date.now() - artistData.updatedAt > Artist.cacheMaxAgeMs;
  }

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.url = data.url;
    this.description = data.description || null;
    this.descriptionEn = data.descriptionEn || null;
    this.countries = (data.countries || []).map((country) => new Country(country.countryCode));
    this.labels = data.labels || [];
    this.updatedAt = data.updatedAt || Date.now();
    this.lastUsedAt = data.lastUsedAt || Date.now();
  }

  getDominantLabel() {
    const labels = this.labels.length ? this.labels : ["noInfo"];
    return Artist.labelPriority.find((label) => labels.includes(label)) || "noInfo";
  }

  // Uses cache when fresh; fetches from DB when stale or missing.
  static async create(artistId, fallbackName = null) {
    const cachedArtistData = LocalStorageManager.getArtist(artistId);

    if (cachedArtistData && !Artist.isCacheStale(cachedArtistData)) {
      console.log("Loading artist from local storage", artistId);
      if (!cachedArtistData.name && fallbackName) {
        cachedArtistData.name = fallbackName;
      }
      const updatedArtistData = await LocalStorageManager.markArtistUsed(artistId);
      return new Artist(updatedArtistData || cachedArtistData);
    }

    if (cachedArtistData) {
      console.log("Artist information from local storage is expired", artistId);
    }

    try {
      const fetchedArtistData = await Artist.fetch(artistId, fallbackName);
      const savedArtistData = await LocalStorageManager.saveArtist(fetchedArtistData);
      return new Artist(savedArtistData);
    } catch (e) {
      if (cachedArtistData) {
        console.warn("[Basify] Fetch failed, using stale cache for", artistId);
        return new Artist(cachedArtistData);
      }
      return new Artist(Artist.createFallbackArtistData(artistId, fallbackName));
    }
  }

  // Always fetches fresh data from DB. Falls back to cache on network error.
  static async createFresh(artistId, fallbackName = null) {
    try {
      const fetchedArtistData = await Artist.fetch(artistId, fallbackName);
      const savedArtistData = await LocalStorageManager.saveArtist(fetchedArtistData);
      return new Artist(savedArtistData);
    } catch (e) {
      const cachedArtistData = LocalStorageManager.getArtist(artistId);
      if (cachedArtistData) {
        console.warn("[Basify] Fresh fetch failed, using cached data for", artistId);
        return new Artist(cachedArtistData);
      }
      return new Artist(Artist.createFallbackArtistData(artistId, fallbackName));
    }
  }

  // Throws on network error. Returns fallback only when artist is genuinely not in DB.
  static async fetch(artistId, fallbackName = null) {
    const requestURL = Artist.apiURL + encodeURIComponent(artistId);
    console.log("Requesting artist from db", artistId);
    const responseData = await fetchWithRetry(requestURL, { method: "GET", headers: { Accept: "application/json" } });
    const artistItem = JSON.parse(await responseData.text()).items[0];
    if (!artistItem) return Artist.createFallbackArtistData(artistId, fallbackName);
    return Artist.fromApiArtistItem(artistItem, artistId, fallbackName);
  }

  static async createMany(artistsData) {
    const artistsById = {};
    const missingArtists = [];
    const staleById = {};

    artistsData.forEach(({ id, name }) => {
      if (!id) return;

      const cachedArtistData = LocalStorageManager.getArtist(id);

      if (cachedArtistData && !Artist.isCacheStale(cachedArtistData)) {
        if (!cachedArtistData.name && name) {
          cachedArtistData.name = name;
        }
        artistsById[id] = new Artist(cachedArtistData);
        LocalStorageManager.markArtistUsed(id).catch(() => {});
        return;
      }

      if (cachedArtistData) staleById[id] = cachedArtistData;
      missingArtists.push({ id, name: name || null });
    });

    if (!missingArtists.length) return artistsById;

    const allInputIds = new Set(artistsData.map(({ id }) => id).filter(Boolean));
    let foundArtistsData = [];

    try {
      foundArtistsData = await Artist.fetchMany(missingArtists);
    } catch (e) {
      console.error("[Basify] fetchMany failed, falling back to stale cache for all missing artists.", e);
    }

    if (foundArtistsData.length) {
      const savedArtistsData = await LocalStorageManager.saveArtist(foundArtistsData, allInputIds);
      savedArtistsData.forEach((artistData) => {
        artistsById[artistData.id] = new Artist(artistData);
      });
    }

    const resolvedIds = new Set(Object.keys(artistsById));
    const newFallbacks = [];

    missingArtists.forEach(({ id, name }) => {
      if (resolvedIds.has(id)) return;
      if (staleById[id]) {
        // API didn't return this artist — keep stale cache rather than overwriting with empty fallback
        artistsById[id] = new Artist(staleById[id]);
      } else {
        // Truly new artist, not in DB — save fallback to avoid re-fetching every time
        newFallbacks.push(Artist.createFallbackArtistData(id, name));
      }
    });

    if (newFallbacks.length) {
      const savedFallbacks = await LocalStorageManager.saveArtist(newFallbacks, allInputIds);
      savedFallbacks.forEach((artistData) => {
        artistsById[artistData.id] = new Artist(artistData);
      });
    }

    return artistsById;
  }

  // Single HTTP request for up to API_BATCH_SIZE artists. Returns only found artists. Throws on network error.
  static async fetchRawBatch(artistsData) {
    const artistIds = artistsData.map((a) => a.id);
    const requestURL = Artist.apiURL + encodeURIComponent(artistIds.join(","));

    console.log("[Basify] Requesting artists from db:", artistIds);

    const responseData = await fetchWithRetry(requestURL, { method: "GET", headers: { Accept: "application/json" } });
    const responseJson = JSON.parse(await responseData.text());
    const artistItems = responseJson.items || [];

    const bySpotifyId = {};
    artistItems.forEach((item) => {
      if (item.spotifyId) bySpotifyId[item.spotifyId] = item;
    });

    const missing = artistsData.filter(({ id }) => !bySpotifyId[id]);
    if (missing.length) {
      console.log(
        "[Basify] Artists not found in DB:",
        missing.map((a) => a.id),
      );
    }

    return artistsData
      .filter(({ id }) => bySpotifyId[id])
      .map(({ id, name }) => Artist.fromApiArtistItem(bySpotifyId[id], id, name));
  }

  // Fetches any number of artists in batches of API_BATCH_SIZE. Returns only found artists.
  static async fetchMany(artistsData) {
    const found = [];
    for (let i = 0; i < artistsData.length; i += Artist.API_BATCH_SIZE) {
      try {
        const batchFound = await Artist.fetchRawBatch(artistsData.slice(i, i + Artist.API_BATCH_SIZE));
        found.push(...batchFound);
      } catch (e) {
        console.error("[Basify] Batch request failed, some artists may be missing.", e);
      }
    }
    return found;
  }

  static fromApiArtistItem(artistItem, artistId, fallbackName = null) {
    const spotifyId = artistItem.spotifyId || artistId;

    return {
      id: spotifyId,
      name: artistItem.name || fallbackName,
      url: Artist.baseArtistURL + spotifyId,
      description: artistItem.description || null,
      descriptionEn: artistItem.descriptionEn || null,
      countries: (artistItem.countries || []).map((countryData) => new Country(countryData.code)),
      labels: (artistItem.listenLabels || []).map((labelData) => labelData.name),
    };
  }

  static createFallbackArtistData(artistId, fallbackName = null) {
    return {
      id: artistId,
      name: fallbackName,
      url: Artist.baseArtistURL + artistId,
      countries: [],
      labels: [],
      description: null,
      descriptionEn: null,
    };
  }

  static async refreshStaleCache() {
    const data = LocalStorageManager.loadData();
    const staleArtists = Object.values(data.artistsById)
      .filter((artist) => Artist.isCacheStale(artist))
      .map(({ id, name }) => ({ id, name: name || null }));

    if (!staleArtists.length) return;

    console.log(`[Basify] Refreshing ${staleArtists.length} stale artist(s)...`);

    // Protect all stale IDs so trimArtistCache doesn't evict un-refreshed batches
    const allStaleIds = new Set(staleArtists.map((a) => a.id));

    for (let i = 0; i < staleArtists.length; i += Artist.API_BATCH_SIZE) {
      await Artist.fetchAndSaveBatchWithRetry(staleArtists.slice(i, i + Artist.API_BATCH_SIZE), allStaleIds);
    }
  }

  static async fetchAndSaveBatchWithRetry(batch, protectedIds = new Set()) {
    try {
      const fetchedData = await Artist.fetchRawBatch(batch);
      const notFoundCount = batch.length - fetchedData.length;
      if (notFoundCount) {
        console.log(`[Basify] ${notFoundCount} artist(s) not in DB, keeping cache`);
      }
      if (fetchedData.length) {
        await LocalStorageManager.saveArtist(fetchedData, protectedIds);
      }
      console.log(`[Basify] Batch: ${fetchedData.length}/${batch.length} artist(s) refreshed`);
    } catch (e) {
      console.error("[Basify] Batch refresh failed, keeping existing cache.", e);
    }
  }
}
