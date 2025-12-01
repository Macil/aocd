import { userAgent } from "./version.ts";
import type { Answer, AocdSource } from "./_common.ts";
import { DbManager } from "./_DbManager.ts";
import memoize from "@korkje/memz";

export interface DefaultAocdSourceOptions {
  /**
   * Read input from a file instead of from the Advent of Code website.
   */
  inputFile?: string | URL;
}

export class DefaultAocdSource implements AocdSource {
  readonly #options: DefaultAocdSourceOptions;
  #dbManager = new DbManager();

  constructor(options?: DefaultAocdSourceOptions) {
    this.#options = options ?? {};
  }

  readonly #getSessionCookie = memoize(async (): Promise<string> => {
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

    const db = await this.#dbManager.getMainDb();
    const result = db.prepare("SELECT session FROM sessions LIMIT 1").get();
    if (result) {
      return result.session;
    }
    throw new Error(
      "Could not find Advent of Code session cookie. You need to install the aocd CLI tool and run the `aocd set-cookie` command first (https://github.com/Macil/aocd#install).",
    );
  });

  async setSessionCookie(session: string) {
    const db = await this.#dbManager.getMainDb();
    try {
      db.exec("BEGIN TRANSACTION");
      db.exec("DELETE FROM sessions");
      db.prepare("INSERT INTO sessions (session) VALUES (?)").run(session);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }

  async #fetchInput(year: number, day: number): Promise<string> {
    const url = `https://adventofcode.com/${year}/day/${day}/input`;
    console.warn(`Fetching ${url}`);
    const AOC_SESSION = await this.#getSessionCookie();
    const req = await fetch(
      url,
      {
        headers: {
          Cookie: `session=${AOC_SESSION}`,
          "User-Agent": userAgent,
        },
      },
    );
    if (!req.ok) {
      await this.#logResponseError(req);
      throw new Error(`Bad response: ${req.status}`);
    }
    return req.text();
  }

  #readInputFile = memoize(async (): Promise<string> => {
    if (this.#options.inputFile == null) {
      throw new Error("No input file");
    }
    return await Deno.readTextFile(this.#options.inputFile);
  });

  readonly getInput: (year: number, day: number) => Promise<string> = memoize(
    async (year: number, day: number): Promise<string> => {
      if (this.#options.inputFile != null) {
        return this.#readInputFile();
      }

      const cacheDb = await this.#dbManager.getCacheDb();
      const cachedResult = cacheDb.prepare(
        "SELECT input FROM inputs WHERE year = ? AND day = ?",
      ).get(year, day);
      if (cachedResult) {
        return cachedResult.input;
      }

      const input = await this.#fetchInput(year, day);
      cacheDb.prepare(
        "INSERT INTO inputs (year, day, input) VALUES (?, ?, ?)",
      ).run(year, day, input);
      return input;
    },
  );

  clearData(): Promise<void> {
    return this.#dbManager.clearData();
  }

  readonly #fetchProblem: (
    year: number,
    day: number,
  ) => Promise<string> = memoize(
    async (year: number, day: number): Promise<string> => {
      const url = `https://adventofcode.com/${year}/day/${day}`;
      const AOC_SESSION = await this.#getSessionCookie();
      const req = await fetch(
        url,
        {
          headers: {
            Cookie: `session=${AOC_SESSION}`,
            "User-Agent": userAgent,
          },
        },
      );
      if (!req.ok) {
        await this.#logResponseError(req);
        throw new Error(`Bad response: ${req.status}`);
      }
      return this.#getMainElementHtml(await req.text());
    },
  );

  #getMainElementHtml(fullHtml: string): string {
    const match = /<main\b[^>]*>(.*)<\/main>/s.exec(fullHtml);
    if (!match) {
      throw new Error("Could not find main element in response");
    }
    return match[1];
  }

  readonly submit: (
    year: number,
    day: number,
    part: number,
    solution: Answer,
  ) => Promise<boolean> = memoize(
    async (
      year: number,
      day: number,
      part: number,
      solution: Answer,
    ): Promise<boolean> => {
      const cacheDb = await this.#dbManager.getCacheDb();
      const cachedResult = cacheDb.prepare(
        "SELECT solution, correct FROM sent_solutions WHERE year = ? AND day = ? AND part = ? AND (solution = ? OR correct)",
      ).get(year, day, part, solution);
      if (cachedResult) {
        const cachedSolution = cachedResult.solution as string;
        const correct = cachedResult.correct as number;
        if (
          typeof solution === "number"
            ? Number(cachedSolution) === solution
            : String(cachedSolution) === solution
        ) {
          return correct !== 0;
        } else {
          return false;
        }
      }

      const correct = await this.#submitToServer(year, day, part, solution);
      cacheDb.prepare(
        "INSERT INTO sent_solutions (year, day, part, solution, correct) VALUES (?, ?, ?, ?, ?)",
      ).run(year, day, part, solution, correct ? 1 : 0);
      return correct;
    },
  );

  async #submitToServer(
    year: number,
    day: number,
    part: number,
    solution: Answer,
  ): Promise<boolean> {
    const url = `https://adventofcode.com/${year}/day/${day}/answer`;
    console.warn(`Submitting to ${url}`);
    const AOC_SESSION = await this.#getSessionCookie();

    const req = await fetch(
      url,
      {
        method: "POST",
        headers: {
          Cookie: `session=${AOC_SESSION}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": userAgent,
        },
        body: new URLSearchParams({
          level: String(part),
          answer: String(solution),
        }),
      },
    );
    if (!req.ok) {
      await this.#logResponseError(req);
      throw new Error(`Bad response: ${req.status}`);
    }
    const mainHtml = this.#getMainElementHtml(await req.text());

    if (mainHtml.includes("That's the right answer!")) {
      return true;
    }

    if (mainHtml.includes("That's not the right answer")) {
      return false;
    }

    if (mainHtml.includes("You don't seem to be solving the right level.")) {
      const problem = await this.#fetchProblem(year, day);
      const problemSplitByPart = problem.split("</article>");
      let relevantProblemPart = problemSplitByPart[part];
      if (!relevantProblemPart) {
        console.error("Response:", JSON.stringify(mainHtml));
        throw new Error("Could not find correct answer in page");
      }
      relevantProblemPart = relevantProblemPart.split("<article")[0];
      const match = /Your puzzle answer was <code>([^<]+)<\/code>/.exec(
        relevantProblemPart,
      );
      if (!match) {
        console.error("Response:", JSON.stringify(mainHtml));
        throw new Error("Could not find correct answer in page");
      }
      const correctAnswer = match[1];
      return typeof solution === "number"
        ? Number(correctAnswer) === solution
        : String(correctAnswer) === solution;
    }

    if (mainHtml.includes("To play, please identify yourself")) {
      throw new Error(
        "Session cookie is invalid. Set it with `aocd set-cookie COOKIE`.",
      );
    }

    console.error("Response:", JSON.stringify(mainHtml));
    throw new Error("Could not parse response");
  }

  async #logResponseError(req: Response) {
    const text = await req.text();
    if (req.status === 500) {
      console.error(
        "Unknown server error. Is the session cookie correct? Try setting it with `aocd set-cookie COOKIE`.",
      );
    } else if (req.status === 400 && text.includes("Please log in")) {
      console.error(
        "Session cookie is invalid. Set it with `aocd set-cookie COOKIE`.",
      );
    } else {
      console.error(`Got status ${req.status}. Response:`);
      console.error(JSON.stringify(text));
    }
  }
}
