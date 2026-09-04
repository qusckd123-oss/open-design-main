export type RobotsCheck = {
  allowed: boolean;
  reason: string;
};

export async function verifyRobotsAllowed(targetUrl: string, userAgent = marketCollectorUserAgent()): Promise<RobotsCheck> {
  const url = new URL(targetUrl);
  const robotsUrl = new URL("/robots.txt", url.origin).toString();
  try {
    const response = await fetch(robotsUrl, { headers: { "User-Agent": userAgent } });
    if (!response.ok) {
      return { allowed: false, reason: `Unable to verify robots.txt: HTTP ${response.status}` };
    }
    const robots = await response.text();
    const allowed = parseRobotsAllowed(robots, userAgent, `${url.pathname}${url.search}`);
    return {
      allowed,
      reason: allowed ? "Allowed by robots.txt." : `Blocked by robots.txt for ${url.pathname}.`
    };
  } catch (error) {
    return { allowed: false, reason: `Unable to verify robots.txt: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export function marketCollectorUserAgent() {
  return process.env.MARKET_COLLECTOR_USER_AGENT ?? "TrendSignalDashboard/0.1 (+local market audit)";
}

export function parseRobotsAllowed(robots: string, userAgent: string, path: string) {
  const groups = splitRobotsGroups(robots);
  const normalizedAgent = userAgent.toLowerCase();
  let fallbackRules: string[] = [];

  for (const group of groups) {
    const agents = group
      .filter((line) => /^user-agent:/i.test(line))
      .map((line) => line.split(":").slice(1).join(":").trim().toLowerCase());
    const rules = group.filter((line) => /^disallow:/i.test(line) || /^allow:/i.test(line));
    if (agents.includes("*")) fallbackRules = rules;
    if (agents.some((agent) => agent !== "*" && normalizedAgent.includes(agent))) return applyRules(rules, path);
  }

  return applyRules(fallbackRules, path);
}

function splitRobotsGroups(robots: string) {
  const groups: string[][] = [];
  let current: string[] = [];
  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    if (/^user-agent:/i.test(line) && current.some((entry) => !/^user-agent:/i.test(entry))) {
      groups.push(current);
      current = [];
    }
    current.push(line);
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

function applyRules(rules: string[], path: string) {
  let matched: { directive: "allow" | "disallow"; value: string } | null = null;
  for (const rule of rules) {
    const [directivePart, ...valueParts] = rule.split(":");
    const directive = directivePart?.trim().toLowerCase() === "allow" ? "allow" : "disallow";
    const rawValue = valueParts.join(":").trim();
    if (!rawValue) continue;
    const value = rawValue.replace(/\*/g, "");
    const matches = rawValue.includes("*") ? path.includes(value) || path.startsWith(value) : path.startsWith(value);
    if (matches && (!matched || rawValue.length > matched.value.length)) {
      matched = { directive, value: rawValue };
    }
  }
  return matched?.directive !== "disallow";
}
