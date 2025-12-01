import { parseArgs } from "@std/cli/parse-args";
import memoize from "@korkje/memz";

import { Aocd } from "./Aocd.ts";
import {
  DefaultAocdSource,
  type DefaultAocdSourceOptions,
} from "./DefaultAocdSource.ts";
import type {
  AocdSource,
  Config,
  Options,
  PartResult,
  Solver,
} from "./_common.ts";

export type * from "./_common.ts";
export { version } from "./version.ts";
export { Aocd, DefaultAocdSource, type DefaultAocdSourceOptions };

let globalConfig: Partial<Config> | undefined;

/**
 * Use this if you want to manually configure Aocd options programmatically or
 * if you want to configure where Aocd gets its data from. Throws an error if
 * the Aocd singleton has already been configured or instantiated.
 */
export function configureAocd(config: Partial<Config>) {
  if (globalConfig) {
    throw new Error(
      "configureAocd() may not be called when Aocd is already configured",
    );
  }
  globalConfig = config;
}

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
  // If globalConfig wasn't already set, set it to signal to future calls of
  // `configureAocd()` that it's too late to configure Aocd.
  const explicitlySetConfig: Partial<Config> = globalConfig ??= {};

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
