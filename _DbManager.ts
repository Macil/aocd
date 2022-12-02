import cacheDir from "https://deno.land/x/dir@1.5.1/cache_dir/mod.ts";
import dataDir from "https://deno.land/x/dir@1.5.1/data_dir/mod.ts";
import once from "https://deno.land/x/once@0.3.0/index.ts";
import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";

export class DbManager {
  private getDataDir = once(() => {
    const dataDir_ = dataDir();
    if (!dataDir_) throw new Error("Could not find data directory");
    return dataDir_ + "/aocd";
  });

  private getMainDbPath() {
    return this.getDataDir() + "/main.db";
  }

  readonly getMainDb = once(async () => {
    await Deno.permissions.request({
      name: "read",
      path: this.getDataDir(),
    });
    await Deno.mkdir(this.getDataDir(), { recursive: true });
    const db = new DB(this.getMainDbPath());
    db.query(`\
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session TEXT NOT NULL
      )
    `);
    return db;
  });

  private getCacheDir = once(() => {
    const cacheDir_ = cacheDir();
    if (!cacheDir_) throw new Error("Could not find cache directory");
    return cacheDir_ + "/aocd";
  });

  private getCacheDbPath() {
    return this.getCacheDir() + "/cache.db";
  }

  readonly getCacheDb = once(async () => {
    await Deno.permissions.request({
      name: "read",
      path: this.getCacheDir(),
    });
    await Deno.mkdir(this.getCacheDir(), { recursive: true });
    const db = new DB(this.getCacheDbPath());
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
        solution INTEGER NOT NULL,
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
