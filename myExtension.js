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
  });
}

(function init() {
  if (!Spicetify.Player || !Spicetify.Platform || !Spicetify.Platform.History) {
    setTimeout(init, 100);
    return;
  }

  main();
})();
