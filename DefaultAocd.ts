import memoizy from "https://deno.land/x/memoizy@1.0.0/mod.ts";
import { Aocd } from "./_common.ts";
import { DbManager } from "./_DbManager.ts";

export class DefaultAocd extends Aocd {
  private dbManager = new DbManager();

  private readonly getSessionCookie = memoizy(async (): Promise<string> => {
    // Don't try to use the AOC_SESSION env variable unless the user has given access to it.
    const hasAocSessionEnvPerm = await Deno.permissions.query({
      name: "env",
      variable: "AOC_SESSION",
    });
    if (hasAocSessionEnvPerm.state === "granted") {
      const AOC_SESSION = Deno.env.get("AOC_SESSION");
      if (AOC_SESSION) {
        return AOC_SESSION;
      }
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

  private readonly fetchProblem: (
    year: number,
    day: number,
  ) => Promise<string> = memoizy(
    async (year: number, day: number): Promise<string> => {
      const url = `https://adventofcode.com/${year}/day/${day}`;
      const AOC_SESSION = await this.getSessionCookie();
      const req = await fetch(
        url,
        { headers: { Cookie: `session=${AOC_SESSION}` } },
      );
      if (!req.ok) {
        throw new Error(`Bad response: ${req.status}`);
      }
      return this.getMainElementHtml(await req.text());
    },
  );

  private getMainElementHtml(fullHtml: string): string {
    const match = /<main\b[^>]*>(.*)<\/main>/s.exec(fullHtml);
    if (!match) {
      throw new Error("Could not find main element in response");
    }
    return match[1];
  }

  override readonly submit: (
    year: number,
    day: number,
    part: number,
    solution: number,
  ) => Promise<boolean> = memoizy(
    async (
      year: number,
      day: number,
      part: number,
      solution: number,
    ): Promise<boolean> => {
      const cacheDb = await this.dbManager.getCacheDb();
      const cachedResults = cacheDb.query<[number, number]>(
        "SELECT solution, correct FROM sent_solutions WHERE year = ? AND day = ? AND part = ? AND (solution = ? OR correct)",
        [year, day, part, solution],
      );
      if (cachedResults[0]) {
        const [cachedSolution, correct] = cachedResults[0];
        if (cachedSolution === solution) {
          return correct !== 0;
        } else {
          return false;
        }
      }

      const correct = await this.submitToServer(year, day, part, solution);
      cacheDb.query(
        "INSERT INTO sent_solutions (year, day, part, solution, correct) VALUES (?, ?, ?, ?, ?)",
        [
          year,
          day,
          part,
          solution,
          correct ? 1 : 0,
        ],
      );
      return correct;
    },
  );

  private async submitToServer(
    year: number,
    day: number,
    part: number,
    solution: number,
  ): Promise<boolean> {
    const url = `https://adventofcode.com/${year}/day/${day}/answer`;
    console.warn(`Submitting to ${url}`);
    const AOC_SESSION = await this.getSessionCookie();

    const req = await fetch(
      url,
      {
        method: "POST",
        headers: {
          Cookie: `session=${AOC_SESSION}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          level: String(part),
          answer: String(solution),
        }),
      },
    );
    if (!req.ok) {
      throw new Error(`Bad response: ${req.status}`);
    }
    const mainHtml = this.getMainElementHtml(await req.text());

    if (mainHtml.includes("That's the right answer!")) {
      return true;
    }

    if (mainHtml.includes("That's not the right answer.")) {
      return false;
    }

    if (mainHtml.includes("You don't seem to be solving the right level.")) {
      const problem = await this.fetchProblem(year, day);
      const problemSplitByPart = problem.split("</article>");
      let relevantProblemPart = problemSplitByPart[part];
      if (!relevantProblemPart) {
        console.error("Response:", JSON.stringify(mainHtml));
        throw new Error("Could not find correct answer in page");
      }
      relevantProblemPart = relevantProblemPart.split("<article")[0];
      const match = /Your puzzle answer was <code>(\d+)<\/code>/.exec(
        relevantProblemPart,
      );
      if (!match) {
        console.error("Response:", JSON.stringify(mainHtml));
        throw new Error("Could not find correct answer in page");
      }
      const correctAnswer = Number(match[1]);
      return solution === correctAnswer;
    }

    console.error("Response:", JSON.stringify(mainHtml));
    throw new Error("Could not parse response");
  }
}
