const BLOCKED_DISTRIBUTORS = [
  "0TO8",
  "88 CEBEP",
  "682 MUSIC",
  // "A+",
  "ADVANCE",
  "ALONE STARZ",
  "ANARCHY RECORDS",
  "ARCADIA",
  "BADTRIP MUSIC",
  "BLXCK MEDIA",
  "BURNT PLANET MUSIC",
  "CEPHALON",
  "CRESTA LA CULTURA",
  "CXLTXRY",
  "DEAD TWENTY MEDIA",
  "DECLIPED",
  "DIGITAL RECORD’S MEDIA",
  "DIRTYBLADES RECORDS",
  "DOOM MEDIA RECORDS",
  "ECHO8",
  "EFFECTIVE RECORDS",
  "EMMETT ZETTO",
  "FRESHMAN MUSIC",
  "GOOST MUSIC",
  "HOBOSHRINE",
  "HOODMAFIA",
  "ILLUSIONE",
  "IMMINENT",
  "LIFESTYLE",
  "MAVS MUSIC",
  "MEDIAHATE MUSIC",
  "MEMPHIS 1996",
  "MEMPHIS CULT",
  "MERPHI MUSIC GROUP",
  "MIZYSQUAD",
  "MNRC RECORDS",
  "MOONMUZ+",
  "NEDOSTUPNOSTЬ",
  "NEEDLMUSIC",
  "NYUKTA",
  "OVERDO$E RECORDS",
  "PANDA MUSIC",
  "PHONK POINT",
  "RHYMES",
  "RPLUS",
  "SAVAGE$TATION",
  "STRADA MUSIC",
  "SVOBODA",
  "UNTITLED BURIAL",
  "WHY Z MUSIC",
  "YELLOW CHAIR",
  "СТУДИЯ СОЮЗ",
];

class LocalStorageManager {
  // JSON.parse(Spicetify.LocalStorage.get("UAfy:data"))
  // Spicetify.LocalStorage.remove("UAfy:data")

  static get storage() {
    return Spicetify.LocalStorage;
  }

  static rootKey = "UAfy:data";

  static lock = Promise.resolve();

  static defaultData = {
    artistsById: {},
    settings: {
      locale: "en",

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

      artistCacheLimit: 150,
    },
  };

  static loadData() {
    try {
      const rawData = LocalStorageManager.storage.get(
        LocalStorageManager.rootKey,
      );

      if (!rawData) {
        return structuredClone(LocalStorageManager.defaultData);
      }

      const parsedData = JSON.parse(rawData);
      const defaultData = structuredClone(LocalStorageManager.defaultData);

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
      return structuredClone(LocalStorageManager.defaultData);
    }
  }

