import { parseArgs } from "@std/cli/parse-args";
import memoize from "@korkje/memz";

import { Aocd } from "./Aocd.ts";
import { DefaultAocdSource } from "./DefaultAocdSource.ts";
import type {
  AocdSource,
  Config,
  Options,
  PartResult,
  Solver,
} from "./_common.ts";
import { configureAocd } from "./configureAocd.ts";

export type * from "./_common.ts";
export { version } from "./version.ts";
export { Aocd, configureAocd };

let singleton: Aocd | undefined;

const parsedArgs = memoize(() =>
  parseArgs(Deno.args, {
    boolean: ["s", "submit", "t", "time"],
    string: ["input"],
  })
);

/**
 * Main entrypoint into this library. Returns an automatically configured
 * Aocd singleton instance.
 *
 * The configuration is based on values previously passed to
 * {@link configureAocd} or CLI parameters inside `Deno.args`.
 */
export function getAocd(): Aocd {
  if (singleton) {
    return singleton;
  }
  singleton = new Aocd(constructConfig());
  return singleton;
}

function constructConfig(): Config {
  // If globalThis.__aocd_config wasn't already set, set it to signal
  // to future calls of `configureAocd()` that it's too late to configure
  // Aocd.
  // deno-lint-ignore no-explicit-any
  const explicitlySetConfig: Partial<Config> = (globalThis as any)
    .__aocd_config ??= {};

  return {
    options: explicitlySetConfig.options ?? optionsFromCLI(),
    source: explicitlySetConfig.source ?? sourceFromCLI(),
  };
}

function optionsFromCLI(): Partial<Options> {
  const p = parsedArgs();
  const submit = Boolean(p.s || p.submit);
  const time = Boolean(p.t || p.time);
  return { submit, time };
}

function sourceFromCLI(): AocdSource {
  const p = parsedArgs();
  const inputFile: string | undefined = p.input;
  return new DefaultAocdSource({ inputFile });
}

/**
 * Run a solver with a given day's input.
 *
 * This method is a shortcut for calling the {@link Aocd.runPart} method of
 * the {@link getAocd} return value.
 */
export function runPart(
  year: number,
  day: number,
  part: number,
  solver: Solver,
): Promise<PartResult> {
  return getAocd().runPart(year, day, part, solver);
}
