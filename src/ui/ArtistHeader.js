import { BasifyI18n } from "../locales/index.js";
import { ArtistInfoSectionRenderer } from "./ArtistInfo.js";

export class ArtistPageHeaderRenderer {
  static styleElementId = "basify-artist-page-header-style";

  static apply(artistHeaderElement, artist) {
    ArtistPageHeaderRenderer.injectStyles();
    artistHeaderElement.style.removeProperty("height");
    artistHeaderElement.classList.add("basify-artist-header-wrapper");
    ArtistPageHeaderRenderer.resetTitleStyles(artistHeaderElement);
    ArtistPageHeaderRenderer.applyArtistNameLink(artistHeaderElement, artist);
    const headerTextElement = artistHeaderElement.querySelector(
      ".main-entityHeader-headerText",
    );
    if (!headerTextElement) return;
    artistHeaderElement.querySelector(".basify-artist-info-section")?.remove();
    const artistInfoSection =
      ArtistInfoSectionRenderer.createArtistInfoSection(artist);
    headerTextElement.appendChild(artistInfoSection);
  }

  static resetTitleStyles(artistHeaderElement) {
    const titleElements = artistHeaderElement.querySelectorAll(
      ".main-entityHeader-title, .main-entityHeader-title *",
    );
    titleElements.forEach((element) => {
      element.style.removeProperty("font-size");
      element.style.removeProperty("line-height");
      element.style.removeProperty("white-space");
      element.style.removeProperty("overflow-wrap");
      element.style.removeProperty("word-break");
    });
  }

  static applyArtistNameLink(artistHeaderElement, artist) {
    const titleElement = artistHeaderElement.querySelector(
      ".main-entityHeader-title",
    );
    if (!titleElement || !artist?.name) return;
    const openArtistOnPhonkersbase = () => {
      const locale = BasifyI18n.getPhonkersbaseLocalePath();
      const searchParams = new URLSearchParams({ search: artist.name });
      window.open(
        `https://www.phonkersbase.com/${locale}?${searchParams.toString()}`,
        "_blank",
        "noopener,noreferrer",
      );
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
    if (document.getElementById(ArtistPageHeaderRenderer.styleElementId))
      return;
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
}