  static saveData(data) {
    try {
      LocalStorageManager.storage.set(
        LocalStorageManager.rootKey,
        JSON.stringify(data),
      );
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
    const defaultSettings = structuredClone(
      LocalStorageManager.defaultData.settings,
    );

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

class Country {
  constructor(name, emoji) {
    this.name = name;
    this.emoji = emoji;
    this.countryCode = this.emojiToCountryCode(emoji);
  }

  emojiToCountryCode(emoji) {
    return Array.from(emoji)
      .map((c) => String.fromCharCode(c.codePointAt(0) - 127397))
      .join("")
      .toLowerCase();
  }

  flagImg(useEmojiFlag = true, marginLeft = 0, height = 12, width = 16) {
    const img = document.createElement("img");

    img.src = useEmojiFlag
      ? `https://flagcdn.com/${width}x${height}/${this.countryCode}.png`
      : `https://flagcdn.com/h${Country.getClosestFlagHeight(height)}/${this.countryCode}.png`;

    img.alt = this.countryCode;
    img.style.marginLeft = `${marginLeft}px`;
    img.style.verticalAlign = "middle";
    img.style.width = `${width}px`;
    img.style.height = `${height}px`;

    return img;
  }

  static getClosestFlagHeight(height) {
    const availableHeights = [20, 24, 40, 60, 80, 120, 240];

    return availableHeights.reduce((closestHeight, currentHeight) => {
      const closestDifference = Math.abs(closestHeight - height);
      const currentDifference = Math.abs(currentHeight - height);

      return currentDifference < closestDifference
        ? currentHeight
        : closestHeight;
    });
  }
}

class Artist {
  static baseArtistURL = "open.spotify.com/artist/";

  static apiURL =
    "https://www.phonkersbase.com/api/artists?limit=50&offset=0&locale=en&search=";

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.url = data.url;
    this.countries = (data.countries || []).map((country) => {
      if (country instanceof Country) {
        return country;
      }

      return new Country(country.name, country.emoji);
    });
    this.labels = data.labels || [];
    this.updatedAt = data.updatedAt || Date.now();
    this.lastUsedAt = data.lastUsedAt || Date.now();
  }

  static async create(artistId) {
    const cachedArtistData = LocalStorageManager.getArtist(artistId);

    if (cachedArtistData) {
      console.log("Loading artist from local storage", artistId);

      const updatedArtistData =
        await LocalStorageManager.markArtistUsed(artistId);

      return new Artist(updatedArtistData || cachedArtistData);
    }

    const fetchedArtistData = await Artist.fetch(artistId);

    const savedArtistData =
      await LocalStorageManager.saveArtist(fetchedArtistData);

    return new Artist(savedArtistData);
  }

  static async fetch(artistId) {
    const artistURL = Artist.baseArtistURL + artistId;
    const requestURL = Artist.apiURL + encodeURIComponent(artistURL);

    console.log("Requesting artist from db", artistId);

    const responseData = await Spicetify.CosmosAsync.get(requestURL);

    const artistItem = responseData?.data?.items?.[0];

    if (!artistItem) {
      return {
        id: artistId,
        name: null,
        url: artistURL,
        countries: [],
        labels: [],
      };
    }

    return {
      id: artistId,
      name: artistItem.name || null,
      url: artistURL,

      countries: (artistItem.countries || []).map((countryData) => {
        const countryInfo = countryData.originalName?.split(" ") || [];

        const countryEmoji = countryInfo[0];
        const countryName = countryInfo.slice(1).join(" ");

        if (countryName === "ruzzia") {
          return new Country("russia", "🇷🇺");
        }

        if (countryName === "belarus") {
          return new Country("belarus", "🇧🇾");
        }

        return new Country(countryName, countryEmoji);
      }),

      labels: (artistItem.listenLabels || []).map((labelData) => {
        return labelData.name;
      }),
    };
  }
}

class UafyTrack {
  constructor(spotifyTrack, trackArtists, distributors = []) {
    this.raw = spotifyTrack;
    this.uri = spotifyTrack.uri;
    this.id = spotifyTrack.uri?.split(":")?.[2] || null;
    this.name = spotifyTrack.name || "Unknown track";

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
      console.warn("UAfy failed to load album distributor data:", error);
      return [];
    }
  }

  getBlockedDistributors() {
    return BLOCKED_DISTRIBUTORS.filter((blockedDistributor) => {
      const normalizedBlockedDistributor =
        UafyTrack.normalizeDistributorName(blockedDistributor);

      return this.distributors.some((distributorText) => {
        const normalizedDistributorText =
          UafyTrack.normalizeDistributorName(distributorText);

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

    if (settings.skipBlockedArtists) {
      this.getBlockedDistributors().forEach((distributor) => {
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
        if (!skipLabelSettings[label]) return;

        reasons.push({
          type: "artist",
          artist,
          label,
        });
      });
    });

    return reasons;
  }

  getTrackTheme() {
    if (this.isDistributorBlocked()) {
      return "blocked";
    }

    const labels = this.artists.flatMap((artist) => {
      return this.getArtistLabels(artist);
    });

    const priority = [
      "blocked",
      "pride",
      "base",
      "approved",
      "unknown",
      "noInfo",
    ];

    return (
      priority.find((themeStatus) => {
        return labels.includes(themeStatus);
      }) || null
    );
  }

  async getDominantColor() {
    const imageUrl = UafyTrack.getTrackImageUrl(this.raw);

    if (!imageUrl) return null;

    return UafyTrack.extractDominantColorFromImage(imageUrl);
  }

  static getTrackImageUrl(spotifyTrack) {
    const imageUri =
      spotifyTrack?.images?.[0]?.url ||
      spotifyTrack?.album?.images?.[0]?.url ||
      spotifyTrack?.metadata?.image_xlarge_url ||
      spotifyTrack?.metadata?.image_large_url ||
      spotifyTrack?.metadata?.image_url;

    if (!imageUri) return null;

    if (imageUri.startsWith("https://")) {
      return imageUri;
    }

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

          const context = canvas.getContext("2d", {
            willReadFrequently: true,
          });

          context.drawImage(image, 0, 0, size, size);

          const pixels = context.getImageData(0, 0, size, size).data;
          const colorBuckets = new Map();

          for (let index = 0; index < pixels.length; index += 4) {
            const alpha = pixels[index + 3];

            if (alpha < 128) continue;

            const red = pixels[index];
            const green = pixels[index + 1];
            const blue = pixels[index + 2];

            const brightness = (red + green + blue) / 3;

            if (brightness < 25 || brightness > 235) continue;

            const quantizedRed = Math.round(red / 24) * 24;
            const quantizedGreen = Math.round(green / 24) * 24;
            const quantizedBlue = Math.round(blue / 24) * 24;

            const key = `${quantizedRed},${quantizedGreen},${quantizedBlue}`;

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

          const [red, green, blue] = dominantColor.split(",").map(Number);

          resolve(UafyTrack.rgbToHex(red, green, blue));
        } catch (error) {
          console.warn("UAfy failed to extract dominant image color:", error);
          resolve(null);
        }
      };

      image.onerror = () => {
        resolve(null);
      };
    });
  }

  static rgbToHex(red, green, blue) {
    return `#${[red, green, blue]
      .map((value) => {
        return value.toString(16).padStart(2, "0");
      })
      .join("")}`;
  }

  static normalizeDistributorName(value) {
    return String(value)
      .toLowerCase()
      .replace(/[©℗]/gu, "")
      .replace(/\b\d{4}\b/gu, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/gu, " ")
      .trim();
  }
}

class ArtistInfoSectionRenderer {
  static icons = {
    crownSvg: `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4.5L10.6667 8.5L14 5.83333L12.6667 12.5H3.33333L2 5.83333L5.33333 8.5L8 4.5Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    thumbsUpSvg: `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.66671 2.5C9.17685 2.49997 9.66772 2.69488 10.0389 3.04486C10.41 3.39483 10.6334 3.8734 10.6634 4.38267L10.6667 4.5V7.16667H12C12.4901 7.16659 12.9632 7.34645 13.3294 7.67212C13.6956 7.99779 13.9295 8.4466 13.9867 8.93333L13.9967 9.04933L14 9.16667L13.9867 9.29733L13.316 12.652C13.062 13.736 12.3147 14.516 11.4427 14.5053L11.3334 14.5H6.00004C5.83675 14.5 5.67915 14.44 5.55713 14.3315C5.4351 14.223 5.35715 14.0735 5.33804 13.9113L5.33337 13.8333L5.33404 7.476C5.33416 7.35909 5.36502 7.24427 5.42353 7.14305C5.48203 7.04184 5.56613 6.95779 5.66737 6.89933C5.95166 6.73515 6.19112 6.50346 6.3646 6.22475C6.53808 5.94605 6.64024 5.6289 6.66204 5.30133L6.66671 5.16667V4.5C6.66671 3.96957 6.87742 3.46086 7.25249 3.08579C7.62757 2.71071 8.13627 2.5 8.66671 2.5Z"/>
    <path d="M3.33337 7.16675C3.49666 7.16677 3.65426 7.22672 3.77629 7.33522C3.89831 7.44373 3.97627 7.59325 3.99537 7.75541L4.00004 7.83341V13.8334C4.00002 13.9967 3.94007 14.1543 3.83156 14.2763C3.72306 14.3984 3.57354 14.4763 3.41137 14.4954L3.33337 14.5001H2.66671C2.33032 14.5002 2.00633 14.3731 1.75968 14.1444C1.51302 13.9157 1.36194 13.6022 1.33671 13.2667L1.33337 13.1667V8.50008C1.33327 8.1637 1.46031 7.8397 1.68904 7.59305C1.91777 7.3464 2.23127 7.19531 2.56671 7.17008L2.66671 7.16675H3.33337Z"/></svg>`,
    starSvg: `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.4953 5.39328L1.24197 6.00995L1.16663 6.02528C1.05259 6.05556 0.948629 6.11555 0.865361 6.19915C0.782092 6.28274 0.722502 6.38694 0.692674 6.5011C0.662847 6.61526 0.663851 6.73529 0.695584 6.84893C0.727318 6.96257 0.788644 7.06576 0.873299 7.14795L3.95463 10.1473L3.22797 14.3839L3.2193 14.4573C3.21232 14.5752 3.23681 14.6929 3.29027 14.7983C3.34372 14.9037 3.42422 14.9929 3.52352 15.057C3.62282 15.121 3.73736 15.1575 3.8554 15.1627C3.97344 15.1679 4.09074 15.1416 4.1953 15.0866L7.9993 13.0866L11.7946 15.0866L11.8613 15.1173C11.9713 15.1606 12.0909 15.1739 12.2078 15.1558C12.3247 15.1377 12.4346 15.0888 12.5264 15.0141C12.6181 14.9395 12.6883 14.8418 12.7299 14.731C12.7714 14.6203 12.7827 14.5005 12.7626 14.3839L12.0353 10.1473L15.118 7.14728L15.17 7.09062C15.2442 6.99913 15.2929 6.88958 15.3111 6.77315C15.3293 6.65671 15.3162 6.53753 15.2734 6.42777C15.2305 6.318 15.1592 6.22157 15.067 6.14829C14.9747 6.07501 14.8646 6.02751 14.748 6.01062L10.4946 5.39328L8.5933 1.53995C8.53828 1.4283 8.45311 1.33429 8.34742 1.26855C8.24174 1.20281 8.11976 1.16797 7.9953 1.16797C7.87084 1.16797 7.74886 1.20281 7.64317 1.26855C7.53749 1.33429 7.45231 1.4283 7.3973 1.53995L5.4953 5.39328Z"/></svg>`,
    warningSvg: `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.3334 2.72676C12.3468 3.31188 13.1884 4.15348 13.7736 5.16695C14.3587 6.18042 14.6667 7.33005 14.6667 8.5003C14.6667 9.67055 14.3586 10.8202 13.7735 11.8336C13.1884 12.8471 12.3468 13.6887 11.3333 14.2738C10.3198 14.8589 9.17019 15.1669 7.99993 15.1669C6.82968 15.1669 5.68005 14.8588 4.6666 14.2737C3.65314 13.6886 2.81157 12.8469 2.22646 11.8335C1.64136 10.82 1.33334 9.67034 1.33337 8.50009L1.33671 8.28409C1.37404 7.13275 1.70907 6.01073 2.30913 5.02742C2.90919 4.04411 3.75381 3.23306 4.76064 2.67335C5.76746 2.11363 6.90214 1.82436 8.05404 1.83372C9.20595 1.84308 10.3358 2.15076 11.3334 2.72676ZM8.00004 10.5001C7.82323 10.5001 7.65366 10.5703 7.52864 10.6954C7.40361 10.8204 7.33337 10.9899 7.33337 11.1668V11.1734C7.33337 11.3502 7.40361 11.5198 7.52864 11.6448C7.65366 11.7699 7.82323 11.8401 8.00004 11.8401C8.17685 11.8401 8.34642 11.7699 8.47144 11.6448C8.59647 11.5198 8.66671 11.3502 8.66671 11.1734V11.1668C8.66671 10.9899 8.59647 10.8204 8.47144 10.6954C8.34642 10.5703 8.17685 10.5001 8.00004 10.5001ZM8.00004 5.83342C7.82323 5.83342 7.65366 5.90366 7.52864 6.02869C7.40361 6.15371 7.33337 6.32328 7.33337 6.50009V9.16676C7.33337 9.34357 7.40361 9.51314 7.52864 9.63816C7.65366 9.76319 7.82323 9.83342 8.00004 9.83342C8.17685 9.83342 8.34642 9.76319 8.47144 9.63816C8.59647 9.51314 8.66671 9.34357 8.66671 9.16676V6.50009C8.66671 6.32328 8.59647 6.15371 8.47144 6.02869C8.34642 5.90366 8.17685 5.83342 8.00004 5.83342Z"/></svg>`,
    banSvg: `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 8.5C2 9.28793 2.15519 10.0681 2.45672 10.7961C2.75825 11.5241 3.20021 12.1855 3.75736 12.7426C4.31451 13.2998 4.97595 13.7417 5.7039 14.0433C6.43185 14.3448 7.21207 14.5 8 14.5C8.78793 14.5 9.56815 14.3448 10.2961 14.0433C11.0241 13.7417 11.6855 13.2998 12.2426 12.7426C12.7998 12.1855 13.2417 11.5241 13.5433 10.7961C13.8448 10.0681 14 9.28793 14 8.5C14 7.71207 13.8448 6.93185 13.5433 6.2039C13.2417 5.47595 12.7998 4.81451 12.2426 4.25736C11.6855 3.70021 11.0241 3.25825 10.2961 2.95672C9.56815 2.65519 8.78793 2.5 8 2.5C7.21207 2.5 6.43185 2.65519 5.7039 2.95672C4.97595 3.25825 4.31451 3.70021 3.75736 4.25736C3.20021 4.81451 2.75825 5.47595 2.45672 6.2039C2.15519 6.93185 2 7.71207 2 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.2427 4.25732L3.75732 12.7427" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    unknownSvg: `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.9833 8.05342C13.8892 6.79321 13.3995 5.5949 12.5842 4.62938C11.7688 3.66386 10.6695 2.98043 9.44281 2.67655C8.21617 2.37266 6.9249 2.46384 5.75313 2.93708C4.58136 3.41032 3.58893 4.24145 2.91736 5.31196C2.24579 6.38247 1.92937 7.6377 2.01323 8.89863C2.09709 10.1596 2.57694 11.3618 3.38435 12.334C4.19176 13.3061 5.28551 13.9985 6.50963 14.3124C7.73375 14.6263 9.02573 14.5457 10.2013 14.0821M2.40002 6.5H13.6M2.40002 10.5H9.00002M7.66665 2.5C6.54354 4.29974 5.94812 6.37858 5.94812 8.5C5.94812 10.6214 6.54354 12.7003 7.66665 14.5M8.33337 2.5C9.51917 4.39925 10.1154 6.60736 10.0467 8.84533M9.34271 12.4473C9.07635 13.1638 8.73818 13.8516 8.33337 14.5M12.6666 15.1667V15.1734M12.6666 13.1668C12.9655 13.1658 13.2554 13.0646 13.4899 12.8794C13.7245 12.6942 13.8901 12.4356 13.9603 12.1451C14.0305 11.8546 14.0013 11.5489 13.8772 11.2771C13.7531 11.0052 13.5414 10.7828 13.276 10.6454C13.0107 10.5096 12.7074 10.4674 12.4152 10.5259C12.123 10.5844 11.8592 10.74 11.6666 10.9674" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  static badges = {
    pride: {
      text: "Our pride",
      icon: ArtistInfoSectionRenderer.icons.crownSvg,
      bg: "#264b61",
    },
    base: {
      text: "Based",
      icon: ArtistInfoSectionRenderer.icons.starSvg,
      bg: "#553995",
    },
    approved: {
      text: "You can listen",
      icon: ArtistInfoSectionRenderer.icons.thumbsUpSvg,
      bg: "#23593e",
    },
    warning: {
      text: "Be careful",
      icon: ArtistInfoSectionRenderer.icons.warningSvg,
      bg: "#77471e",
    },
    blocked: {
      text: "Don't listen",
      icon: ArtistInfoSectionRenderer.icons.banSvg,
      bg: "#723433",
    },
    unknown: {
      text: "Origin not confirmed",
      icon: ArtistInfoSectionRenderer.icons.unknownSvg,
      bg: "#2f2f2f",
    },
    noInfo: {
      text: "No artist info",
      icon: ArtistInfoSectionRenderer.icons.unknownSvg,
      bg: "#2f2f2f",
    },
    blockedDistributor: {
      text: "Blocked distributor",
      icon: ArtistInfoSectionRenderer.icons.banSvg,
      bg: "#723433",
    },
  };

