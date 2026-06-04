export class DomObserver {
  static async waitUntil(
    conditionCallback,
    timeoutMs = 5000,
    intervalMs = 100,
  ) {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(() => {
        try {
          const result = conditionCallback();
          if (result) {
            clearInterval(intervalId);
            resolve(result);
            return;
          }
          if (Date.now() - startTime >= timeoutMs) {
            clearInterval(intervalId);
            reject(new Error("Basify waitUntil timed out"));
          }
        } catch (error) {
          clearInterval(intervalId);
          reject(error);
        }
      }, intervalMs);
    });
  }

  static async waitForElement(selector, timeoutMs = 5000) {
    return DomObserver.waitUntil(
      () => document.querySelector(selector),
      timeoutMs,
    );
  }

  static async waitForNowPlayingArtistSpans(track, timeoutMs = 5000) {
    return DomObserver.waitUntil(() => {
      const bottomBarArtistsContainer = document.querySelector(
        "div.Root__now-playing-bar div.main-nowPlayingBar-left div.main-trackInfo-artists span.OINH5zA0pQyzffwo",
      );
      const sideViewArtistsContainer = document.querySelector(
        "div.Root__right-sidebar div.main-nowPlayingView-nowPlayingWidget div.main-trackInfo-artists span.OINH5zA0pQyzffwo",
      );

      if (!bottomBarArtistsContainer) {
        return null;
      }

      const trackArtistIds = (track?.artists || []).map(
        (artist) => artist.uri.split(":")[2],
      );
      const bottomBarArtistSpansById =
        DomObserver.extractArtistDataFromContainer(bottomBarArtistsContainer);
      const bottomBarMatchesTrackArtists = DomObserver.haveSameArtistIds(
        Object.keys(bottomBarArtistSpansById),
        trackArtistIds,
      );

      if (!bottomBarMatchesTrackArtists) {
        return null;
      }

      let sideViewArtistSpansById = {};
      if (sideViewArtistsContainer) {
        sideViewArtistSpansById = DomObserver.extractArtistDataFromContainer(
          sideViewArtistsContainer,
        );
        const sideViewMatchesTrackArtists = DomObserver.haveSameArtistIds(
          Object.keys(sideViewArtistSpansById),
          trackArtistIds,
        );
        if (!sideViewMatchesTrackArtists) {
          return null;
        }
      }

      return {
        bottomBarArtistSpans: bottomBarArtistSpansById,
        sideViewArtistSpans: sideViewArtistSpansById,
      };
    }, timeoutMs);
  }

  static extractArtistDataFromContainer(artistsContainer) {
    const artistLinks = Array.from(artistsContainer.querySelectorAll("a"));
    const artistSpansById = {};
    artistLinks.forEach((artistLink) => {
      const artistId = artistLink.href.split("/").pop();
      const artistSpan = artistLink.closest("span");
      if (!artistId || !artistSpan) return;
      artistSpansById[artistId] = artistSpan;
    });
    return artistSpansById;
  }

  static haveSameArtistIds(firstArtistIds, secondArtistIds) {
    if (firstArtistIds.length !== secondArtistIds.length) {
      return false;
    }
    const sortedFirstArtistIds = [...firstArtistIds].sort();
    const sortedSecondArtistIds = [...secondArtistIds].sort();
    return sortedFirstArtistIds.every(
      (artistId, index) => artistId === sortedSecondArtistIds[index],
    );
  }

  static async waitForArtistPageHeaderElement(artistId, timeoutMs = 5000) {
    return DomObserver.waitUntil(() => {
      const headerTitleElement = document.querySelector(
        ".main-entityHeader-imageContainerWrapper",
      );
      if (!headerTitleElement) return null;
      const currentPathname = Spicetify.Platform.History.location.pathname;
      const currentArtistId = currentPathname.split("/")[2];
      if (currentArtistId !== artistId) return null;
      return headerTitleElement;
    }, timeoutMs);
  }
}
