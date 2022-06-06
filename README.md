# aocd

This repo contains a CLI tool and library for creating and running
[Advent of Code](https://adventofcode.com/) solutions using
[Deno](https://deno.land/).

The CLI tool provides a way to configure authentication as your Advent of Code
account and provides the ability to start a new project or day script from
built-in templates.

The library is used within each day script that you write, and it manages
fetching the problem input and running your solutions with the input. This
allows you to avoid needing to manually download problem inputs and lets you
avoid committing them into your repo.

## Install

The `aocd` CLI tool can be installed with this command:

```
deno install -A -r -f https://deno.land/x/aocd/cli.ts
```

## Usage

First you need to load your Advent of Code session cookie.
[You need to get this value from your browser](https://github.com/wimglenn/advent-of-code-wim/issues/1)
after logging into Advent of Code.

```
aocd set-cookie COOKIE_VALUE_HERE
```

Next, you can use aocd to start a new project from a template. Run this command
in a brand new directory with the correct year:

```
aocd init 2021
```

(If you already have an existing project that you want to start using aocd
within, run the command `aocd init --only-aocd-config YEAR` instead. This will
only create a ".aocdrc.json" file with the current year so that the
`aocd start DAY` command works later.)

This will set up a Deno project within the current directory suitable for using
with aocd. The project will include a file named "day_1.ts" which contains a
basic example of using the aocd library:

```ts
import { assertEquals } from "https://deno.land/std@0.142.0/testing/asserts.ts";
import { runPart } from "https://deno.land/x/aocd/mod.ts";

function parse(input: string) {
  return input.trimEnd().split("\n").map(Number);
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
  runPart(2021, 1, 1, part1);
  // runPart(2021, 1, 2, part2);
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

Deno.test("part2", () => {
  assertEquals(part2(TEST_INPUT), 12);
});
```

You are expected to complete the `parse()`, `part1()`, and `part2()` functions.
The `parse()` function defined in the template works fine for inputs that
contain lines with one number each, but you must adjust the code for other types
of input.

You are also able to have tests within the script. You are expected to replace
the `TEST_INPUT` contents with test input from the Advent of Code problem
description and then update the expected answers (`11` and `12` in the Deno.test
blocks) to the expected answers given in the problem description. There is no
specific structure on tests that this library requires; you may want to add more
test inputs and tests if the problem description gives multiple examples.

The `if (import.meta.main) {` check around the `runPart()` calls is so that the
solutions are not run when tests are run. You are not expected to modify that
if-block or its contents except to uncomment the part 2 `runPart()` call once
you're ready to work on part 2's solution.

An example of complete solution based on this template using this library can be
seen at
[Macil/deno-advent2021/day_1.ts](https://github.com/Macil/deno-advent2021/blob/main/day_1.ts).

You can run a solution script like this:

```
deno run -A day_1.ts
```

You can run a solution script's tests like this:

```
deno test day_1.ts
```

Or you can run tests inside of Visual Studio Code by clicking the play button
next to a Deno.test call inside of a script.

You can run all solution scripts' tests like this:

```
deno test day_*.ts
```

When you're ready to start a new solution script for another day's challenge,
run:

```
aocd start 2
```

This will create a `day_2.ts` file in the directory.

## Advanced

### Help Info

You can run `aocd -h` to see a listing of all subcommands and options it
supports. Some subcommands have their own options which can be viewed by passing
the `-h` flag to the subcommand, like `aocd init -h`.

### Session and Cache Info

Aocd caches inputs so that they do not have to be refetched from the Advent of
Code website every time a solution script is executed. This cache and the
session cookie can be erased by running `aocd clear-data`.

Aocd stores data inside
[cacheDir](https://github.com/justjavac/deno_dirs/tree/main/cache_dir) `/aocd`
and [dataDir](https://github.com/justjavac/deno_dirs/tree/main/data_dir) `/aocd`
on your computer within your user's profile directory.

### Safe Run

This library in normal use requires access to environment variables, read and
write access to several directories, and network access, so using `deno run`
with the `-A` (`--allow-all`) flag is recommended.

If you want to run a solution script in a sandbox that gives it no extra
permissions, then you can use this command:

```
aocd safe-run day_1.ts
```

This causes day_1.ts to be executed by Deno with no permissions except for a
communications channel to the privileged aocd process which it uses to fetch
problem inputs using aocd's session cookie and cache.

This command may be useful if you are trying out another person's solutions and
want to sandbox their code to be sure it doesn't access any of your personal
files. You can pass a remote URL to safe-run, such as a GitHub file's raw link:

```
aocd safe-run https://raw.githubusercontent.com/Macil/deno-advent2021/main/day_1.ts
```

If you must pass in extra flags to the Deno process started by safe-run, you can
do that with the `--deno-flags` parameter:

```
aocd safe-run --deno-flags="--allow-net --allow-env" https://raw.githubusercontent.com/Macil/deno-advent2021/main/day_1.ts
```

## Related Projects

This project is partly inspired by [aocf](https://github.com/nuxeh/aocf) and
[aocrunner](https://github.com/caderek/aocrunner) which were made by other
people for programming ecosystems other than Deno.