  static createArtistInfoSection(artist) {
    const section = document.createElement("div");
    section.classList.add("uafy-artist-info-section");

    const countriesRow = document.createElement("div");
    countriesRow.classList.add("uafy-countries-row");

    const badgesRow = document.createElement("div");
    badgesRow.classList.add("uafy-badges-row");

    Object.assign(section.style, {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginTop: "4px",
      flexWrap: "nowrap",
      width: "100%",
      maxWidth: "100%",
      overflow: "hidden",
    });

    [countriesRow, badgesRow].forEach((row) => {
      Object.assign(row.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      });
    });

    if (artist.countries.length) {
      artist.countries.forEach((country) => {
        countriesRow.appendChild(
          ArtistInfoSectionRenderer.createCountryBadge(country),
        );
      });
    } else {
      countriesRow.appendChild(
        ArtistInfoSectionRenderer.createSimpleTag("Unknown origin"),
      );
    }

    if (artist.labels.length) {
      artist.labels.forEach((label) => {
        badgesRow.appendChild(
          ArtistInfoSectionRenderer.createTrustBadge(label),
        );
      });
    } else {
      badgesRow.appendChild(
        ArtistInfoSectionRenderer.createTrustBadge("noInfo"),
      );
    }

    section.appendChild(countriesRow);
    section.appendChild(ArtistInfoSectionRenderer.createInfoSeparator());
    section.appendChild(badgesRow);

    return section;
  }

  static createCountryBadge(country) {
    const badge = document.createElement("span");

    Object.assign(badge.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 10px",
      borderRadius: "6px",
      background: "rgba(255, 255, 255, 0.08)",
      color: "#ffffff",
      fontSize: "1rem",
      lineHeight: "1",
      whiteSpace: "nowrap",
    });

    const settings = LocalStorageManager.getSettings();

    badge.appendChild(country.flagImg(settings.emojiFlags, 0, 18, 24));

    const name = document.createElement("span");
    name.textContent = country.name;

    badge.appendChild(name);

    return badge;
  }

  static createTrustBadge(type) {
    const badgeData =
      ArtistInfoSectionRenderer.badges[type] ??
      ArtistInfoSectionRenderer.badges.noInfo;

    const badge = document.createElement("span");
    badge.classList.add("uafy-trust-badge");
    badge.dataset.type = type;

    badge.innerHTML = `<span>${badgeData.text}</span>${badgeData.icon}`;

    Object.assign(badge.style, {
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: "6px",
      background: `color-mix(in srgb, ${badgeData.bg} 75%, transparent)`,
      color: "#ffffff",
      fontSize: "1rem",
      lineHeight: "1",
      whiteSpace: "nowrap",
    });

    return badge;
  }

  static createSimpleTag(text) {
    const tag = document.createElement("span");
    tag.textContent = text;

    Object.assign(tag.style, {
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: "6px",
      background: "#2f2f2fbf",
      color: "#ffffff",
      fontSize: "1rem",
      lineHeight: "1",
      whiteSpace: "nowrap",
    });

    return tag;
  }

  static createInfoSeparator() {
    const separator = document.createElement("span");
    separator.classList.add("uafy-info-separator");

    Object.assign(separator.style, {
      width: "1px",
      height: "100%",
      background: "rgba(255, 255, 255, 0.35)",
      minHeight: "24px",
    });

    return separator;
  }
}

class DomObserver {
  static async waitUntil(
    conditionCallback,
    timeoutMs = 5000,
    intervalMs = 100,
  ) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const intervalId = setInterval(() => {
        try {
          const result = conditionCallback();

          if (result) {
            clearInterval(intervalId);
            resolve(result);
            return;
          }

          if (Date.now() - startTime >= timeoutMs) {
            clearInterval(intervalId);
            reject(new Error("UAfy waitUntil timed out"));
          }
        } catch (error) {
          clearInterval(intervalId);
          reject(error);
        }
      }, intervalMs);
    });
  }

  static async waitForElement(selector, timeoutMs = 5000) {
    return DomObserver.waitUntil(() => {
      return document.querySelector(selector);
    }, timeoutMs);
  }

  static async waitForNowPlayingArtist(track, timeoutMs = 5000) {
    return DomObserver.waitUntil(() => {
      const bottomBarArtistsContainer = document.querySelector(
        "div.Root__now-playing-bar div.main-nowPlayingBar-left div.main-trackInfo-artists span.OINH5zA0pQyzffwo",
      );

      const sideViewArtistsContainer = document.querySelector(
        "div.Root__right-sidebar div.main-nowPlayingView-nowPlayingWidget div.main-trackInfo-artists span.OINH5zA0pQyzffwo",
      );

      if (!bottomBarArtistsContainer) {
        return null;
      }

      const trackArtistIds = (track?.artists || []).map((artist) => {
        return artist.uri.split(":")[2];
      });

      const bottomBarArtistSpansById =
        DomObserver.extractArtistDataFromContainer(bottomBarArtistsContainer);

      const bottomBarMatchesTrackArtists = DomObserver.haveSameArtistIds(
        Object.keys(bottomBarArtistSpansById),
        trackArtistIds,
      );

      if (!bottomBarMatchesTrackArtists) {
        return null;
      }

      let sideViewArtistSpansById = {};

      if (sideViewArtistsContainer) {
        sideViewArtistSpansById = DomObserver.extractArtistDataFromContainer(
          sideViewArtistsContainer,
        );

        const sideViewMatchesTrackArtists = DomObserver.haveSameArtistIds(
          Object.keys(sideViewArtistSpansById),
          trackArtistIds,
        );

        if (!sideViewMatchesTrackArtists) {
          return null;
        }
      }

      return {
        bottomBarArtistSpans: bottomBarArtistSpansById,
        sideViewArtistSpans: sideViewArtistSpansById,
      };
    }, timeoutMs);
  }

  static extractArtistDataFromContainer(artistsContainer) {
    const artistLinks = Array.from(artistsContainer.querySelectorAll("a"));
    const artistSpansById = {};

    artistLinks.forEach((artistLink) => {
      const artistId = artistLink.href.split("/").pop();
      const artistSpan = artistLink.closest("span");

      if (!artistId || !artistSpan) return;

      artistSpansById[artistId] = artistSpan;
    });

    return artistSpansById;
  }

  static haveSameArtistIds(firstArtistIds, secondArtistIds) {
    if (firstArtistIds.length !== secondArtistIds.length) {
      return false;
    }

    const sortedFirstArtistIds = [...firstArtistIds].sort();
    const sortedSecondArtistIds = [...secondArtistIds].sort();

    return sortedFirstArtistIds.every((artistId, index) => {
      return artistId === sortedSecondArtistIds[index];
    });
  }

  static async waitForArtistPageHeaderElement(artistId, timeoutMs = 5000) {
    return DomObserver.waitUntil(() => {
      const headerTitleElement = document.querySelector(
        ".main-entityHeader-imageContainerWrapper",
      );

      if (!headerTitleElement) return null;

      const currentPathname = Spicetify.Platform.History.location.pathname;
      const currentArtistId = currentPathname.split("/")[2];

      if (currentArtistId !== artistId) return null;

      return headerTitleElement;
    }, timeoutMs);
  }
}

