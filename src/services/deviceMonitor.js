import { handleCurrentTrackSkipCheck } from "../index.js";

export class PlaybackDeviceMonitor {
  static checkIntervalMs = 2000;
  static intervalId = null;
  static lastDeviceId = null;
  static lastPlayingOnCurrentDevice = null;

  static getActiveDevice() {
    return Spicetify.Platform.ConnectAPI.state.activeDevice ?? null;
  }

  static isSpotifyPlayingOnCurrentDevice() {
    const device = PlaybackDeviceMonitor.getActiveDevice();
    if (!device) return false;
    const isLocal = device.isLocal || device.type.toLowerCase() === "computer";
    return Boolean(isLocal);
  }

  static check(reason = "Device check") {
    const device = PlaybackDeviceMonitor.getActiveDevice();
    const playingOnCurrentDevice =
      PlaybackDeviceMonitor.isSpotifyPlayingOnCurrentDevice();

    if (
      playingOnCurrentDevice !==
      PlaybackDeviceMonitor.lastPlayingOnCurrentDevice
    ) {
      console.log(
        `[Basify] Device Status Changed: Playing locally = ${playingOnCurrentDevice} (${reason})`,
      );
    }

    PlaybackDeviceMonitor.lastPlayingOnCurrentDevice = playingOnCurrentDevice;

    if (
      playingOnCurrentDevice &&
      (reason === "Song changed" || reason === "Startup")
    ) {
      handleCurrentTrackSkipCheck(reason);
    }
  }

  static start() {
    if (PlaybackDeviceMonitor.intervalId) return;
    console.log("[Basify] Starting PlaybackDeviceMonitor");
    PlaybackDeviceMonitor.check("Startup");
    PlaybackDeviceMonitor.intervalId = setInterval(() => {
      PlaybackDeviceMonitor.check("Interval check");
    }, PlaybackDeviceMonitor.checkIntervalMs);
  }
}
