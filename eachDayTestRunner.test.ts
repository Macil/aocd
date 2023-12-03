import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

const spawnedCommands: MockCommand[] = [];

class MockChildProcess {
  status = Promise.resolve({ code: 7 });
}

class MockCommand {
  _command: string | URL;
  _options: Deno.CommandOptions | undefined;
  constructor(command: string | URL, options?: Deno.CommandOptions) {
    this._command = command;
    this._options = options;
  }

  spawn(): MockChildProcess {
    spawnedCommands.push(this);
    return new MockChildProcess();
  }
}

class MockExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`exit code ${code}`);
    this.code = code;
  }
}

// deno-lint-ignore no-explicit-any
(Deno.Command as any) = MockCommand;
// deno-lint-ignore no-explicit-any
(Deno.exit as any) = (code?: number) => {
  throw new MockExitError(code ?? 0);
};

Deno.test("eachDayTestRunner", async () => {
  Deno.chdir("_testData");
  try {
    try {
      await import("./eachDayTestRunner.ts");
      throw new Error("Expected Deno.exit() call");
    } catch (err) {
      if (!(err instanceof MockExitError)) {
        throw err;
      }
      if (err.code !== 7) {
        throw new Error(`Expected exit code 7, got ${err.code}`);
      }
    }
    assertStrictEquals(spawnedCommands.length, 1);
    assertStrictEquals(spawnedCommands[0]._command, "deno");
    assertEquals(spawnedCommands[0]._options?.args, [
      "test",
      "foo.test.ts",
      "test.ts",
      "day_1.ts",
      "day_2.ts",
      "day_10.ts",
    ]);
  } finally {
    Deno.chdir("..");
  }
});
