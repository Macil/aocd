import { Command, ValidationError } from "@cliffy/command";
import { CompletionsCommand } from "@cliffy/command/completions";
import { DefaultAocdSource } from "./DefaultAocdSource.ts";
import { init } from "./cli/init.ts";
import { safeRun } from "./cli/safeRun.ts";
import { start } from "./cli/start.ts";
import { version } from "./version.ts";

const defaultAocdSource = new DefaultAocdSource();

await new Command()
  .name("aocd")
  .description(
    "Helper tool for solving Advent of Code with Deno.\nFull instructions are available at <https://github.com/Macil/aocd/blob/main/README.md>.",
  )
  .version(version)
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
    await defaultAocdSource.setSessionCookie(value);
    console.log("The session cookie was set and is now usable by aocd.");
  })
  .command("clear-data", "Forget the session cookie and cached inputs")
  .action(async () => {
    await defaultAocdSource.clearData();
    console.log("Session cookie and cached data has been cleared.");
  })
  .command("get-input", "View the input for a specific day's challenge")
  .arguments("<year:number> <day:number>")
  .action(async (_options, year, day) => {
    const input = await defaultAocdSource.getInput(year, day);
    await ReadableStream.from([new TextEncoder().encode(input)])
      .pipeTo(Deno.stdout.writable);
  })
  .command(
    "safe-run",
    "Run a solution script in a safely-sandboxed environment",
  )
  .option("--deno-flags=<flags:string>", "Pass extra flags to Deno")
  .option("--input <file>", "Read input from a file instead of fetching it")
  .option("-s, --submit", "Submit answers")
  .option("-t, --time", "Show the runtimes of the solvers")
  .arguments("<script_arg:string>")
  .action(async (options, scriptArg) => {
    let chosenAocdSource = defaultAocdSource;
    if (options.input != null) {
      chosenAocdSource = new DefaultAocdSource({ inputFile: options.input });
    }
    const denoFlags = options.denoFlags?.split(" ") || [];
    const status = await safeRun(chosenAocdSource, {
      denoFlags,
      scriptArg,
      submit: options.submit === true,
      time: options.time === true,
    });
    Deno.exit(status.code);
  })
  .command("completions", new CompletionsCommand())
  .parse();
