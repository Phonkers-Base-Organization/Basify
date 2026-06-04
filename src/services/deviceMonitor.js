import { playPauseHandler } from "../index.js";

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
    return Boolean(device.isLocal && Spicetify.Player.isPlaying());
  }

  static check(reason = "Device check") {
    const device = PlaybackDeviceMonitor.getActiveDevice();
    const deviceId = device?.id ?? null;
    const playingOnCurrentDevice =
      PlaybackDeviceMonitor.isSpotifyPlayingOnCurrentDevice();

    const deviceChanged = deviceId !== PlaybackDeviceMonitor.lastDeviceId;
    const startedPlayingOnCurrentDevice =
      playingOnCurrentDevice &&
      PlaybackDeviceMonitor.lastPlayingOnCurrentDevice === false;

    PlaybackDeviceMonitor.lastDeviceId = deviceId;
    PlaybackDeviceMonitor.lastPlayingOnCurrentDevice = playingOnCurrentDevice;

    if (deviceChanged) {
      const deviceLabel = device
        ? `${device.isLocal ? "local" : "remote"} ${device.type}: ${device.name}`
        : "No active device";

      console.log(`[Basify] ${reason}`);
      console.log("[Basify] Active device:", deviceLabel);
      console.log(
        "[Basify] Playing on current device:",
        playingOnCurrentDevice,
      );
    }

    if (startedPlayingOnCurrentDevice) {
      playPauseHandler(reason);
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
