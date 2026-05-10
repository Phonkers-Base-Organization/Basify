const icons = {
  crownSvg: `
  <svg width="20" height="20" viewBox="0 0 16 17"
    style="margin-left:6px; box-sizing:content-box;"
    fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4.5L10.6667 8.5L14 5.83333L12.6667 12.5H3.33333L2 5.83333L5.33333 8.5L8 4.5Z"
      fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`,
  thumbsUpSvg: `
  <svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.66671 2.5C9.17685 2.49997 9.66772 2.69488 10.0389 3.04486C10.41 3.39483 10.6334 3.8734 10.6634 4.38267L10.6667 4.5V7.16667H12C12.4901 7.16659 12.9632 7.34645 13.3294 7.67212C13.6956 7.99779 13.9295 8.4466 13.9867 8.93333L13.9967 9.04933L14 9.16667L13.9867 9.29733L13.316 12.652C13.062 13.736 12.3147 14.516 11.4427 14.5053L11.3334 14.5H6.00004C5.83675 14.5 5.67915 14.44 5.55713 14.3315C5.4351 14.223 5.35715 14.0735 5.33804 13.9113L5.33337 13.8333L5.33404 7.476C5.33416 7.35909 5.36502 7.24427 5.42353 7.14305C5.48203 7.04184 5.56613 6.95779 5.66737 6.89933C5.95166 6.73515 6.19112 6.50346 6.3646 6.22475C6.53808 5.94605 6.64024 5.6289 6.66204 5.30133L6.66671 5.16667V4.5C6.66671 3.96957 6.87742 3.46086 7.25249 3.08579C7.62757 2.71071 8.13627 2.5 8.66671 2.5Z"/>
    <path d="M3.33337 7.16675C3.49666 7.16677 3.65426 7.22672 3.77629 7.33522C3.89831 7.44373 3.97627 7.59325 3.99537 7.75541L4.00004 7.83341V13.8334C4.00002 13.9967 3.94007 14.1543 3.83156 14.2763C3.72306 14.3984 3.57354 14.4763 3.41137 14.4954L3.33337 14.5001H2.66671C2.33032 14.5002 2.00633 14.3731 1.75968 14.1444C1.51302 13.9157 1.36194 13.6022 1.33671 13.2667L1.33337 13.1667V8.50008C1.33327 8.1637 1.46031 7.8397 1.68904 7.59305C1.91777 7.3464 2.23127 7.19531 2.56671 7.17008L2.66671 7.16675H3.33337Z"/>
  </svg>
`,
  starSvg: `
  <svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.4953 5.39328L1.24197 6.00995L1.16663 6.02528C1.05259 6.05556 0.948629 6.11555 0.865361 6.19915C0.782092 6.28274 0.722502 6.38694 0.692674 6.5011C0.662847 6.61526 0.663851 6.73529 0.695584 6.84893C0.727318 6.96257 0.788644 7.06576 0.873299 7.14795L3.95463 10.1473L3.22797 14.3839L3.2193 14.4573C3.21232 14.5752 3.23681 14.6929 3.29027 14.7983C3.34372 14.9037 3.42422 14.9929 3.52352 15.057C3.62282 15.121 3.73736 15.1575 3.8554 15.1627C3.97344 15.1679 4.09074 15.1416 4.1953 15.0866L7.9993 13.0866L11.7946 15.0866L11.8613 15.1173C11.9713 15.1606 12.0909 15.1739 12.2078 15.1558C12.3247 15.1377 12.4346 15.0888 12.5264 15.0141C12.6181 14.9395 12.6883 14.8418 12.7299 14.731C12.7714 14.6203 12.7827 14.5005 12.7626 14.3839L12.0353 10.1473L15.118 7.14728L15.17 7.09062C15.2442 6.99913 15.2929 6.88958 15.3111 6.77315C15.3293 6.65671 15.3162 6.53753 15.2734 6.42777C15.2305 6.318 15.1592 6.22157 15.067 6.14829C14.9747 6.07501 14.8646 6.02751 14.748 6.01062L10.4946 5.39328L8.5933 1.53995C8.53828 1.4283 8.45311 1.33429 8.34742 1.26855C8.24174 1.20281 8.11976 1.16797 7.9953 1.16797C7.87084 1.16797 7.74886 1.20281 7.64317 1.26855C7.53749 1.33429 7.45231 1.4283 7.3973 1.53995L5.4953 5.39328Z"/>
  </svg>
`,
  warningSvg: `
  <svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.3334 2.72676C12.3468 3.31188 13.1884 4.15348 13.7736 5.16695C14.3587 6.18042 14.6667 7.33005 14.6667 8.5003C14.6667 9.67055 14.3586 10.8202 13.7735 11.8336C13.1884 12.8471 12.3468 13.6887 11.3333 14.2738C10.3198 14.8589 9.17019 15.1669 7.99993 15.1669C6.82968 15.1669 5.68005 14.8588 4.6666 14.2737C3.65314 13.6886 2.81157 12.8469 2.22646 11.8335C1.64136 10.82 1.33334 9.67034 1.33337 8.50009L1.33671 8.28409C1.37404 7.13275 1.70907 6.01073 2.30913 5.02742C2.90919 4.04411 3.75381 3.23306 4.76064 2.67335C5.76746 2.11363 6.90214 1.82436 8.05404 1.83372C9.20595 1.84308 10.3358 2.15076 11.3334 2.72676ZM8.00004 10.5001C7.82323 10.5001 7.65366 10.5703 7.52864 10.6954C7.40361 10.8204 7.33337 10.9899 7.33337 11.1668V11.1734C7.33337 11.3502 7.40361 11.5198 7.52864 11.6448C7.65366 11.7699 7.82323 11.8401 8.00004 11.8401C8.17685 11.8401 8.34642 11.7699 8.47144 11.6448C8.59647 11.5198 8.66671 11.3502 8.66671 11.1734V11.1668C8.66671 10.9899 8.59647 10.8204 8.47144 10.6954C8.34642 10.5703 8.17685 10.5001 8.00004 10.5001ZM8.00004 5.83342C7.82323 5.83342 7.65366 5.90366 7.52864 6.02869C7.40361 6.15371 7.33337 6.32328 7.33337 6.50009V9.16676C7.33337 9.34357 7.40361 9.51314 7.52864 9.63816C7.65366 9.76319 7.82323 9.83342 8.00004 9.83342C8.17685 9.83342 8.34642 9.76319 8.47144 9.63816C8.59647 9.51314 8.66671 9.34357 8.66671 9.16676V6.50009C8.66671 6.32328 8.59647 6.15371 8.47144 6.02869C8.34642 5.90366 8.17685 5.83342 8.00004 5.83342Z"/>
  </svg>
`,
  banSvg: `
  <svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 8.5C2 9.28793 2.15519 10.0681 2.45672 10.7961C2.75825 11.5241 3.20021 12.1855 3.75736 12.7426C4.31451 13.2998 4.97595 13.7417 5.7039 14.0433C6.43185 14.3448 7.21207 14.5 8 14.5C8.78793 14.5 9.56815 14.3448 10.2961 14.0433C11.0241 13.7417 11.6855 13.2998 12.2426 12.7426C12.7998 12.1855 13.2417 11.5241 13.5433 10.7961C13.8448 10.0681 14 9.28793 14 8.5C14 7.71207 13.8448 6.93185 13.5433 6.2039C13.2417 5.47595 12.7998 4.81451 12.2426 4.25736C11.6855 3.70021 11.0241 3.25825 10.2961 2.95672C9.56815 2.65519 8.78793 2.5 8 2.5C7.21207 2.5 6.43185 2.65519 5.7039 2.95672C4.97595 3.25825 4.31451 3.70021 3.75736 4.25736C3.20021 4.81451 2.75825 5.47595 2.45672 6.2039C2.15519 6.93185 2 7.71207 2 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.2427 4.25732L3.75732 12.7427" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`,
  unknownSvg: `
  <svg width="20" height="20" viewBox="0 0 16 17" style="margin-left:6px; box-sizing:content-box;" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.9833 8.05342C13.8892 6.79321 13.3995 5.5949 12.5842 4.62938C11.7688 3.66386 10.6695 2.98043 9.44281 2.67655C8.21617 2.37266 6.9249 2.46384 5.75313 2.93708C4.58136 3.41032 3.58893 4.24145 2.91736 5.31196C2.24579 6.38247 1.92937 7.6377 2.01323 8.89863C2.09709 10.1596 2.57694 11.3618 3.38435 12.334C4.19176 13.3061 5.28551 13.9985 6.50963 14.3124C7.73375 14.6263 9.02573 14.5457 10.2013 14.0821M2.40002 6.5H13.6M2.40002 10.5H9.00002M7.66665 2.5C6.54354 4.29974 5.94812 6.37858 5.94812 8.5C5.94812 10.6214 6.54354 12.7003 7.66665 14.5M8.33337 2.5C9.51917 4.39925 10.1154 6.60736 10.0467 8.84533M9.34271 12.4473C9.07635 13.1638 8.73818 13.8516 8.33337 14.5M12.6666 15.1667V15.1734M12.6666 13.1668C12.9655 13.1658 13.2554 13.0646 13.4899 12.8794C13.7245 12.6942 13.8901 12.4356 13.9603 12.1451C14.0305 11.8546 14.0013 11.5489 13.8772 11.2771C13.7531 11.0052 13.5414 10.7828 13.276 10.6454C13.0107 10.5096 12.7074 10.4674 12.4152 10.5259C12.123 10.5844 11.8592 10.74 11.6666 10.9674" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`,
};