class SettingsMenu {
  static button = null;
  static styleElementId = "uafy-settings-style";

  static icons = {
    settings: `<svg role="img" height="19.25" width="19.25" viewBox="0 0 36 36" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M32.57,15.72l-3.35-1a11.65,11.65,0,0,0-.95-2.33l1.64-3.07a.61.61,0,0,0-.11-.72L27.41,6.2a.61.61,0,0,0-.72-.11L23.64,7.72a11.62,11.62,0,0,0-2.36-1l-1-3.31A.61.61,0,0,0,19.69,3H16.31a.61.61,0,0,0-.58.43l-1,3.3a11.63,11.63,0,0,0-2.38,1l-3-1.62a.61.61,0,0,0-.72.11L6.2,8.59a.61.61,0,0,0-.11.72l1.62,3a11.63,11.63,0,0,0-1,2.37l-3.31,1a.61.61,0,0,0-.43.58v3.38a.61.61,0,0,0,.43.58l3.33,1a11.62,11.62,0,0,0,1,2.33L6.09,26.69a.61.61,0,0,0,.11.72L8.59,29.8a.61.61,0,0,0,.72.11l3.09-1.65a11.65,11.65,0,0,0,2.3.94l1,3.37a.61.61,0,0,0,.58.43h3.38a.61.61,0,0,0,.58-.43l1-3.38a11.63,11.63,0,0,0,2.28-.94l3.11,1.66a.61.61,0,0,0,.72-.11l2.39-2.39a.61.61,0,0,0,.11-.72l-1.66-3.1a11.63,11.63,0,0,0,.95-2.29l3.37-1a.61.61,0,0,0,.43-.58V16.31A.61.61,0,0,0,32.57,15.72ZM18,23.5A5.5,5.5,0,1,1,23.5,18,5.5,5.5,0,0,1,18,23.5Z" />
    </svg>`,
  };

  static registerButton() {
    if (SettingsMenu.button) return;

    SettingsMenu.injectStyles();

    SettingsMenu.button = new Spicetify.Topbar.Button(
      "UAfy Settings",
      SettingsMenu.icons.settings,
      SettingsMenu.open,
      false,
      true,
    );
  }

  static open() {
    const React = Spicetify.React;
    const ReactDOM = Spicetify.ReactDOM;

    const container = document.createElement("div");
    container.className = "uafy-settings-react-root";

    Spicetify.PopupModal.display({
      title: "UAfy Settings",
      content: container,
      isLarge: true,
    });

    ReactDOM.render(React.createElement(SettingsMenu.Component), container);
  }

  static async applyRuntimeSettings(settings, changedSettings = {}) {
    SkipToastRenderer.applySettings(settings, changedSettings);

    const track = NowPlayingRuntimeState.track;

    const emojiFlagsChanged = Object.hasOwn(changedSettings, "emojiFlags");

    if (!track) {
      if (emojiFlagsChanged) {
        refreshCurrentArtistPageFlags().catch((error) => {
          console.warn("UAfy failed to refresh artist page flags:", error);
        });
      }

      return;
    }

    const nowPlayingSettingsChanged =
      Object.hasOwn(changedSettings, "formatNowPlayingBar") ||
      Object.hasOwn(changedSettings, "formatNowPlayingArtistName") ||
      Object.hasOwn(changedSettings, "showNowPlayingArtistStatusShape") ||
      Object.hasOwn(changedSettings, "showNowPlayingArtistFlags") ||
      emojiFlagsChanged;

    if (nowPlayingSettingsChanged) {
      const artistSpans = NowPlayingRuntimeState.artistSpans;

      if (artistSpans) {
        renderNowPlayingTrack(track, artistSpans);
      } else if (!settings.formatNowPlayingBar) {
        NowPlayingThemeOverlayRenderer.clear();
      } else {
        NowPlayingThemeOverlayRenderer.applyFromTrack(track);
      }
    }

    if (emojiFlagsChanged) {
      const artistSpans = NowPlayingRuntimeState.artistSpans;

      if (artistSpans) {
        NowPlayingArtistRenderer.render(track, artistSpans);
      }

      refreshCurrentArtistPageFlags().catch((error) => {
        console.warn("UAfy failed to refresh artist page flags:", error);
      });
    }

    const skipSettingsChanged =
      Object.hasOwn(changedSettings, "skipEnabled") ||
      Object.hasOwn(changedSettings, "skipBlockedArtists") ||
      Object.hasOwn(changedSettings, "skipWarningArtists") ||
      Object.hasOwn(changedSettings, "skipUnknownArtists");

    if (!skipSettingsChanged) return;
    if (!track.shouldSkipTrack()) return;

    SkipToastRenderer.show(track);

    Spicetify.Player.next();
  }

