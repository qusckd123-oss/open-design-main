// Orchestrates: remote sales feed (if configured) -> local latest.json fallback -> normalize.
// Never throws to the caller - always returns a usable dataset plus a `source` flag the UI uses
// to render the "REMOTE / LOCAL / LOCAL FALLBACK" status badge.
window.WackyDataService = (function (Providers, Normalize) {
  const FALLBACK_DATA = {
    meta: {
      brand: "Wacky Willy",
      season: "26SS/26FW",
      weekLabel: "",
      period: "",
      comparePeriod: "",
      amountUnit: "VAT- / 백만원",
      updatedAt: "fallback",
      targetLabel: "전주 매출"
    },
    categories: [],
    styles: [],
    launch: [],
    summary: { headline: "데이터를 불러오지 못했습니다.", message: "data/latest.json 연결을 확인해 주세요." }
  };

  function getConfig() {
    return window.__WACKY_DASHBOARD_CONFIG__ || { dataSource: "local", remoteDataUrl: "", remoteTimeoutMs: 8000 };
  }

  async function load() {
    const config = getConfig();
    let remoteError = null;
    let raw = null;
    let source = "local";

    if (config.dataSource === "remote" && config.remoteDataUrl) {
      try {
        raw = await Providers.remote(config.remoteDataUrl, config.remoteTimeoutMs);
        source = "remote";
      } catch (error) {
        remoteError = error;
      }
    }

    if (!raw) {
      try {
        raw = await Providers.local();
        source = remoteError ? "local-fallback" : "local";
      } catch (localError) {
        return { raw: FALLBACK_DATA, source: "empty", error: remoteError || localError };
      }
    }

    return { raw: Normalize.normalizeDataset(raw), source, error: remoteError };
  }

  return { load, FALLBACK_DATA };
})(window.WackyProviders, window.WackyNormalize);
