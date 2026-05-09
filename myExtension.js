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
    .join("").toLowerCase();
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

function main() {
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

    const parentSpans = document.querySelectorAll(
      "div.Root__now-playing-bar div.main-nowPlayingBar-left div.main-trackInfo-artists span.OINH5zA0pQyzffwo",
    );

    const links = new Map(
      Array.from(parentSpans).flatMap((span) =>
        Array.from(span.querySelectorAll("a")).map((a) => {
          const id = a.href.split("/").pop();

          const artist = trackArtists.find((art) => art.url === id);

          if (artist?.name) {
            const innerSpan = a.closest("span");

            artist.countries.forEach((ct) => {
              const img = flagImg(ct.emoji, 16, 12, 4);
              innerSpan.appendChild(img);
            });
          }

          return [id, a];
        }),
      ),
    );
  });
}

(function init() {
  if (!Spicetify.Player || !Spicetify.Platform || !Spicetify.Platform.History) {
    setTimeout(init, 100);
    return;
  }

  main();
})();
