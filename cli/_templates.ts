import { version } from "../version.ts";

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
  ".gitattributes": `\
* text=auto eol=lf
`,
  ".github/workflows/tests.yml": `\
name: tests
on: [push]
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
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
  ".vscode/launch.json": `\
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "request": "launch",
      "name": "Debug Current File",
      "type": "node",
      "program": "\${file}",
      "cwd": "\${workspaceFolder}",
      "runtimeExecutable": "deno",
      "runtimeArgs": ["run", "--check", "--inspect-wait", "--allow-all"],
      "attachSimplePort": 9229
    },
    {
      "request": "launch",
      "name": "Debug Current File's Tests",
      "type": "node",
      "program": "\${file}",
      "cwd": "\${workspaceFolder}",
      "runtimeExecutable": "deno",
      "runtimeArgs": ["test", "--inspect-wait"],
      "attachSimplePort": 9229
    }
  ]
}
`,
  ".vscode/settings.json": `\
{
  "deno.enable": true,
  "deno.lint": true,
  "editor.defaultFormatter": "denoland.vscode-deno",
  "editor.formatOnSave": true,
  "editor.insertSpaces": true,
  "editor.tabSize": 2,
  "files.eol": "\\n",
  "[json]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[markdown]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[javascript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  }
}
`,
  "deno.json": `\
{
  "tasks": {
    "test": "deno run --allow-read=. --allow-run jsr:@macil/aocd@${version}/eachDayTestRunner"
  },
  "imports": {
    "@macil/aocd": "jsr:@macil/aocd@^${version}",
    "@std/assert": "jsr:@std/assert@^1.0.6"
  }
}
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

You can debug a script within Visual Studio Code by opening the "Run and Debug"
view on the left side of Visual Studio Code, picking either the "Debug Current
File" or "Debug Current File's Tests" configuration in the dropdown, and then
clicking the play button next to it. You can set breakpoints by clicking to the
left of a line number to place a red dot.

You can also debug a script outside of Visual Studio Code by running
\`deno run -A --inspect-brk day_1.ts\` or \`deno test --inspect-brk day_1.ts\`.

If you want to use a local file as input for a problem instead of fetching it
from the Advent of Code website, you can add the \`--input\` flag to use a
specific file:

\`\`\`
deno run -A day_1.ts --input myInput.txt
\`\`\`

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
import { assertEquals } from "@std/assert";
import { runPart } from "@macil/aocd";

function parse(input: string) {
  return input.trimEnd().split("\\n").map(Number);
}

function part1(input: string): number {
  const items = parse(input);
  throw new Error("TODO");
}

// function part2(input: string): number {
//   const items = parse(input);
//   throw new Error("TODO");
// }

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

// Deno.test("part2", () => {
//   assertEquals(part2(TEST_INPUT), 12);
// });
`;
}
