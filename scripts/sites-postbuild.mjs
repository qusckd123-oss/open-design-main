import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync("dist/server", { recursive: true });
mkdirSync("dist/.openai", { recursive: true });

copyFileSync(".openai/hosting.json", "dist/.openai/hosting.json");

const jsonFiles = [
  "data/latest.json",
  ...readdirSync("dist/data/archive")
    .filter((file) => file.endsWith(".json"))
    .map((file) => `data/archive/${file}`),
];

const embeddedFiles = [
  ["index.html", "text/html; charset=utf-8", "utf8"],
  ["dashboard.html", "text/html; charset=utf-8", "utf8"],
  ...jsonFiles.map((path) => [path, "application/json; charset=utf-8", "utf8"]),
  ["assets/bcave_logo.png", "image/png", "base64"],
].map(([path, contentType, encoding]) => {
  const body = readFileSync(`dist/${path}`, encoding);
  return { path: `/${path}`, contentType, encoding, body };
});

writeFileSync(
  "dist/server/index.js",
  `const files = new Map(${JSON.stringify(embeddedFiles).replace(/</g, "\\u003c")}.map((file) => [file.path, file]));

function serve(pathname) {
  const file = files.get(pathname);
  if (!file) {
    return null;
  }

  const body = file.encoding === "base64"
    ? Uint8Array.from(atob(file.body), (char) => char.charCodeAt(0))
    : file.body;

  return new Response(body, {
    headers: {
      "cache-control": pathname.includes("/data/") ? "no-store" : "public, max-age=300",
      "content-type": file.contentType
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;

    const embeddedResponse = serve(pathname);
    if (embeddedResponse) {
      return embeddedResponse;
    }

    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};
`,
  "utf8",
);
