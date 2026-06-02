import { LocalStorageManager } from "../services/storage.js";
import { Country } from "./Country.js";

export class Artist {
  static baseArtistURL = "open.spotify.com/artist/";
  static apiURL = "https://www.phonkersbase.com/api/artists?limit=50&offset=0&locale=en&search=";

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.url = data.url;
    this.description = data.description || null;
    this.descriptionEn = data.descriptionEn || null;
    this.countries = (data.countries || []).map((country) => {
      if (country instanceof Country) return country;
      return new Country(country.name, country.emoji, country.countryCode);
    });
    this.labels = data.labels || [];
    this.updatedAt = data.updatedAt || Date.now();
    this.lastUsedAt = data.lastUsedAt || Date.now();
  }

  static async create(artistId, fallbackName = null) {
    const cachedArtistData = LocalStorageManager.getArtist(artistId);
    if (cachedArtistData) {
      if (!cachedArtistData.name && fallbackName) {
        cachedArtistData.name = fallbackName;
      }
      const updatedArtistData = await LocalStorageManager.markArtistUsed(artistId);
      return new Artist(updatedArtistData || cachedArtistData);
    }
    const fetchedArtistData = await Artist.fetch(artistId, fallbackName);
    const savedArtistData = await LocalStorageManager.saveArtist(fetchedArtistData);
    return new Artist(savedArtistData);
  }

  static async fetch(artistId, fallbackName = null) {
    const artistURL = Artist.baseArtistURL + artistId;
    const requestURL = Artist.apiURL + encodeURIComponent(artistURL);
    
    try {
      const responseData = await Spicetify.CosmosAsync.get(requestURL);
      const artistItem = responseData?.data?.items?.[0];

      if (!artistItem) {
        return {
          id: artistId,
          name: fallbackName,
          url: artistURL,
          countries: [],
          labels: [],
          description: null,
          descriptionEn: null
        };
      }

      return {
        id: artistId,
        name: artistItem.name || fallbackName,
        url: artistURL,
        description: artistItem.description || null,
        descriptionEn: artistItem.descriptionEn || null,
        countries: (artistItem.countries || []).map((countryData) => {
          const countryInfo = countryData.originalName?.split(" ") || [];
          const countryEmoji = countryInfo[0];
          const countryName = countryInfo.slice(1).join(" ");
          if (countryName === "ruzzia") return new Country("russia", "🇷🇺");
          if (countryName === "belarus") return new Country("belarus", "🇧🇾");
          if (countryName === "Scotland") return new Country(countryName, countryEmoji, "gb-sct");
          if (countryName === "Syria") return new Country(countryName, countryEmoji, "sy");
          return new Country(countryName, countryEmoji);
        }),
        labels: (artistItem.listenLabels || []).map((labelData) => labelData.name)
      };
    } catch (e) {
      return { id: artistId, name: fallbackName, url: artistURL, countries: [], labels: [], description: null, descriptionEn: null };
    }
  }
}