import type { Config } from "./_common.ts";

// This module is split out so it can be imported by itself from a
// module that only wants to configure Aocd for use by other modules
// that may be importing a possibly different version of Aocd.

/**
 * Use this if you want to manually configure Aocd options programmatically
 * or if you want to configure where Aocd gets its data from.
 * Throws an error if the Aocd singleton has already been configured.
 *
 * This function can be used to configure Aocd even if a different
 * version of Aocd is used later. This may be useful for writing a library
 * that preconfigures aspects of Aocd for use by scripts that may be
 * using different versions of Aocd.
 */
export function configureAocd(config: Partial<Config>) {
  // deno-lint-ignore no-explicit-any
  if ((globalThis as any).__aocd_config) {
    throw new Error(
      "configureAocd() may not be called when Aocd is already configured",
    );
  }
  // deno-lint-ignore no-explicit-any
  (globalThis as any).__aocd_config = config;
}
