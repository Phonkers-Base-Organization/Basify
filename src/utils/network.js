const TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

function isRateLimitError(e) {
  return e?.status === 429 || e?.statusCode === 429 || String(e?.message).includes("429");
}

export async function fetchWithRetry(url, options = {}, { timeoutMs = TIMEOUT_MS, maxRetries = MAX_RETRIES, retryDelayMs = RETRY_DELAY_MS } = {}) {
  for (let attempt = 0; ; ) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (response.status === 429) {
        const waitMs = parseInt(response.headers.get("Retry-After") || "10") * 1000;
        console.warn(`[Basify] Rate limited, retrying in ${waitMs / 1000}s... ${url}`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      return response;
    } catch (e) {
      clearTimeout(timer);
      if (e.name === "AbortError") {
        attempt++;
        if (attempt <= maxRetries) {
          console.warn(`[Basify] Request timed out (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs / 1000}s... ${url}`);
          await new Promise((r) => setTimeout(r, retryDelayMs));
        } else {
          console.error(`[Basify] Request timed out after ${maxRetries} retries, giving up. ${url}`);
          throw e;
        }
      } else {
        console.error(`[Basify] Request failed:`, e, url);
        throw e;
      }
    }
  }
}

export async function callWithRetry(fn, { timeoutMs = TIMEOUT_MS, maxRetries = MAX_RETRIES, retryDelayMs = RETRY_DELAY_MS } = {}) {
  for (let attempt = 0; ; ) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
      ]);
    } catch (e) {
      if (isRateLimitError(e)) {
        console.warn(`[Basify] Rate limited, retrying in ${retryDelayMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, retryDelayMs));
      } else if (e.message === "timeout") {
        attempt++;
        if (attempt <= maxRetries) {
          console.warn(`[Basify] Request timed out (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs / 1000}s...`);
          await new Promise((r) => setTimeout(r, retryDelayMs));
        } else {
          console.error(`[Basify] Request timed out after ${maxRetries} retries, giving up.`);
          throw e;
        }
      } else {
        console.error(`[Basify] Request failed:`, e);
        throw e;
      }
    }
  }
}
