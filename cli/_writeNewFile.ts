/** Creates a new file with the given contents. Never overwrites existing files. */
export async function writeNewFile(fileName: string, contents: string) {
  const newFile = await Deno.open(fileName, {
    write: true,
    createNew: true,
  });
  try {
    await ReadableStream.from([new TextEncoder().encode(contents)])
      .pipeTo(newFile.writable, { preventClose: true });
  } finally {
    newFile.close();
  }
}
