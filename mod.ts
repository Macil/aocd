import { parse } from "https://deno.land/std@0.142.0/flags/mod.ts";

import { DefaultAocd } from "./DefaultAocd.ts";
export { DefaultAocd } from "./DefaultAocd.ts";
import { Aocd, Solver } from "./_common.ts";
import { SafeRunAocd } from "./SafeRunAocd.ts";
export * from "./_common.ts";
export { version } from "./version.ts";

let singleton: Aocd | undefined;

/**
 * Main entrance into this module. Returns an automatically configured
 * Aocd instance by default. The instance may be manually configured by
 * using {@link setAocd} before this.
 */
export function getAocd(): Aocd {
  const existingAocd = getAocdIfSet();
  if (existingAocd) {
    return existingAocd;
  }
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
  return singleton;
}

/**
 * Get the current Aocd instance if it's set.
 * This is mainly for internal use but is exposed to help debugging.
 * Generally the {@link getAocd} function should be used instead of this.
 */
export function getAocdIfSet(): Aocd | undefined {
  return singleton;
}

/**
 * Allow the Aocd singleton to be set if it hasn't been set yet.
 * Use this if you want to manually configure where Aocd gets its data
 * from.
 */
export function setAocd(aocd: Aocd) {
  // TODO take in AocdSource instead, so more methods can be added to Aocd
  // without breaking setAocd() users.
  // TODO figure out how getDefaultAocd() will work if Aocd becomes a
  // concrete class and it's the source that's DefaultAocdSource.
  // TODO set global so the value set here gets picked up by other versions.
  if (singleton) {
    throw new Error("Aocd instance is already set");
  }
  singleton = aocd;
}

/**
 * Get the current {@link DefaultAocd} singleton. Throws an error if called
 * while `aocd safe-run` is being used.
 * The function {@link getAocd} is recommended over this unless you
 * specifically need functionality that doesn't work in safe-run mode.
 */
export function getDefaultAocd(): DefaultAocd {
  const aocd = getAocd();
  if (aocd instanceof DefaultAocd) {
    return aocd;
  } else {
    if (aocd instanceof SafeRunAocd) {
      throw new Error("getDefaultAocd() is disallowed inside safe-run");
    } else {
      throw new Error("Aocd instance is not DefaultAocd instance");
    }
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
