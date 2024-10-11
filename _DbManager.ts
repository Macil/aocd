import { dir } from "@cross/dir";
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";
import memoize from "@korkje/memz";

export class DbManager {
  #getDataDir = memoize(async () => {
    const dataDir = await dir("data");
    if (!dataDir) throw new Error("Could not find data directory");
    return dataDir + "/aocd";
  });

  async #getMainDbPath() {
    return await this.#getDataDir() + "/main.db";
  }

  readonly getMainDb = memoize(async () => {
    await Deno.permissions.request({
      name: "read",
      path: await this.#getDataDir(),
    });
    await Deno.mkdir(await this.#getDataDir(), { recursive: true });
    const db = new DB(await this.#getMainDbPath());
    db.query(`\
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session TEXT NOT NULL
      )
    `);
    return db;
  });

  #getCacheDir = memoize(async () => {
    const cacheDir = await dir("cache");
    if (!cacheDir) throw new Error("Could not find cache directory");
    return cacheDir + "/aocd";
  });

  async #getCacheDbPath() {
    return await this.#getCacheDir() + "/cache.db";
  }

  readonly getCacheDb = memoize(async () => {
    await Deno.permissions.request({
      name: "read",
      path: await this.#getCacheDir(),
    });
    await Deno.mkdir(await this.#getCacheDir(), { recursive: true });
    const db = new DB(await this.#getCacheDbPath());
    db.query(`\
      CREATE TABLE IF NOT EXISTS inputs (
        year INTEGER NOT NULL,
        day INTEGER NOT NULL,
        input TEXT,
        PRIMARY KEY (year, day)
      )
    `);
    db.query(`\
      CREATE TABLE IF NOT EXISTS sent_solutions (
        year INTEGER NOT NULL,
        day INTEGER NOT NULL,
        part INTEGER NOT NULL,
        solution TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        correct INTEGER NOT NULL,
        PRIMARY KEY (year, day, part, solution)
      )
    `);
    return db;
  });

  async clearData() {
    async function rmIgnoringMissing(path: string) {
      try {
        await Deno.remove(path);
      } catch (err) {
        if (err instanceof Error && err?.name !== "NotFound") {
          throw err;
        }
      }
    }
    await Promise.all([
      rmIgnoringMissing(await this.#getMainDbPath()),
      rmIgnoringMissing(await this.#getCacheDbPath()),
    ]);
  }
}