const artistURL = "open.spotify.com/artist/";

const checkURL =
  "https://www.phonkersbase.com/api/artists?limit=50&offset=0&locale=en&search=";

class Country {
  constructor(name, emoji) {
    this.name = name;
    this.emoji = emoji;
  }
}

class Artist {
  constructor(name, url, countries = [], labels = []) {
    this.name = name;
    this.url = url;
    this.countries = countries;
    this.labels = labels;
  }

  addCountry(country) {
    this.countries.push(country);
  }

  addLabel(label) {
    this.labels.push(label);
  }
}

function createBadgeRow() {
  const row = document.createElement("div");

  row.classList.add("uafy-badge-row");

  Object.assign(row.style, {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: "8px",
    gap: "10px",
    flexWrap: "wrap",
  });

  return row;
}

function createTrustBadge(type) {
  const badges = {
    pride: {
      text: "Our pride",
      icon: icons.crownSvg,
      bg: "#264b61bf",
    },
    base: {
      text: "Based",
      icon: icons.starSvg,
      bg: "#553995bf",
    },
    approved: {
      text: "You can listen",
      icon: icons.thumbsUpSvg,
      bg: "#23593ebf",
    },
    warning: {
      text: "Be careful",
      icon: icons.warningSvg,
      bg: "#77471ebf",
    },
    blocked: {
      text: "Don't listen",
      icon: icons.banSvg,
      bg: "#723433bf",
    },
    unknown: {
      text: "Unknown origin",
      icon: icons.unknownSvg,
      bg: "#2f2f2fbf",
    },
    noInfo: {
      text: "No artist info",
      icon: icons.unknownSvg,
      bg: "linear-gradient(90deg, rgba(255,0,0,0.3), rgba(255,165,0,0.3), rgba(255,255,0,0.3), rgba(0,128,0,0.3), rgba(0,0,255,0.3), rgba(75,0,130,0.3), rgba(238,130,238,0.3))",
    },
  };

  const badgeData = badges[type] ?? badges.noInfo;

  const badge = document.createElement("span");
  badge.classList.add("uafy-trust-badge");
  badge.dataset.type = type;

  badge.innerHTML = `
    <span>${badgeData.text}</span>
    ${badgeData.icon}
  `;

  Object.assign(badge.style, {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "6px",
    background: badgeData.bg,
    color: "#ffffff",
    fontSize: "1rem",
    lineHeight: "1",
    whiteSpace: "nowrap",
  });

  return badge;
}