  static Component() {
    const React = Spicetify.React;

    const [settings, setSettings] = React.useState(() => {
      return LocalStorageManager.getSettings();
    });

    const saveSettings = async (newSettings) => {
      const updatedSettings = {
        ...settings,
        ...newSettings,
      };

      setSettings(updatedSettings);

      await LocalStorageManager.updateSettings(newSettings);

      SettingsMenu.applyRuntimeSettings(updatedSettings, newSettings);
    };

    const resetSettings = async () => {
      const defaultSettings = await LocalStorageManager.resetSettings();

      setSettings(defaultSettings);

      SettingsMenu.applyRuntimeSettings(defaultSettings, defaultSettings);

      Spicetify.showNotification("UAfy settings have been reset");
    };

    const skipStatusSwitchesEnabled =
      settings.skipBlockedArtists ||
      settings.skipWarningArtists ||
      settings.skipUnknownArtists;

    const skipMainSwitchEnabled =
      settings.skipEnabled && skipStatusSwitchesEnabled;

    const skipSubSwitchesDisabled =
      !settings.skipEnabled && skipStatusSwitchesEnabled;

    return React.createElement(
      "div",
      {
        className: "uafy-settings-menu",
      },

      React.createElement(SettingsMenu.SectionTitle, {
        title: "Language",
      }),

      React.createElement(SettingsMenu.SelectRow, {
        label: "Locale",
        description: "Choose the language used by UAfy settings and messages.",
        value: settings.locale,
        options: [
          {
            value: "en",
            label: "English",
          },
          {
            value: "ua",
            label: "Українська",
          },
        ],
        onChange: (value) => {
          saveSettings({
            locale: value,
          });
        },
      }),

      React.createElement(SettingsMenu.SectionTitle, {
        title: "Skipping",
      }),

      React.createElement(SettingsMenu.ToggleRow, {
        label: "Skip tracks",
        description:
          "Automatically skip tracks based on the selected status filters.",
        value: skipMainSwitchEnabled,
        disabled: !skipStatusSwitchesEnabled,
        onChange: (value) => {
          saveSettings({
            skipEnabled: value,
          });
        },
      }),

      React.createElement(SettingsMenu.SubSectionTitle, {
        title: "Skip status filter",
      }),

      React.createElement(SettingsMenu.ToggleRow, {
        label: "Blocked",
        description:
          "Skip blocked artists and tracks released by blocked distributors.",
        value: settings.skipBlockedArtists,
        disabled: skipSubSwitchesDisabled,
        onChange: (value) => {
          saveSettings({
            skipBlockedArtists: value,
          });
        },
      }),

      React.createElement(SettingsMenu.ToggleRow, {
        label: "Warning",
        description: "Skip artists marked as warning.",
        value: settings.skipWarningArtists,
        disabled: skipSubSwitchesDisabled,
        onChange: (value) => {
          saveSettings({
            skipWarningArtists: value,
          });
        },
      }),

      React.createElement(SettingsMenu.ToggleRow, {
        label: "Unknown",
        description: "Skip artists with unknown origin or status.",
        value: settings.skipUnknownArtists,
        disabled: skipSubSwitchesDisabled,
        onChange: (value) => {
          saveSettings({
            skipUnknownArtists: value,
          });
        },
      }),

      React.createElement(SettingsMenu.SectionTitle, {
        title: "Popup",
      }),

      React.createElement(SettingsMenu.ToggleRow, {
        label: "Show skip popup",
        description: "Show a notification when UAfy skips a track.",
        value: settings.popupEnabled,
        onChange: (value) => {
          saveSettings({
            popupEnabled: value,
          });
        },
      }),

      React.createElement(SettingsMenu.NumberRow, {
        label: "Popup duration",
        description: "How long each skip popup stays visible, in milliseconds.",
        value: settings.popupDurationMs,
        min: 1000,
        max: 60000,
        onChange: (value) => {
          saveSettings({
            popupDurationMs: value,
          });
        },
      }),

      React.createElement(SettingsMenu.NumberRow, {
        label: "Visible popup limit",
        description: "Maximum number of skip popups visible at the same time.",
        value: settings.visibleToastLimit,
        min: 1,
        max: 10,
        onChange: (value) => {
          saveSettings({
            visibleToastLimit: value,
          });
        },
      }),

      React.createElement(SettingsMenu.SectionTitle, {
        title: "Flags",
      }),

      React.createElement(SettingsMenu.ToggleRow, {
        label: "Use emoji flags",
        description:
          "Use country emoji flags instead of flag images in now playing and artist profile.",
        value: settings.emojiFlags,
        onChange: (value) => {
          saveSettings({
            emojiFlags: value,
          });
        },
      }),

      React.createElement(SettingsMenu.SectionTitle, {
        title: "Now Playing",
      }),

      React.createElement(SettingsMenu.ToggleRow, {
        label: "Highlight now playing bar",
        description:
          "Color the now playing bar based on the strongest artist status on the current track.",
        value: settings.formatNowPlayingBar,
        onChange: (value) => {
          saveSettings({
            formatNowPlayingBar: value,
          });
        },
      }),

      React.createElement(SettingsMenu.ToggleRow, {
        label: "Format artist names",
        description:
          "Color artist names in now playing when the artist exists in the UAfy database.",
        value: settings.formatNowPlayingArtistName,
        onChange: (value) => {
          saveSettings({
            formatNowPlayingArtistName: value,
          });
        },
      }),

      React.createElement(SettingsMenu.ToggleRow, {
        label: "Show status shapes",
        description:
          "Show a small shape next to each artist name: blocked square, warning triangle, approved circle, etc.",
        value: settings.showNowPlayingArtistStatusShape,
        onChange: (value) => {
          saveSettings({
            showNowPlayingArtistStatusShape: value,
          });
        },
      }),

      React.createElement(SettingsMenu.ToggleRow, {
        label: "Show artist flags",
        description: "Show country flags next to artist names in now playing.",
        value: settings.showNowPlayingArtistFlags,
        onChange: (value) => {
          saveSettings({
            showNowPlayingArtistFlags: value,
          });
        },
      }),

      React.createElement(SettingsMenu.SectionTitle, {
        title: "Storage",
      }),

      React.createElement(SettingsMenu.NumberRow, {
        label: "Artist cache limit",
        description: "Maximum number of artists stored locally.",
        value: settings.artistCacheLimit,
        min: 1,
        max: 1000,
        onChange: (value) => {
          saveSettings({
            artistCacheLimit: value,
          });
        },
      }),

      React.createElement(SettingsMenu.SectionTitle, {
        title: "Reset",
      }),

      React.createElement(SettingsMenu.ButtonRow, {
        label: "Clear UAfy data",
        description: "This clears cached artists and settings.",
        buttonText: "Reset",
        onClick: resetSettings,
      }),
    );
  }

  static SectionTitle({ title }) {
    return Spicetify.React.createElement(
      "h2",
      {
        className: "uafy-settings-section-title",
      },
      title,
    );
  }

  static SubSectionTitle({ title }) {
    return Spicetify.React.createElement(
      "div",
      {
        className: "uafy-settings-subsection-title",
      },
      title,
    );
  }

  static ToggleRow({ label, description, value, disabled = false, onChange }) {
    const React = Spicetify.React;
    const Toggle = Spicetify.ReactComponent.Toggle;

    return React.createElement(
      "div",
      {
        className: `uafy-settings-row${disabled ? " is-disabled" : ""}`,
      },

      React.createElement(SettingsMenu.RowText, {
        label,
        description,
      }),

      React.createElement(Toggle, {
        value,
        checked: value,
        isChecked: value,
        disabled,
        isDisabled: disabled,
        onSelected: () => {
          if (disabled) return;

          onChange(!value);
        },
      }),
    );
  }

  static SelectRow({ label, description, value, options, onChange }) {
    const React = Spicetify.React;

    return React.createElement(
      "div",
      {
        className: "uafy-settings-row",
      },

      React.createElement(SettingsMenu.RowText, {
        label,
        description,
      }),

      React.createElement(
        "select",
        {
          className: "uafy-settings-select",
          value,
          onChange: (event) => {
            onChange(event.target.value);
          },
        },

        options.map((option) => {
          return React.createElement(
            "option",
            {
              key: option.value,
              value: option.value,
            },
            option.label,
          );
        }),
      ),
    );
  }

  static NumberRow({ label, description, value, min, max, onChange }) {
    const React = Spicetify.React;

    const [inputValue, setInputValue] = React.useState(String(value));

    React.useEffect(() => {
      setInputValue(String(value));
    }, [value]);

    const saveValue = () => {
      const numberValue = Number(inputValue);

      if (!Number.isFinite(numberValue)) {
        setInputValue(String(value));
        return;
      }

      const clampedValue = Math.min(
        max,
        Math.max(min, Math.floor(numberValue)),
      );

      setInputValue(String(clampedValue));
      onChange(clampedValue);
    };

    return React.createElement(
      "div",
      {
        className: "uafy-settings-row",
      },

      React.createElement(SettingsMenu.RowText, {
        label,
        description,
      }),

      React.createElement("input", {
        className: "uafy-settings-number",
        type: "number",
        min,
        max,
        value: inputValue,
        onChange: (event) => {
          setInputValue(event.target.value);
        },
        onBlur: () => {
          saveValue();
        },
        onKeyDown: (event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            setInputValue(String(value));
            event.currentTarget.blur();
          }
        },
      }),
    );
  }

  static ButtonRow({ label, description, buttonText, onClick }) {
    const React = Spicetify.React;

    return React.createElement(
      "div",
      {
        className: "uafy-settings-row",
      },

      React.createElement(SettingsMenu.RowText, {
        label,
        description,
      }),

      React.createElement(
        "button",
        {
          className:
            "Button-sc-qlcn5g-0 Button-small-buttonSecondary-useBrowserDefaultFocusStyle uafy-settings-button",
          type: "button",
          onClick,
        },
        buttonText,
      ),
    );
  }

  static RowText({ label, description }) {
    const React = Spicetify.React;

    return React.createElement(
      "div",
      {
        className: "uafy-settings-text-wrapper",
      },

      React.createElement(
        "div",
        {
          className: "uafy-settings-label",
        },
        label,
      ),

      description
        ? React.createElement(
            "div",
            {
              className: "uafy-settings-description",
            },
            description,
          )
        : null,
    );
  }

  static injectStyles() {
    if (document.getElementById(SettingsMenu.styleElementId)) return;

    const style = document.createElement("style");
    style.id = SettingsMenu.styleElementId;

    style.textContent = `
      .uafy-settings-react-root {
        min-width: 460px;
      }

      .uafy-settings-menu {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 4px 0 18px;
      }

      .uafy-settings-section-title {
        margin: 18px 0 4px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.18);
        color: var(--spice-text);
        font-size: 20px;
        font-weight: 700;
      }

      .uafy-settings-subsection-title {
        margin-top: 6px;
        color: var(--spice-subtext);
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .uafy-settings-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        min-height: 42px;
      }

      .uafy-settings-row.is-disabled {
        opacity: 0.45;
      }

      .uafy-settings-row.is-disabled [role="switch"],
      .uafy-settings-row.is-disabled button {
        pointer-events: none;
        filter: grayscale(1);
      }

      .uafy-settings-text-wrapper {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
      }

      .uafy-settings-label {
        color: var(--spice-text);
        font-size: 14px;
        font-weight: 600;
      }

      .uafy-settings-description {
        color: var(--spice-subtext);
        font-size: 12px;
        line-height: 1.35;
      }

      .uafy-settings-number {
        width: 80px;
        padding: 8px 10px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 6px;
        background: var(--spice-main);
        color: var(--spice-text);
        font-size: 14px;
        font-weight: 600;
      }

      .uafy-settings-select {
        min-width: 130px;
        padding: 8px 10px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 6px;
        background: var(--spice-main);
        color: var(--spice-text);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }

      .uafy-settings-button {
        min-width: 90px;
        height: 40px;
        border-radius: 999px;
        border: 0;
        padding: 0 18px;
        background: var(--spice-button);
        color: var(--spice-main);
        font-weight: 700;
        cursor: pointer;
      }
    `;

    document.head.appendChild(style);
  }
}

