import { LocalStorageManager } from "../services/storage.js";

export const BasifyLocales = {
  en: {
    settingsTitle: "Basify Settings",
    language: "Language",
    locale: "Locale",
    localeDescription:
      "Choose the language used in Basify settings and popup messages.",
    skipping: "Skipping",
    skipTracks: "Skip tracks",
    skipTracksDescription:
      "Automatically skip tracks based on the selected filters below.",
    skipStatusFilter: "Skip filters",
    blocked: "Blocked",
    blockedDescription:
      "Skip blocked artists and tracks released by blocked distributors.",
    warning: "Warning",
    warningDescription: "Skip artists with a warning trust label.",
    unknown: "Unknown",
    unknownDescription:
      "Skip artists whose country of origin is not confirmed. This does not affect artists that are not in Phonkersbase.",
    popup: "Popup",
    showSkipPopup: "Show skip popup",
    showSkipPopupDescription: "Show a notification when Basify skips a track.",
    popupDuration: "Popup duration",
    popupDurationDescription:
      "How long each skip popup stays visible, in seconds.",
    visiblePopupLimit: "Visible popup limit",
    visiblePopupLimitDescription:
      "Maximum number of skip popups visible at once.",
    flags: "Flags",
    useEmojiFlags: "Use emoji flags",
    useEmojiFlagsDescription:
      "Display country flags as emojis instead of flat rectangular icons.",
    nowPlaying: "Now Playing Bar",
    highlightNowPlayingBar: "Highlight now playing bar",
    highlightNowPlayingBarDescription:
      "Change the now playing bar background based on the current track's trust level, using all artists and the distributor.",
    formatArtistNames: "Format artist names",
    formatArtistNamesDescription:
      "Color artist names in the now playing bar based on their trust level.",
    showStatusShapes: "Show status shapes",
    showStatusShapesDescription:
      "Show a small status shape next to each artist name in the now playing bar: blocked square, warning triangle, approved circle, etc.",
    showArtistFlags: "Show artist flags",
    showArtistFlagsDescription:
      "Show country flags next to artist names in the now playing bar.",
    playlistRating: "Playlist Safety",
    showPlaylistRating: "Show playlist safety rating",
    showPlaylistRatingDescription:
      "Show a gauge and the percentage of blocked tracks in the playlist header.",
    storage: "Storage",
    artistCacheLimit: "Cached artists limit",
    artistCacheLimitDescription:
      "Maximum number of artists stored locally to reduce repeated API requests.",
    reset: "Reset",
    clearBasifyData: "Clear Basify data",
    clearBasifyDataDescription: "Reset Basify settings to default.",
    resetButton: "Reset",
    settingsResetNotification: "Basify settings have been reset",
    poweredBy: "Powered by",
    allInformationTakenFrom: "All information is taken from the database at:",
    createdBy: "Created by",
    trust: {
      pride: "Our pride",
      base: "Based",
      approved: "You can listen",
      warning: "Be careful",
      blocked: "Don't listen",
      unknown: "Origin not confirmed",
      noInfo: "No artist info",
      blockedDistributor: "Blocked distributor",
    },
    unknownOrigin: "Unknown origin",
    trackSkipped: "Track skipped",
    unknownTrack: "Unknown track",
    unknownArtist: "Unknown artist",
    unknownDistributor: "Unknown distributor",
  },
  uk: {
    settingsTitle: "Налаштування Basify",
    language: "Мова",
    locale: "Мова інтерфейсу",
    localeDescription: "Оберіть мову для налаштувань Basify і сповіщень.",
    skipping: "Пропуск треків",
    skipTracks: "Пропускати треки",
    skipTracksDescription:
      "Автоматично пропускати треки за вибраними нижче фільтрами.",
    skipStatusFilter: "Фільтри пропуску",
    blocked: "Заблоковані",
    blockedDescription:
      "Пропускати заблокованих артистів і треки, випущені заблокованими дистрибʼюторами.",
    warning: "Попередження",
    warningDescription:
      "Пропускати артистів із міткою довіри «Будь обережний».",
    unknown: "Невідомі",
    unknownDescription:
      "Пропускати артистів, країна походження яких не підтверджена. Це не впливає на артистів, яких немає у Phonkersbase.",
    popup: "Сповіщення",
    showSkipPopup: "Показувати сповіщення про пропуск",
    showSkipPopupDescription:
      "Показувати сповіщення, коли Basify пропускає трек.",
    popupDuration: "Тривалість сповіщення",
    popupDurationDescription:
      "Скільки секунд кожне сповіщення про пропуск залишається видимим.",
    visiblePopupLimit: "Ліміт видимих сповіщень",
    visiblePopupLimitDescription:
      "Максимальна кількість сповіщень про пропуск, видимих одночасно.",
    flags: "Прапори",
    useEmojiFlags: "Використовувати емодзі-прапори",
    useEmojiFlagsDescription:
      "Показувати прапори країн як емодзі замість пласких прямокутних іконок.",
    nowPlaying: "Панель поточного треку",
    highlightNowPlayingBar: "Підсвічувати панель поточного треку",
    highlightNowPlayingBarDescription:
      "Змінювати фон панелі поточного треку відповідно до рівня довіри треку, враховуючи всіх артистів і дистрибʼютора.",
    formatArtistNames: "Форматувати імена артистів",
    formatArtistNamesDescription:
      "Забарвлювати імена артистів на панелі поточного треку відповідно до їхнього рівня довіри.",
    showStatusShapes: "Показувати позначки статусу",
    showStatusShapesDescription:
      "Показувати маленьку позначку статусу біля імені кожного артиста на панелі поточного треку: квадрат для заблокованих, трикутник для попереджень, коло для схвалених тощо.",
    showArtistFlags: "Показувати прапори артистів",
    showArtistFlagsDescription:
      "Показувати прапори країн походження артистів біля їхніх імен на панелі поточного треку.",
    playlistRating: "Безпека плейлиста",
    showPlaylistRating: "Показувати рейтинг безпеки плейлиста",
    showPlaylistRatingDescription:
      "Показувати кругову шкалу та відсоток заблокованих треків у шапці плейлиста.",
    storage: "Сховище",
    artistCacheLimit: "Ліміт кешованих артистів",
    artistCacheLimitDescription:
      "Максимальна кількість артистів, що зберігаються локально для зменшення повторних запитів.",
    reset: "Скидання",
    clearBasifyData: "Очистити дані Basify",
    clearBasifyDataDescription: "Скинути налаштування Basify до стандартних.",
    resetButton: "Скинути",
    settingsResetNotification: "Налаштування Basify скинуто",
    poweredBy: "За підтримки",
    allInformationTakenFrom: "Усю інформацію взято з бази даних:",
    createdBy: "Створив",
    trust: {
      pride: "Наша гордість",
      base: "Базований",
      approved: "Можеш слухати",
      warning: "Будь обережний",
      blocked: "Не слухай це",
      unknown: "Походження не підтверджено",
      noInfo: "Немає інформації про артиста",
      blockedDistributor: "Заблокований дистрибʼютор",
    },
    unknownOrigin: "Невідоме походження",
    trackSkipped: "Трек пропущено",
    unknownTrack: "Невідомий трек",
    unknownArtist: "Невідомий артист",
    unknownDistributor: "Невідомий дистрибʼютор",
  },
};

