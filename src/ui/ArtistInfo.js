import { BasifyI18n } from "../locales/index.js";
import { LocalStorageManager } from "../services/storage.js";
import {
  crownSvg,
  thumbsUpSvg,
  starSvg,
  warningSvg,
  banSvg,
  unknownSvg,
} from "../constants/icons.js";

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
        countriesRow.appendChild(
          ArtistInfoSectionRenderer.createCountryBadge(country),
        );
      });
    } else {
      countriesRow.appendChild(
        ArtistInfoSectionRenderer.createSimpleTag(
          BasifyI18n.t("unknownOrigin"),
        ),
      );
    }

    if (artist.labels.length) {
      artist.labels.forEach((label) => {
        badgesRow.appendChild(
          ArtistInfoSectionRenderer.createTrustBadge(label, artist),
        );
      });
    } else {
      badgesRow.appendChild(
        ArtistInfoSectionRenderer.createTrustBadge("noInfo", artist),
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
    name.textContent = BasifyI18n.countryName(country.countryCode);
    badge.appendChild(name);

    return badge;
  }

  static createTrustBadge(type, artist = null) {
    const badgeData =
      ArtistInfoSectionRenderer.badges[type] ??
      ArtistInfoSectionRenderer.badges.noInfo;

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

    if (artist) {
      const locale = LocalStorageManager.getSettings().locale;
      const description =
        locale === "uk" ? artist.description : artist.descriptionEn;
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
              <div style="padding: 24px; font-size: 15px; line-height: 1.6; color: #ffffff; background: #121212; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #ff5252; font-size: 20px; font-weight: 700; margin-bottom: 14px;">${BasifyI18n.t(badgeData.textKey)}</h3>
                <div style="height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 16px;"></div>
                <p style="margin-bottom: 0; font-weight: 500; font-size: 15px; color: #b3b3b3;">${description}</p>
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
}
