import sinon from "https://cdn.skypack.dev/sinon@14.0.0?dts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { Aocd, AocdSource } from "./mod.ts";

class TestAocdSource implements AocdSource {
  getInput = sinon.spy((year: number, day: number) =>
    Promise.resolve(JSON.stringify({ year, day }))
  );

  submit = sinon.spy(
    (
      _year: number,
      _day: number,
      _part: number,
      _solution: number,
    ): Promise<boolean> => {
      throw new Error("Method not implemented.");
    },
  );
}

Deno.test("Aocd.runPart", async () => {
  const source = new TestAocdSource();
  const aocd = new Aocd({
    options: { printResults: false },
    source,
  });

  const part1 = sinon.spy((input: string): number => {
    assertEquals(JSON.parse(input), { year: 2021, day: 7 });
    return 42;
  });

  const result = await aocd.runPart(2021, 7, 1, part1);
  assertEquals(result.answer, 42);
  assert(source.getInput.calledOnce);
  assert(part1.calledOnce);
});