async function fetchArtist(artist) {
  const data = await Spicetify.CosmosAsync.get(
    checkURL + encodeURIComponent(artistURL + artist),
  );

  const item = data?.data?.items?.[0];
  const name = item?.name || null;
  const countries = (item?.countries || []).map(
    (el) => new Country(el.name, el.originalName?.split(" ")[0] || ""),
  );

  const labels = (item?.listenLabels || []).map((el) => el.name);

  return new Artist(name, artist, countries, labels);
}

async function getTrackArtists(track) {
  const trackArtistsUrls = (track?.artists || []).map(
    (a) => a.uri.split(":")[2],
  );

  return await Promise.all(trackArtistsUrls.map((el) => fetchArtist(el)));
}

function emojiToCountryCode(emoji) {
  return Array.from(emoji)
    .map((c) => String.fromCharCode(c.codePointAt(0) - 127397))
    .join("")
    .toLowerCase();
}

function flagImg(emoji, width, height, marginLeft) {
  const code = emojiToCountryCode(emoji);

  const img = document.createElement("img");
  img.src = `https://flagcdn.com/${width}x${height}/${code}.png`;
  img.alt = code;
  img.style.marginLeft = `${marginLeft}px`;
  img.style.verticalAlign = "middle";
  img.style.width = `${width}px`;
  img.style.height = `${height}px`;

  return img;
}

