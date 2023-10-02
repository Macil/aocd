import { basename, dirname } from "https://deno.land/std@0.203.0/path/mod.ts";
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
    const entry = await pickEntryInDirectory();
    if (entry) {
      console.error(
        `aocd init may only be run within an empty directory. (Found ${
          describeEntry(entry)
        }.)`,
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

function describeEntry(entry: Deno.DirEntry): string {
  const kind = entry.isFile ? "file" : entry.isDirectory ? "directory" : "item";
  return `${kind} ${JSON.stringify(entry.name)}`;
}

async function pickEntryInDirectory(): Promise<Deno.DirEntry | null> {
  for await (const entry of Deno.readDir(".")) {
    return entry;
  }
  return null;
}
