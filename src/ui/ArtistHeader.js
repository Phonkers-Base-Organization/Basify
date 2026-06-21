import { BasifyI18n } from "../locales/index.js";
import { ArtistInfoSectionRenderer } from "./ArtistInfo.js";

export class ArtistPageHeaderRenderer {
  static styleElementId = "basify-artist-page-header-style";

  static apply(artistHeaderElement, artist) {
    const originalHeaderHeight = artistHeaderElement.getBoundingClientRect().height;
    ArtistPageHeaderRenderer.injectStyles();
    artistHeaderElement.style.setProperty("max-height", "fit-content", "important");
    artistHeaderElement.style.setProperty("height", "fit-content", "important");

    const artistLayout = artistHeaderElement.querySelector(".main-entityHeader-imageContainerWrapper");
    artistLayout.classList.add("basify-artist-header-wrapper");

    const artistImgElement = artistHeaderElement.querySelector(
      ".main-entityHeader-imageContainer.main-entityHeader-imageContainerNew",
    );
    if (artistImgElement) artistImgElement.style.setProperty("align-self", "center", "important");

    const artistTextLayout = artistLayout.querySelector(".main-entityHeader-headerText");
    artistLayout.style.setProperty("height", "fit-content", "important");

    const artistNameElement = artistTextLayout.querySelector(".main-entityHeader-title");
    ArtistPageHeaderRenderer.resetTitleStyles(artistTextLayout);
    artistNameElement.querySelector("span").style.setProperty("white-space", "nowrap", "important");
    artistNameElement.querySelector("span").style.setProperty("overflow-wrap", "normal", "important");
    artistNameElement.querySelector("span").style.setProperty("word-break", "normal", "important");

    ArtistPageHeaderRenderer.applyArtistNameLink(artistNameElement, artist);
    if (!artistTextLayout) return;
    const artistInfoSection = ArtistInfoSectionRenderer.createArtistInfoSection(artist);
    artistTextLayout.querySelector(".basify-artist-info-section")?.remove();
    artistTextLayout.appendChild(artistInfoSection);
    if (artistTextLayout.getBoundingClientRect().height < originalHeaderHeight) {
      artistHeaderElement.style.removeProperty("max-height");
      artistHeaderElement.style.removeProperty("height");
    }
  }

  static resetTitleStyles(artistHeaderElement) {
    artistHeaderElement.style.removeProperty("font-size");
    artistHeaderElement.style.removeProperty("line-height");
    artistHeaderElement.style.removeProperty("white-space");
    artistHeaderElement.style.removeProperty("overflow-wrap");
    artistHeaderElement.style.removeProperty("word-break");
  }

  static applyArtistNameLink(titleElement, artist) {
    if (!titleElement || !artist?.id) return;
    const openArtistOnPhonkersbase = () => {
      const locale = BasifyI18n.getPhonkersbaseLocalePath();
      const searchParams = new URLSearchParams({ search: artist.id });
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
      .basify-artist-name-link { display: inline-block !important; width: fit-content !important; max-width: 100% !important; cursor: pointer; color: transparent !important; -webkit-text-fill-color: transparent; background-image: radial-gradient( ellipse at center, var(--spice-button, #1ed760) 0%, color-mix( in srgb, var(--spice-button, #1ed760) 95%, transparent ) 30%, color-mix( in srgb, var(--spice-button, #1ed760) 70%, transparent ) 52%, color-mix( in srgb, var(--spice-button, #1ed760) 35%, transparent ) 72%, transparent 100% ), linear-gradient( var(--spice-text, #ffffff), var(--spice-text, #ffffff) ); background-repeat: no-repeat; background-position: center center; background-size: 0% 0%, 100% 100%; background-clip: text; -webkit-background-clip: text; text-shadow: 0 0 0 transparent; transition: background-size 0.42s cubic-bezier(0.4, 0, 1, 1), text-shadow 0.42s ease; }
      .basify-artist-name-link * { color: inherit !important; -webkit-text-fill-color: inherit !important; cursor: pointer; }
      .basify-artist-name-link:hover { background-size: 220% 500%, 100% 100%; text-shadow: 0 0 8px color-mix( in srgb, var(--spice-button, #1ed760) 32%, transparent ), 0 0 18px color-mix( in srgb, var(--spice-button, #1ed760) 16%, transparent ); transition: background-size 0.75s cubic-bezier(0.16, 1, 0.3, 1), text-shadow 0.75s cubic-bezier(0.16, 1, 0.3, 1); }
    `;
    document.head.appendChild(style);
  }
}
