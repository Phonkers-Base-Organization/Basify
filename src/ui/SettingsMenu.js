import { BasifyI18n } from "../locales/index.js";
import { LocalStorageManager } from "../services/storage.js";
import { SkipToastRenderer } from "./SkipToast.js";
import { NowPlayingRuntimeState } from "../state/runtimeState.js";
import { NowPlayingThemeOverlayRenderer } from "./ThemeOverlay.js";
import { refreshCurrentArtistPage, skipTrackIfNeeded, renderNowPlayingTrack } from "../index.js";
import { settingsSvg, phonkersbaseLogoSvg } from "../constants/icons.js";
import { PlaylistViewRenderer } from "./PlaylistView.js";

const React = Spicetify.React;

export class SettingsMenu {
  static button = null;
  static styleElementId = "basify-settings-style";

  static icons = {
    settings: settingsSvg,
    phonkersbaseLogoSvg: phonkersbaseLogoSvg,
  };

  static registerButton() {
    if (SettingsMenu.button) return;
    SettingsMenu.injectStyles();
    SettingsMenu.button = new Spicetify.Topbar.Button(
      BasifyI18n.t("settingsTitle"),
      SettingsMenu.icons.settings,
      SettingsMenu.open,
      false,
      false,
    );
    SettingsMenu.applyTopbarButtonClass();
  }

  static applyTopbarButtonClass() {
    requestAnimationFrame(() => {
      const buttonElement = SettingsMenu.button?.element;
      if (!buttonElement) return;
      buttonElement.classList.add("basify-topbar-settings-button-wrapper");
      const innerButton = buttonElement.matches("button, [role='button']")
        ? buttonElement
        : buttonElement.querySelector("button, [role='button']");
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
      const modal =
        settingsRoot.closest('[role="dialog"]') ||
        settingsRoot.closest('[class*="Modal"]') ||
        document.querySelector('[role="dialog"]');
      if (!modal) return;
      const titleElement = Array.from(modal.querySelectorAll('h1, [class*="Title"], [class*="title"]')).find(
        (element) => !settingsRoot.contains(element),
      );
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
      isLarge: true,
    });

    const React = Spicetify.React;
    const ReactDOM = Spicetify.ReactDOM;
    ReactDOM.render(React.createElement(SettingsMenu.Component), container);
  }

  static async applyRuntimeSettings(settings, changedSettings = {}) {
    const emojiFlagsChanged = Object.hasOwn(changedSettings, "emojiFlags");
    const localeChanged = Object.hasOwn(changedSettings, "locale");
    SkipToastRenderer.applySettings(settings, changedSettings);

    if (localeChanged) {
      SettingsMenu.updateLocalizedTitles(settings.locale);
      PlaylistViewRenderer.updateRatingCard();
    }

    const track = NowPlayingRuntimeState.track;
    const nowPlayingSettingsChanged =
      Object.hasOwn(changedSettings, "formatNowPlayingBar") ||
      Object.hasOwn(changedSettings, "formatNowPlayingArtistName") ||
      Object.hasOwn(changedSettings, "showNowPlayingArtistStatusShape") ||
      Object.hasOwn(changedSettings, "showNowPlayingArtistFlags") ||
      emojiFlagsChanged;

    if (nowPlayingSettingsChanged) {
      const artistSpans = NowPlayingRuntimeState.artistSpans;
      if (track && artistSpans) {
        renderNowPlayingTrack(track, artistSpans);
      } else if (!settings.formatNowPlayingBar) {
        NowPlayingThemeOverlayRenderer.clear();
      } else if (track) {
        NowPlayingThemeOverlayRenderer.applyFromTrack(track);
      }
    }

    if (emojiFlagsChanged || localeChanged) {
      refreshCurrentArtistPage().catch((error) => {
        console.warn("Basify failed to refresh artist page:", error);
      });
    }

    const skipSettingsChanged =
      Object.hasOwn(changedSettings, "skipEnabled") ||
      Object.hasOwn(changedSettings, "skipBlockedArtists") ||
      Object.hasOwn(changedSettings, "skipWarningArtists") ||
      Object.hasOwn(changedSettings, "skipUnknownArtists");

    const playlistDisplaySettingsChanged =
      localeChanged ||
      Object.hasOwn(changedSettings, "formatNowPlayingArtistName") ||
      Object.hasOwn(changedSettings, "showNowPlayingArtistStatusShape") ||
      skipSettingsChanged;

    if (playlistDisplaySettingsChanged) {
      PlaylistViewRenderer.rescanRows();
    }

    if (skipSettingsChanged) {
      PlaylistViewRenderer.recalculateRating();
    }

    if (skipSettingsChanged && track) {
      skipTrackIfNeeded(track);
    }
  }

