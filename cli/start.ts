import { createDayScript } from "./_createDayScript.ts";

export async function start(day: number) {
  const config = JSON.parse(await Deno.readTextFile(".aocdrc.json"));
  const year = config.year;
  if (typeof year !== "number") {
    throw new Error("Invalid year in config .aocdrc.json");
  }
  await createDayScript(year, day);
}
