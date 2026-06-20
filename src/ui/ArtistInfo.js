import { BasifyI18n } from "../locales/index.js";
import { LocalStorageManager } from "../services/storage.js";
import { crownSvg, thumbsUpSvg, starSvg, warningSvg, banSvg, unknownSvg } from "../constants/icons.js";

export class ArtistInfoSectionRenderer {
  static badges = {
    pride: { textKey: "trust.pride", icon: crownSvg, bg: "#264b61" },
    base: { textKey: "trust.base", icon: starSvg, bg: "#553995" },
    approved: { textKey: "trust.approved", icon: thumbsUpSvg, bg: "#23593e" },
    warning: { textKey: "trust.warning", icon: warningSvg, bg: "#77471e" },
    blocked: { textKey: "trust.blocked", icon: banSvg, bg: "#723433" },
    unknown: { textKey: "trust.unknown", icon: unknownSvg, bg: "#2f2f2f" },
    noInfo: { textKey: "trust.noInfo", icon: unknownSvg, bg: "#2f2f2f" },
    blockedDistributor: {
      textKey: "trust.blockedDistributor",
      icon: banSvg,
      bg: "#723433",
    },
  };

  static createArtistInfoSection(artist) {
    ArtistInfoSectionRenderer.injectStyles();

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
        countriesRow.appendChild(ArtistInfoSectionRenderer.createCountryBadge(country));
      });
    } else {
      countriesRow.appendChild(ArtistInfoSectionRenderer.createSimpleTag(BasifyI18n.t("unknownOrigin")));
    }

    if (artist.labels.length) {
      artist.labels.forEach((label) => {
        badgesRow.appendChild(ArtistInfoSectionRenderer.createTrustBadge(label, artist));
      });
    } else {
      badgesRow.appendChild(ArtistInfoSectionRenderer.createTrustBadge("noInfo", artist));
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
      transition: "transform 0.1s ease",
    });

    if (artist && type !== "approved") {
      const locale = LocalStorageManager.getSettings().locale;
      const description = locale === "uk" ? artist.description : artist.descriptionEn;

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
                    ${badgeData.icon
                      .replace(/margin-left:\s*6px;?/g, "")
                      .replace(/width="20"/g, 'width="24"')
                      .replace(/height="20"/g, 'height="24"')}
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
            `,
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
      whiteSpace: "nowrap",
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
      minHeight: "24px",
    });
    return separator;
  }

  static injectStyles() {
    if (document.getElementById("basify-artist-info-section-style")) return;

    const style = document.createElement("style");
    style.id = "basify-artist-info-section-style";
    style.textContent = `
      .main-entityHeader-headerText {
        container-type: inline-size;
        container-name: artist-header;
      }

      @container artist-header (max-width: 375px) {
        .basify-artist-info-section {
          flex-direction: column !important;
          gap: 8px !important;
          width: min-content !important;
          align-items: start !important;
        }

        .basify-countries-row,
        .basify-badges-row {
          width: min-content !important;
        }

        .basify-info-separator {
          width: 100% !important;
          height: 1px !important;
          min-height: 1px !important;
          align-self: stretch !important;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