  static Component() {
    const React = Spicetify.React;
    const [settings, setSettings] = React.useState(() => LocalStorageManager.getSettings());
    const t = (key) => BasifyI18n.t(key, settings.locale);

    const saveSettings = async (newSettings) => {
      const updatedSettings = { ...settings, ...newSettings };
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

    const skipStatusSwitchesEnabled =
      settings.skipBlockedArtists || settings.skipWarningArtists || settings.skipUnknownArtists;

    const skipMainSwitchEnabled = settings.skipEnabled && skipStatusSwitchesEnabled;
    const skipSubSwitchesDisabled = !settings.skipEnabled && skipStatusSwitchesEnabled;
    const popupSubSettingsDisabled = !settings.popupEnabled;

    return React.createElement(
      "div",
      { className: "basify-settings-menu" },
      React.createElement(SettingsMenu.SectionTitle, { title: t("language") }),
      React.createElement(SettingsMenu.SelectRow, {
        label: t("locale"),
        description: t("localeDescription"),
        value: settings.locale,
        options: [
          { value: "en", label: "English" },
          { value: "uk", label: "Українська" },
        ],
        onChange: (value) => saveSettings({ locale: value }),
      }),
      React.createElement(SettingsMenu.SectionTitle, { title: t("skipping") }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("skipTracks"),
        description: t("skipTracksDescription"),
        value: skipMainSwitchEnabled,
        disabled: !skipStatusSwitchesEnabled,
        onChange: (value) => saveSettings({ skipEnabled: value }),
      }),
      React.createElement(SettingsMenu.SubSectionTitle, {
        title: t("skipStatusFilter"),
      }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("blocked"),
        description: t("blockedDescription"),
        value: settings.skipBlockedArtists,
        disabled: skipSubSwitchesDisabled,
        onChange: (value) => saveSettings({ skipBlockedArtists: value }),
      }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("warning"),
        description: t("warningDescription"),
        value: settings.skipWarningArtists,
        disabled: skipSubSwitchesDisabled,
        onChange: (value) => saveSettings({ skipWarningArtists: value }),
      }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("unknown"),
        description: t("unknownDescription"),
        value: settings.skipUnknownArtists,
        disabled: skipSubSwitchesDisabled,
        onChange: (value) => saveSettings({ skipUnknownArtists: value }),
      }),
      React.createElement(SettingsMenu.SectionTitle, { title: t("popup") }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("showSkipPopup"),
        description: t("showSkipPopupDescription"),
        value: settings.popupEnabled,
        onChange: (value) => saveSettings({ popupEnabled: value }),
      }),
      React.createElement(SettingsMenu.NumberRow, {
        label: t("popupDuration"),
        description: t("popupDurationDescription"),
        value: settings.popupDurationMs / 1000,
        min: 1,
        max: 60,
        step: 0.5,
        disabled: popupSubSettingsDisabled,
        onChange: (value) => saveSettings({ popupDurationMs: value * 1000 }),
      }),
      React.createElement(SettingsMenu.NumberRow, {
        label: t("visiblePopupLimit"),
        description: t("visiblePopupLimitDescription"),
        value: settings.visibleToastLimit,
        min: 1,
        max: 10,
        disabled: popupSubSettingsDisabled,
        onChange: (value) => saveSettings({ visibleToastLimit: value }),
      }),
      React.createElement(SettingsMenu.SectionTitle, { title: t("flags") }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("useEmojiFlags"),
        description: t("useEmojiFlagsDescription"),
        value: settings.emojiFlags,
        onChange: (value) => saveSettings({ emojiFlags: value }),
      }),
      React.createElement(SettingsMenu.SectionTitle, {
        title: t("nowPlaying"),
      }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("highlightNowPlayingBar"),
        description: t("highlightNowPlayingBarDescription"),
        value: settings.formatNowPlayingBar,
        onChange: (value) => saveSettings({ formatNowPlayingBar: value }),
      }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("formatArtistNames"),
        description: t("formatArtistNamesDescription"),
        value: settings.formatNowPlayingArtistName,
        onChange: (value) => saveSettings({ formatNowPlayingArtistName: value }),
      }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("showStatusShapes"),
        description: t("showStatusShapesDescription"),
        value: settings.showNowPlayingArtistStatusShape,
        onChange: (value) => saveSettings({ showNowPlayingArtistStatusShape: value }),
      }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("showArtistFlags"),
        description: t("showArtistFlagsDescription"),
        value: settings.showNowPlayingArtistFlags,
        onChange: (value) => saveSettings({ showNowPlayingArtistFlags: value }),
      }),
      React.createElement(SettingsMenu.SectionTitle, {
        title: t("playlistRating"),
      }),
      React.createElement(SettingsMenu.ToggleRow, {
        label: t("showPlaylistRating"),
        description: t("showPlaylistRatingDescription"),
        value: settings.showPlaylistRating,
        onChange: (value) => saveSettings({ showPlaylistRating: value }),
      }),
      React.createElement(SettingsMenu.SectionTitle, { title: t("storage") }),
      React.createElement(SettingsMenu.NumberRow, {
        label: t("artistCacheLimit"),
        description: t("artistCacheLimitDescription"),
        value: settings.artistCacheLimit,
        min: 1,
        max: 1000,
        onChange: (value) => saveSettings({ artistCacheLimit: value }),
      }),
      React.createElement(SettingsMenu.SectionTitle, { title: t("reset") }),
      React.createElement(SettingsMenu.ButtonRow, {
        label: t("clearBasifyData"),
        description: t("clearBasifyDataDescription"),
        buttonText: t("resetButton"),
        onClick: resetSettings,
      }),
      React.createElement(SettingsMenu.InfoSection, {
        locale: settings.locale,
      }),
    );
  }

  static SectionTitle({ title }) {
    return Spicetify.React.createElement("h2", { className: "basify-settings-section-title" }, title);
  }

  static SubSectionTitle({ title }) {
    return Spicetify.React.createElement("div", { className: "basify-settings-subsection-title" }, title);
  }

  static ToggleRow({ label, description, value, disabled = false, onChange }) {
    const Toggle = Spicetify.ReactComponent.Toggle;
    return Spicetify.React.createElement(
      "div",
      { className: `basify-settings-row${disabled ? " is-disabled" : ""}` },
      Spicetify.React.createElement(SettingsMenu.RowText, {
        label,
        description,
      }),
      Spicetify.React.createElement(Toggle, {
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
    return Spicetify.React.createElement(
      "div",
      { className: "basify-settings-row" },
      Spicetify.React.createElement(SettingsMenu.RowText, {
        label,
        description,
      }),
      Spicetify.React.createElement(
        "select",
        {
          className: "basify-settings-select",
          value,
          onChange: (event) => onChange(event.target.value),
        },
        options.map((option) =>
          Spicetify.React.createElement("option", { key: option.value, value: option.value }, option.label),
        ),
      ),
    );
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

    return Spicetify.React.createElement(
      "div",
      { className: `basify-settings-row${disabled ? " is-disabled" : ""}` },
      Spicetify.React.createElement(SettingsMenu.RowText, {
        label,
        description,
      }),
      Spicetify.React.createElement("input", {
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
    return Spicetify.React.createElement(
      "div",
      { className: "basify-settings-row" },
      Spicetify.React.createElement(SettingsMenu.RowText, {
        label,
        description,
      }),
      Spicetify.React.createElement(
        "button",
        {
          className:
            "Button-sc-qlcn5g-0 Button-small-buttonSecondary-useBrowserDefaultFocusStyle basify-settings-button",
          type: "button",
          onClick,
        },
        buttonText,
      ),
    );
  }

  static RowText({ label, description }) {
    return Spicetify.React.createElement(
      "div",
      { className: "basify-settings-text-wrapper" },
      Spicetify.React.createElement("div", { className: "basify-settings-label" }, label),
      description
        ? Spicetify.React.createElement("div", { className: "basify-settings-description" }, description)
        : null,
    );
  }

  static InfoSection({ locale }) {
    const phonkersbaseLocale = BasifyI18n.getPhonkersbaseLocalePath(locale);
    const phonkersbaseUrl = `https://www.phonkersbase.com/${phonkersbaseLocale}`;
    const githubUrl = "https://github.com/I2oman";

    return Spicetify.React.createElement(
      "div",
      { className: "basify-settings-info-section" },
      Spicetify.React.createElement(
        "div",
        { className: "basify-settings-info-powered" },
        Spicetify.React.createElement(
          "span",
          { className: "basify-settings-info-powered-label" },
          BasifyI18n.t("poweredBy", locale),
        ),
        Spicetify.React.createElement("span", {
          className: "basify-settings-info-logo",
          dangerouslySetInnerHTML: {
            __html: SettingsMenu.icons.phonkersbaseLogoSvg,
          },
        }),
      ),
      Spicetify.React.createElement(
        "div",
        { className: "basify-settings-info-line" },
        BasifyI18n.t("allInformationTakenFrom", locale),
        " ",
        Spicetify.React.createElement(
          "a",
          {
            href: phonkersbaseUrl,
            target: "_blank",
            rel: "noopener noreferrer",
          },
          "phonkersbase.com",
        ),
      ),
      Spicetify.React.createElement(
        "div",
        { className: "basify-settings-info-line" },
        BasifyI18n.t("createdBy", locale),
        " ",
        Spicetify.React.createElement(
          "a",
          { href: githubUrl, target: "_blank", rel: "noopener noreferrer" },
          "github.com/I2oman",
        ),
      ),
    );
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
}