class SkipToastRenderer {
  static styleElementId = "uafy-skip-toast-style";
  static containerClassName = "uafy-skip-toast-container";
  static toastTimeouts = new WeakMap();

  static async show(track) {
    const settings = LocalStorageManager.getSettings();

    if (!settings.popupEnabled) return;

    SkipToastRenderer.injectStyles();

    const dominantColor = await track.getDominantColor();

    const container = SkipToastRenderer.createContainer();
    const toast = SkipToastRenderer.createToast(track, dominantColor);

    SkipToastRenderer.removeExtraToastsBeforeAppend(container);

    container.appendChild(toast);

    SkipToastRenderer.updateToastStack(container);

    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    toast.dataset.createdAt = String(Date.now());

    SkipToastRenderer.scheduleToastRemoval(toast);
  }

  static scheduleToastRemoval(toast) {
    const existingTimeoutId = SkipToastRenderer.toastTimeouts.get(toast);

    if (existingTimeoutId) {
      clearTimeout(existingTimeoutId);
    }

    const durationMs = SkipToastRenderer.getToastDurationMs();
    const createdAt = Number(toast.dataset.createdAt) || Date.now();
    const ageMs = Date.now() - createdAt;
    const remainingMs = Math.max(0, durationMs - ageMs);

    const timeoutId = setTimeout(() => {
      SkipToastRenderer.removeToast(toast);
    }, remainingMs);

    SkipToastRenderer.toastTimeouts.set(toast, timeoutId);
  }

  static applySettings(settings, changedSettings = {}) {
    if (!settings.popupEnabled) {
      SkipToastRenderer.clearAll();
      return;
    }

    const container = document.querySelector(
      `.${SkipToastRenderer.containerClassName}`,
    );

    if (!container) return;

    if (Object.hasOwn(changedSettings, "popupDurationMs")) {
      const toasts = Array.from(container.querySelectorAll(".uafy-skip-toast"));

      toasts.forEach((toast) => {
        SkipToastRenderer.scheduleToastRemoval(toast);
      });
    }

    if (Object.hasOwn(changedSettings, "visibleToastLimit")) {
      SkipToastRenderer.removeExtraToastsBeforeAppend(container);
      SkipToastRenderer.updateToastStack(container);
    }
  }

  static removeExtraToastsBeforeAppend(container) {
    const maxToastCount = SkipToastRenderer.getVisibleToastLimit() + 1;
    const toasts = Array.from(container.querySelectorAll(".uafy-skip-toast"));

    while (toasts.length >= maxToastCount) {
      const oldestToast = toasts.shift();

      SkipToastRenderer.removeToast(oldestToast, false);
    }
  }

  static updateToastStack(container) {
    const visibleToastLimit = SkipToastRenderer.getVisibleToastLimit();
    const toasts = Array.from(container.querySelectorAll(".uafy-skip-toast"));

    toasts.forEach((toast) => {
      toast.classList.remove("is-fading-away");
    });

    if (toasts.length > visibleToastLimit) {
      toasts[0].classList.add("is-fading-away");
    }
  }

  static createContainer() {
    let container = document.querySelector(
      `.${SkipToastRenderer.containerClassName}`,
    );

    if (container) return container;

    container = document.createElement("div");
    container.className = SkipToastRenderer.containerClassName;

    document.body.appendChild(container);

    return container;
  }

  static createToast(track, dominantColor) {
    const toast = document.createElement("div");
    toast.className = "uafy-skip-toast";

    SkipToastRenderer.applyDominantColorBackground(toast, dominantColor);

    const header = document.createElement("div");
    header.className = "uafy-skip-toast-header";

    const title = document.createElement("div");
    title.className = "uafy-skip-toast-title";
    title.textContent = "Track skipped";

    const closeButton = document.createElement("button");
    closeButton.className = "uafy-skip-toast-close";
    closeButton.type = "button";
    closeButton.textContent = "×";

    closeButton.addEventListener("click", () => {
      SkipToastRenderer.removeToast(toast);
    });

    header.append(title, closeButton);

    const trackName = document.createElement("div");
    trackName.className = "uafy-skip-toast-track";
    trackName.textContent = track.name;

    const artistsWrapper = document.createElement("div");
    artistsWrapper.className = "uafy-skip-toast-artists";

    const skipReasons = track.getSkipReasons();

    skipReasons.forEach((reason) => {
      if (reason.type === "distributor") {
        artistsWrapper.appendChild(
          SkipToastRenderer.createDistributorReasonRow(
            reason.name,
            reason.label,
          ),
        );

        return;
      }

      artistsWrapper.appendChild(
        SkipToastRenderer.createArtistReasonRow(reason.artist, [reason.label]),
      );
    });

    toast.append(header, trackName, artistsWrapper);

    return toast;
  }

  static applyDominantColorBackground(toast, dominantColor) {
    if (!dominantColor) return;

    toast.style.background = `
      linear-gradient(
        180deg,
        ${dominantColor} 0%,
        color-mix(in srgb, ${dominantColor} 45%, var(--spice-card, #181818)) 30%,
        var(--spice-card, #181818) 80%
      )
    `;

    toast.style.backgroundClip = "padding-box";
  }

  static createArtistReasonRow(artist, labels) {
    const row = document.createElement("div");
    row.className = "uafy-skip-toast-artist-row";

    const artistName = document.createElement("button");
    artistName.className = "uafy-skip-toast-artist-name";
    artistName.type = "button";
    artistName.textContent = artist?.name || "Unknown artist";

    if (artist?.id) {
      artistName.addEventListener("click", (event) => {
        event.stopPropagation();
        Spicetify.Platform.History.push(`/artist/${artist.id}`);
      });
    }

    const badgesWrapper = document.createElement("div");
    badgesWrapper.className = "uafy-skip-toast-badges";

    const uniqueLabels = [...new Set(labels)];

    uniqueLabels.forEach((label) => {
      const badge = ArtistInfoSectionRenderer.createTrustBadge(label);
      badge.classList.add("uafy-skip-toast-badge");

      badgesWrapper.appendChild(badge);
    });

    row.append(artistName, badgesWrapper);

    return row;
  }

  static createDistributorReasonRow(distributorName, label) {
    const row = document.createElement("div");
    row.className = "uafy-skip-toast-artist-row";

    const distributor = document.createElement("div");
    distributor.className = "uafy-skip-toast-distributor-name";
    distributor.textContent = distributorName || "Unknown distributor";

    const badgesWrapper = document.createElement("div");
    badgesWrapper.className = "uafy-skip-toast-badges";

    const badge = ArtistInfoSectionRenderer.createTrustBadge(label);
    badge.classList.add("uafy-skip-toast-badge");

    badgesWrapper.appendChild(badge);

    row.append(distributor, badgesWrapper);

    return row;
  }

  static getToastDurationMs() {
    const settings = LocalStorageManager.getSettings();

    return Number(settings.popupDurationMs) || 10000;
  }

  static getVisibleToastLimit() {
    const settings = LocalStorageManager.getSettings();

    return Number(settings.visibleToastLimit) || 3;
  }

  static removeToast(toast, animate = true) {
    if (!toast || toast.classList.contains("is-removing")) return;

    const timeoutId = SkipToastRenderer.toastTimeouts.get(toast);

    if (timeoutId) {
      clearTimeout(timeoutId);
      SkipToastRenderer.toastTimeouts.delete(toast);
    }

    const container = toast.closest(`.${SkipToastRenderer.containerClassName}`);

    if (!animate) {
      toast.remove();

      if (container?.children.length) {
        SkipToastRenderer.updateToastStack(container);
      } else {
        container?.remove();
      }

      return;
    }

    toast.classList.remove("is-visible");
    toast.classList.add("is-removing");

    setTimeout(() => {
      toast.remove();

      if (container?.children.length) {
        SkipToastRenderer.updateToastStack(container);
      } else {
        container?.remove();
      }
    }, 200);
  }

