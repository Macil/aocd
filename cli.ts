import {
  Command,
  CompletionsCommand,
  ValidationError,
} from "https://deno.land/x/cliffy@v0.24.2/command/mod.ts";
import { writeAll } from "https://deno.land/std@0.142.0/streams/conversion.ts";
import { getDefaultAocd } from "./mod.ts";
import { init } from "./cli/init.ts";
import { start } from "./cli/start.ts";
import { safeRun } from "./cli/safeRun.ts";

await new Command()
  .name("aocd")
  .description(
    "Helper tool for solving Advent of Code with Deno.\nFull instructions are available at <https://github.com/Macil/aocd/blob/main/README.md>.",
  )
  .version("0.1.0")
  .action(() => {
    throw new ValidationError("A command is required");
  })
  .command(
    "init",
    "Initialize a project directory",
  )
  .option(
    "--only-aocd-config",
    "Only create .aocdrc.json for start command support",
  )
  .arguments("<year:number>")
  .action(async (options, year) => {
    await init({
      year,
      onlyAocdConfig: options.onlyAocdConfig,
    });
  })
  .command(
    "start",
    "Create a script from a template for solving a day's challenge",
  )
  .arguments("<day:number>")
  .action(async (_options, day) => {
    await start(day);
  })
  .command(
    "set-cookie",
    "Set the Advent of Code session cookie for later calls",
  )
  .arguments("<value:string>")
  .action(async (_options, value) => {
    await getDefaultAocd().setSessionCookie(value);
  })
  .command("clear-data", "Forget the session cookie and cached inputs")
  .action(async () => {
    await getDefaultAocd().clearData();
  })
  .command("get-input", "View the input for a specific day's challenge")
  .arguments("<year:number> <day:number>")
  .action(async (_options, year, day) => {
    const input = await getDefaultAocd().getInput(year, day);
    await writeAll(Deno.stdout, new TextEncoder().encode(input));
  })
  .command(
    "safe-run",
    "Run a solution script in a safely-sandboxed environment",
  )
  .option("--deno-flags=<flags:string>", "Pass extra flags to Deno")
  .option("-s, --submit", "Submit answers")
  .arguments("<script_arg:string>")
  .action(async (options, scriptArg) => {
    const denoFlags = options.denoFlags?.split(" ") || [];
    const status = await safeRun({
      denoFlags,
      scriptArg,
      submit: options.submit === true,
    });
    Deno.exit(status.code);
  })
  .command("completions", new CompletionsCommand())
  .parse(
    // Work around https://github.com/c4spar/deno-cliffy/issues/387
    Deno.args.length !== 0 ? Deno.args : ["-h"],
  );