function waitForArtistToLoad(previousHeader, timeout = 5000) {
  const previousName = previousHeader
    ?.querySelector(".main-entityHeader-title span")
    ?.textContent?.trim();

  return new Promise((resolve) => {
    const start = Date.now();

    const observer = new MutationObserver(() => {
      const header = document.querySelector(".main-entityHeader-headerText");

      const currentName = header
        ?.querySelector(".main-entityHeader-title span")
        ?.textContent?.trim();

      const headerChanged = header && header !== previousHeader;
      const nameChanged = currentName && currentName !== previousName;

      if (headerChanged || nameChanged) {
        observer.disconnect();
        resolve(header);
        return;
      }

      if (Date.now() - start > timeout) {
        observer.disconnect();
        resolve(header || null);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
}

async function loadArtistPage(location = Spicetify.Platform.History.location) {
  const pageType = location.pathname.split("/")[1];
  const id = location.pathname.split("/")[2];
  if (pageType === "artist") {
    const oldHeader = document.querySelector(".main-entityHeader-headerText");

    const artistHeader = await waitForArtistToLoad(oldHeader);

    if (!artistHeader) return;

    const artistNameSpan = artistHeader.querySelector(
      ".main-entityHeader-title span",
    );

    if (!artistNameSpan) return;

    const artist = await fetchArtist(id);

    artist.countries.forEach((ct, i) => {
      const img = flagImg(ct.emoji, 96, 72, i === 0 ? 25 : 5);
      artistNameSpan.appendChild(img);
    });

    artistHeader.querySelector(".uafy-badge-row")?.remove();

    const badgeRow = createBadgeRow();

    if (!artist?.labels?.length) {
      badgeRow.appendChild(createTrustBadge("noInfo"));
    } else {
      artist.labels.forEach((label) => {
        const badge = createTrustBadge(label);
        badgeRow.appendChild(badge);
      });
    }

    artistHeader.appendChild(badgeRow);
  }
}

function main() {
  loadArtistPage();

  Spicetify.Player.addEventListener("songchange", async (event) => {
    const track = Spicetify.Player.data?.item;
    const trackName = track?.name;

    const trackArtists = await getTrackArtists(track);

    console.log("Now playing:", trackName);
    console.log(trackArtists);

    const isBlocked = trackArtists.some((artist) =>
      artist.labels.some((label) =>
        ["blocked", "unknown", "warning"].includes(label.toLowerCase()),
      ),
    );

    if (isBlocked) {
      Spicetify.Player.next();
    }

    const allArtistSpans = [
      document.querySelector(
        "div.Root__now-playing-bar div.main-nowPlayingBar-left div.main-trackInfo-artists span.OINH5zA0pQyzffwo",
      ),
      document.querySelector(
        "div.Root__right-sidebar div.main-nowPlayingView-nowPlayingWidget div.main-trackInfo-artists span.OINH5zA0pQyzffwo",
      ),
    ];

    allArtistSpans.forEach((span) => {
      span.querySelectorAll("a").forEach((a) => {
        const id = a.href.split("/").pop();

        const artist = trackArtists.find((art) => art.url === id);
        if (!artist?.name) return;

        const innerSpan = a.closest("span");
        if (!innerSpan) return;

        artist.countries.forEach((ct) => {
          const img = flagImg(ct.emoji, 16, 12, 4);
          innerSpan.appendChild(img);
        });
      });
    });
  });

  Spicetify.Platform.History.listen(async (location) => {
    loadArtistPage(location);
  });
}

(function init() {
  if (!Spicetify.Player || !Spicetify.Platform || !Spicetify.Platform.History) {
    setTimeout(init, 100);
    return;
  }

  main();
})();
