import denoJson from "./deno.json" with { type: "json" };

export const version = denoJson.version;
export const userAgent =
  `https://github.com/Macil/aocd ${version} by aocd@macil.tech`;