  static clearAll() {
    const container = document.querySelector(
      `.${SkipToastRenderer.containerClassName}`,
    );

    if (!container) return;

    container.querySelectorAll(".uafy-skip-toast").forEach((toast) => {
      SkipToastRenderer.removeToast(toast, false);
    });

    container.remove();
  }

  static injectStyles() {
    if (document.getElementById(SkipToastRenderer.styleElementId)) return;

    const style = document.createElement("style");
    style.id = SkipToastRenderer.styleElementId;

    style.textContent = `
      .uafy-skip-toast-container {
        position: fixed;
        right: 24px;
        bottom: 112px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
        width: fit-content;
        min-width: 350px;
        max-width: min(720px, calc(100vw - 48px));
        pointer-events: none;
      }

      .uafy-skip-toast {
        display: flex;
        flex-direction: column;
        width: fit-content;
        gap: 12px;
        padding: 16px;
        border-radius: 12px;
        background: var(--spice-card, #181818);
        color: var(--spice-text, #ffffff);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.12);
        opacity: 0;
        transform: translateY(12px) scale(0.98);
        transition:
          opacity 0.2s ease,
          transform 0.2s ease;
        pointer-events: auto;
        overflow: hidden;
      }

      .uafy-skip-toast.is-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .uafy-skip-toast.is-removing {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }

      .uafy-skip-toast.is-fading-away {
        -webkit-mask-image: linear-gradient(
          to bottom,
          transparent 0%,
          transparent 32%,
          rgba(0, 0, 0, 0.28) 45%,
          rgba(0, 0, 0, 0.7) 58%,
          black 68%,
          black 100%
        );
        mask-image: linear-gradient(
          to bottom,
          transparent 0%,
          transparent 32%,
          rgba(0, 0, 0, 0.28) 45%,
          rgba(0, 0, 0, 0.7) 58%,
          black 68%,
          black 100%
        );
      }

      .uafy-skip-toast-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .uafy-skip-toast-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--spice-subtext, #b3b3b3);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .uafy-skip-toast-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--spice-subtext, #b3b3b3);
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
      }

      .uafy-skip-toast-close:hover {
        background: rgba(255, 255, 255, 0.08);
        color: var(--spice-text, #ffffff);
      }

      .uafy-skip-toast-track {
        font-size: 18px;
        font-weight: 800;
        line-height: 1.25;
      }

      .uafy-skip-toast-artists {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .uafy-skip-toast-artist-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 10px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
      }

      .uafy-skip-toast-artist-name {
        min-width: 0;
        flex: 1;
        border: 0;
        padding: 0;
        background: transparent;
        color: var(--spice-text, #ffffff);
        font-size: 14px;
        font-weight: 800;
        text-align: left;
        text-decoration: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
      }

      .uafy-skip-toast-artist-name:hover {
        color: var(--spice-button, #1ed760);
        text-decoration: underline;
      }

      .uafy-skip-toast-distributor-name {
        min-width: 0;
        flex: 1;
        color: var(--spice-text, #ffffff);
        font-size: 14px;
        font-weight: 800;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .uafy-skip-toast-badges {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 8px;
        flex: 0 0 auto;
      }

      .uafy-skip-toast-badge {
        font-size: 12px !important;
        padding: 5px 8px !important;
      }

      .uafy-skip-toast-badge svg {
        width: 16px !important;
        height: 16px !important;
      }
    `;

    document.head.appendChild(style);
  }
}

class NowPlayingRuntimeState {
  static track = null;
  static artistSpans = null;

  static update(track, artistSpans = null) {
    NowPlayingRuntimeState.track = track;
    NowPlayingRuntimeState.artistSpans = artistSpans;
  }
}

class NowPlayingThemeOverlayRenderer {
  static styleElementId = "uafy-now-playing-theme-overlay-style";
  static overlayElementId = "uafy-now-playing-theme-overlay";

  static applyFromTrack(track) {
    const settings = LocalStorageManager.getSettings();

    if (!settings.formatNowPlayingBar) {
      NowPlayingThemeOverlayRenderer.clear();
      return;
    }

    const themeStatus = track.getTrackTheme();

    if (!themeStatus) {
      NowPlayingThemeOverlayRenderer.clear();
      return;
    }

    NowPlayingThemeOverlayRenderer.apply(themeStatus);
  }

  static apply(themeStatus) {
    const nowPlayingBar = NowPlayingThemeOverlayRenderer.getNowPlayingBar();
    const themeColor = ArtistInfoSectionRenderer.badges[themeStatus].bg;

    if (!nowPlayingBar || !themeColor) return;

    NowPlayingThemeOverlayRenderer.injectStyles();

    let overlay = nowPlayingBar.querySelector(
      `#${NowPlayingThemeOverlayRenderer.overlayElementId}`,
    );

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = NowPlayingThemeOverlayRenderer.overlayElementId;
      overlay.setAttribute("aria-hidden", "true");

      nowPlayingBar.prepend(overlay);
    }

    overlay.dataset.status = themeStatus;
    overlay.style.setProperty("--uafy-now-playing-color", themeColor);
  }

  static clear() {
    document
      .getElementById(NowPlayingThemeOverlayRenderer.overlayElementId)
      ?.remove();
  }

  static getNowPlayingBar() {
    return document.querySelector("div.Root__now-playing-bar");
  }

  static injectStyles() {
    if (
      document.getElementById(NowPlayingThemeOverlayRenderer.styleElementId)
    ) {
      return;
    }

    const style = document.createElement("style");
    style.id = NowPlayingThemeOverlayRenderer.styleElementId;

    style.textContent = `
      .Root__now-playing-bar {
        position: relative;
        isolation: isolate;
        overflow: hidden;
      }

      .Root__now-playing-bar #uafy-now-playing-theme-overlay {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        opacity: 0.82;
        mix-blend-mode: screen;
        contain: strict;
        background:
          radial-gradient(circle at left center, color-mix(in srgb, var(--uafy-now-playing-color) 95%, transparent) 0%, color-mix(in srgb, var(--uafy-now-playing-color) 75%, transparent) 8%, transparent 22%),
          radial-gradient(circle at right center, color-mix(in srgb, var(--uafy-now-playing-color) 95%, transparent) 0%, color-mix(in srgb, var(--uafy-now-playing-color) 75%, transparent) 8%, transparent 22%),
          linear-gradient(90deg, color-mix(in srgb, var(--uafy-now-playing-color) 45%, transparent) 0%, transparent 28%, transparent 72%, color-mix(in srgb, var(--uafy-now-playing-color) 45%, transparent) 100%);
      }

      .Root__now-playing-bar > :not(#uafy-now-playing-theme-overlay) {
        position: relative;
        z-index: 1;
      }

      .Root__now-playing-bar #uafy-now-playing-theme-overlay[data-status="approved"],
      .Root__now-playing-bar #uafy-now-playing-theme-overlay[data-status="pride"],
      .Root__now-playing-bar #uafy-now-playing-theme-overlay[data-status="base"] {
        opacity: 0.68;
      }

      .Root__now-playing-bar #uafy-now-playing-theme-overlay[data-status="unknown"],
      .Root__now-playing-bar #uafy-now-playing-theme-overlay[data-status="noInfo"] {
        opacity: 0.58;
      }
    `;

    document.head.appendChild(style);
  }
}

class NowPlayingArtistRenderer {
  static styleElementId = "uafy-now-playing-artist-style";

  static labelPriority = [
    "blocked",
    "warning",
    "unknown",
    "pride",
    "base",
    "approved",
    "noInfo",
  ];

  static statusStyles = {
    blocked: {
      color: "#ff4d4d",
      shape: "square",
    },
    warning: {
      color: "#f5c542",
      shape: "triangle",
    },
    approved: {
      color: "#1ed760",
      shape: "circle",
    },
    pride: {
      color: "#4aa3df",
      shape: "circle",
    },
    base: {
      color: "#8f6cff",
      shape: "circle",
    },
    unknown: {
      color: "#b3b3b3",
      shape: "circle",
    },
    noInfo: {
      color: "#8a8a8a",
      shape: "circle",
    },
  };

  static render(uafyTrack, artistSpans) {
    const settings = LocalStorageManager.getSettings();

    NowPlayingArtistRenderer.injectStyles();

    NowPlayingArtistRenderer.renderArtistSpanGroup(
      artistSpans.bottomBarArtistSpans,
      uafyTrack.artists,
      settings,
    );

    NowPlayingArtistRenderer.renderArtistSpanGroup(
      artistSpans.sideViewArtistSpans,
      uafyTrack.artists,
      settings,
    );
  }

