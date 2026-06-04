var Basify = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/services/storage.js
	var LocalStorageManager = class LocalStorageManager {
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
					artistCacheLimit: 50
				}
			};
		}
		static loadData() {
			try {
				const rawData = LocalStorageManager.storage.get(LocalStorageManager.rootKey);
				if (!rawData) return LocalStorageManager.createDefaultData();
				const parsedData = JSON.parse(rawData);
				const defaultData = LocalStorageManager.createDefaultData();
				return {
					...defaultData,
					...parsedData,
					settings: {
						...defaultData.settings,
						...parsedData.settings || {}
					}
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
			LocalStorageManager.lock = LocalStorageManager.lock.then(async () => {
				const data = LocalStorageManager.loadData();
				await callback(data);
				LocalStorageManager.saveData(data);
			}).catch((error) => {
				console.error("Storage update failed:", error);
			});
			return LocalStorageManager.lock;
		}
		static getArtist(id) {
			return LocalStorageManager.loadData().artistsById[id] || null;
		}
		static async saveArtist(artist) {
			const now = Date.now();
			const savedArtist = {
				...artist,
				updatedAt: now,
				lastUsedAt: now
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
				return (b.lastUsedAt || b.updatedAt || 0) - aTime;
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
			return LocalStorageManager.loadData().settings;
		}
		static async updateSettings(newSettings) {
			await LocalStorageManager.updateData((data) => {
				data.settings = {
					...data.settings,
					...newSettings
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
	};
	//#endregion
	//#region src/locales/index.js
	var BasifyLocales = {
		en: {
			settingsTitle: "Basify Settings",
			language: "Language",
			locale: "Locale",
			localeDescription: "Choose the language used in Basify settings and popup messages.",
			skipping: "Skipping",
			skipTracks: "Skip tracks",
			skipTracksDescription: "Automatically skip tracks based on the selected filters below.",
			skipStatusFilter: "Skip filters",
			blocked: "Blocked",
			blockedDescription: "Skip blocked artists and tracks released by blocked distributors.",
			warning: "Warning",
			warningDescription: "Skip artists with a warning trust label.",
			unknown: "Unknown",
			unknownDescription: "Skip artists whose country of origin is not confirmed. This does not affect artists that are not in Phonkersbase.",
			popup: "Popup",
			showSkipPopup: "Show skip popup",
			showSkipPopupDescription: "Show a notification when Basify skips a track.",
			popupDuration: "Popup duration",
			popupDurationDescription: "How long each skip popup stays visible, in seconds.",
			visiblePopupLimit: "Visible popup limit",
			visiblePopupLimitDescription: "Maximum number of skip popups visible at once.",
			flags: "Flags",
			useEmojiFlags: "Use emoji flags",
			useEmojiFlagsDescription: "Display country flags as emojis instead of flat rectangular icons.",
			nowPlaying: "Now Playing Bar",
			highlightNowPlayingBar: "Highlight now playing bar",
			highlightNowPlayingBarDescription: "Change the now playing bar background based on the current track's trust level, using all artists and the distributor.",
			formatArtistNames: "Format artist names",
			formatArtistNamesDescription: "Color artist names in the now playing bar based on their trust level.",
			showStatusShapes: "Show status shapes",
			showStatusShapesDescription: "Show a small status shape next to each artist name in the now playing bar: blocked square, warning triangle, approved circle, etc.",
			showArtistFlags: "Show artist flags",
			showArtistFlagsDescription: "Show country flags next to artist names in the now playing bar.",
			playlistRating: "Playlist Safety",
			showPlaylistRating: "Show playlist safety rating",
			showPlaylistRatingDescription: "Show a gauge and the percentage of blocked tracks in the playlist header.",
			storage: "Storage",
			artistCacheLimit: "Cached artists limit",
			artistCacheLimitDescription: "Maximum number of artists stored locally to reduce repeated API requests.",
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
				blockedDistributor: "Blocked distributor"
			},
			unknownOrigin: "Unknown origin",
			trackSkipped: "Track skipped",
			unknownTrack: "Unknown track",
			unknownArtist: "Unknown artist",
			unknownDistributor: "Unknown distributor"
		},
		uk: {
			settingsTitle: "Налаштування Basify",
			language: "Мова",
			locale: "Мова інтерфейсу",
			localeDescription: "Оберіть мову для налаштувань Basify і сповіщень.",
			skipping: "Пропуск треків",
			skipTracks: "Пропускати треки",
			skipTracksDescription: "Автоматично пропускати треки за вибраними нижче фільтрами.",
			skipStatusFilter: "Фільтри пропуску",
			blocked: "Заблоковані",
			blockedDescription: "Пропускати заблокованих артистів і треки, випущені заблокованими дистрибʼюторами.",
			warning: "Попередження",
			warningDescription: "Пропускати артистів із міткою довіри «Будь обережний».",
			unknown: "Невідомі",
			unknownDescription: "Пропускати артистів, країна походження яких не підтверджена. Це не впливає на артистів, яких немає у Phonkersbase.",
			popup: "Сповіщення",
			showSkipPopup: "Показувати сповіщення про пропуск",
			showSkipPopupDescription: "Показувати сповіщення, коли Basify пропускає трек.",
			popupDuration: "Тривалість сповіщення",
			popupDurationDescription: "Скільки секунд кожне сповіщення про пропуск залишається видимим.",
			visiblePopupLimit: "Ліміт видимих сповіщень",
			visiblePopupLimitDescription: "Максимальна кількість сповіщень про пропуск, видимих одночасно.",
			flags: "Прапори",
			useEmojiFlags: "Використовувати емодзі-прапори",
			useEmojiFlagsDescription: "Показувати прапори країн як емодзі замість пласких прямокутних іконок.",
			nowPlaying: "Панель поточного треку",
			highlightNowPlayingBar: "Підсвічувати панель поточного треку",
			highlightNowPlayingBarDescription: "Змінювати фон панелі поточного треку відповідно до рівня довіри треку, враховуючи всіх артистів і дистрибʼютора.",
			formatArtistNames: "Форматувати імена артистів",
			formatArtistNamesDescription: "Забарвлювати імена артистів на панелі поточного треку відповідно до їхнього рівня довіри.",
			showStatusShapes: "Показувати позначки статусу",
			showStatusShapesDescription: "Показувати маленьку позначку статусу біля імені кожного артиста на панелі поточного треку: квадрат для заблокованих, трикутник для попереджень, коло для схвалених тощо.",
			showArtistFlags: "Показувати прапори артистів",
			showArtistFlagsDescription: "Показувати прапори країн походження артистів біля їхніх імен на панелі поточного треку.",
			playlistRating: "Безпека плейлиста",
			showPlaylistRating: "Показувати рейтинг безпеки плейлиста",
			showPlaylistRatingDescription: "Показувати кругову шкалу та відсоток заблокованих треків у шапці плейлиста.",
			storage: "Сховище",
			artistCacheLimit: "Ліміт кешованих артистів",
			artistCacheLimitDescription: "Максимальна кількість артистів, що зберігаються локально для зменшення повторних запитів.",
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
				blockedDistributor: "Заблокований дистрибʼютор"
			},
			unknownOrigin: "Невідоме походження",
			trackSkipped: "Трек пропущено",
			unknownTrack: "Невідомий трек",
			unknownArtist: "Невідомий артист",
			unknownDistributor: "Невідомий дистрибʼютор"
		}
	};
	var BasifyI18n = class BasifyI18n {
		static defaultLocale = "en";
		static lowercaseCountryNames = {
			"gb-sct": {
				en: "Scotland",
				uk: "Шотландія"
			},
			ru: {
				en: "russia",
				uk: "росія"
			},
			by: {
				en: "belarus",
				uk: "білорусь"
			}
		};
		static getSpotifyLocale() {
			try {
				return Spicetify?.Locale?.getLocale() || "en";
			} catch (e) {
				return "en";
			}
		}
		static normalizeLocale(locale) {
			const languageCode = String(locale || "").split("-")[0].toLowerCase();
			return languageCode === "uk" || languageCode === "ru" ? "uk" : BasifyI18n.defaultLocale;
		}
		static getInitialLocale() {
			return BasifyI18n.normalizeLocale(BasifyI18n.getSpotifyLocale());
		}
		static getLocale() {
			try {
				const settings = LocalStorageManager.getSettings();
				return BasifyLocales[settings.locale] ? settings.locale : BasifyI18n.defaultLocale;
			} catch (e) {
				return BasifyI18n.defaultLocale;
			}
		}
		static getPhonkersbaseLocalePath(locale = BasifyI18n.getLocale()) {
			return locale === "uk" ? "uk" : "en";
		}
		static t(key, locale = BasifyI18n.getLocale()) {
			if (!key) return "";
			const dictionary = BasifyLocales[locale] || BasifyLocales[BasifyI18n.defaultLocale];
			return BasifyI18n.getNestedValue(dictionary, key) ?? BasifyI18n.getNestedValue(BasifyLocales[BasifyI18n.defaultLocale], key) ?? key;
		}
		static getNestedValue(object, path) {
			return String(path).split(".").reduce((currentValue, keyPart) => currentValue?.[keyPart], object);
		}
		static countryName(countryCode, locale = BasifyI18n.getLocale()) {
			if (!countryCode) return "";
			const normalizedCountryCode = String(countryCode).trim().toLowerCase();
			const customCountryName = BasifyI18n.lowercaseCountryNames[normalizedCountryCode]?.[locale] ?? BasifyI18n.lowercaseCountryNames[normalizedCountryCode]?.[BasifyI18n.defaultLocale];
			if (customCountryName) return customCountryName;
			try {
				return new Intl.DisplayNames([locale], { type: "region" }).of(String(countryCode).toUpperCase());
			} catch (error) {
				return String(countryCode).toUpperCase();
			}
		}
	};
	//#endregion
	//#region src/constants/icons.js
	var crownSvg = `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 4.5L10.6667 8.5L14 5.83333L12.6667 12.5H3.33333L2 5.83333L5.33333 8.5L8 4.5Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
	var thumbsUpSvg = `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8.66671 2.5C9.17685 2.49997 9.66772 2.69488 10.0389 3.04486C10.41 3.39483 10.6334 3.8734 10.6634 4.38267L10.6667 4.5V7.16667H12C12.4901 7.16659 12.9632 7.34645 13.3294 7.67212C13.6956 7.99779 13.9295 8.4466 13.9867 8.93333L13.9967 9.04933L14 9.16667L13.9867 9.29733L13.316 12.652C13.062 13.736 12.3147 14.516 11.4427 14.5053L11.3334 14.5H6.00004C5.83675 14.5 5.67915 14.44 5.55713 14.3315C5.4351 14.223 5.35715 14.0735 5.33804 13.9113L5.33337 13.8333L5.33404 7.476C5.33416 7.35909 5.36502 7.24427 5.42353 7.14305C5.48203 7.04184 5.56613 6.95779 5.66737 6.89933C5.95166 6.73515 6.19112 6.50346 6.3646 6.22475C6.53808 5.94605 6.64024 5.6289 6.66204 5.30133L6.66671 5.16667V4.5C6.66671 3.96957 6.87742 3.46086 7.25249 3.08579C7.62757 2.71071 8.13627 2.5 8.66671 2.5Z"/><path d="M3.33337 7.16675C3.49666 7.16677 3.65426 7.22672 3.77629 7.33522C3.89831 7.44373 3.97627 7.59325 3.99537 7.75541L4.00004 7.83341V13.8334C4.00002 13.9967 3.94007 14.1543 3.83156 14.2763C3.72306 14.3984 3.57354 14.4763 3.41137 14.4954L3.33337 14.5001H2.66671C2.33032 14.5002 2.00633 14.3731 1.75968 14.1444C1.51302 13.9157 1.36194 13.6022 1.33671 13.2667L1.33337 13.1667V8.50008C1.33327 8.1637 1.46031 7.8397 1.68904 7.59305C1.91777 7.3464 2.23127 7.19531 2.56671 7.17008L2.66671 7.16675H3.33337Z"/></svg>`;
	var starSvg = `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.4953 5.39328L1.24197 6.00995L1.16663 6.02528C1.05259 6.05556 0.948629 6.11555 0.865361 6.19915C0.782092 6.28274 0.722502 6.38694 0.692674 6.5011C0.662847 6.61526 0.663851 6.73529 0.695584 6.84893C0.727318 6.96257 0.788644 7.06576 0.873299 7.14795L3.95463 10.1473L3.22797 14.3839L3.2193 14.4573C3.21232 14.5752 3.23681 14.6929 3.29027 14.7983C3.34372 14.9037 3.42422 14.9929 3.52352 15.057C3.62282 15.121 3.73736 15.1575 3.8554 15.1627C3.97344 15.1679 4.09074 15.1416 4.1953 15.0866L7.9993 13.0866L11.7946 15.0866L11.8613 15.1173C11.9713 15.1606 12.0909 15.1739 12.2078 15.1558C12.3247 15.1377 12.4346 15.0888 12.5264 15.0141C12.6181 14.9395 12.6883 14.8418 12.7299 14.731C12.7714 14.6203 12.7827 14.5005 12.7626 14.3839L12.0353 10.1473L15.118 7.14728L15.17 7.09062C15.2442 6.99913 15.2929 6.88958 15.3111 6.77315C15.3293 6.65671 15.3162 6.53753 15.2734 6.42777C15.2305 6.318 15.1592 6.22157 15.067 6.14829C14.9747 6.07501 14.8646 6.02751 14.748 6.01062L10.4946 5.39328L8.5933 1.53995C8.53828 1.4283 8.45311 1.33429 8.34742 1.26855C8.24174 1.20281 8.11976 1.16797 7.9953 1.16797C7.87084 1.16797 7.74886 1.20281 7.64317 1.26855C7.53749 1.33429 7.45231 1.4283 7.3973 1.53995L5.4953 5.39328Z"/></svg>`;
	var warningSvg = `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.3334 2.72676C12.3468 3.31188 13.1884 4.15348 13.7736 5.16695C14.3587 6.18042 14.6667 7.33005 14.6667 8.5003C14.6667 9.67055 14.3586 10.8202 13.7735 11.8336C13.1884 12.8471 12.3468 13.6887 11.3333 14.2738C10.3198 14.8589 9.17019 15.1669 7.99993 15.1669C6.82968 15.1669 5.68005 14.8588 4.6666 14.2737C3.65314 13.6886 2.81157 12.8469 2.22646 11.8335C1.64136 10.82 1.33334 9.67034 1.33337 8.50009L1.33671 8.28409C1.37404 7.13275 1.70907 6.01073 2.30913 5.02742C2.90919 4.04411 3.75381 3.23306 4.76064 2.67335C5.76746 2.11363 6.90214 1.82436 8.05404 1.83372C9.20595 1.84308 10.3358 2.15076 11.3334 2.72676ZM8.00004 10.5001C7.82323 10.5001 7.65366 10.5703 7.52864 10.6954C7.40361 10.8204 7.33337 10.9899 7.33337 11.1668V11.1734C7.33337 11.3502 7.40361 11.5198 7.52864 11.6448C7.65366 11.7699 7.82323 11.8401 8.00004 11.8401C8.17685 11.8401 8.34642 11.7699 8.47144 11.6448C8.59647 11.5198 8.66671 11.3502 8.66671 11.1734V11.1668C8.66671 10.9899 8.59647 10.8204 8.47144 10.6954C8.34642 10.5703 8.17685 10.5001 8.00004 10.5001ZM8.00004 5.83342C7.82323 5.83342 7.65366 5.90366 7.52864 6.02869C7.40361 6.15371 7.33337 6.32328 7.33337 6.50009V9.16676C7.33337 9.34357 7.40361 9.51314 7.52864 9.63816C7.65366 9.76319 7.82323 9.83342 8.00004 9.83342C8.17685 9.83342 8.34642 9.76319 8.47144 9.63816C8.59647 9.51314 8.66671 9.34357 8.66671 9.16676V6.50009C8.66671 6.32328 8.59647 6.15371 8.47144 6.02869C8.34642 5.90366 8.17685 5.83342 8.00004 5.83342Z"/></svg>`;
	var banSvg = `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 8.5C2 9.28793 2.15519 10.0681 2.45672 10.7961C2.75825 11.5241 3.20021 12.1855 3.75736 12.7426C4.31451 13.2998 4.97595 13.7417 5.7039 14.0433C6.43185 14.3448 7.21207 14.5 8 14.5C8.78793 14.5 9.56815 14.3448 10.2961 14.0433C11.0241 13.7417 11.6855 13.2998 12.2426 12.7426C12.7998 12.1855 13.2417 11.5241 13.5433 10.7961C13.8448 10.0681 14 9.28793 14 8.5C14 7.71207 13.8448 6.93185 13.5433 6.2039C13.2417 5.47595 12.7998 4.81451 12.2426 4.25736C11.6855 3.70021 11.0241 3.25825 10.2961 2.95672C9.56815 2.65519 8.78793 2.5 8 2.5C7.21207 2.5 6.43185 2.65519 5.7039 2.95672C4.97595 3.25825 4.31451 3.70021 3.75736 4.25736C3.20021 4.81451 2.75825 5.47595 2.45672 6.2039C2.15519 6.93185 2 7.71207 2 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.2427 4.25732L3.75732 12.7427" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
	var unknownSvg = `<svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.9833 8.05342C13.8892 6.79321 13.3995 5.5949 12.5842 4.62938C11.7688 3.66386 10.6695 2.98043 9.44281 2.67655C8.21617 2.37266 6.9249 2.46384 5.75313 2.93708C4.58136 3.41032 3.58893 4.24145 2.91736 5.31196C2.24579 6.38247 1.92937 7.6377 2.01323 8.89863C2.09709 10.1596 2.57694 11.3618 3.38435 12.334C4.19176 13.3061 5.28551 13.9985 6.50963 14.3124C7.73375 14.6263 9.02573 14.5457 10.2013 14.0821M2.40002 6.5H13.6M2.40002 10.5H9.00002M7.66665 2.5C6.54354 4.29974 5.94812 6.37858 5.94812 8.5C5.94812 10.6214 6.54354 12.7003 7.66665 14.5M8.33337 2.5C9.51917 4.39925 10.1154 6.60736 10.0467 8.84533M9.34271 12.4473C9.07635 13.1638 8.73818 13.8516 8.33337 14.5M12.6666 15.1667V15.1734M12.6666 13.1668C12.9655 13.1658 13.2554 13.0646 13.4899 12.8794C13.7245 12.6942 13.8901 12.4356 13.9603 12.1451C14.0305 11.8546 14.0013 11.5489 13.8772 11.2771C13.7531 11.0052 13.5414 10.7828 13.276 10.6454C13.0107 10.5096 12.7074 10.4674 12.4152 10.5259C12.123 10.5844 11.8592 10.74 11.6666 10.9674" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
	var settingsSvg = `<svg class="basify-topbar-settings-icon" role="img" width="48" height="48" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="84" height="84" rx="42" fill="var(--basify-settings-button-bg, var(--background-elevated-base, #1f1f1f))"/><path fill-rule="evenodd" clip-rule="evenodd" d="M58.001 54.917C58.6911 54.9173 59.251 55.4768 59.251 56.167V57.5918C59.9754 57.7975 60.6435 58.1807 61.1924 58.7139L62.4307 58C63.0284 57.6551 63.7924 57.8605 64.1377 58.458C64.4829 59.0559 64.2785 59.8208 63.6807 60.166L62.4443 60.8789C62.5361 61.2424 62.584 61.6188 62.584 62C62.584 62.3806 62.5358 62.7562 62.4443 63.1191L63.6816 63.834C64.2796 64.179 64.4846 64.944 64.1396 65.542C63.7945 66.1395 63.0304 66.3448 62.4326 66L61.1934 65.2852C60.6435 65.819 59.9759 66.2023 59.251 66.4082V67.833C59.251 68.5232 58.6911 69.0827 58.001 69.083C57.3106 69.083 56.751 68.5234 56.751 67.833V66.4082C56.0258 66.2025 55.3571 65.82 54.8076 65.2861L53.5723 66C52.9744 66.3447 52.2092 66.1397 51.8643 65.542C51.5195 64.9442 51.7247 64.1791 52.3223 63.834L53.5557 63.1221C53.4638 62.7582 53.417 62.3815 53.417 62C53.417 61.6181 53.4636 61.241 53.5557 60.877L52.3223 60.166C51.7247 59.8209 51.5195 59.0558 51.8643 58.458C52.2092 57.8603 52.9744 57.6553 53.5723 58L54.8076 58.7129C55.357 58.1794 56.0261 57.7973 56.751 57.5918V56.167C56.751 55.4766 57.3106 54.917 58.001 54.917ZM58 59.917C57.4477 59.9171 56.9179 60.1369 56.5273 60.5273C56.1367 60.918 55.917 61.4476 55.917 62C55.917 62.5525 56.1366 63.0829 56.5273 63.4736C56.9157 63.8618 57.4414 64.0805 57.9902 64.083H58.0098C58.5586 64.0803 59.0854 63.8619 59.4736 63.4736C59.8642 63.083 60.084 62.5524 60.084 62C60.0839 61.4478 59.864 60.9179 59.4736 60.5273C59.083 60.1368 58.5524 59.9171 58 59.917Z" fill="var(--basify-settings-button-icon, var(--spice-subtext, #a5a5a5))"/><path fill-rule="evenodd" clip-rule="evenodd" d="M33.0996 38.7129C34.49 36.403 36.2207 34.6201 38.29 33.3633C40.3593 32.1065 42.6869 31.4776 45.2734 31.4775C47.9571 31.4775 50.334 32.1233 52.4033 33.4141C54.4727 34.671 56.0899 36.4547 57.2539 38.7646C58.4179 41.0406 59 43.7074 59 46.7646C59 48.6513 58.7727 50.3989 58.3193 52.0078C58.2133 52.0045 58.1069 52 58 52C52.5568 52 48.1315 56.349 48.0049 61.7617C47.1328 61.9188 46.2223 62 45.2734 62C42.6869 61.9999 40.3593 61.371 38.29 60.1143C36.35 58.9359 34.7075 57.3103 33.3643 55.2363L33.0996 54.8154V61.2354H25V22H33.0996V38.7129ZM43.043 38.1016C41.5234 38.1016 40.0845 38.4755 38.7266 39.2227C37.3685 39.936 36.1714 40.9554 35.1367 42.2803C34.1344 43.5711 33.3427 45.0662 32.7607 46.7646C33.3427 48.4628 34.1345 49.9574 35.1367 51.248C36.1714 52.5389 37.3685 53.5583 38.7266 54.3057C40.0845 55.0189 41.5234 55.376 43.043 55.376C44.5302 55.3759 45.8556 55.0189 47.0195 54.3057C48.1836 53.5583 49.0896 52.5389 49.7363 51.248C50.4152 49.9573 50.7548 48.4629 50.7549 46.7646C50.7549 45.0662 50.4153 43.5711 49.7363 42.2803C49.0896 40.9554 48.1836 39.936 47.0195 39.2227C45.8556 38.4755 44.5301 38.1016 43.043 38.1016Z" fill="var(--basify-settings-button-icon, var(--spice-subtext, #a5a5a5))""/></svg>`;
	var phonkersbaseLogoSvg = `<svg role="img" width="122" height="26" viewBox="0 0 122 26" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.52761 9.57622V21.4494L10.0957 21.3584V16.4454C11.5525 16.5364 14.4299 15.8995 14.2858 12.6241C14.1416 9.34877 11.8979 9.21229 10.6814 9.34877L7.52761 9.57622ZM10.0957 14.8987V10.8955C10.7265 10.668 11.988 10.7135 11.988 12.7151C11.988 14.7167 10.7265 15.0048 10.0957 14.8987Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M15.2319 8.98484V21.04C18.1604 20.676 22.6659 21.5859 22.6659 17.2187C22.6959 16.2482 22.3685 14.2891 20.8187 14.2163C22.0441 13.9616 22.2304 12.2905 22.1703 11.4868C22.0802 9.57622 20.8187 8.166 15.2319 8.98484ZM17.8901 13.6249V10.2586C18.7011 10.2586 19.7374 9.80368 19.7374 11.8963C19.7374 13.7159 18.656 13.6249 17.8901 13.6249ZM17.8901 19.3568V15.2171C18.8813 14.9897 20.1879 14.8987 20.1879 17.3097C20.1879 19.5297 18.7462 19.3568 17.8901 19.3568Z" /><path fill-rule="evenodd" clip-rule="evenodd" d="M5.27497 25.9984L24.6934 24.8156C25.1289 24.6791 26 24.1969 26 23.3599V6.0278C25.97 5.70936 25.7387 5.0088 25.0539 4.75405C24.333 4.28094 20.6686 1.64549 18.9265 0.386907C18.8063 0.220106 18.2146 -0.0862003 16.8089 0.0229782C15.4032 0.132157 5.80061 0.796408 1.17502 1.11489C0.754513 1.20587 0.00360573 1.62439 0.00360573 2.5706V19.1748C-0.0114124 19.3265 0.0126166 19.6934 0.228878 19.9482C0.445139 20.2029 2.90205 23.633 4.10347 25.3161C4.26873 25.5573 4.73439 26.0313 5.27497 25.9984ZM16.8089 1.38783L2.48151 2.43413C2.12108 2.46045 2.21119 2.71804 2.30129 2.84355C2.87198 3.38944 4.08545 4.56311 4.3738 4.89064C4.66215 5.21818 5.63532 5.26974 6.08587 5.25457C11.0118 4.92097 20.9538 4.24467 21.3143 4.20828C21.6747 4.17189 21.5846 3.92017 21.4945 3.79886C20.5633 3.14682 18.584 1.77906 18.1154 1.52431C17.6468 1.26956 17.0492 1.32718 16.8089 1.38783ZM23.5219 6.16439L5.77048 7.34716C5.26587 7.38355 5.13972 7.78691 5.13972 7.98404V22.8141C5.13972 23.6875 5.86059 23.9666 6.22103 23.9969C11.5074 23.6481 22.2964 22.9415 23.1615 22.9051C24.0265 22.8687 24.3029 22.3137 24.3329 22.0408V6.93774C24.3329 6.39185 23.7922 6.19472 23.5219 6.16439Z" /><path d="M38 1H42.8727V12.6325L42.2016 14.0029V17.7789L42.8727 19.1797V24.4478H38V1ZM41.1512 15.7995C41.4624 13.9521 42.0363 12.3483 42.8727 10.9881C43.7091 9.60767 44.7498 8.54186 45.9947 7.79072C47.2396 7.03958 48.6401 6.66401 50.1963 6.66401C51.8108 6.66401 53.2405 7.04973 54.4854 7.82118C55.7303 8.57232 56.7029 9.63813 57.4032 11.0186C58.1035 12.3788 58.4536 13.9724 58.4536 15.7995C58.4536 17.6063 58.1035 19.2 57.4032 20.5804C56.7029 21.9406 55.7303 23.0064 54.4854 23.7779C53.2405 24.529 51.8108 24.9046 50.1963 24.9046C48.6401 24.9046 47.2396 24.529 45.9947 23.7779C44.7498 23.0267 43.7091 21.9711 42.8727 20.6109C42.0557 19.2304 41.4819 17.6266 41.1512 15.7995ZM53.4934 15.7995C53.4934 14.7845 53.2891 13.8912 52.8806 13.1198C52.4916 12.328 51.947 11.719 51.2467 11.2927C50.5464 10.846 49.7489 10.6227 48.8541 10.6227C47.9399 10.6227 47.0743 10.846 46.2573 11.2927C45.4403 11.719 44.7206 12.328 44.0981 13.1198C43.4951 13.8912 43.0186 14.7845 42.6684 15.7995C43.0186 16.8146 43.4951 17.7078 44.0981 18.4793C44.7206 19.2507 45.4403 19.8597 46.2573 20.3064C47.0743 20.7327 47.9399 20.9458 48.8541 20.9458C49.7489 20.9458 50.5464 20.7327 51.2467 20.3064C51.947 19.8597 52.4916 19.2507 52.8806 18.4793C53.2891 17.7078 53.4934 16.8146 53.4934 15.7995Z" /><path d="M100.999 18.9969C100.999 20.2353 100.649 21.3011 99.9489 22.1944C99.2681 23.0876 98.2469 23.7677 96.8853 24.2346C95.5236 24.6813 93.8605 24.9046 91.8959 24.9046C89.8729 24.9046 88.1125 24.6508 86.6147 24.1433C85.1169 23.6154 83.9498 22.8745 83.1134 21.9203C82.277 20.9661 81.8296 19.8597 81.7712 18.6011H86.7314C86.8481 19.1695 87.1399 19.6669 87.6068 20.0932C88.0736 20.4992 88.6766 20.8139 89.4158 21.0372C90.1744 21.2605 91.0497 21.3722 92.0418 21.3722C93.4228 21.3722 94.4635 21.2098 95.1638 20.8849C95.8835 20.5601 96.2434 20.0729 96.2434 19.4233C96.2434 18.9563 95.9905 18.6011 95.4847 18.3575C94.9984 18.1138 94.0939 17.9311 92.7712 17.8093L89.6784 17.5657C87.8304 17.4033 86.3618 17.0785 85.2725 16.5913C84.1832 16.104 83.4052 15.495 82.9383 14.7642C82.4909 14.013 82.2672 13.1908 82.2672 12.2976C82.2672 11.0592 82.6368 10.0238 83.376 9.1915C84.1152 8.35915 85.1461 7.72982 86.4688 7.3035C87.811 6.87717 89.3574 6.66401 91.1081 6.66401C92.8976 6.66401 94.4927 6.91778 95.8932 7.4253C97.2938 7.93283 98.4122 8.63322 99.2487 9.52647C100.105 10.4197 100.591 11.4551 100.708 12.6325H95.7473C95.6695 12.2062 95.4458 11.8103 95.0762 11.4449C94.7261 11.0592 94.2106 10.7445 93.5298 10.5009C92.849 10.2573 91.964 10.1355 90.8747 10.1355C89.6492 10.1355 88.7058 10.2878 88.0444 10.5923C87.3831 10.8765 87.0524 11.313 87.0524 11.9017C87.0524 12.3077 87.2566 12.6427 87.6651 12.9066C88.0736 13.1502 88.8322 13.3228 89.941 13.4243L93.9675 13.7593C95.7571 13.9217 97.1673 14.2363 98.1983 14.7033C99.2292 15.1499 99.9489 15.7386 100.357 16.4695C100.785 17.2003 100.999 18.0428 100.999 18.9969Z" /><path d="M113.159 24.9046C111.195 24.9046 109.434 24.529 107.878 23.7779C106.341 23.0064 105.126 21.9305 104.231 20.55C103.355 19.1695 102.918 17.5657 102.918 15.7386C102.918 13.9318 103.336 12.3483 104.172 10.9881C105.028 9.62797 106.195 8.57232 107.674 7.82118C109.152 7.04973 110.835 6.66401 112.721 6.66401C114.647 6.66401 116.301 7.11064 117.682 8.00389C119.063 8.87683 120.123 10.1152 120.862 11.719C121.621 13.3228 122 15.2108 122 17.383H106.828V14.0029H119.374L117.477 15.2209C117.4 14.2059 117.156 13.3431 116.748 12.6325C116.359 11.922 115.824 11.3739 115.143 10.9881C114.462 10.6024 113.665 10.4096 112.751 10.4096C111.759 10.4096 110.893 10.6227 110.154 11.0491C109.434 11.4551 108.87 12.0337 108.462 12.7848C108.072 13.5156 107.878 14.3784 107.878 15.3732C107.878 16.571 108.131 17.5962 108.637 18.4488C109.142 19.3015 109.882 19.9511 110.854 20.3977C111.827 20.8443 113.004 21.0677 114.385 21.0677C115.63 21.0677 116.884 20.8849 118.149 20.5195C119.413 20.1338 120.551 19.5958 121.562 18.9056V22.3162C120.473 23.1282 119.199 23.7677 117.74 24.2346C116.301 24.6813 114.774 24.9046 113.159 24.9046Z" /><path d="M79.1522 6.44105L75.4861 19.5566L75.1082 21.1541C75.0704 21.3513 75.0515 21.496 75.0515 21.588C75.0515 21.7458 75.1019 21.8838 75.2027 22.0022C75.3161 22.1205 75.4294 22.1797 75.5428 22.1797C75.8074 22.1797 76.1727 21.9693 76.6389 21.5485C76.8279 21.3776 77.2814 20.7728 77.9995 19.7341L78.6609 20.0891C77.7664 21.7984 76.809 23.0475 75.7885 23.8364C74.7806 24.6121 73.6909 25 72.5192 25C71.8011 25 71.2531 24.8093 70.8751 24.428C70.4972 24.0336 70.3082 23.5405 70.3082 22.9489C70.3082 22.4361 70.5098 21.4828 70.9129 20.0891L71.3665 18.4915C69.9051 21.1081 68.5004 22.962 67.1523 24.0533C66.3712 24.6844 65.5397 25 64.6579 25C63.4988 25 62.661 24.5069 62.1445 23.5208C61.628 22.5215 61.3697 21.3973 61.3697 20.1482C61.3697 18.2943 61.9114 16.1709 62.9949 13.7778C64.0783 11.3717 65.502 9.43888 67.2657 7.97941C68.7145 6.76976 70.0751 6.16493 71.3476 6.16493C72.0531 6.16493 72.62 6.38188 73.0484 6.81577C73.4767 7.23652 73.7917 8.01228 73.9932 9.14304L74.6735 6.71716L79.1522 6.44105ZM73.105 10.1883C73.105 9.12332 72.9476 8.35414 72.6326 7.88079C72.4058 7.55208 72.0972 7.38773 71.7066 7.38773C71.3161 7.38773 70.9129 7.58496 70.4972 7.97941C69.6531 8.79461 68.7397 10.4513 67.7571 12.9495C66.787 15.4345 66.3019 17.5843 66.3019 19.3988C66.3019 20.0956 66.409 20.6019 66.6232 20.9174C66.85 21.2198 67.0956 21.371 67.3602 21.371C67.9271 21.371 68.5004 21.0292 69.0799 20.3455C69.9114 19.3725 70.661 18.1826 71.3287 16.7757C72.5129 14.3038 73.105 12.108 73.105 10.1883Z" /></svg>`;
	//#endregion
	//#region src/ui/ArtistInfo.js
	var ArtistInfoSectionRenderer = class ArtistInfoSectionRenderer {
		static badges = {
			pride: {
				textKey: "trust.pride",
				icon: crownSvg,
				bg: "#264b61"
			},
			base: {
				textKey: "trust.base",
				icon: starSvg,
				bg: "#553995"
			},
			approved: {
				textKey: "trust.approved",
				icon: thumbsUpSvg,
				bg: "#23593e"
			},
			warning: {
				textKey: "trust.warning",
				icon: warningSvg,
				bg: "#77471e"
			},
			blocked: {
				textKey: "trust.blocked",
				icon: banSvg,
				bg: "#723433"
			},
			unknown: {
				textKey: "trust.unknown",
				icon: unknownSvg,
				bg: "#2f2f2f"
			},
			noInfo: {
				textKey: "trust.noInfo",
				icon: unknownSvg,
				bg: "#2f2f2f"
			},
			blockedDistributor: {
				textKey: "trust.blockedDistributor",
				icon: banSvg,
				bg: "#723433"
			}
		};
		static createArtistInfoSection(artist) {
			const section = document.createElement("div");
			section.classList.add("basify-artist-info-section");
			const countriesRow = document.createElement("div");
			countriesRow.classList.add("basify-countries-row");
			const badgesRow = document.createElement("div");
			badgesRow.classList.add("basify-badges-row");
			Object.assign(section.style, {
				display: "flex",
				alignItems: "center",
				gap: "12px",
				marginTop: "4px",
				flexWrap: "nowrap",
				width: "100%",
				maxWidth: "100%",
				overflow: "hidden"
			});
			[countriesRow, badgesRow].forEach((row) => {
				Object.assign(row.style, {
					display: "flex",
					alignItems: "center",
					gap: "8px",
					flexWrap: "wrap"
				});
			});
			if (artist.countries.length) artist.countries.forEach((country) => {
				countriesRow.appendChild(ArtistInfoSectionRenderer.createCountryBadge(country));
			});
			else countriesRow.appendChild(ArtistInfoSectionRenderer.createSimpleTag(BasifyI18n.t("unknownOrigin")));
			if (artist.labels.length) artist.labels.forEach((label) => {
				badgesRow.appendChild(ArtistInfoSectionRenderer.createTrustBadge(label, artist));
			});
			else badgesRow.appendChild(ArtistInfoSectionRenderer.createTrustBadge("noInfo", artist));
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
				whiteSpace: "nowrap"
			});
			const settings = LocalStorageManager.getSettings();
			badge.appendChild(country.flagImg(settings.emojiFlags, 0, 18, 24));
			const name = document.createElement("span");
			name.textContent = BasifyI18n.countryName(country.countryCode);
			badge.appendChild(name);
			return badge;
		}
		static createTrustBadge(type, artist = null) {
			const badgeData = ArtistInfoSectionRenderer.badges[type] ?? ArtistInfoSectionRenderer.badges.noInfo;
			const badge = document.createElement("span");
			badge.classList.add("basify-trust-badge");
			badge.dataset.type = type;
			badge.innerHTML = `<span>${BasifyI18n.t(badgeData.textKey)}</span>${badgeData.icon}`;
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
				transition: "transform 0.1s ease"
			});
			if (artist && type !== "approved") {
				const description = LocalStorageManager.getSettings().locale === "uk" ? artist.description : artist.descriptionEn;
				if (description) {
					badge.style.cursor = "pointer";
					badge.addEventListener("mouseenter", () => {
						badge.style.transform = "scale(1.04)";
					});
					badge.addEventListener("mouseleave", () => {
						badge.style.transform = "scale(1)";
					});
					badge.addEventListener("click", () => {
						Spicetify.PopupModal.display({
							title: artist.name,
							content: `
              <div style="
                padding: 24px;
                color: #ffffff;
                background: linear-gradient(
                  180deg,
                  color-mix(in srgb, ${badgeData.bg} 28%, #121212) 0%,
                  #121212 72%
                );
                border: 1px solid color-mix(in srgb, ${badgeData.bg} 55%, transparent);
                border-radius: 18px;
                box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
              ">
                <div style="
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  padding: 10px 15px;
                  margin-bottom: 20px;
                  border-radius: 999px;
                  background: color-mix(in srgb, ${badgeData.bg} 25%, transparent);
                  color: color-mix(in srgb, ${badgeData.bg} 50%, White);
                  font-size: 17px;
                  font-weight: 800;
                  line-height: 1;
                ">
                  <span style="display: inline-flex; align-items: center;">
                    ${BasifyI18n.t(badgeData.textKey)}
                  </span>
                  <span style="
                    display: inline-flex;
                    align-items: center;
                    line-height: 1;
                    transform: translateY(1px);
                  ">
                    ${badgeData.icon.replace(/margin-left:\s*6px;?/g, "").replace(/width="20"/g, "width=\"24\"").replace(/height="20"/g, "height=\"24\"")}
                  </span>
                </div>

                <div style="
                  height: 1px;
                  margin-bottom: 18px;
                  background: color-mix(in srgb, ${badgeData.bg} 45%, transparent);
                "></div>

                <p style="
                  margin: 0;
                  color: #d6d6d6;
                  font-size: 15px;
                  font-weight: 500;
                  line-height: 1.65;
                  white-space: pre-wrap;
                ">${description.charAt(0).toUpperCase() + description.slice(1)}</p>
              </div>
            `
						});
					});
				}
			}
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
				whiteSpace: "nowrap"
			});
			return tag;
		}
		static createInfoSeparator() {
			const separator = document.createElement("span");
			separator.classList.add("basify-info-separator");
			Object.assign(separator.style, {
				width: "1px",
				height: "100%",
				background: "rgba(255, 255, 255, 0.35)",
				minHeight: "24px"
			});
			return separator;
		}
	};
	//#endregion
	//#region src/ui/SkipToast.js
	var SkipToastRenderer = class SkipToastRenderer {
		static styleElementId = "basify-skip-toast-style";
		static containerClassName = "basify-skip-toast-container";
		static toastTimeouts = /* @__PURE__ */ new WeakMap();
		static async show(track) {
			if (!LocalStorageManager.getSettings().popupEnabled) return;
			SkipToastRenderer.injectStyles();
			const dominantColor = await track.getDominantColor();
			const container = SkipToastRenderer.createContainer();
			const toast = SkipToastRenderer.createToast(track, dominantColor);
			toast.dataset.createdAt = String(Date.now());
			SkipToastRenderer.removeExtraToastsBeforeAppend(container);
			container.appendChild(toast);
			SkipToastRenderer.updateToastStack(container);
			requestAnimationFrame(() => {
				toast.classList.add("is-visible");
			});
			SkipToastRenderer.scheduleToastRemoval(toast);
		}
		static scheduleToastRemoval(toast) {
			const existingTimeoutId = SkipToastRenderer.toastTimeouts.get(toast);
			if (existingTimeoutId) clearTimeout(existingTimeoutId);
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
			const container = document.querySelector(`.${SkipToastRenderer.containerClassName}`);
			if (!container) return;
			if (Object.hasOwn(changedSettings, "popupDurationMs")) Array.from(container.querySelectorAll(".basify-skip-toast")).forEach((toast) => {
				SkipToastRenderer.scheduleToastRemoval(toast);
			});
			if (Object.hasOwn(changedSettings, "visibleToastLimit")) {
				SkipToastRenderer.removeExtraToastsBeforeAppend(container);
				SkipToastRenderer.updateToastStack(container);
			}
		}
		static removeExtraToastsBeforeAppend(container) {
			const maxToastCount = SkipToastRenderer.getVisibleToastLimit() + 1;
			const toasts = Array.from(container.querySelectorAll(".basify-skip-toast"));
			while (toasts.length >= maxToastCount) {
				const oldestToast = toasts.shift();
				SkipToastRenderer.removeToast(oldestToast, false);
			}
		}
		static updateToastStack(container) {
			const visibleToastLimit = SkipToastRenderer.getVisibleToastLimit();
			const toasts = Array.from(container.querySelectorAll(".basify-skip-toast"));
			toasts.forEach((toast) => {
				toast.classList.remove("is-fading-away");
			});
			if (toasts.length > visibleToastLimit) toasts[0].classList.add("is-fading-away");
		}
		static createContainer() {
			let container = document.querySelector(`.${SkipToastRenderer.containerClassName}`);
			if (container) return container;
			container = document.createElement("div");
			container.className = SkipToastRenderer.containerClassName;
			document.body.appendChild(container);
			return container;
		}
		static createToast(track, dominantColor) {
			const toast = document.createElement("div");
			toast.className = "basify-skip-toast";
			SkipToastRenderer.applyDominantColorBackground(toast, dominantColor);
			const header = document.createElement("div");
			header.className = "basify-skip-toast-header";
			const title = document.createElement("div");
			title.className = "basify-skip-toast-title";
			title.textContent = BasifyI18n.t("trackSkipped");
			const closeButton = document.createElement("button");
			closeButton.className = "basify-skip-toast-close";
			closeButton.type = "button";
			closeButton.textContent = "×";
			closeButton.addEventListener("click", () => {
				SkipToastRenderer.removeToast(toast);
			});
			header.append(title, closeButton);
			const trackName = document.createElement("button");
			trackName.className = "basify-skip-toast-track";
			trackName.type = "button";
			trackName.textContent = track.name;
			if (track.id) trackName.addEventListener("click", (event) => {
				event.stopPropagation();
				Spicetify.Platform.History.push(`/track/${track.id}`);
			});
			const artistsWrapper = document.createElement("div");
			artistsWrapper.className = "basify-skip-toast-artists";
			track.getSkipReasons().forEach((reason) => {
				if (reason.type === "distributor") {
					artistsWrapper.appendChild(SkipToastRenderer.createDistributorReasonRow(reason.name, reason.label));
					return;
				}
				artistsWrapper.appendChild(SkipToastRenderer.createArtistReasonRow(reason.artist, [reason.label]));
			});
			toast.append(header, trackName, artistsWrapper);
			return toast;
		}
		static applyDominantColorBackground(toast, dominantColor) {
			if (!dominantColor) return;
			toast.style.background = `linear-gradient(180deg, ${dominantColor} 0%, color-mix(in srgb, ${dominantColor} 45%, var(--spice-card, #181818)) 30%, var(--spice-card, #181818) 80%)`;
			toast.style.backgroundClip = "padding-box";
		}
		static createArtistReasonRow(artist, labels) {
			const row = document.createElement("div");
			row.className = "basify-skip-toast-artist-row";
			const artistName = document.createElement("button");
			artistName.className = "basify-skip-toast-artist-name";
			artistName.type = "button";
			artistName.textContent = artist?.name || BasifyI18n.t("unknownArtist");
			if (artist?.id) artistName.addEventListener("click", (event) => {
				event.stopPropagation();
				Spicetify.Platform.History.push(`/artist/${artist.id}`);
			});
			const badgesWrapper = document.createElement("div");
			badgesWrapper.className = "basify-skip-toast-badges";
			[...new Set(labels)].forEach((label) => {
				const badge = ArtistInfoSectionRenderer.createTrustBadge(label, artist);
				badge.classList.add("basify-skip-toast-badge");
				badgesWrapper.appendChild(badge);
			});
			row.append(artistName, badgesWrapper);
			return row;
		}
		static createDistributorReasonRow(distributorName, label) {
			const row = document.createElement("div");
			row.className = "basify-skip-toast-artist-row";
			const distributor = document.createElement("div");
			distributor.className = "basify-skip-toast-distributor-name";
			distributor.textContent = distributorName || BasifyI18n.t("unknownDistributor");
			const badgesWrapper = document.createElement("div");
			badgesWrapper.className = "basify-skip-toast-badges";
			const badge = ArtistInfoSectionRenderer.createTrustBadge(label);
			badge.classList.add("basify-skip-toast-badge");
			badgesWrapper.appendChild(badge);
			row.append(distributor, badgesWrapper);
			return row;
		}
		static getToastDurationMs() {
			const settings = LocalStorageManager.getSettings();
			return Number(settings.popupDurationMs) || 1e4;
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
				if (container?.children.length) SkipToastRenderer.updateToastStack(container);
				else container?.remove();
				return;
			}
			toast.classList.remove("is-visible");
			toast.classList.add("is-removing");
			setTimeout(() => {
				toast.remove();
				if (container?.children.length) SkipToastRenderer.updateToastStack(container);
				else container?.remove();
			}, 200);
		}
		static clearAll() {
			const container = document.querySelector(`.${SkipToastRenderer.containerClassName}`);
			if (!container) return;
			container.querySelectorAll(".basify-skip-toast").forEach((toast) => {
				SkipToastRenderer.removeToast(toast, false);
			});
			container.remove();
		}
		static injectStyles() {
			if (document.getElementById(SkipToastRenderer.styleElementId)) return;
			const style = document.createElement("style");
			style.id = SkipToastRenderer.styleElementId;
			style.textContent = `
      .basify-skip-toast-container { position: fixed; right: 24px; bottom: 112px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; width: fit-content; min-width: 350px; max-width: min(720px, calc(100vw - 48px)); pointer-events: none; }
      .basify-skip-toast { display: flex; flex-direction: column; width: fit-content; gap: 12px; padding: 16px; border-radius: 12px; background: var(--spice-card, #181818); color: var(--spice-text, #ffffff); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.12); opacity: 0; transform: translateY(12px) scale(0.98); transition: opacity 0.2s ease, transform 0.2s ease; pointer-events: auto; overflow: hidden; }
      .basify-skip-toast.is-visible { opacity: 1; transform: translateY(0) scale(1); }
      .basify-skip-toast.is-removing { opacity: 0; transform: translateY(12px) scale(0.98); }
      .basify-skip-toast.is-fading-away { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, transparent 32%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.7) 58%, black 68%, black 100%); mask-image: linear-gradient(to bottom, transparent 0%, transparent 32%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.7) 58%, black 68%, black 100%); }
      .basify-skip-toast-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .basify-skip-toast-title { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45); font-size: 13px; font-weight: 700; color: var(--spice-subtext, #b3b3b3); text-transform: uppercase; letter-spacing: 0.04em; }
      .basify-skip-toast-close { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: 0; border-radius: 50%; background: transparent; color: var(--spice-subtext, #b3b3b3); font-size: 22px; line-height: 1; cursor: pointer; }
      .basify-skip-toast-close:hover { background: rgba(255, 255, 255, 0.08); color: var(--spice-text, #ffffff); }
      .basify-skip-toast-track { border: 0; padding: 0; background: transparent; color: var(--spice-text, #ffffff); font-size: 18px; font-weight: 800; line-height: 1.25; text-align: left; cursor: pointer; }
      .basify-skip-toast-track:hover { color: var(--spice-button, #1ed760); text-decoration: underline; }
      .basify-skip-toast-artists { display: flex; flex-direction: column; gap: 10px; }
      .basify-skip-toast-artist-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px; border-radius: 8px; background: rgba(255, 255, 255, 0.06); }
      .basify-skip-toast-artist-name { min-width: 0; flex: 1; border: 0; padding: 0; background: transparent; color: var(--spice-text, #ffffff); font-size: 14px; font-weight: 800; text-align: left; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
      .basify-skip-toast-artist-name:hover { color: var(--spice-button, #1ed760); text-decoration: underline; }
      .basify-skip-toast-distributor-name { min-width: 0; flex: 1; color: var(--spice-text, #ffffff); font-size: 14px; font-weight: 800; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .basify-skip-toast-badges { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; flex: 0 0 auto; }
      .basify-skip-toast-badge { font-size: 12px !important; padding: 5px 8px !important; }
      .basify-skip-toast-badge svg { width: 16px !important; height: 16px !important; }
      .basify-skip-toast-list-container::-webkit-scrollbar { width: 4px; }
      .basify-skip-toast-list-container::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }
    `;
			document.head.appendChild(style);
		}
	};
	//#endregion
	//#region src/state/runtimeState.js
	var NowPlayingRuntimeState = class NowPlayingRuntimeState {
		static track = null;
		static artistSpans = null;
		static update(track, artistSpans = null) {
			NowPlayingRuntimeState.track = track;
			NowPlayingRuntimeState.artistSpans = artistSpans;
		}
	};
	//#endregion
	//#region src/ui/ThemeOverlay.js
	var NowPlayingThemeOverlayRenderer = class NowPlayingThemeOverlayRenderer {
		static styleElementId = "basify-now-playing-theme-overlay-style";
		static overlayElementId = "basify-now-playing-theme-overlay";
		static applyFromTrack(track) {
			if (!LocalStorageManager.getSettings().formatNowPlayingBar) {
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
			let overlay = nowPlayingBar.querySelector(`#${NowPlayingThemeOverlayRenderer.overlayElementId}`);
			if (!overlay) {
				overlay = document.createElement("div");
				overlay.id = NowPlayingThemeOverlayRenderer.overlayElementId;
				overlay.setAttribute("aria-hidden", "true");
				nowPlayingBar.prepend(overlay);
			}
			overlay.dataset.status = themeStatus;
			overlay.style.setProperty("--basify-now-playing-color", themeColor);
		}
		static clear() {
			document.getElementById(NowPlayingThemeOverlayRenderer.overlayElementId)?.remove();
		}
		static getNowPlayingBar() {
			return document.querySelector("div.Root__now-playing-bar");
		}
		static injectStyles() {
			if (document.getElementById(NowPlayingThemeOverlayRenderer.styleElementId)) return;
			const style = document.createElement("style");
			style.id = NowPlayingThemeOverlayRenderer.styleElementId;
			style.textContent = `
      .Root__now-playing-bar { position: relative; isolation: isolate; overflow: hidden; }
      .Root__now-playing-bar #basify-now-playing-theme-overlay { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.82; mix-blend-mode: screen; contain: strict; background: radial-gradient(circle at left center, color-mix(in srgb, var(--basify-now-playing-color) 95%, transparent) 0%, color-mix(in srgb, var(--basify-now-playing-color) 75%, transparent) 8%, transparent 22%), radial-gradient(circle at right center, color-mix(in srgb, var(--basify-now-playing-color) 95%, transparent) 0%, color-mix(in srgb, var(--basify-now-playing-color) 75%, transparent) 8%, transparent 22%), linear-gradient(90deg, color-mix(in srgb, var(--basify-now-playing-color) 45%, transparent) 0%, transparent 28%, transparent 72%, color-mix(in srgb, var(--basify-now-playing-color) 45%, transparent) 100%); }
      .Root__now-playing-bar > :not(#basify-now-playing-theme-overlay) { position: relative; z-index: 1; }
      .Root__now-playing-bar #basify-now-playing-theme-overlay[data-status="approved"], .Root__now-playing-bar #basify-now-playing-theme-overlay[data-status="pride"], .Root__now-playing-bar #basify-now-playing-theme-overlay[data-status="base"] { opacity: 0.68; }
      .Root__now-playing-bar #basify-now-playing-theme-overlay[data-status="unknown"], .Root__now-playing-bar #basify-now-playing-theme-overlay[data-status="noInfo"] { opacity: 0.58; }
    `;
			document.head.appendChild(style);
		}
	};
	//#endregion
	//#region src/models/Country.js
	var Country = class Country {
		constructor(name, emoji, countryCode = null) {
			this.name = name;
			this.emoji = emoji;
			this.countryCode = countryCode ? countryCode : this.emojiToCountryCode(emoji);
		}
		emojiToCountryCode(emoji) {
			return Array.from(emoji).map((c) => String.fromCharCode(c.codePointAt(0) - 127397)).join("").toLowerCase();
		}
		flagImg(useEmojiFlag = true, marginLeft = 0, height = 12, width = 16) {
			const img = document.createElement("img");
			img.src = useEmojiFlag ? `https://flagcdn.com/${width}x${height}/${this.countryCode}.png` : `https://flagcdn.com/h${Country.getClosestFlagHeight(height)}/${this.countryCode}.png`;
			img.alt = this.countryCode;
			img.style.marginLeft = `${marginLeft}px`;
			img.style.verticalAlign = "middle";
			img.style.width = `${width}px`;
			img.style.height = `${height}px`;
			return img;
		}
		static getClosestFlagHeight(height) {
			return [
				20,
				24,
				40,
				60,
				80,
				120,
				240
			].reduce((closestHeight, currentHeight) => {
				const closestDifference = Math.abs(closestHeight - height);
				return Math.abs(currentHeight - height) < closestDifference ? currentHeight : closestHeight;
			});
		}
	};
	//#endregion
	//#region src/models/Artist.js
	var Artist = class Artist {
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
				if (!cachedArtistData.name && fallbackName) cachedArtistData.name = fallbackName;
				return new Artist(await LocalStorageManager.markArtistUsed(artistId) || cachedArtistData);
			}
			const fetchedArtistData = await Artist.fetch(artistId, fallbackName);
			return new Artist(await LocalStorageManager.saveArtist(fetchedArtistData));
		}
		static async fetch(artistId, fallbackName = null) {
			const artistURL = Artist.baseArtistURL + artistId;
			const requestURL = Artist.apiURL + encodeURIComponent(artistURL);
			try {
				const artistItem = (await Spicetify.CosmosAsync.get(requestURL))?.data?.items?.[0];
				if (!artistItem) return {
					id: artistId,
					name: fallbackName,
					url: artistURL,
					countries: [],
					labels: [],
					description: null,
					descriptionEn: null
				};
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
		}
	};
	//#endregion
	//#region src/ui/NowPlayingArtist.js
	var NowPlayingArtistRenderer = class NowPlayingArtistRenderer {
		static styleElementId = "basify-now-playing-artist-style";
		static labelPriority = [
			"blocked",
			"warning",
			"unknown",
			"pride",
			"base",
			"approved",
			"noInfo"
		];
		static statusStyles = {
			blocked: {
				color: "#ff4d4d",
				shape: "square"
			},
			warning: {
				color: "#f5c542",
				shape: "triangle"
			},
			approved: {
				color: "#1ed760",
				shape: "circle"
			},
			pride: {
				color: "#4aa3df",
				shape: "crown"
			},
			base: {
				color: "#8f6cff",
				shape: "star"
			},
			unknown: {
				color: "#b3b3b3",
				shape: "world"
			},
			noInfo: {
				color: "#8a8a8a",
				shape: "world"
			}
		};
		static statusIcons = {
			crown: crownSvg,
			star: starSvg,
			world: unknownSvg
		};
		static render(basifyTrack, artistSpans) {
			const settings = LocalStorageManager.getSettings();
			NowPlayingArtistRenderer.injectStyles();
			NowPlayingArtistRenderer.renderArtistSpanGroup(artistSpans.bottomBarArtistSpans, basifyTrack.artists, settings);
			NowPlayingArtistRenderer.renderArtistSpanGroup(artistSpans.sideViewArtistSpans, basifyTrack.artists, settings);
		}
		static renderArtistSpanGroup(artistSpansById, artists, settings) {
			Object.entries(artistSpansById).forEach(([artistId, artistSpan]) => {
				const artist = artists.find((trackArtist) => trackArtist.id === artistId);
				NowPlayingArtistRenderer.resetArtistSpan(artistSpan);
				if (!artist) return;
				const dominantLabel = NowPlayingArtistRenderer.getDominantArtistLabel(artist);
				const statusStyle = NowPlayingArtistRenderer.statusStyles[dominantLabel];
				const artistLink = artistSpan.querySelector("a") || artistSpan;
				if (settings.formatNowPlayingArtistName && statusStyle?.color) {
					artistLink.classList.add("basify-now-playing-artist-name");
					artistLink.style.setProperty("--basify-artist-status-color", statusStyle.color);
				}
				if (settings.showNowPlayingArtistStatusShape && statusStyle) artistSpan.appendChild(NowPlayingArtistRenderer.createStatusShape(dominantLabel));
				if (settings.showNowPlayingArtistFlags && artist.countries.length) artist.countries.forEach((country) => {
					const flagElement = country.flagImg(settings.emojiFlags, 4, 12, 16);
					flagElement.classList.add("basify-artist-flag");
					artistSpan.appendChild(flagElement);
				});
			});
		}
		static resetArtistSpan(artistSpan) {
			artistSpan.querySelectorAll(".basify-artist-flag").forEach((flag) => flag.remove());
			artistSpan.querySelectorAll(".basify-artist-status-shape").forEach((shape) => shape.remove());
			const artistLink = artistSpan.querySelector("a") || artistSpan;
			artistLink.classList.remove("basify-now-playing-artist-name");
			artistLink.style.removeProperty("--basify-artist-status-color");
		}
		static getDominantArtistLabel(artist) {
			const labels = artist.labels.length ? artist.labels : ["noInfo"];
			return NowPlayingArtistRenderer.labelPriority.find((label) => labels.includes(label)) || "noInfo";
		}
		static createStatusShape(label) {
			const statusStyle = NowPlayingArtistRenderer.statusStyles[label] || NowPlayingArtistRenderer.statusStyles.noInfo;
			const shape = document.createElement("span");
			shape.classList.add("basify-artist-status-shape");
			shape.dataset.status = label;
			shape.dataset.shape = statusStyle.shape;
			shape.style.setProperty("--basify-artist-status-color", statusStyle.color);
			const iconSvg = NowPlayingArtistRenderer.statusIcons[statusStyle.shape];
			if (iconSvg) shape.innerHTML = iconSvg;
			return shape;
		}
		static injectStyles() {
			if (document.getElementById(NowPlayingArtistRenderer.styleElementId)) return;
			const style = document.createElement("style");
			style.id = NowPlayingArtistRenderer.styleElementId;
			style.textContent = `
      .basify-now-playing-artist-name { color: var(--basify-artist-status-color) !important; }
      .basify-artist-flag { margin-bottom: 2px; }
      .basify-artist-status-shape { display: inline-block; margin-left: 4px; vertical-align: middle; flex: 0 0 auto; }
      .basify-artist-status-shape[data-shape="square"] { width: 10px; height: 10px; border-radius: 2px; background: var(--basify-artist-status-color); }
      .basify-artist-status-shape[data-shape="circle"] { width: 10px; height: 10px; border-radius: 50%; background: var(--basify-artist-status-color); margin-bottom: 3px; }
      .basify-artist-status-shape[data-shape="triangle"] { width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 10px solid var(--basify-artist-status-color); margin-bottom: 4px; }
      .basify-artist-status-shape[data-shape="crown"], .basify-artist-status-shape[data-shape="star"], .basify-artist-status-shape[data-shape="world"] { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; color: var(--basify-artist-status-color); margin-bottom: 2px; }
      .basify-artist-status-shape[data-shape="crown"] svg, .basify-artist-status-shape[data-shape="star"] svg, .basify-artist-status-shape[data-shape="world"] svg { width: 14px; height: 14px; margin-left: 0 !important; }
    `;
			document.head.appendChild(style);
		}
	};
	//#endregion
	//#region src/utils/domObserver.js
	var DomObserver = class DomObserver {
		static async waitUntil(conditionCallback, timeoutMs = 5e3, intervalMs = 100) {
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
							reject(/* @__PURE__ */ new Error("Basify waitUntil timed out"));
						}
					} catch (error) {
						clearInterval(intervalId);
						reject(error);
					}
				}, intervalMs);
			});
		}
		static async waitForElement(selector, timeoutMs = 5e3) {
			return DomObserver.waitUntil(() => document.querySelector(selector), timeoutMs);
		}
		static async waitForNowPlayingArtistSpans(track, timeoutMs = 5e3) {
			return DomObserver.waitUntil(() => {
				const bottomBarArtistsContainer = document.querySelector("div.Root__now-playing-bar div.main-nowPlayingBar-left div.main-trackInfo-artists span.OINH5zA0pQyzffwo");
				const sideViewArtistsContainer = document.querySelector("div.Root__right-sidebar div.main-nowPlayingView-nowPlayingWidget div.main-trackInfo-artists span.OINH5zA0pQyzffwo");
				if (!bottomBarArtistsContainer) return null;
				const trackArtistIds = (track?.artists || []).map((artist) => artist.uri.split(":")[2]);
				const bottomBarArtistSpansById = DomObserver.extractArtistDataFromContainer(bottomBarArtistsContainer);
				if (!DomObserver.haveSameArtistIds(Object.keys(bottomBarArtistSpansById), trackArtistIds)) return null;
				let sideViewArtistSpansById = {};
				if (sideViewArtistsContainer) {
					sideViewArtistSpansById = DomObserver.extractArtistDataFromContainer(sideViewArtistsContainer);
					if (!DomObserver.haveSameArtistIds(Object.keys(sideViewArtistSpansById), trackArtistIds)) return null;
				}
				return {
					bottomBarArtistSpans: bottomBarArtistSpansById,
					sideViewArtistSpans: sideViewArtistSpansById
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
			if (firstArtistIds.length !== secondArtistIds.length) return false;
			const sortedFirstArtistIds = [...firstArtistIds].sort();
			const sortedSecondArtistIds = [...secondArtistIds].sort();
			return sortedFirstArtistIds.every((artistId, index) => artistId === sortedSecondArtistIds[index]);
		}
		static async waitForArtistPageHeaderElement(artistId, timeoutMs = 5e3) {
			return DomObserver.waitUntil(() => {
				const headerTitleElement = document.querySelector(".main-entityHeader-imageContainerWrapper");
				if (!headerTitleElement) return null;
				if (Spicetify.Platform.History.location.pathname.split("/")[2] !== artistId) return null;
				return headerTitleElement;
			}, timeoutMs);
		}
	};
	//#endregion
	//#region src/ui/PlaylistView.js
	var PlaylistViewRenderer = class PlaylistViewRenderer {
		static styleElementId = "basify-playlist-view-style";
		static observer = null;
		static eventsRegistered = false;
		static start() {
			PlaylistViewRenderer.injectStyles();
			PlaylistViewRenderer.registerGlobalInterceptors();
			if (PlaylistViewRenderer.observer) PlaylistViewRenderer.observer.disconnect();
			PlaylistViewRenderer.observer = new MutationObserver(() => {
				PlaylistViewRenderer.scanRows();
			});
			const mainView = document.querySelector(".main-view-container");
			if (mainView) {
				PlaylistViewRenderer.observer.observe(mainView, {
					childList: true,
					subtree: true
				});
				PlaylistViewRenderer.scanRows();
			}
		}
		static registerGlobalInterceptors() {
			if (PlaylistViewRenderer.eventsRegistered) return;
			PlaylistViewRenderer.eventsRegistered = true;
			document.addEventListener("dblclick", (e) => {
				if (!LocalStorageManager.getSettings().skipEnabled) return;
				if (e.target.closest(".basify-blocked-row")) {
					e.stopPropagation();
					e.preventDefault();
				}
			}, true);
			document.addEventListener("click", (e) => {
				if (!LocalStorageManager.getSettings().skipEnabled) return;
				if (!e.target.closest(".basify-blocked-row")) return;
				const playButton = e.target.closest("button[aria-label*=\"Play\"], button[aria-label*=\"play\"]");
				const indexCell = e.target.closest(".main-trackList-rowSectionIndex");
				if (playButton || indexCell) {
					e.stopPropagation();
					e.preventDefault();
				}
			}, true);
		}
		static async calculatePlaylistRating(playlistId) {
			try {
				const playlistUri = "spotify:playlist:" + playlistId;
				let allTracks = [];
				let offset = 0;
				const limit = 100;
				let hasMore = true;
				console.log(`[Basify] Requesting metadata for playlist: ${playlistId}`);
				while (hasMore) {
					const contents = await Spicetify.Platform.PlaylistAPI.getContents(playlistUri, {
						offset,
						limit
					}).catch(() => null);
					if (!contents || !contents.items || contents.items.length === 0) {
						hasMore = false;
						break;
					}
					allTracks = allTracks.concat(contents.items);
					offset += limit;
					if (contents.items.length < limit) hasMore = false;
				}
				if (allTracks.length === 0) {
					console.warn("[Basify] PlaylistAPI returned no tracks, trying fallback.");
					return null;
				}
				console.log(`[Basify] Loaded ${allTracks.length} tracks. Extracting artists...`);
				const uniqueArtistIds = /* @__PURE__ */ new Set();
				allTracks.forEach((item) => {
					const trackData = item.track || item;
					if (!trackData) return;
					(trackData.artists || []).forEach((artist) => {
						const id = artist.uri?.split?.(":")?.[2];
						if (id) uniqueArtistIds.add(id);
					});
				});
				const artistIdsArray = Array.from(uniqueArtistIds);
				console.log(`[Basify] Found ${artistIdsArray.length} unique artists. Resolving...`);
				const artists = await Promise.all(artistIdsArray.map((id) => Artist.create(id)));
				const blockedArtistIds = /* @__PURE__ */ new Set();
				artists.forEach((artist) => {
					if ((artist.labels || []).includes("blocked")) blockedArtistIds.add(artist.id);
				});
				let blockedCount = 0;
				allTracks.forEach((item) => {
					const trackData = item.track || item;
					if (!trackData) return;
					if ((trackData.artists || []).some((artist) => {
						const id = artist.uri?.split?.(":")?.[2];
						return blockedArtistIds.has(id);
					})) blockedCount++;
				});
				const percentage = allTracks.length > 0 ? Math.round(blockedCount / allTracks.length * 100) : 0;
				console.log(`[Basify] Safety Rating calculated: ${percentage}% (${blockedCount}/${allTracks.length})`);
				return {
					percentage,
					blockedCount,
					totalCount: allTracks.length
				};
			} catch (e) {
				console.error("[Basify] calculatePlaylistRating failed:", e);
				return null;
			}
		}
		static animateCounter(element, targetValue, durationMs = 800) {
			const startTime = performance.now();
			const startValue = 0;
			function update(currentTime) {
				const elapsedTime = currentTime - startTime;
				if (elapsedTime >= durationMs) {
					element.textContent = `${targetValue}%`;
					return;
				}
				const progress = elapsedTime / durationMs;
				const easeProgress = progress * (2 - progress);
				element.textContent = `${Math.round(startValue + easeProgress * (targetValue - startValue))}%`;
				requestAnimationFrame(update);
			}
			requestAnimationFrame(update);
		}
		static async renderRatingCard(playlistId) {
			try {
				if (!LocalStorageManager.getSettings().showPlaylistRating) {
					document.getElementById("basify-playlist-rating-card")?.remove();
					return;
				}
				console.log(`[Basify] Attempting to render rating card for: ${playlistId}`);
				const rating = await PlaylistViewRenderer.calculatePlaylistRating(playlistId);
				if (!rating) return;
				const header = await DomObserver.waitForElement(".main-entityHeader-headerText", 5e3);
				if (!header) {
					console.warn("[Basify] Header text container not found.");
					return;
				}
				document.getElementById("basify-playlist-rating-card")?.remove();
				const card = document.createElement("div");
				card.id = "basify-playlist-rating-card";
				card.className = "basify-playlist-rating-card";
				const dashArray = 126;
				const dashOffset = dashArray - rating.percentage / 100 * dashArray;
				let strokeColor = "#1ed760";
				if (rating.percentage > 9) strokeColor = "#f5c542";
				if (rating.percentage > 29) strokeColor = "#ff4d4d";
				const locale = LocalStorageManager.getSettings().locale;
				const ratingText = locale === "uk" ? "Рейтинг безпеки" : "Safety Rating";
				const subText = locale === "uk" ? `${rating.blockedCount} з ${rating.totalCount} треків заблоковано` : `${rating.blockedCount} of ${rating.totalCount} tracks blocked`;
				card.innerHTML = `
        <div class="basify-gauge-wrapper">
          <svg viewBox="0 0 100 55" width="100" height="55">
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10" stroke-linecap="round" />
            <path class="basify-gauge-fill" d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="${strokeColor}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashArray}" />
          </svg>
          <div class="basify-gauge-percentage">0%</div>
        </div>
        <div class="basify-rating-text-container">
          <div class="basify-rating-title">${ratingText}</div>
          <div class="basify-rating-subtext">${subText}</div>
        </div>
      `;
				header.appendChild(card);
				requestAnimationFrame(() => {
					const fillPath = card.querySelector(".basify-gauge-fill");
					const percentageText = card.querySelector(".basify-gauge-percentage");
					if (fillPath && percentageText) {
						fillPath.style.strokeDashoffset = String(dashOffset);
						PlaylistViewRenderer.animateCounter(percentageText, rating.percentage, 800);
					}
				});
				console.log("[Basify] Rating card successfully injected into DOM.");
			} catch (e) {
				console.error("[Basify] renderRatingCard failed:", e);
			}
		}
		static async scanRows() {
			const rows = document.querySelectorAll("div[role=\"row\"]");
			const settings = LocalStorageManager.getSettings();
			rows.forEach(async (row) => {
				const artistLinks = row.querySelectorAll("a[href^=\"/artist/\"]");
				if (!artistLinks.length) return;
				const artistIds = Array.from(artistLinks).map((link) => link.pathname.split("/")[2]);
				const artistIdsString = artistIds.join(",");
				if (row.dataset.basifyProcessed === artistIdsString) return;
				row.dataset.basifyProcessed = artistIdsString;
				row.classList.remove("basify-blocked-row");
				row.querySelectorAll(".basify-playlist-status-icon-wrapper").forEach((el) => {
					el.removeEventListener("mouseenter", PlaylistViewRenderer.showTooltip);
					el.removeEventListener("mouseleave", PlaylistViewRenderer.hideTooltip);
					el.remove();
				});
				artistLinks.forEach((link) => {
					link.classList.remove("basify-now-playing-artist-name");
					link.style.removeProperty("--basify-artist-status-color");
				});
				try {
					const artists = await Promise.all(artistIds.map((id) => Artist.create(id)));
					let shouldSkipRow = false;
					artists.forEach((artist, index) => {
						const link = artistLinks[index];
						if (!link) return;
						const labels = artist.labels.length ? artist.labels : ["noInfo"];
						const dominantLabel = [
							"blocked",
							"warning",
							"unknown",
							"pride",
							"base",
							"approved",
							"noInfo"
						].find((l) => labels.includes(l)) || "noInfo";
						const statusStyle = NowPlayingArtistRenderer.statusStyles[dominantLabel];
						if (settings.formatNowPlayingArtistName && statusStyle?.color) {
							link.classList.add("basify-now-playing-artist-name");
							link.style.setProperty("--basify-artist-status-color", statusStyle.color);
						}
						if (dominantLabel === "blocked" || dominantLabel === "warning" || dominantLabel === "unknown") {
							const wrapper = document.createElement("span");
							wrapper.className = "basify-playlist-status-icon-wrapper";
							const iconSpan = document.createElement("span");
							iconSpan.className = "basify-playlist-status-icon";
							iconSpan.style.color = statusStyle.color;
							const badgeConfig = ArtistInfoSectionRenderer.badges[dominantLabel] || ArtistInfoSectionRenderer.badges.noInfo;
							const labelText = BasifyI18n.t(badgeConfig.textKey);
							const description = LocalStorageManager.getSettings().locale === "uk" ? artist.description : artist.descriptionEn;
							let tooltipText = `${labelText} (${artist.name})`;
							if (description) tooltipText += ` - ${description}`;
							wrapper.dataset.tooltipText = tooltipText;
							let iconSvg = unknownSvg;
							if (dominantLabel === "blocked") iconSvg = banSvg;
							else if (dominantLabel === "warning") iconSvg = warningSvg;
							iconSpan.innerHTML = iconSvg;
							const svgElement = iconSpan.querySelector("svg");
							if (svgElement) {
								svgElement.setAttribute("width", "12");
								svgElement.setAttribute("height", "12");
								svgElement.style.marginLeft = "0";
							}
							wrapper.appendChild(iconSpan);
							wrapper.addEventListener("mouseenter", PlaylistViewRenderer.showTooltip);
							wrapper.addEventListener("mouseleave", PlaylistViewRenderer.hideTooltip);
							link.parentNode.insertBefore(wrapper, link.nextSibling);
						}
						if (dominantLabel === "blocked") shouldSkipRow = true;
					});
					if (shouldSkipRow && settings.skipEnabled) row.classList.add("basify-blocked-row");
				} catch (e) {
					row.removeAttribute("data-basify-processed");
				}
			});
		}
		static showTooltip(event) {
			const wrapper = event.currentTarget;
			const text = wrapper.dataset.tooltipText;
			if (!text) return;
			let tooltip = document.getElementById("basify-global-tooltip");
			if (!tooltip) {
				tooltip = document.createElement("div");
				tooltip.id = "basify-global-tooltip";
				tooltip.className = "basify-global-tooltip";
				document.body.appendChild(tooltip);
			}
			tooltip.textContent = text;
			const rect = wrapper.getBoundingClientRect();
			tooltip.style.left = `${rect.left + rect.width / 2}px`;
			tooltip.style.top = `${rect.top - 6}px`;
			tooltip.classList.add("is-visible");
		}
		static hideTooltip() {
			const tooltip = document.getElementById("basify-global-tooltip");
			if (tooltip) tooltip.classList.remove("is-visible");
		}
		static injectStyles() {
			if (document.getElementById(PlaylistViewRenderer.styleElementId)) return;
			const style = document.createElement("style");
			style.id = PlaylistViewRenderer.styleElementId;
			style.textContent = `
      .basify-blocked-row {
        opacity: 0.35;
        background: rgba(114, 52, 51, 0.05) !important;
        transition: opacity 0.2s ease;
      }
      .basify-blocked-row:hover {
        opacity: 0.75;
      }
      .basify-playlist-status-icon-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
        margin-left: 4px;
      }
      .basify-playlist-status-icon svg {
        display: block;
      }
      .basify-global-tooltip {
        position: fixed;
        transform: translate(-50%, -100%) scale(0.95);
        background: #282828;
        color: #ffffff;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        max-width: 320px;
        white-space: normal;
        line-height: 1.4;
        text-align: center;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        opacity: 0;
        z-index: 999999 !important;
        pointer-events: none;
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: opacity 0.1s cubic-bezier(0.4, 0, 0.2, 1), transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .basify-global-tooltip.is-visible {
        opacity: 1;
        transform: translate(-50%, -100%) scale(1);
      }
      .basify-playlist-rating-card {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 16px;
        padding: 10px 16px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        width: fit-content;
      }
      .basify-gauge-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 55px;
      }
      .basify-gauge-fill {
        transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .basify-gauge-percentage {
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 15px;
        font-weight: 800;
        color: #ffffff;
      }
      .basify-rating-text-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .basify-rating-title {
        font-size: 12px;
        font-weight: 800;
        color: #ffffff;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .basify-playlist-rating-card .basify-rating-title {
        color: #ffffff !important;
      }
      .basify-rating-subtext {
        font-size: 12px;
        font-weight: 500;
        color: var(--spice-subtext);
      }
    `;
			document.head.appendChild(style);
		}
	};
	//#endregion
	//#region src/ui/SettingsMenu.js
	Spicetify.React;
	var SettingsMenu = class SettingsMenu {
		static button = null;
		static styleElementId = "basify-settings-style";
		static icons = {
			settings: settingsSvg,
			phonkersbaseLogoSvg
		};
		static registerButton() {
			if (SettingsMenu.button) return;
			SettingsMenu.injectStyles();
			SettingsMenu.button = new Spicetify.Topbar.Button(BasifyI18n.t("settingsTitle"), SettingsMenu.icons.settings, SettingsMenu.open, false, false);
			SettingsMenu.applyTopbarButtonClass();
		}
		static applyTopbarButtonClass() {
			requestAnimationFrame(() => {
				const buttonElement = SettingsMenu.button?.element;
				if (!buttonElement) return;
				buttonElement.classList.add("basify-topbar-settings-button-wrapper");
				const innerButton = buttonElement.matches("button, [role='button']") ? buttonElement : buttonElement.querySelector("button, [role='button']");
				if (!innerButton) return;
				innerButton.classList.add("basify-topbar-settings-button");
			});
		}
		static updateLocalizedTitles(locale = BasifyI18n.getLocale()) {
			SettingsMenu.updateButtonTitle(locale);
			SettingsMenu.updateModalTitle(locale);
		}
		static updateButtonTitle(locale = BasifyI18n.getLocale()) {
			const title = BasifyI18n.t("settingsTitle", locale);
			if (!SettingsMenu.button) return;
			SettingsMenu.button.label = title;
			SettingsMenu.button.element?.setAttribute("aria-label", title);
			SettingsMenu.button.element?.setAttribute("title", title);
			SettingsMenu.button.tippy?.setContent?.(title);
			SettingsMenu.button.tippy?.setProps?.({ content: title });
		}
		static updateModalTitle(locale = BasifyI18n.getLocale()) {
			const title = BasifyI18n.t("settingsTitle", locale);
			requestAnimationFrame(() => {
				const settingsRoot = document.querySelector(".basify-settings-react-root");
				if (!settingsRoot) return;
				const modal = settingsRoot.closest("[role=\"dialog\"]") || settingsRoot.closest("[class*=\"Modal\"]") || document.querySelector("[role=\"dialog\"]");
				if (!modal) return;
				const titleElement = Array.from(modal.querySelectorAll("h1, [class*=\"Title\"], [class*=\"title\"]")).find((element) => !settingsRoot.contains(element));
				if (!titleElement) return;
				titleElement.textContent = title;
			});
		}
		static open() {
			const container = document.createElement("div");
			container.className = "basify-settings-react-root";
			Spicetify.PopupModal.display({
				title: BasifyI18n.t("settingsTitle"),
				content: container,
				isLarge: true
			});
			const React = Spicetify.React;
			Spicetify.ReactDOM.render(React.createElement(SettingsMenu.Component), container);
		}
		static async applyRuntimeSettings(settings, changedSettings = {}) {
			const emojiFlagsChanged = Object.hasOwn(changedSettings, "emojiFlags");
			const localeChanged = Object.hasOwn(changedSettings, "locale");
			SkipToastRenderer.applySettings(settings, changedSettings);
			if (localeChanged) SettingsMenu.updateLocalizedTitles(settings.locale);
			const track = NowPlayingRuntimeState.track;
			if (Object.hasOwn(changedSettings, "formatNowPlayingBar") || Object.hasOwn(changedSettings, "formatNowPlayingArtistName") || Object.hasOwn(changedSettings, "showNowPlayingArtistStatusShape") || Object.hasOwn(changedSettings, "showNowPlayingArtistFlags") || emojiFlagsChanged) {
				const artistSpans = NowPlayingRuntimeState.artistSpans;
				if (track && artistSpans) renderNowPlayingTrack(track, artistSpans);
				else if (!settings.formatNowPlayingBar) NowPlayingThemeOverlayRenderer.clear();
				else if (track) NowPlayingThemeOverlayRenderer.applyFromTrack(track);
			}
			if (Object.hasOwn(changedSettings, "showPlaylistRating")) {
				const pathParts = Spicetify.Platform.History.location.pathname.split("/");
				if (pathParts[1] === "playlist" && pathParts[2]) PlaylistViewRenderer.renderRatingCard(pathParts[2]).catch(() => {});
			}
			if (Object.hasOwn(changedSettings, "skipEnabled")) {
				document.querySelectorAll("div[role=\"row\"]").forEach((row) => {
					row.removeAttribute("data-basify-processed");
				});
				PlaylistViewRenderer.scanRows();
			}
			if (emojiFlagsChanged || localeChanged) refreshCurrentArtistPage().catch((error) => {
				console.warn("Basify failed to refresh artist page:", error);
			});
			if (!(Object.hasOwn(changedSettings, "skipEnabled") || Object.hasOwn(changedSettings, "skipBlockedArtists") || Object.hasOwn(changedSettings, "skipWarningArtists") || Object.hasOwn(changedSettings, "skipUnknownArtists")) || !track) return;
			skipTrackIfNeeded(track);
		}
		static Component() {
			const React = Spicetify.React;
			const [settings, setSettings] = React.useState(() => LocalStorageManager.getSettings());
			const t = (key) => BasifyI18n.t(key, settings.locale);
			const saveSettings = async (newSettings) => {
				const updatedSettings = {
					...settings,
					...newSettings
				};
				setSettings(updatedSettings);
				await LocalStorageManager.updateSettings(newSettings);
				SettingsMenu.applyRuntimeSettings(updatedSettings, newSettings).catch((error) => {
					console.error("Basify failed to apply runtime settings:", error);
				});
			};
			const resetSettings = async () => {
				const defaultSettings = await LocalStorageManager.resetSettings();
				setSettings(defaultSettings);
				SettingsMenu.applyRuntimeSettings(defaultSettings, defaultSettings).catch((error) => {
					console.error("Basify failed to apply runtime settings after reset:", error);
				});
				Spicetify.showNotification(BasifyI18n.t("settingsResetNotification", defaultSettings.locale));
			};
			const skipStatusSwitchesEnabled = settings.skipBlockedArtists || settings.skipWarningArtists || settings.skipUnknownArtists;
			const skipMainSwitchEnabled = settings.skipEnabled && skipStatusSwitchesEnabled;
			const skipSubSwitchesDisabled = !settings.skipEnabled && skipStatusSwitchesEnabled;
			const popupSubSettingsDisabled = !settings.popupEnabled;
			return React.createElement("div", { className: "basify-settings-menu" }, React.createElement(SettingsMenu.SectionTitle, { title: t("language") }), React.createElement(SettingsMenu.SelectRow, {
				label: t("locale"),
				description: t("localeDescription"),
				value: settings.locale,
				options: [{
					value: "en",
					label: "English"
				}, {
					value: "uk",
					label: "Українська"
				}],
				onChange: (value) => saveSettings({ locale: value })
			}), React.createElement(SettingsMenu.SectionTitle, { title: t("skipping") }), React.createElement(SettingsMenu.ToggleRow, {
				label: t("skipTracks"),
				description: t("skipTracksDescription"),
				value: skipMainSwitchEnabled,
				disabled: !skipStatusSwitchesEnabled,
				onChange: (value) => saveSettings({ skipEnabled: value })
			}), React.createElement(SettingsMenu.SubSectionTitle, { title: t("skipStatusFilter") }), React.createElement(SettingsMenu.ToggleRow, {
				label: t("blocked"),
				description: t("blockedDescription"),
				value: settings.skipBlockedArtists,
				disabled: skipSubSwitchesDisabled,
				onChange: (value) => saveSettings({ skipBlockedArtists: value })
			}), React.createElement(SettingsMenu.ToggleRow, {
				label: t("warning"),
				description: t("warningDescription"),
				value: settings.skipWarningArtists,
				disabled: skipSubSwitchesDisabled,
				onChange: (value) => saveSettings({ skipWarningArtists: value })
			}), React.createElement(SettingsMenu.ToggleRow, {
				label: t("unknown"),
				description: t("unknownDescription"),
				value: settings.skipUnknownArtists,
				disabled: skipSubSwitchesDisabled,
				onChange: (value) => saveSettings({ skipUnknownArtists: value })
			}), React.createElement(SettingsMenu.SectionTitle, { title: t("popup") }), React.createElement(SettingsMenu.ToggleRow, {
				label: t("showSkipPopup"),
				description: t("showSkipPopupDescription"),
				value: settings.popupEnabled,
				onChange: (value) => saveSettings({ popupEnabled: value })
			}), React.createElement(SettingsMenu.NumberRow, {
				label: t("popupDuration"),
				description: t("popupDurationDescription"),
				value: settings.popupDurationMs / 1e3,
				min: 1,
				max: 60,
				step: .5,
				disabled: popupSubSettingsDisabled,
				onChange: (value) => saveSettings({ popupDurationMs: value * 1e3 })
			}), React.createElement(SettingsMenu.NumberRow, {
				label: t("visiblePopupLimit"),
				description: t("visiblePopupLimitDescription"),
				value: settings.visibleToastLimit,
				min: 1,
				max: 10,
				disabled: popupSubSettingsDisabled,
				onChange: (value) => saveSettings({ visibleToastLimit: value })
			}), React.createElement(SettingsMenu.SectionTitle, { title: t("flags") }), React.createElement(SettingsMenu.ToggleRow, {
				label: t("useEmojiFlags"),
				description: t("useEmojiFlagsDescription"),
				value: settings.emojiFlags,
				onChange: (value) => saveSettings({ emojiFlags: value })
			}), React.createElement(SettingsMenu.SectionTitle, { title: t("nowPlaying") }), React.createElement(SettingsMenu.ToggleRow, {
				label: t("highlightNowPlayingBar"),
				description: t("highlightNowPlayingBarDescription"),
				value: settings.formatNowPlayingBar,
				onChange: (value) => saveSettings({ formatNowPlayingBar: value })
			}), React.createElement(SettingsMenu.ToggleRow, {
				label: t("formatArtistNames"),
				description: t("formatArtistNamesDescription"),
				value: settings.formatNowPlayingArtistName,
				onChange: (value) => saveSettings({ formatNowPlayingArtistName: value })
			}), React.createElement(SettingsMenu.ToggleRow, {
				label: t("showStatusShapes"),
				description: t("showStatusShapesDescription"),
				value: settings.showNowPlayingArtistStatusShape,
				onChange: (value) => saveSettings({ showNowPlayingArtistStatusShape: value })
			}), React.createElement(SettingsMenu.ToggleRow, {
				label: t("showArtistFlags"),
				description: t("showArtistFlagsDescription"),
				value: settings.showNowPlayingArtistFlags,
				onChange: (value) => saveSettings({ showNowPlayingArtistFlags: value })
			}), React.createElement(SettingsMenu.SectionTitle, { title: t("playlistRating") }), React.createElement(SettingsMenu.ToggleRow, {
				label: t("showPlaylistRating"),
				description: t("showPlaylistRatingDescription"),
				value: settings.showPlaylistRating,
				onChange: (value) => saveSettings({ showPlaylistRating: value })
			}), React.createElement(SettingsMenu.SectionTitle, { title: t("storage") }), React.createElement(SettingsMenu.NumberRow, {
				label: t("artistCacheLimit"),
				description: t("artistCacheLimitDescription"),
				value: settings.artistCacheLimit,
				min: 1,
				max: 1e3,
				onChange: (value) => saveSettings({ artistCacheLimit: value })
			}), React.createElement(SettingsMenu.SectionTitle, { title: t("reset") }), React.createElement(SettingsMenu.ButtonRow, {
				label: t("clearBasifyData"),
				description: t("clearBasifyDataDescription"),
				buttonText: t("resetButton"),
				onClick: resetSettings
			}), React.createElement(SettingsMenu.InfoSection, { locale: settings.locale }));
		}
		static SectionTitle({ title }) {
			return Spicetify.React.createElement("h2", { className: "basify-settings-section-title" }, title);
		}
		static SubSectionTitle({ title }) {
			return Spicetify.React.createElement("div", { className: "basify-settings-subsection-title" }, title);
		}
		static ToggleRow({ label, description, value, disabled = false, onChange }) {
			const Toggle = Spicetify.ReactComponent.Toggle;
			return Spicetify.React.createElement("div", { className: `basify-settings-row${disabled ? " is-disabled" : ""}` }, Spicetify.React.createElement(SettingsMenu.RowText, {
				label,
				description
			}), Spicetify.React.createElement(Toggle, {
				value,
				checked: value,
				isChecked: value,
				disabled,
				isDisabled: disabled,
				onSelected: () => {
					if (disabled) return;
					onChange(!value);
				}
			}));
		}
		static SelectRow({ label, description, value, options, onChange }) {
			return Spicetify.React.createElement("div", { className: "basify-settings-row" }, Spicetify.React.createElement(SettingsMenu.RowText, {
				label,
				description
			}), Spicetify.React.createElement("select", {
				className: "basify-settings-select",
				value,
				onChange: (event) => onChange(event.target.value)
			}, options.map((option) => Spicetify.React.createElement("option", {
				key: option.value,
				value: option.value
			}, option.label))));
		}
		static NumberRow({ label, description, value, min, max, step = 1, disabled = false, onChange }) {
			const [inputValue, setInputValue] = Spicetify.React.useState(String(value));
			Spicetify.React.useEffect(() => {
				setInputValue(String(value));
			}, [value]);
			const saveValue = () => {
				if (disabled) return;
				const numberValue = Number(inputValue);
				if (!Number.isFinite(numberValue)) {
					setInputValue(String(value));
					return;
				}
				const clampedValue = Math.min(max, Math.max(min, numberValue));
				setInputValue(String(clampedValue));
				onChange(clampedValue);
			};
			return Spicetify.React.createElement("div", { className: `basify-settings-row${disabled ? " is-disabled" : ""}` }, Spicetify.React.createElement(SettingsMenu.RowText, {
				label,
				description
			}), Spicetify.React.createElement("input", {
				className: "basify-settings-number",
				type: "number",
				min,
				max,
				step,
				value: inputValue,
				disabled,
				onChange: (event) => {
					if (disabled) return;
					setInputValue(event.target.value);
				},
				onBlur: saveValue,
				onKeyDown: (event) => {
					if (disabled) return;
					if (event.key === "Enter") event.currentTarget.blur();
					if (event.key === "Escape") {
						setInputValue(String(value));
						event.currentTarget.blur();
					}
				}
			}));
		}
		static ButtonRow({ label, description, buttonText, onClick }) {
			return Spicetify.React.createElement("div", { className: "basify-settings-row" }, Spicetify.React.createElement(SettingsMenu.RowText, {
				label,
				description
			}), Spicetify.React.createElement("button", {
				className: "Button-sc-qlcn5g-0 Button-small-buttonSecondary-useBrowserDefaultFocusStyle basify-settings-button",
				type: "button",
				onClick
			}, buttonText));
		}
		static RowText({ label, description }) {
			return Spicetify.React.createElement("div", { className: "basify-settings-text-wrapper" }, Spicetify.React.createElement("div", { className: "basify-settings-label" }, label), description ? Spicetify.React.createElement("div", { className: "basify-settings-description" }, description) : null);
		}
		static InfoSection({ locale }) {
			const phonkersbaseUrl = `https://www.phonkersbase.com/${BasifyI18n.getPhonkersbaseLocalePath(locale)}`;
			return Spicetify.React.createElement("div", { className: "basify-settings-info-section" }, Spicetify.React.createElement("div", { className: "basify-settings-info-powered" }, Spicetify.React.createElement("span", { className: "basify-settings-info-powered-label" }, BasifyI18n.t("poweredBy", locale)), Spicetify.React.createElement("span", {
				className: "basify-settings-info-logo",
				dangerouslySetInnerHTML: { __html: SettingsMenu.icons.phonkersbaseLogoSvg }
			})), Spicetify.React.createElement("div", { className: "basify-settings-info-line" }, BasifyI18n.t("allInformationTakenFrom", locale), " ", Spicetify.React.createElement("a", {
				href: phonkersbaseUrl,
				target: "_blank",
				rel: "noopener noreferrer"
			}, "phonkersbase.com")), Spicetify.React.createElement("div", { className: "basify-settings-info-line" }, BasifyI18n.t("createdBy", locale), " ", Spicetify.React.createElement("a", {
				href: "https://github.com/I2oman",
				target: "_blank",
				rel: "noopener noreferrer"
			}, "github.com/I2oman")));
		}
		static injectStyles() {
			if (document.getElementById(SettingsMenu.styleElementId)) return;
			const style = document.createElement("style");
			style.id = SettingsMenu.styleElementId;
			style.textContent = `
      .basify-settings-react-root { min-width: 460px; }
      .basify-settings-menu { display: flex; flex-direction: column; gap: 10px; padding: 4px 0 18px; }
      .basify-settings-section-title { margin: 18px 0 4px; padding-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.18); color: var(--spice-text); font-size: 20px; font-weight: 700; }
      .basify-settings-subsection-title { margin-top: 6px; color: var(--spice-subtext); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
      .basify-settings-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 42px; }
      .basify-settings-row.is-disabled { opacity: 0.45; }
      .basify-settings-row.is-disabled [role="switch"], .basify-settings-row.is-disabled button { pointer-events: none; filter: grayscale(1); }
      .basify-settings-text-wrapper { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
      .basify-settings-label { color: var(--spice-text); font-size: 14px; font-weight: 600; }
      .basify-settings-description { color: var(--spice-subtext); font-size: 12px; line-height: 1.35; }
      .basify-settings-number { width: 80px; padding: 8px 10px; border: 1px solid rgba(255, 255, 255, 0.24); border-radius: 6px; background: var(--spice-main); color: var(--spice-text); font-size: 14px; font-weight: 600; }
      .basify-settings-select { min-width: 130px; padding: 8px 10px; border: 1px solid rgba(255, 255, 255, 0.24); border-radius: 6px; background: var(--spice-main); color: var(--spice-text); font-size: 14px; font-weight: 600; cursor: pointer; }
      .basify-settings-button { min-width: 90px; height: 40px; border-radius: 999px; border: 0; padding: 0 18px; background: var(--spice-button); color: var(--spice-main); font-weight: 700; cursor: pointer; }
      .basify-settings-info-section { margin-top: 4px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.18); }
      .basify-settings-info-powered { display: flex; align-items: center; gap: 8px; min-height: 26px; }
      .basify-settings-info-powered-label { color: var(--spice-text); font-size: 13px; font-weight: 700; }
      .basify-settings-info-logo { display: inline-flex; align-items: center; height: 26px; }
      .basify-settings-info-logo svg { width: 100px; height: auto; display: block; }
      .basify-settings-info-line { margin-top: 5px; color: var(--spice-subtext); font-size: 12px; line-height: 1.35; }
      .basify-settings-info-line a { color: var(--spice-button); text-decoration: none; }
      .basify-settings-info-line a:hover { text-decoration: underline; }
      
      .basify-topbar-settings-button-wrapper {--basify-settings-button-bg: var(--background-elevated-base); --basify-settings-button-icon: var(--spice-subtext); }
      .basify-topbar-settings-button-wrapper:hover {--basify-settings-button-bg: var(--background-elevated-highlight); --basify-settings-button-icon: var(--spice-text); }

      .basify-topbar-settings-button svg, .basify-topbar-settings-icon { width: 48px !important; height: 48px !important; display: block !important; margin: 0 !important; flex: 0 0 auto !important; }
      .basify-topbar-settings-button-wrapper { margin-left: 12px !important; }

      .basify-topbar-settings-icon rect,
      .basify-topbar-settings-icon path { transition: fill 0.18s ease; }
    `;
			document.head.appendChild(style);
		}
	};
	//#endregion
	//#region src/services/deviceMonitor.js
	var PlaybackDeviceMonitor = class PlaybackDeviceMonitor {
		static checkIntervalMs = 2e3;
		static intervalId = null;
		static lastDeviceId = null;
		static lastPlayingOnCurrentDevice = null;
		static getActiveDevice() {
			return Spicetify.Platform.ConnectAPI.state.activeDevice ?? null;
		}
		static isSpotifyPlayingOnCurrentDevice() {
			const device = PlaybackDeviceMonitor.getActiveDevice();
			if (!device) return false;
			return Boolean(device.isLocal && Spicetify.Player.isPlaying());
		}
		static check(reason = "Device check") {
			const device = PlaybackDeviceMonitor.getActiveDevice();
			const deviceId = device?.id ?? null;
			const playingOnCurrentDevice = PlaybackDeviceMonitor.isSpotifyPlayingOnCurrentDevice();
			const deviceChanged = deviceId !== PlaybackDeviceMonitor.lastDeviceId;
			const startedPlayingOnCurrentDevice = playingOnCurrentDevice && PlaybackDeviceMonitor.lastPlayingOnCurrentDevice === false;
			PlaybackDeviceMonitor.lastDeviceId = deviceId;
			PlaybackDeviceMonitor.lastPlayingOnCurrentDevice = playingOnCurrentDevice;
			if (deviceChanged) {
				const deviceLabel = device ? `${device.isLocal ? "local" : "remote"} ${device.type}: ${device.name}` : "No active device";
				console.log(`[Basify] ${reason}`);
				console.log("[Basify] Active device:", deviceLabel);
				console.log("[Basify] Playing on current device:", playingOnCurrentDevice);
			}
			if (startedPlayingOnCurrentDevice) playPauseHandler(reason);
		}
		static start() {
			if (PlaybackDeviceMonitor.intervalId) return;
			console.log("[Basify] Starting PlaybackDeviceMonitor");
			PlaybackDeviceMonitor.check("Startup");
			PlaybackDeviceMonitor.intervalId = setInterval(() => {
				PlaybackDeviceMonitor.check("Interval check");
			}, PlaybackDeviceMonitor.checkIntervalMs);
		}
	};
	//#endregion
	//#region src/constants/distributors.js
	var BLOCKED_DISTRIBUTORS = [
		"0TO8",
		"88 CEBEP",
		"682 MUSIC",
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
		"VOLUME100",
		"ALLSTARS DISTRIBUTION",
		"MUSIC ALLIGATOR",
		"KOALA MUSIC",
		"PHONKMEDIA",
		"EVILEAF",
		"СОЮЗ МЬЮЗИК",
		"SCARED CULT",
		"OCCULTWAVES",
		"HARMONY HUSTLERS",
		"COWBELLKILLAZ",
		"CHERRY CULT",
		"DXFO",
		"HASLETT CULT",
		"HATEWAVE",
		"ZVONKO DIGITAL",
		"YOURTUNES",
		"SFEROOM DISTRIBUTION",
		"ONERPM",
		"MIN.ECO",
		"BELIVE",
		"EVILSET",
		"ПЕРВОЕ МУЗЫКАЛЬНОЕ",
		"FRESHTUNES",
		"PLAYA POSSE",
		"VELVET MUSIC",
		"GAMMA MUSIC",
		"PEPERFUNK RECORDINGS",
		"РНБ КЛУБ"
	];
	//#endregion
	//#region src/models/Track.js
	var BasifyTrack = class BasifyTrack {
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
				const album = (await Spicetify.GraphQL.Request(getAlbum, {
					uri: albumUri,
					locale: "",
					offset: 0,
					limit: 50
				}))?.data?.albumUnion;
				const distributorTexts = [];
				if (album?.label) distributorTexts.push(album.label);
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
					return BasifyTrack.normalizeDistributorName(distributorText).includes(normalizedBlockedDistributor);
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
			if (!LocalStorageManager.getSettings().skipEnabled) return false;
			return this.getSkipReasons().length > 0;
		}
		getSkipReasons() {
			const settings = LocalStorageManager.getSettings();
			const reasons = [];
			const blockedDistros = this.getBlockedDistributors();
			if (settings.skipBlockedArtists && blockedDistros.length > 0) blockedDistros.forEach((distributor) => {
				reasons.push({
					type: "distributor",
					name: distributor,
					label: "blockedDistributor"
				});
			});
			const skipLabelSettings = {
				blocked: settings.skipBlockedArtists,
				warning: settings.skipWarningArtists,
				unknown: settings.skipUnknownArtists
			};
			this.artists.forEach((artist) => {
				this.getArtistLabels(artist).forEach((label) => {
					if (skipLabelSettings[label]) reasons.push({
						type: "artist",
						artist,
						label
					});
				});
			});
			return reasons;
		}
		getTrackTheme() {
			if (this.isDistributorBlocked()) return "blocked";
			const labels = this.artists.flatMap((artist) => this.getArtistLabels(artist));
			return [
				"blocked",
				"pride",
				"base",
				"approved",
				"unknown",
				"noInfo"
			].find((themeStatus) => labels.includes(themeStatus)) || null;
		}
		async getDominantColor() {
			const imageUrl = BasifyTrack.getTrackImageUrl(this.raw);
			if (!imageUrl) return null;
			return BasifyTrack.extractDominantColorFromImage(imageUrl);
		}
		static getTrackImageUrl(spotifyTrack) {
			const imageUri = spotifyTrack?.images?.[0]?.url || spotifyTrack?.album?.images?.[0]?.url || spotifyTrack?.metadata?.image_xlarge_url || spotifyTrack?.metadata?.image_large_url || spotifyTrack?.metadata?.image_url;
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
						const colorBuckets = /* @__PURE__ */ new Map();
						for (let i = 0; i < pixels.length; i += 4) {
							if (pixels[i + 3] < 128) continue;
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
			return `#${[
				r,
				g,
				b
			].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
		}
		static normalizeDistributorName(v) {
			return String(v).toLowerCase().replace(/[©℗]/gu, "").replace(/\b\d{4}\b/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/gu, " ").trim();
		}
	};
	//#endregion
	//#region src/ui/ArtistHeader.js
	var ArtistPageHeaderRenderer = class ArtistPageHeaderRenderer {
		static styleElementId = "basify-artist-page-header-style";
		static apply(artistHeaderElement, artist) {
			ArtistPageHeaderRenderer.injectStyles();
			artistHeaderElement.style.removeProperty("height");
			artistHeaderElement.classList.add("basify-artist-header-wrapper");
			ArtistPageHeaderRenderer.resetTitleStyles(artistHeaderElement);
			ArtistPageHeaderRenderer.applyArtistNameLink(artistHeaderElement, artist);
			const headerTextElement = artistHeaderElement.querySelector(".main-entityHeader-headerText");
			if (!headerTextElement) return;
			artistHeaderElement.querySelector(".basify-artist-info-section")?.remove();
			const artistInfoSection = ArtistInfoSectionRenderer.createArtistInfoSection(artist);
			headerTextElement.appendChild(artistInfoSection);
		}
		static resetTitleStyles(artistHeaderElement) {
			artistHeaderElement.querySelectorAll(".main-entityHeader-title, .main-entityHeader-title *").forEach((element) => {
				element.style.removeProperty("font-size");
				element.style.removeProperty("line-height");
				element.style.removeProperty("white-space");
				element.style.removeProperty("overflow-wrap");
				element.style.removeProperty("word-break");
			});
		}
		static applyArtistNameLink(artistHeaderElement, artist) {
			const titleElement = artistHeaderElement.querySelector(".main-entityHeader-title");
			if (!titleElement || !artist?.name) return;
			const openArtistOnPhonkersbase = () => {
				const locale = BasifyI18n.getPhonkersbaseLocalePath();
				const searchParams = new URLSearchParams({ search: artist.name });
				window.open(`https://www.phonkersbase.com/${locale}?${searchParams.toString()}`, "_blank", "noopener,noreferrer");
			};
			titleElement.classList.add("basify-artist-name-link");
			titleElement.setAttribute("role", "link");
			titleElement.setAttribute("tabindex", "0");
			titleElement.onclick = openArtistOnPhonkersbase;
			titleElement.onkeydown = (event) => {
				if (event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				openArtistOnPhonkersbase();
			};
		}
		static injectStyles() {
			if (document.getElementById(ArtistPageHeaderRenderer.styleElementId)) return;
			const style = document.createElement("style");
			style.id = ArtistPageHeaderRenderer.styleElementId;
			style.textContent = `
      .main-entityHeader-imageContainerWrapper.basify-artist-header-wrapper { height: auto !important; min-height: clamp(128px, calc(128px + (var(--main-view-grid-width) - 600px) / 424 * 104), 232px) !important; width: 100%; display: flex; }
      .main-entityHeader-imageContainerWrapper.basify-artist-header-wrapper .main-entityHeader-headerText { min-width: 0; max-width: 100%; }
      .main-entityHeader-imageContainerWrapper.basify-artist-header-wrapper .main-entityHeader-title { max-width: 100%; }
      .main-entityHeader-imageContainerWrapper.basify-artist-header-wrapper .main-entityHeader-title, .main-entityHeader-imageContainerWrapper.basify-artist-header-wrapper .main-entityHeader-title * { white-space: nowrap !important; overflow-wrap: normal !important; word-break: normal !important; }
      .main-entityHeader-imageContainerWrapper.basify-artist-header-wrapper .basify-artist-info-section { margin-top: 12px !important; }
      .main-entityHeader-imageContainerWrapper.basify-artist-header-wrapper .main-entityHeader-title.basify-artist-name-link { display: inline-block !important; width: fit-content !important; max-width: 100% !important; cursor: pointer; color: transparent !important; -webkit-text-fill-color: transparent; background-image: radial-gradient( ellipse at center, var(--spice-button, #1ed760) 0%, color-mix( in srgb, var(--spice-button, #1ed760) 95%, transparent ) 30%, color-mix( in srgb, var(--spice-button, #1ed760) 70%, transparent ) 52%, color-mix( in srgb, var(--spice-button, #1ed760) 35%, transparent ) 72%, transparent 100% ), linear-gradient( var(--spice-text, #ffffff), var(--spice-text, #ffffff) ); background-repeat: no-repeat; background-position: center center; background-size: 0% 0%, 100% 100%; background-clip: text; -webkit-background-clip: text; text-shadow: 0 0 0 transparent; transition: background-size 0.42s cubic-bezier(0.4, 0, 1, 1), text-shadow 0.42s ease; }
      .main-entityHeader-imageContainerWrapper.basify-artist-header-wrapper .main-entityHeader-title.basify-artist-name-link * { color: inherit !important; -webkit-text-fill-color: inherit !important; cursor: pointer; }
      .main-entityHeader-imageContainerWrapper.basify-artist-header-wrapper .main-entityHeader-title.basify-artist-name-link:hover { background-size: 220% 500%, 100% 100%; text-shadow: 0 0 8px color-mix( in srgb, var(--spice-button, #1ed760) 32%, transparent ), 0 0 18px color-mix( in srgb, var(--spice-button, #1ed760) 16%, transparent ); transition: background-size 0.75s cubic-bezier(0.16, 1, 0.3, 1), text-shadow 0.75s cubic-bezier(0.16, 1, 0.3, 1); }
    `;
			document.head.appendChild(style);
		}
	};
	//#endregion
	//#region src/index.js
	async function loadArtistPage(location = Spicetify.Platform.History.location) {
		const pathParts = location.pathname.split("/");
		if (pathParts[1] !== "artist" || !pathParts[2]) return;
		const artistId = pathParts[2];
		const targetPathname = location.pathname;
		try {
			const artist = await Artist.create(artistId);
			const artistHeaderElement = await DomObserver.waitForArtistPageHeaderElement(artistId, 5e3);
			if (Spicetify.Platform.History.location.pathname !== targetPathname) return;
			if (artistHeaderElement) ArtistPageHeaderRenderer.apply(artistHeaderElement, artist);
		} catch (error) {}
	}
	async function refreshCurrentArtistPage() {
		const location = Spicetify.Platform.History.location;
		if (location.pathname.split("/")[1] !== "artist") return;
		await loadArtistPage(location);
	}
	async function getTrackArtists(track) {
		const artistsData = track?.artists || [];
		return Promise.all(artistsData.map((a) => {
			const id = a.uri.split(":")[2];
			return Artist.create(id, a.name);
		}));
	}
	async function songChangeHandler(timeoutMs = 7500) {
		NowPlayingThemeOverlayRenderer.clear();
		try {
			const spotifyTrack = await waitForCurrentSpotifyTrack(timeoutMs);
			if (!spotifyTrack) return;
			const context = await buildNowPlayingTrackContext(spotifyTrack);
			if (!context || !isStillCurrentTrack(spotifyTrack.uri)) return;
			const { basifyTrack, artistSpans } = context;
			NowPlayingRuntimeState.update(basifyTrack, artistSpans);
			if (skipTrackIfNeeded(basifyTrack)) return;
			renderNowPlayingTrack(basifyTrack, artistSpans);
		} catch (error) {}
	}
	async function waitForCurrentSpotifyTrack(timeoutMs = 1e4) {
		return await DomObserver.waitUntil(() => {
			const track = Spicetify.Player.data?.item;
			return track?.uri && track?.artists?.length ? track : null;
		}, timeoutMs).catch(() => null);
	}
	async function buildNowPlayingTrackContext(spotifyTrack) {
		try {
			const [trackArtists, artistSpans, distributors] = await Promise.all([
				getTrackArtists(spotifyTrack),
				DomObserver.waitForNowPlayingArtistSpans(spotifyTrack, 5e3).catch(() => null),
				BasifyTrack.getDistributorsFromSpotifyTrack(spotifyTrack).catch(() => [])
			]);
			return {
				basifyTrack: new BasifyTrack(spotifyTrack, trackArtists, distributors),
				artistSpans
			};
		} catch (e) {
			return null;
		}
	}
	function isStillCurrentTrack(trackUri) {
		return Spicetify.Player.data?.item?.uri === trackUri;
	}
	function playPauseHandler(reason = "Manual") {
		const track = NowPlayingRuntimeState.track;
		if (track) {
			skipTrackIfNeeded(track);
			return;
		}
		songChangeHandler().catch(() => {});
	}
	function skipTrackIfNeeded(basifyTrack) {
		if (!PlaybackDeviceMonitor.isSpotifyPlayingOnCurrentDevice()) return false;
		if (!basifyTrack.shouldSkipTrack()) return false;
		SkipToastRenderer.show(basifyTrack);
		Spicetify.Player.next();
		return true;
	}
	function renderNowPlayingTrack(basifyTrack, artistSpans) {
		NowPlayingThemeOverlayRenderer.applyFromTrack(basifyTrack);
		if (artistSpans) NowPlayingArtistRenderer.render(basifyTrack, artistSpans);
	}
	async function startup() {
		SettingsMenu.registerButton();
		PlaybackDeviceMonitor.start();
		PlaylistViewRenderer.start();
		loadArtistPage().catch(() => {});
		const pathParts = Spicetify.Platform.History.location.pathname.split("/");
		if (pathParts[1] === "playlist" && pathParts[2]) PlaylistViewRenderer.renderRatingCard(pathParts[2]).catch(() => {});
		songChangeHandler().catch(() => {});
	}
	function main() {
		startup().catch(() => {});
		Spicetify.Player.addEventListener("songchange", () => {
			songChangeHandler().catch(() => {});
		});
		Spicetify.Player.addEventListener("onplaypause", () => {
			playPauseHandler("Play/Pause");
		});
		Spicetify.Platform.History.listen((location) => {
			loadArtistPage(location).catch(() => {});
			const pathParts = location.pathname.split("/");
			if (pathParts[1] === "playlist" && pathParts[2]) setTimeout(() => {
				PlaylistViewRenderer.renderRatingCard(pathParts[2]).catch(() => {});
			}, 600);
			setTimeout(() => {
				PlaylistViewRenderer.start();
			}, 400);
		});
	}
	(function init() {
		if (!Spicetify?.Player || !Spicetify?.Platform || !Spicetify?.Platform?.History || !Spicetify?.Platform?.ConnectAPI || !Spicetify?.Platform?.ConnectAPI?.state || !Spicetify?.LocalStorage || !Spicetify?.CosmosAsync || !Spicetify?.Topbar || !Spicetify?.PopupModal || !Spicetify?.React || !Spicetify?.ReactDOM || !Spicetify?.ReactComponent || !Spicetify?.ReactComponent?.Toggle || !Spicetify?.GraphQL || !Spicetify?.GraphQL?.Definitions || !Spicetify?.GraphQL?.Definitions?.getAlbum || !Spicetify?.Locale) {
			setTimeout(init, 100);
			return;
		}
		main();
	})();
	//#endregion
	exports.buildNowPlayingTrackContext = buildNowPlayingTrackContext;
	exports.getTrackArtists = getTrackArtists;
	exports.isStillCurrentTrack = isStillCurrentTrack;
	exports.loadArtistPage = loadArtistPage;
	exports.playPauseHandler = playPauseHandler;
	exports.refreshCurrentArtistPage = refreshCurrentArtistPage;
	exports.renderNowPlayingTrack = renderNowPlayingTrack;
	exports.skipTrackIfNeeded = skipTrackIfNeeded;
	exports.songChangeHandler = songChangeHandler;
	exports.waitForCurrentSpotifyTrack = waitForCurrentSpotifyTrack;
	return exports;
})({});
