import { SettingsMenu } from "./ui/SettingsMenu.js";
import { PlaybackDeviceMonitor } from "./services/deviceMonitor.js";
import { Artist } from "./models/Artist.js";
import { DomObserver } from "./utils/domObserver.js";
import { BasifyTrack } from "./models/Track.js";
import { NowPlayingRuntimeState } from "./state/runtimeState.js";
import { NowPlayingThemeOverlayRenderer } from "./ui/ThemeOverlay.js";
import { NowPlayingArtistRenderer } from "./ui/NowPlayingArtist.js";
import { ArtistPageHeaderRenderer } from "./ui/ArtistHeader.js";
import { SkipToastRenderer } from "./ui/SkipToast.js";
import { LocalStorageManager } from "./services/storage.js";
import { PlaylistViewRenderer } from "./ui/PlaylistView.js";

export async function loadArtistPage(
  location = Spicetify.Platform.History.location,
) {
  const pathParts = location.pathname.split("/");
  if (pathParts[1] !== "artist" || !pathParts[2]) return;
  const artistId = pathParts[2];
  try {
    const artist = await Artist.create(artistId);
    const artistHeaderElement =
      await DomObserver.waitForArtistPageHeaderElement(artistId, 5000);
    if (artistHeaderElement) {
      ArtistPageHeaderRenderer.apply(artistHeaderElement, artist);
    }
  } catch (error) {}
}

export async function refreshCurrentArtistPage() {
  const location = Spicetify.Platform.History.location;
  if (location.pathname.split("/")[1] !== "artist") return;
  await loadArtistPage(location);
}

export async function getTrackArtists(track) {
  const artistsData = track?.artists || [];
  return Promise.all(
    artistsData.map((a) => {
      const id = a.uri.split(":")[2];
      return Artist.create(id, a.name);
    }),
  );
}

export function fastSkipCheck() {
  const track = Spicetify.Player.data?.item;
  if (!track?.uri || !track?.artists?.length) return false;

  const settings = LocalStorageManager.getSettings();
  if (!settings.skipEnabled) return false;

  const isLocal = PlaybackDeviceMonitor.isSpotifyPlayingOnCurrentDevice();
  if (!isLocal) return false;

  const artistIds = track.artists.map((a) => a.uri.split(":")[2]);
  let shouldSkip = false;

  const resolvedArtists = [];
  for (const id of artistIds) {
    const cachedArtist = LocalStorageManager.getArtist(id);
    if (cachedArtist) {
      resolvedArtists.push(cachedArtist);
      const labels = cachedArtist.labels.length
        ? cachedArtist.labels
        : ["noInfo"];
      const skipLabelSettings = {
        blocked: settings.skipBlockedArtists,
        warning: settings.skipWarningArtists,
        unknown: settings.skipUnknownArtists,
      };

      for (const label of labels) {
        if (skipLabelSettings[label]) {
          shouldSkip = true;
          break;
        }
      }
    }
    if (shouldSkip) break;
  }

  if (shouldSkip) {
    console.log(`[Basify] Fast Skip Pipeline triggered for: ${track.name}`);
    const mockTrack = new BasifyTrack(track, resolvedArtists, []);
    SkipToastRenderer.bufferTrack(mockTrack);
    Spicetify.Player.next();
    return true;
  }

  return false;
}

export async function handleNowPlayingTrackChange(timeoutMs = 10000) {
  NowPlayingThemeOverlayRenderer.clear();
  try {
    const spotifyTrack = await waitForCurrentSpotifyTrack(timeoutMs);
    if (!spotifyTrack) return;
    const context = await buildNowPlayingTrackContext(spotifyTrack);
    if (!context || !isStillCurrentTrack(spotifyTrack.uri)) return;
    const { basifyTrack, artistSpans } = context;
    NowPlayingRuntimeState.update(basifyTrack, artistSpans);
    if (handleTrackSkipIfNeeded(basifyTrack)) return;
    renderNowPlayingTrack(basifyTrack, artistSpans);
  } catch (error) {}
}

export async function waitForCurrentSpotifyTrack(timeoutMs = 10000) {
  return await DomObserver.waitUntil(() => {
    const track = Spicetify.Player.data?.item;
    return track?.uri && track?.artists?.length ? track : null;
  }, timeoutMs).catch(() => null);
}

