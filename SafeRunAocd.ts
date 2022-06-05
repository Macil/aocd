import { Aocd, Config } from "./_common.ts";

export class SafeRunAocd extends Aocd {
  constructor(config: Partial<Config>, private apiAddr: string) {
    super(config);
  }

  override async getInput(year: number, day: number): Promise<string> {
    const url = new URL(`${this.apiAddr}/getInput`);
    url.searchParams.set("year", String(year));
    url.searchParams.set("day", String(day));
    const req = await fetch(url.toString());
    if (!req.ok) {
      throw new Error(`Bad status: ${req.status}`);
    }
    const input = await req.text();
    return input;
  }
}
