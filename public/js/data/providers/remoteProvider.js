// Remote provider: placeholder for a future sales-dashboard-fed endpoint (see
// public/data-config.js / .env VITE_PRODUCT_DATA_URL). Not used until an endpoint is configured;
// dataService.js falls back to localProvider whenever this throws or is not configured.
window.WackyProviders = window.WackyProviders || {};
window.WackyProviders.remote = async function loadRemote(url, timeoutMs) {
  if (!url) throw new Error("remoteDataUrl is not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 8000);

  let response;
  try {
    response = await fetch(url, { cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const payload = await response.json();
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.styles)) {
    throw new Error("Unexpected remote payload shape: expected an object with a styles[] array");
  }
  return payload;
};
