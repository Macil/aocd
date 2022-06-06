// This module does the equivalent of running `deno test day_*.ts "$@"`.
// This module exists just because `deno task` does not support glob
// expressions yet.

const dayScriptFilenames: string[] = [];
for await (const entry of Deno.readDir(".")) {
  if (entry.isFile && /^day_\d+\.ts$/.test(entry.name)) {
    dayScriptFilenames.push(entry.name);
  }
}
const p = Deno.run({
  cmd: [
    "deno",
    "test",
    ...dayScriptFilenames,
    ...Deno.args,
  ],
});
const status = await p.status();
Deno.exit(status.code);