export class BasifyI18n {
  static defaultLocale = "en";
  static lowercaseCountryNames = {
    "gb-sct": { en: "Scotland", uk: "Шотландія" },
    ru: { en: "russia", uk: "росія" },
    by: { en: "belarus", uk: "білорусь" },
  };

  static getSpotifyLocale() {
    try {
      return Spicetify?.Locale?.getLocale() || "en";
    } catch (e) {
      return "en";
    }
  }

  static normalizeLocale(locale) {
    const languageCode = String(locale || "")
      .split("-")[0]
      .toLowerCase();
    return languageCode === "uk" || languageCode === "ru"
      ? "uk"
      : BasifyI18n.defaultLocale;
  }

  static getInitialLocale() {
    return BasifyI18n.normalizeLocale(BasifyI18n.getSpotifyLocale());
  }

  static getLocale() {
    try {
      const settings = LocalStorageManager.getSettings();
      return BasifyLocales[settings.locale]
        ? settings.locale
        : BasifyI18n.defaultLocale;
    } catch (e) {
      return BasifyI18n.defaultLocale;
    }
  }

  static getPhonkersbaseLocalePath(locale = BasifyI18n.getLocale()) {
    return locale === "uk" ? "uk" : "en";
  }

  static t(key, locale = BasifyI18n.getLocale()) {
    if (!key) return "";
    const dictionary =
      BasifyLocales[locale] || BasifyLocales[BasifyI18n.defaultLocale];
    return (
      BasifyI18n.getNestedValue(dictionary, key) ??
      BasifyI18n.getNestedValue(BasifyLocales[BasifyI18n.defaultLocale], key) ??
      key
    );
  }

  static getNestedValue(object, path) {
    return String(path)
      .split(".")
      .reduce((currentValue, keyPart) => currentValue?.[keyPart], object);
  }

  static countryName(countryCode, locale = BasifyI18n.getLocale()) {
    if (!countryCode) return "";
    const normalizedCountryCode = String(countryCode).trim().toLowerCase();
    const customCountryName =
      BasifyI18n.lowercaseCountryNames[normalizedCountryCode]?.[locale] ??
      BasifyI18n.lowercaseCountryNames[normalizedCountryCode]?.[
        BasifyI18n.defaultLocale
      ];

    if (customCountryName) return customCountryName;

    try {
      return new Intl.DisplayNames([locale], { type: "region" }).of(
        String(countryCode).toUpperCase(),
      );
    } catch (error) {
      return String(countryCode).toUpperCase();
    }
  }
}
