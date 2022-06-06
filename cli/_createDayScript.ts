import { dayScript } from "./_templates.ts";
import { writeNewFile } from "./_writeNewFile.ts";

export async function createDayScript(year: number, day: number) {
  const newFileName = `day_${day}.ts`;
  await writeNewFile(newFileName, dayScript(year, day));
  console.log(`Created ${newFileName}`);
}
