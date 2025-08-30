"use server";

import { Mutex } from "async-mutex";
import path from "path";
import pg from "pg";

import { NgramMaps, loadNgramIndex } from "@/utils/load_ngram_index";

const DB_NAME = process.env.DB_NAME || "chocassye";
const DB_PASSWORD = process.env.DB_PASSWORD || "password";

const { Pool } = pg;
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: DB_NAME,
  password: DB_PASSWORD,
  statement_timeout: 10000, // 10 seconds
});
console.log(`Connected successfully to DB ${DB_NAME}`);

export async function getPool() {
  return pool;
}

let ngramIndex: NgramMaps | null = null;
const mutex = new Mutex();

export async function getNgramIndex() {
  return await mutex.runExclusive(async () => {
    if (ngramIndex !== null) {
      return ngramIndex;
    }
    ngramIndex = await loadNgramIndex(path.join(process.cwd(), "index"));
    console.log("Loaded ngram index with", ngramIndex.common.size, "ngrams");
    return ngramIndex;
  });
}
