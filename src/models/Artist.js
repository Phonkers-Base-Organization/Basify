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
        return {
          id: artistId,
          name: fallbackName,
          url: artistURL,
          countries: [],
          labels: [],
          description: null,
          descriptionEn: null,
        };
      }

      return {
        id: artistId,
        name: artistItem.name || fallbackName,
        url: artistURL,
        description: artistItem.description || null,
        descriptionEn: artistItem.descriptionEn || null,
        countries: (artistItem.countries || []).map((countryData) => new Country(countryData.code)),
        labels: (artistItem.listenLabels || []).map((labelData) => labelData.name),
      };
    } catch (e) {
      return {
        id: artistId,
        name: fallbackName,
        url: artistURL,
        countries: [],
        labels: [],
        description: null,
        descriptionEn: null,
      };
    }
  }
}
