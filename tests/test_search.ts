import path from "path";
import pg from "pg";

import { loadNgramIndex } from "@/utils/load_ngram_index";
import { makeCorpusQuery, makeCorpusStatsQuery } from "@/utils/search";

const DB_NAME = process.env.DB_NAME || "chocassye";
const DB_PASSWORD = process.env.DB_PASSWORD || "password";

async function test() {
  const { Pool } = pg;
  const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: DB_NAME,
    password: DB_PASSWORD,
    statement_timeout: 10000, // 10 seconds
  });
  console.log(`Connected successfully to DB ${DB_NAME}`);

  const ngramIndex = await loadNgramIndex(path.join(process.cwd(), "index"));
  pool
    .connect()
    .then(async (client) => {
      {
        const startTime = new Date();
        const result = await makeCorpusQuery(
          client,
          "hwo.la",
          "언해",
          false,
          false,
          200,
          50,
          ngramIndex,
        );
        const elapsed = new Date().getTime() - startTime.getTime();
        console.log(result);
        console.log("Query executed in " + elapsed + "ms");
      }
      client.release();

      console.log("Finished");
    })
    .then(() => {
      return pool.connect();
    })
    .then(async (client) => {
      {
        const startTime = new Date();
        const queryString = await makeCorpusStatsQuery(
          "hwo.la",
          "언해",
          false,
          false,
          ngramIndex,
        );
        let results = null;
        if (queryString !== null) {
          results = await client.query(queryString);
        }
        const elapsed = new Date().getTime() - startTime.getTime();
        console.log(results);
        console.log("Query executed in " + elapsed + "ms");
      }

      client.release();

      console.log("Finished");
    });
}

test();
