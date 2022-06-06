export const initTemplates: { [path: string]: string } = {
  ".editorconfig": `\
root = true

[*]
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

indent_style = space
indent_size = 2
`,
  ".gitignore": `\
*~
.DS_Store
`,
  ".github/workflows/tests.yml": `\
name: tests
on: [push]
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      - run: deno fmt --check
      - run: deno lint
      - run: deno task test
`,
  ".vscode/extensions.json": `\
{
  "recommendations": [
    "editorconfig.editorconfig",
    "denoland.vscode-deno"
  ]
}
`,
  ".vscode/settings.json": `\
{
  "deno.enable": true,
  "deno.lint": true,
  "editor.defaultFormatter": "denoland.vscode-deno",
  "editor.formatOnSave": true,
  "[markdown]": {
    "editor.defaultFormatter": "denoland.vscode-deno",
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  }
}
`,
  "deno.json": `\
{
  "tasks": {
    "test": "deno test --allow-read=. --allow-net"
  }
}
`,
  "every_day.test.ts": `\
import { walk } from "https://deno.land/std@0.142.0/fs/walk.ts";

// Run all of the tests in day_*.ts files. This works around the fact that
// \`deno test\` by default only runs tests in files named like *test.ts.

const tasks = [];
for await (
  const entry of walk(".", {
    maxDepth: 1,
    includeDirs: false,
    match: [/^day_\\d+\\.ts$/],
  })
) {
  tasks.push(import("./" + entry.path));
}
await Promise.all(tasks);
`,
};

export function readme(projectName: string, year: number) {
  return `\
# ${projectName}

This project contains solutions to [Advent of Code](https://adventofcode.com/)
${year}, using [Deno](https://deno.land/) and Typescript.

## Usage

You must have [aocd](https://github.com/Macil/aocd) installed and have set your
session cookie with it:

\`\`\`
aocd set-cookie COOKIE_VALUE_HERE
\`\`\`

Then you can run any solution script:

\`\`\`
deno run -A day_1.ts
\`\`\`

You can run one day's tests with \`deno test day_1.ts\` or by clicking the play
button next to it inside of Visual Studio Code. You can run all days' tests with
\`deno task test\`.

When you're confident about a solution, you can add the \`--submit\` (or \`-s\`)
flag to submit the solution and see if it was correct:

\`\`\`
deno run -A day_1.ts --submit
\`\`\`

You can start a new day's challenge with this command:

\`\`\`
aocd start 2
\`\`\`
`;
}

export function dayScript(year: number, day: number) {
  return `\
import { assertEquals } from "https://deno.land/std@0.142.0/testing/asserts.ts";
import { runPart } from "https://deno.land/x/aocd@v0.1.1/mod.ts";

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
  // runPart(${year}, ${day}, 2, part2);
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
}
