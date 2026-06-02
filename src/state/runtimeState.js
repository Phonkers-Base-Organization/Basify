export class NowPlayingRuntimeState {
  static track = null;
  static artistSpans = null;

  static update(track, artistSpans = null) {
    NowPlayingRuntimeState.track = track;
    NowPlayingRuntimeState.artistSpans = artistSpans;
  }
}