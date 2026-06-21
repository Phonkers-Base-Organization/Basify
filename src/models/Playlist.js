import { LocalStorageManager } from "../services/storage.js";
import { Artist } from "./Artist.js";
import { BasifyTrack } from "./Track.js";
import { callWithRetry } from "../utils/network.js";

export class Playlist {
  constructor(data) {
    this.id = data.id;
    this.name = data.name || null;
    this.rating = data.rating || null;
    this.trackIds = data.trackIds || [];
    this.updatedAt = data.updatedAt || Date.now();
    this.lastUsedAt = data.lastUsedAt || Date.now();
  }

  static async create(playlistId, shouldContinue = () => true) {
    const playlistUri = "spotify:playlist:" + playlistId;
    const trackIds = await Playlist.fetchTrackIds(playlistUri, shouldContinue);

    const cachedPlaylistData = LocalStorageManager.getPlaylist(playlistId);
    const sameTrackIds = cachedPlaylistData && Playlist.sameTrackIds(trackIds, cachedPlaylistData.trackIds);
    const allTracksCached = trackIds.every((id) => LocalStorageManager.getTrack(id));

    if (sameTrackIds && allTracksCached) {
      const updatedPlaylistData = await LocalStorageManager.markPlaylistUsed(playlistId);
      return new Playlist(updatedPlaylistData || cachedPlaylistData);
    }

    if (!shouldContinue()) throw new Error("Basify: playlist load aborted");

    const metadata = await callWithRetry(() => Spicetify.Platform.PlaylistAPI.getMetadata(playlistUri)).catch(() => null);
    const name = metadata?.name || null;

    const fetchedPlaylistData = await Playlist.fetch(playlistId, name, shouldContinue);
    const savedPlaylistData = await LocalStorageManager.savePlaylist(fetchedPlaylistData);
    return new Playlist(savedPlaylistData);
  }

  static sameTrackIds(currentTrackIds, cachedTrackIds = []) {
    if (currentTrackIds.length !== cachedTrackIds.length) return false;
    return currentTrackIds.every((id, index) => id === cachedTrackIds[index]);
  }

  static async fetchPlaylistItems(playlistUri, shouldContinue = () => true) {
    let allTracks = [];
    let offset = 0;
    const limit = 200;
    let hasMore = true;

    while (hasMore) {
      if (!shouldContinue()) throw new Error("Basify: playlist load aborted");

      const contents = await callWithRetry(() =>
        Spicetify.Platform.PlaylistAPI.getContents(playlistUri, { offset, limit }),
      ).catch(() => null);

      if (!contents?.items?.length) {
        hasMore = false;
        break;
      }

      allTracks = allTracks.concat(contents.items.map((item) => item.track || item));
      offset += limit;

      if (contents.items.length < limit) {
        hasMore = false;
      }
    }

    return allTracks.filter((track) => track?.uri);
  }

  static async fetchTrackIds(playlistUri, shouldContinue = () => true) {
    const spotifyTracks = await Playlist.fetchPlaylistItems(playlistUri, shouldContinue);
    return spotifyTracks.map((track) => track.uri.split(":")[2]);
  }

  static async fetch(playlistId, name, shouldContinue = () => true) {
    const playlistUri = "spotify:playlist:" + playlistId;
    const spotifyTracks = await Playlist.fetchPlaylistItems(playlistUri, shouldContinue);

    if (!shouldContinue()) throw new Error("Basify: playlist load aborted");

    const uniqueArtistsById = {};
    spotifyTracks.forEach((track) => {
      (track.artists || []).forEach((artist) => {
        const id = artist.uri?.split(":")?.[2];
        if (id && !uniqueArtistsById[id]) {
          uniqueArtistsById[id] = { id, name: artist.name || null };
        }
      });
    });

    const artistsById = await Artist.createMany(Object.values(uniqueArtistsById));

    const tracksById = await BasifyTrack.createMany(
      spotifyTracks.map((track) => ({
        track,
        trackArtists: (track.artists || []).map((artist) => artistsById[artist.uri?.split(":")?.[2]]).filter(Boolean),
      })),
    );

    const trackIds = spotifyTracks.map((track) => track.uri.split(":")[2]);

    const trackCounts = { blocked: 0, warning: 0, unknown: 0, noInfo: 0 };
    trackIds.forEach((trackId) => {
      const basifyTrack = tracksById[trackId];
      if (!basifyTrack) return;
      const status = basifyTrack.getTrackDominantStatus();
      if (status in trackCounts) trackCounts[status]++;
    });

    return {
      id: playlistId,
      name,
      trackIds,
      rating: { trackCounts, totalCount: trackIds.length },
    };
  }
}
