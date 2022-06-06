import { parse } from "https://deno.land/std@0.142.0/flags/mod.ts";

import { DefaultAocd } from "./DefaultAocd.ts";
export { DefaultAocd } from "./DefaultAocd.ts";
import { Aocd, Solver } from "./_common.ts";
import { SafeRunAocd } from "./SafeRunAocd.ts";
export * from "./_common.ts";
export { version } from "./version.ts";

let singleton: Aocd | undefined;

export function getAocd(): Aocd {
  if (!singleton) {
    const parsedArgs = parse(Deno.args, {
      boolean: ["s", "submit"],
      string: ["aocd-api-addr"],
    });
    const submit = Boolean(parsedArgs.s || parsedArgs.submit);
    if (parsedArgs["aocd-api-addr"]) {
      singleton = new SafeRunAocd({ submit }, parsedArgs["aocd-api-addr"]);
    } else {
      singleton = new DefaultAocd({ submit });
    }
  }
  return singleton;
}

/**
 * Get the current DefaultAocd singleton. Throws an error if called
 * while `aocd safe-run` is being used.
 */
export function getDefaultAocd(): DefaultAocd {
  const aocd = getAocd();
  if (aocd instanceof DefaultAocd) {
    return aocd;
  } else {
    throw new Error("getDefaultAocd() is disallowed inside safe-run");
  }
}

export function runPart(
  year: number,
  day: number,
  part: number,
  solver: Solver,
) {
  return getAocd().runPart(year, day, part, solver);
}
