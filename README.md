# aocd

This repo contains a CLI tool and library for creating and running
[Advent of Code](https://adventofcode.com/) solutions using
[Deno](https://deno.com/).

The CLI tool provides a way to configure authentication as your Advent of Code
account and provides the ability to start a new project or day script from
built-in templates.

The library is used within each day's script that you write, and it manages
fetching the problem input and running your solutions with the input. This
allows you to avoid needing to manually download problem inputs and lets you
avoid committing them into your repo.

## Install

The latest version of the `aocd` CLI tool can be installed with this command:

```
deno install --global -A -r -f jsr:@macil/aocd/cli
```

## Usage

First you need to give aocd your Advent of Code session cookie. You need to get
this value from your browser after logging into Advent of Code. Once you're
logged in, follow the instructions for your browser while on the Advent of Code
website:

**Chrome**: Press the "Customize and control Google Chrome" button (⋮) at the
top right of the browser, "More tools", "Developer tools", pick the
"Application" tab (you may have to press the overflow (») button to see it),
expand "Cookies", click on "https://adventofcode.com", double-click the Value
field for the "session" cookie, and then right-click and copy it.

**Firefox**: Press the application menu button (☰) at the top right of the
browser, "More tools", "Web Developer Tools", pick the "Storage" tab, expand
"Cookies", click on "https://adventofcode.com", double-click the Value field for
the "session" cookie, and then right-click and copy it.

With your copied cookie value, run this command in a terminal:

```
aocd set-cookie COOKIE_VALUE_HERE
```

Next, you can use aocd to start a new project from a template. Run this command
in a brand new directory with the correct year:

```
aocd init 2023
```

(If you already have an existing project that you want to start using aocd
within, run the command `aocd init --only-aocd-config YEAR` instead. This will
only create a ".aocdrc.json" file with the current year so that the
`aocd start DAY` command works later.)

This will set up a Deno project within the current directory suitable for using
with aocd. The project will include a file named "day_1.ts" which contains a
basic example of using the aocd library:

```ts
import { assertEquals } from "@std/assert";
import { runPart } from "@macil/aocd";

function parse(input: string) {
  return input.trimEnd().split("\n").map(Number);
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
  runPart(2023, 1, 1, part1);
  // runPart(2023, 1, 2, part2);
}

const TEST_INPUT = `\
6
7
8
9
10
`;

Deno.test("part1", () => {
  assertEquals(part1(TEST_INPUT), 11);
});

// Deno.test("part2", () => {
//   assertEquals(part2(TEST_INPUT), 12);
// });
```

You are expected to complete the `parse()`, `part1()`, and `part2()` functions.

The `part1()` and `part2()` functions may return a number, a string, or
null/undefined. If you return null/undefined, the `--submit` functionality of
aocd will not be able to submit an answer automatically.

The `parse()` function is optional and only included in the template as a
suggestion. It's provided as an example of how to share code between the
`part1()` and `part2()` functions. The example `parse()` function in the
template is written for problems with inputs that contain lines with one number
each, but you must adjust the code for other types of input. Depending on the
problem, you may want to define a custom interface and return it or an array of
it from the `parse()` function.

You are able to have tests directly within the script, unlike in usual Deno
projects. Deno's standard "deno test" command with no arguments expects tests to
be in separate "test.ts" or "*.test.ts" files. For Advent of Code, it's often
more convenient to have the code related to a single day in a single file.
Aocd's project template sets up `deno.json` to add a "deno task test" command
that can be used in place of "deno test" to also run tests within all "day_#.ts"
files. All arguments to "deno task test" are passed to "deno test".

For the tests, you are expected to replace the `TEST_INPUT` contents with test
input from the Advent of Code problem description and then update the expected
answers (`11` and `12` in the Deno.test blocks) to the expected answers given in
the problem description. You may remove the tests or add additional ones. The
tests are not required to use the `TEST_INPUT` variable, so feel free to add
tests that use other inputs.

The `if (import.meta.main) {` check around the `runPart()` calls is so that the
solutions are not run when tests are run. The value `import.meta.main` is only
true when the file is executed directly and not as a test. You are not expected
to modify that if-block or its contents except to uncomment the `part2()`
function, its `runPart()` call, and its test once you're ready to work on part
2's solution.

An example of a complete solution based on this template using this library can
be seen at
[Macil/deno-advent2021/day_1.ts](https://github.com/Macil/deno-advent2021/blob/main/day_1.ts).

You can run a solution script like this:

```
deno run -A day_1.ts
```

You can run one day's tests with `deno test day_1.ts` or by clicking the play
button next to it inside of Visual Studio Code. You can run all days' tests with
`deno test`.

You can debug a script within Visual Studio Code by opening the "Run and Debug"
view on the left side of Visual Studio Code, picking either the "Debug Current
File" or "Debug Current File's Tests" configuration in the dropdown, and then
clicking the play button next to it. You can set breakpoints by clicking to the
left of a line number to place a red dot.

You can also debug a script outside of Visual Studio Code by running
`deno run -A --inspect-brk day_1.ts` or `deno test --inspect-brk day_1.ts`.

If you want to see the runtime of your solutions, you can add the `--time` (or
`-t`) flag:

```
deno run -A day_1.ts --time
```

If you want to use a local file as input for a problem instead of fetching it
from the Advent of Code website, you can add the `--input` flag to use a
specific file:

```
deno run -A day_1.ts --input myInput.txt
```

When you're confident about a solution, you can add the `--submit` (or `-s`)
flag to submit the solution and see if it was correct:

```
deno run -A day_1.ts --submit
```

You can use this command to create a new day_N.ts file from the template for a
new day:

```
aocd start 2
```

This will create a `day_2.ts` file in the directory.

## Package

This library is published on JSR as [@macil/aocd](https://jsr.io/@macil/aocd).

## Advanced

### Help Info

You can run `aocd -h` to see a listing of all subcommands and options it
supports. Some subcommands have their own options which can be viewed by passing
the `-h` flag to the subcommand, like `aocd init -h`.

### Session and Cache Info

Aocd caches inputs so that they do not have to be refetched from the Advent of
Code website every time a solution script is executed. Submitted answers are
cached similarly. This cache and the session cookie can be erased by running
`aocd clear-data`.

Aocd stores data inside
[cacheDir()](https://github.com/justjavac/deno_dirs/tree/main/cache_dir) `/aocd`
and [dataDir()](https://github.com/justjavac/deno_dirs/tree/main/data_dir)
`/aocd` on your computer within your user's profile directory.

## Related Projects

This project is partly inspired by [aocf](https://github.com/nuxeh/aocf) and
[aocrunner](https://github.com/caderek/aocrunner) which were made by other
people for programming ecosystems other than Deno.
