import { ArtistInfoSectionRenderer } from "./ArtistInfo.js";

export class ArtistPageHeaderRenderer {
  static styleElementId = "basify-artist-page-header-style";

  static apply(artistHeaderElement, artist) {
    ArtistPageHeaderRenderer.injectStyles();
    artistHeaderElement.style.removeProperty("height");
    artistHeaderElement.classList.add("basify-artist-header-wrapper");
    ArtistPageHeaderRenderer.resetTitleStyles(artistHeaderElement);
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
    `;
    document.head.appendChild(style);
  }
}
