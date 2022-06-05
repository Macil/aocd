import { DB } from "https://deno.land/x/sqlite@v3.4.0/mod.ts";
import cacheDir from "https://deno.land/x/dir@1.4.0/cache_dir/mod.ts";
import dataDir from "https://deno.land/x/dir@1.4.0/data_dir/mod.ts";
import { memoizy } from "https://deno.land/x/memoizy@1.0.0/mod.ts";
import { dirname } from "https://deno.land/std@0.142.0/path/mod.ts";

export class DbManager {
  private getMainDbPath() {
    const dataDir_ = dataDir();
    if (!dataDir_) throw new Error("Could not find data directory");
    return dataDir_ + "/aocd/main.db";
  }

  readonly getMainDb = memoizy(async () => {
    const dbPath = this.getMainDbPath();
    await Deno.mkdir(dirname(dbPath), { recursive: true });
    const db = new DB(dbPath);
    db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session TEXT NOT NULL
      )
    `);
    return db;
  });

  private getCacheDbPath() {
    const cacheDir_ = cacheDir();
    if (!cacheDir_) throw new Error("Could not find cache directory");
    return cacheDir_ + "/aocd/cache.db";
  }

  readonly getCacheDb = memoizy(async () => {
    const dbPath = this.getCacheDbPath();
    await Deno.mkdir(dirname(dbPath), { recursive: true });
    const db = new DB(dbPath);
    db.query(`
      CREATE TABLE IF NOT EXISTS inputs (
        year INTEGER NOT NULL,
        day INTEGER NOT NULL,
        input TEXT,
        PRIMARY KEY (year, day)
      )
    `);
    return db;
  });

  async clearData() {
    async function rmIgnoringMissing(path: string) {
      try {
        await Deno.remove(path);
      } catch (err) {
        if (err?.name !== "NotFound") {
          throw err;
        }
      }
    }
    await Promise.all([
      rmIgnoringMissing(this.getMainDbPath()),
      rmIgnoringMissing(this.getCacheDbPath()),
    ]);
  }
}
