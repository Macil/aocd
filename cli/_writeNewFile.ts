import { writeAll } from "https://deno.land/std@0.142.0/streams/conversion.ts";

/** Creates a new file with the given contents. Never overwrites existing files. */
export async function writeNewFile(fileName: string, contents: string) {
  const newFile = await Deno.open(fileName, {
    write: true,
    createNew: true,
  });
  try {
    await writeAll(newFile, new TextEncoder().encode(contents));
  } finally {
    newFile.close();
  }
}
