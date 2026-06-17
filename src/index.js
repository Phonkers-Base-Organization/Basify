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
import { PlaylistViewRenderer } from "./ui/PlaylistView.js";

export async function loadArtistPage(location = Spicetify.Platform.History.location) {
  const pathParts = location.pathname.split("/");
  if (pathParts[1] !== "artist" || !pathParts[2]) return;
  const artistId = pathParts[2];
  const targetPathname = location.pathname;
  try {
    const artist = await Artist.create(artistId);
    const artistHeaderElement = await DomObserver.waitForArtistPageHeaderElement(artistId, 5000);
    if (Spicetify.Platform.History.location.pathname !== targetPathname) {
      return;
    }
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

export async function loadPlaylistPage(location = Spicetify.Platform.History.location) {
  const pathParts = location.pathname.split("/");
  if (pathParts[1] !== "playlist" || !pathParts[2]) {
    PlaylistViewRenderer.stop();
    return;
  }
  PlaylistViewRenderer.start();
  console.log("loadPlaylistPage()");
  const playlistId = pathParts[2];
  const targetPathname = location.pathname;
  try {
    const headerElement = await DomObserver.waitForElement(".main-entityHeader-headerText", 5000);
    if (Spicetify.Platform.History.location.pathname !== targetPathname) return;
    if (headerElement) {
      PlaylistViewRenderer.apply(headerElement, playlistId);
    }
  } catch (error) {}
}

export async function songChangeHandler(timeoutMs = 7500) {
  NowPlayingThemeOverlayRenderer.clear();
  try {
    const spotifyTrack = await waitForCurrentSpotifyTrack(timeoutMs);
    if (!spotifyTrack) return;
    const context = await BasifyTrack.createFromNowPlaying(spotifyTrack);
    if (!context || !isStillCurrentTrack(spotifyTrack.uri)) return;
    const { basifyTrack, artistSpans } = context;
    NowPlayingRuntimeState.update(basifyTrack, artistSpans);
    if (skipTrackIfNeeded(basifyTrack)) return;
    renderNowPlayingTrack(basifyTrack, artistSpans);
  } catch (error) {}
}

export async function waitForCurrentSpotifyTrack(timeoutMs = 10000) {
  return await DomObserver.waitUntil(() => {
    const track = Spicetify.Player.data?.item;
    return track?.uri && track?.artists?.length ? track : null;
  }, timeoutMs).catch(() => null);
}

export function isStillCurrentTrack(trackUri) {
  return Spicetify.Player.data?.item?.uri === trackUri;
}

export function playPauseHandler(reason = "Manual") {
  const track = NowPlayingRuntimeState.track;
  if (track) {
    skipTrackIfNeeded(track);
    return;
  }

  songChangeHandler().catch(() => {});
}

export function skipTrackIfNeeded(basifyTrack) {
  if (!PlaybackDeviceMonitor.isSpotifyPlayingOnCurrentDevice()) return false;

  if (!basifyTrack.shouldSkipTrack()) return false;
  SkipToastRenderer.show(basifyTrack);
  Spicetify.Player.next();

  return true;
}

export function renderNowPlayingTrack(basifyTrack, artistSpans) {
  NowPlayingThemeOverlayRenderer.applyFromTrack(basifyTrack);
  if (artistSpans) NowPlayingArtistRenderer.render(basifyTrack, artistSpans);
}

async function startup() {
  SettingsMenu.registerButton();
  PlaybackDeviceMonitor.start();
  loadArtistPage().catch(() => {});
  loadPlaylistPage().catch(() => {});
  songChangeHandler().catch(() => {});
}

function main() {
  startup().catch(() => {});
  Spicetify.Player.addEventListener("songchange", () => {
    songChangeHandler().catch(() => {});
  });
  Spicetify.Player.addEventListener("onplaypause", () => {
    playPauseHandler("Play/Pause");
  });
  Spicetify.Platform.History.listen(async (location) => {
    console.log(location);

    loadArtistPage(location).catch(() => {});
    loadPlaylistPage(location).catch(() => {});
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
