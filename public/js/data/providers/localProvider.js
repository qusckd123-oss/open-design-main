// Local provider: reads the checked-in data/latest.json fallback. This is the exact request the
// dashboard has always made - unchanged - so today's behavior stays identical.
window.WackyProviders = window.WackyProviders || {};
window.WackyProviders.local = async function loadLocal() {
  const response = await fetch("data/latest.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};
