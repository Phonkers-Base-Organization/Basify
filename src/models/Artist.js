import { LocalStorageManager } from "../services/storage.js";
import { Country } from "./Country.js";

export class Artist {
  static baseArtistURL = "open.spotify.com/artist/";
  static apiURL = "https://api.phonkersbase.com/api/v1/artist/all?search=";
  static cacheMaxAgeMs = 24 * 60 * 60 * 1000;

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

    if (cachedArtistData && Artist.isCacheStale(cachedArtistData)) {
      console.log("Artist information from local storage is expired", artistId);
    }

    const fetchedArtistData = await Artist.fetch(artistId, fallbackName);
    const savedArtistData = await LocalStorageManager.saveArtist(fetchedArtistData);
    return new Artist(savedArtistData);
  }

  static async fetch(artistId, fallbackName = null) {
    const artistURL = Artist.baseArtistURL + artistId;
    const requestURL = Artist.apiURL + encodeURIComponent(artistId);

    console.log("Requesting artist from db", artistId);

    try {
      const responseData = await fetch(requestURL, { method: "GET", headers: { Accept: "application/json" } });
      const artistItem = JSON.parse(await responseData.text()).items[0];

      if (!artistItem) {
        return Artist.createFallbackArtistData(artistId, fallbackName);
      }

      return Artist.fromApiArtistItem(artistItem, artistId, fallbackName);
    } catch (e) {
      return Artist.createFallbackArtistData(artistId, fallbackName);
    }
  }

  static async createMany(artistsData) {
    const artistsById = {};
    const missingArtists = [];

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

      missingArtists.push({ id, name: name || null });
    });

    if (!missingArtists.length) {
      return artistsById;
    }

    const fetchedArtistsData = await Artist.fetchMany(missingArtists);

    const savedArtistsData = await LocalStorageManager.saveArtist(fetchedArtistsData);

    savedArtistsData.forEach((artistData) => {
      artistsById[artistData.id] = new Artist(artistData);
    });

    return artistsById;
  }

  static async fetchMany(artistsData) {
    const artistIds = artistsData.map((artist) => artist.id);
    const requestURL = Artist.apiURL + encodeURIComponent(artistIds.join(","));

    console.log("[Basify] Requesting artists from db:", artistIds);

    try {
      const responseData = await fetch(requestURL, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const responseJson = JSON.parse(await responseData.text());
      const artistItems = responseJson.items || [];

      const artistsBySpotifyId = {};
      artistItems.forEach((artistItem) => {
        if (!artistItem.spotifyId) return;
        artistsBySpotifyId[artistItem.spotifyId] = artistItem;
      });

      return artistsData.map(({ id, name }) => {
        const artistItem = artistsBySpotifyId[id];

        if (!artistItem) {
          return Artist.createFallbackArtistData(id, name);
        }

        return Artist.fromApiArtistItem(artistItem, id, name);
      });
    } catch (e) {
      return artistsData.map(({ id, name }) => Artist.createFallbackArtistData(id, name));
    }
  }

  static fromApiArtistItem(artistItem, artistId, fallbackName = null) {
    const spotifyId = artistItem.spotifyId || artistId;
    const artistURL = Artist.baseArtistURL + spotifyId;

    return {
      id: spotifyId,
      name: artistItem.name || fallbackName,
      url: artistURL,
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
}