  static renderArtistSpanGroup(artistSpansById, artists, settings) {
    Object.entries(artistSpansById).forEach(([artistId, artistSpan]) => {
      const artist = artists.find((trackArtist) => {
        return trackArtist.id === artistId;
      });

      NowPlayingArtistRenderer.resetArtistSpan(artistSpan);

      if (!artist) return;

      const dominantLabel =
        NowPlayingArtistRenderer.getDominantArtistLabel(artist);

      const statusStyle = NowPlayingArtistRenderer.statusStyles[dominantLabel];

      const artistLink = artistSpan.querySelector("a") || artistSpan;

      const artistExistsInDatabase = Boolean(artist.name);

      if (
        settings.formatNowPlayingArtistName &&
        artistExistsInDatabase &&
        statusStyle?.color
      ) {
        artistLink.classList.add("uafy-now-playing-artist-name");
        artistLink.style.setProperty(
          "--uafy-artist-status-color",
          statusStyle.color,
        );
      }

      if (
        settings.showNowPlayingArtistStatusShape &&
        artistExistsInDatabase &&
        statusStyle
      ) {
        artistSpan.appendChild(
          NowPlayingArtistRenderer.createStatusShape(dominantLabel),
        );
      }

      if (settings.showNowPlayingArtistFlags && artist.countries.length) {
        artist.countries.forEach((country) => {
          const flagElement = country.flagImg(settings.emojiFlags, 4, 12, 16);

          flagElement.classList.add("uafy-artist-flag");

          artistSpan.appendChild(flagElement);
        });
      }
    });
  }

  static resetArtistSpan(artistSpan) {
    artistSpan.querySelectorAll(".uafy-artist-flag").forEach((flag) => {
      flag.remove();
    });

    artistSpan
      .querySelectorAll(".uafy-artist-status-shape")
      .forEach((shape) => {
        shape.remove();
      });

    const artistLink = artistSpan.querySelector("a") || artistSpan;

    artistLink.classList.remove("uafy-now-playing-artist-name");
    artistLink.style.removeProperty("--uafy-artist-status-color");
  }

  static getDominantArtistLabel(artist) {
    const labels = artist.labels.length ? artist.labels : ["noInfo"];

    return (
      NowPlayingArtistRenderer.labelPriority.find((label) => {
        return labels.includes(label);
      }) || "noInfo"
    );
  }

  static createStatusShape(label) {
    const statusStyle =
      NowPlayingArtistRenderer.statusStyles[label] ||
      NowPlayingArtistRenderer.statusStyles.noInfo;

    const shape = document.createElement("span");

    shape.classList.add("uafy-artist-status-shape");
    shape.dataset.status = label;
    shape.dataset.shape = statusStyle.shape;
    shape.style.setProperty("--uafy-artist-status-color", statusStyle.color);

    return shape;
  }

  static injectStyles() {
    if (document.getElementById(NowPlayingArtistRenderer.styleElementId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = NowPlayingArtistRenderer.styleElementId;

    style.textContent = `
      .uafy-now-playing-artist-name {
        color: var(--uafy-artist-status-color) !important;
      }

      .uafy-artist-flag{
        margin-bottom: 2px
      }

      .uafy-artist-status-shape {
        display: inline-block;
        margin-left: 4px;
        vertical-align: middle;
        flex: 0 0 auto;
      }

      .uafy-artist-status-shape[data-shape="square"] {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        background: var(--uafy-artist-status-color);
      }

      .uafy-artist-status-shape[data-shape="circle"] {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--uafy-artist-status-color);
        margin-bottom: 3px;
      }
        
      .uafy-artist-status-shape[data-shape="triangle"] {
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 10px solid var(--uafy-artist-status-color);
        margin-bottom: 4px;
      }
    `;

    document.head.appendChild(style);
  }
}

async function loadArtistPage(location = Spicetify.Platform.History.location) {
  const pageType = location.pathname.split("/")[1];
  const artistId = location.pathname.split("/")[2];

  if (pageType !== "artist" || !artistId) return;

  const targetPathname = location.pathname;

  const artistPromise = Artist.create(artistId);

  const artistHeaderElementPromise =
    DomObserver.waitForArtistPageHeaderElement(artistId);

  const [artist, artistHeaderElement] = await Promise.all([
    artistPromise,
    artistHeaderElementPromise,
  ]);

  if (Spicetify.Platform.History.location.pathname !== targetPathname) {
    return;
  }

  if (!artistHeaderElement) return;

  artistHeaderElement.style.setProperty("height", "auto", "important");

  const headerTextElement = artistHeaderElement.querySelector(
    ".main-entityHeader-headerText",
  );

  if (!headerTextElement) return;

  artistHeaderElement.querySelector(".uafy-artist-info-section")?.remove();

  const artistInfoSection =
    ArtistInfoSectionRenderer.createArtistInfoSection(artist);

  headerTextElement.appendChild(artistInfoSection);
}

async function refreshCurrentArtistPageFlags() {
  const location = Spicetify.Platform.History.location;
  const pageType = location.pathname.split("/")[1];

  if (pageType !== "artist") return;

  await loadArtistPage(location);
}

async function getTrackArtists(track) {
  const artistIds = (track?.artists || []).map((artist) => {
    return artist.uri.split(":")[2];
  });

  return Promise.all(
    artistIds.map((artistId) => {
      return Artist.create(artistId);
    }),
  );
}

async function handleNowPlayingTrackChange(timeoutMs = 5000) {
  NowPlayingThemeOverlayRenderer.clear();

  const spotifyTrack = await waitForCurrentSpotifyTrack(timeoutMs);
  const currentTrackUri = spotifyTrack.uri;

  const { uafyTrack, artistSpans } =
    await buildNowPlayingTrackContext(spotifyTrack);

  if (!isStillCurrentTrack(currentTrackUri)) {
    return;
  }

  NowPlayingRuntimeState.update(uafyTrack, artistSpans);

  if (handleTrackSkipIfNeeded(uafyTrack)) {
    return;
  }

  renderNowPlayingTrack(uafyTrack, artistSpans);
}

async function waitForCurrentSpotifyTrack(timeoutMs = 5000) {
  return DomObserver.waitUntil(() => {
    const track = Spicetify.Player.data?.item;

    if (!track?.uri) return null;
    if (!track?.artists?.length) return null;

    return track;
  }, timeoutMs);
}

async function buildNowPlayingTrackContext(spotifyTrack) {
  const trackArtistsPromise = getTrackArtists(spotifyTrack);
  const artistSpansPromise = DomObserver.waitForNowPlayingArtist(spotifyTrack);
  const distributorsPromise =
    UafyTrack.getDistributorsFromSpotifyTrack(spotifyTrack);

  const [trackArtists, artistSpans, distributors] = await Promise.all([
    trackArtistsPromise,
    artistSpansPromise,
    distributorsPromise,
  ]);

  return {
    uafyTrack: new UafyTrack(spotifyTrack, trackArtists, distributors),
    artistSpans,
  };
}

function isStillCurrentTrack(trackUri) {
  return Spicetify.Player.data?.item?.uri === trackUri;
}

function handleTrackSkipIfNeeded(uafyTrack) {
  if (!uafyTrack.shouldSkipTrack()) {
    return false;
  }

  SkipToastRenderer.show(uafyTrack);
  Spicetify.Player.next();

  return true;
}

function renderNowPlayingTrack(uafyTrack, artistSpans) {
  NowPlayingThemeOverlayRenderer.applyFromTrack(uafyTrack);
  NowPlayingArtistRenderer.render(uafyTrack, artistSpans);
}

async function startup() {
  SettingsMenu.registerButton();

  const startupResults = await Promise.allSettled([
    loadArtistPage(),
    handleNowPlayingTrackChange(),
  ]);

  startupResults.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("UAfy startup task failed:", result.reason);
    }
  });
}

function main() {
  startup().catch((error) => {
    console.error("UAfy startup failed:", error);
  });

  Spicetify.Player.addEventListener("songchange", () => {
    handleNowPlayingTrackChange().catch((error) => {
      console.error("UAfy failed to update now playing flags:", error);
    });
  });

  Spicetify.Platform.History.listen((location) => {
    loadArtistPage(location).catch((error) => {
      console.error("UAfy failed to load artist page:", error);
    });
  });
}

(function init() {
  if (
    !Spicetify.Player ||
    !Spicetify.Platform ||
    !Spicetify.Platform.History ||
    !Spicetify.LocalStorage ||
    !Spicetify.CosmosAsync ||
    !Spicetify.Topbar ||
    !Spicetify.PopupModal ||
    !Spicetify.React ||
    !Spicetify.ReactDOM ||
    !Spicetify.ReactComponent ||
    !Spicetify.ReactComponent.Toggle ||
    !Spicetify.GraphQL ||
    !Spicetify.GraphQL.Definitions ||
    !Spicetify.GraphQL.Definitions.getAlbum
  ) {
    setTimeout(init, 100);
    return;
  }

  main();
})();
