import { Aocd } from "./_common.ts";
import sinon from "https://cdn.skypack.dev/sinon@14.0.0?dts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.142.0/testing/asserts.ts";

class TestAocd extends Aocd {
  getInput = sinon.spy((year: number, day: number) =>
    Promise.resolve(JSON.stringify({ year, day }))
  );
}

Deno.test("Aocd.runPart", async () => {
  const aocd = new TestAocd({ printResults: false });

  const part1 = sinon.spy((input: string): number => {
    assertEquals(JSON.parse(input), { year: 2021, day: 7 });
    return 42;
  });

  const result = await aocd.runPart(2021, 7, 1, part1);
  assertEquals(result.answer, 42);
  assert(aocd.getInput.calledOnce);
  assert(part1.calledOnce);
});
