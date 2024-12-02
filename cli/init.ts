import { basename, dirname } from "@std/path";
import { createDayScript } from "./_createDayScript.ts";
import { initTemplates, readme } from "./_templates.ts";
import { writeNewFile } from "./_writeNewFile.ts";

export interface InitOptions {
  year: number;
  onlyAocdConfig?: boolean;
}

export async function init(options: InitOptions) {
  if (options.onlyAocdConfig) {
    await createAocdConfig(options.year);
  } else {
    // check that none of the files we're about to create already exist.
    const filesToBeWritten = [
      ".aocdrc.json",
      "README.md",
      "day_1.ts",
      ...Object.keys(initTemplates),
    ];
    const conflicts = (await Promise.all(
      filesToBeWritten.map(async (fileName) => {
        try {
          await Deno.lstat(fileName);
          return fileName;
        } catch (err) {
          if (!(err instanceof Deno.errors.NotFound)) {
            throw err;
          }
          return null;
        }
      }),
    )).filter((conflict) => conflict != null);
    if (conflicts.length > 0) {
      console.error(
        `The current directory has pre-existing files that conflict with aocd init's templates: ${
          conflicts.map((conflict) => JSON.stringify(conflict)).join(", ")
        }.\nYou should either run "aocd init" in an empty directory or remove these conflicting files first.`,
      );
      Deno.exit(1);
    }

    await createAocdConfig(options.year);

    const projectName = basename(await Deno.realPath("."));
    await writeNewFile("README.md", readme(projectName, options.year));
    console.log("Created README.md");

    for (const [fileName, contents] of Object.entries(initTemplates)) {
      const fileDir = dirname(fileName);
      await Deno.mkdir(fileDir, { recursive: true });
      await writeNewFile(fileName, contents);
      console.log(`Created ${fileName}`);
    }

    await createDayScript(options.year, 1);
  }
}

async function createAocdConfig(year: number) {
  const config = { year };
  await writeNewFile(".aocdrc.json", JSON.stringify(config, null, 2) + "\n");
  console.log("Created .aocdrc.json");
}
