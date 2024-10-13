import { createDayScript } from "./_createDayScript.ts";

export async function start(day: number) {
  let configText: string;
  try {
    configText = await Deno.readTextFile(".aocdrc.json");
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(
        `.aocdrc.json file not found. The "start" command must be used in a directory created with the "init" command.`,
      );
    }
    throw err;
  }
  const config = JSON.parse(configText);
  const year = config.year;
  if (typeof year !== "number") {
    throw new Error("Invalid year in config .aocdrc.json");
  }
  await createDayScript(year, day);
}
