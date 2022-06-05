import { writeAll } from "https://deno.land/std@0.142.0/streams/conversion.ts";

export async function start(day: number) {
  const config = JSON.parse(await Deno.readTextFile(".aocdrc.json"));
  const year = config.year;
  if (typeof year !== "number") {
    throw new Error("Invalid year in config .aocdrc.json");
  }
  const src = `\
import { assertEquals } from "https://deno.land/std@0.142.0/testing/asserts.ts";
import { runPart } from "https://deno.land/x/aocd@v0.1.0/mod.ts";

function parse(input: string) {
  return input.trimEnd().split("\\n").map(Number);
}

function part1(input: string): number {
  const items = parse(input);
  throw new Error("TODO");
}

function part2(input: string): number {
  const items = parse(input);
  throw new Error("TODO");
}

if (import.meta.main) {
  runPart(${year}, ${day}, 1, part1);
  runPart(${year}, ${day}, 2, part2);
}

const TEST_INPUT = \`\\
6
7
8
9
10
\`;

Deno.test("part1", () => {
  assertEquals(part1(TEST_INPUT), 11);
});

Deno.test("part2", () => {
  assertEquals(part2(TEST_INPUT), 12);
});
`;
  const newFileName = `day_${day}.ts`;
  const newFile = await Deno.open(newFileName, {
    write: true,
    createNew: true,
  });
  try {
    await writeAll(newFile, new TextEncoder().encode(src));
  } finally {
    newFile.close();
  }
  console.log(`Created ${newFileName}`);
}
