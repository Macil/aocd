import memoizy from "https://deno.land/x/memoizy@1.0.0/mod.ts";
import { Aocd } from "./_common.ts";
import { DbManager } from "./_DbManager.ts";

export class DefaultAocd extends Aocd {
  private dbManager = new DbManager();

  private readonly getSessionCookie = memoizy(async (): Promise<string> => {
    const AOC_SESSION = Deno.env.get("AOC_SESSION");
    if (AOC_SESSION) {
      return AOC_SESSION;
    }
    const db = await this.dbManager.getMainDb();
    const results = db.query<[string]>("SELECT session FROM sessions LIMIT 1");
    if (results[0]) {
      return results[0][0];
    }
    throw new Error("Could not find Advent of Code session cookie");
  });

  async setSessionCookie(session: string) {
    const db = await this.dbManager.getMainDb();
    db.transaction(() => {
      db.query("INSERT INTO sessions (session) VALUES (?)", [
        session,
      ]);
      const sessionId = db.lastInsertRowId;
      db.query("DELETE FROM sessions WHERE id != ?", [sessionId]);
    });
  }

  private async fetchInput(year: number, day: number): Promise<string> {
    const url = `https://adventofcode.com/${year}/day/${day}/input`;
    console.warn(`Fetching ${url}`);
    const AOC_SESSION = await this.getSessionCookie();
    const req = await fetch(
      url,
      { headers: { Cookie: `session=${AOC_SESSION}` } },
    );
    if (!req.ok) {
      throw new Error(`Bad response: ${req.status}`);
    }
    return req.text();
  }

  override readonly getInput: (year: number, day: number) => Promise<string> =
    memoizy(
      async (year: number, day: number): Promise<string> => {
        const cacheDb = await this.dbManager.getCacheDb();
        const cachedResults = cacheDb.query<[string]>(
          "SELECT input FROM inputs WHERE year = ? AND day = ?",
          [year, day],
        );
        if (cachedResults[0]) {
          return cachedResults[0][0];
        }

        const input = await this.fetchInput(year, day);
        cacheDb.query(
          "INSERT INTO inputs (year, day, input) VALUES (?, ?, ?)",
          [
            year,
            day,
            input,
          ],
        );
        return input;
      },
    );

  clearData() {
    return this.dbManager.clearData();
  }
}
