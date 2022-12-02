import { userAgent } from "./version.ts";
import type { AocdSource } from "./_common.ts";

export class SafeRunAocdSource implements AocdSource {
  constructor(private readonly apiAddr: string) {}

  async getInput(year: number, day: number): Promise<string> {
    const url = new URL(`${this.apiAddr}/getInput`);
    url.searchParams.set("year", String(year));
    url.searchParams.set("day", String(day));
    const req = await fetch(url.toString(), {
      headers: {
        "User-Agent": userAgent,
      },
    });
    if (!req.ok) {
      throw new Error(`Bad status: ${req.status}`);
    }
    const input = await req.text();
    return input;
  }

  async submit(
    year: number,
    day: number,
    part: number,
    solution: number,
  ): Promise<boolean> {
    const url = new URL(`${this.apiAddr}/submit`);
    const body = { year, day, part, solution };
    const req = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
      },
      body: JSON.stringify(body),
    });
    if (!req.ok) {
      throw new Error(`Bad status: ${req.status}`);
    }
    const result = await req.json();
    return result.correct;
  }
}
