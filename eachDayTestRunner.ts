import { walk } from "@std/fs/walk";

// This module does the equivalent of running `deno test REGULAR_TESTS... day_*.ts "$@"`.

const dayScriptFilenames: string[] = [];
for await (const entry of Deno.readDir(".")) {
  if (entry.isFile && /^day_\d+\.ts$/.test(entry.name)) {
    dayScriptFilenames.push(entry.name);
  }
}
// Natural sort the day script filenames so they're in order by day number.
dayScriptFilenames.sort((a, b) => {
  const aNum = Number(/\d+/.exec(a)![0]);
  const bNum = Number(/\d+/.exec(b)![0]);
  return aNum - bNum;
});

const regularTestFilenames: string[] = [];
for await (
  const item of walk(".", {
    includeDirs: false,
    match: [/(?:^|[\._])test\.(?:tsx?|jsx?|[cm][tj]s)$/],
  })
) {
  regularTestFilenames.push(item.path);
}
regularTestFilenames.sort();

const command = new Deno.Command("deno", {
  args: [
    "test",
    ...regularTestFilenames,
    ...dayScriptFilenames,
    ...Deno.args,
  ],
});
const child = command.spawn();
const status = await child.status;
Deno.exit(status.code);