export async function buildNowPlayingTrackContext(spotifyTrack) {
  try {
    const [trackArtists, artistSpans, distributors] = await Promise.all([
      getTrackArtists(spotifyTrack),
      DomObserver.waitForNowPlayingArtist(spotifyTrack, 5000).catch(() => null),
      BasifyTrack.getDistributorsFromSpotifyTrack(spotifyTrack).catch(() => []),
    ]);
    return {
      basifyTrack: new BasifyTrack(spotifyTrack, trackArtists, distributors),
      artistSpans,
    };
  } catch (e) {
    return null;
  }
}

export function isStillCurrentTrack(trackUri) {
  return Spicetify.Player.data?.item?.uri === trackUri;
}

export function handleCurrentTrackSkipCheck(reason = "Manual") {
  const track = NowPlayingRuntimeState.track;
  console.log("track", track);
  if (track) {
    handleTrackSkipIfNeeded(track);
  } else {
    if (fastSkipCheck()) return;
    handleNowPlayingTrackChange().catch(() => {});
  }
}

export function handleTrackSkipIfNeeded(basifyTrack) {
  const isLocal = PlaybackDeviceMonitor.isSpotifyPlayingOnCurrentDevice();
  const settings = LocalStorageManager.getSettings();
  if (!isLocal || !settings.skipEnabled) return false;
  const reasons = basifyTrack.getSkipReasons();
  if (reasons.length > 0) {
    SkipToastRenderer.bufferTrack(basifyTrack);
    Spicetify.Player.next();
    return true;
  }
  return false;
}

export function renderNowPlayingTrack(basifyTrack, artistSpans) {
  NowPlayingThemeOverlayRenderer.applyFromTrack(basifyTrack);
  if (artistSpans) NowPlayingArtistRenderer.render(basifyTrack, artistSpans);
}

async function startup() {
  SettingsMenu.registerButton();
  PlaybackDeviceMonitor.start();
  PlaylistViewRenderer.start();
  loadArtistPage().catch(() => {});

  const pathParts = Spicetify.Platform.History.location.pathname.split("/");
  if (pathParts[1] === "playlist" && pathParts[2]) {
    PlaylistViewRenderer.renderRatingCard(pathParts[2]).catch(() => {});
  }

  if (fastSkipCheck()) return;
  handleNowPlayingTrackChange().catch(() => {});
}

function main() {
  startup().catch(() => {});
  Spicetify.Player.addEventListener("songchange", () => {
    if (fastSkipCheck()) return;
    handleNowPlayingTrackChange().catch(() => {});
  });
  Spicetify.Player.addEventListener("onplaypause", () => {
    handleCurrentTrackSkipCheck("Play/Pause");
  });
  Spicetify.Platform.History.listen((location) => {
    loadArtistPage(location).catch(() => {});

    const pathParts = location.pathname.split("/");
    if (pathParts[1] === "playlist" && pathParts[2]) {
      setTimeout(() => {
        PlaylistViewRenderer.renderRatingCard(pathParts[2]).catch(() => {});
      }, 600);
    }

    setTimeout(() => {
      PlaylistViewRenderer.start();
    }, 400);
  });
}

(function init() {
  if (
    !Spicetify?.Player ||
    !Spicetify?.Platform ||
    !Spicetify?.Platform?.History ||
    !Spicetify?.Platform?.ConnectAPI ||
    !Spicetify?.Platform?.ConnectAPI?.state ||
    !Spicetify?.LocalStorage ||
    !Spicetify?.CosmosAsync ||
    !Spicetify?.Topbar ||
    !Spicetify?.PopupModal ||
    !Spicetify?.React ||
    !Spicetify?.ReactDOM ||
    !Spicetify?.ReactComponent ||
    !Spicetify?.ReactComponent?.Toggle ||
    !Spicetify?.GraphQL ||
    !Spicetify?.GraphQL?.Definitions ||
    !Spicetify?.GraphQL?.Definitions?.getAlbum ||
    !Spicetify?.Locale
  ) {
    setTimeout(init, 100);
    return;
  }

  main();
})();
