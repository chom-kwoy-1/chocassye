"use server";

import escapeStringRegexp from "escape-string-regexp";
import { format } from "node-pg-format";

import { getNgramIndex, getPool } from "@/app/db";
import { makeCorpusQuery, makeCorpusStatsQuery } from "@/utils/search";

const PAGE_N: number = parseInt(process.env.PAGE_N || "50");

export type SearchQuery = {
  term: string;
  doc: string;
  page: number;
  excludeModern: boolean;
  ignoreSep: boolean;
};

type Sentence = {
  text: string;
};

export type Book = {
  name: string;
  year: number;
  year_start: number;
  year_end: number;
  year_string: string;
  year_sort: number;
  sentences: Sentence[];
  count: number;
};

export async function search(
  query: SearchQuery,
): Promise<
  | { status: "success"; results: Book[]; page_N: number }
  | { status: "error"; msg: string }
> {
  // Get current time
  const beginTime = new Date();

  // Get current timestamp
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} | Search text=${query.term} doc=${query.doc}`);

  const pool = await getPool();
  const client = await pool.connect();

  try {
    const page = query.page ?? 1;
    const offset = (page - 1) * PAGE_N;

    const results = await makeCorpusQuery(
      client,
      query.term,
      query.doc,
      query.excludeModern,
      query.ignoreSep,
      offset,
      PAGE_N,
      await getNgramIndex(),
    );

    const elapsed = new Date().getTime() - beginTime.getTime();
    console.log("Successfully retrieved search results in " + elapsed + "ms");

    if (results === null) {
      return {
        status: "success",
        results: [],
        page_N: PAGE_N,
      };
    }

    const books: Book[] = [];
    for (const row of results) {
      if (books.length === 0 || books[books.length - 1].name !== row.filename) {
        books.push({
          name: row.filename,
          year: row.year,
          year_start: row.year_start,
          year_end: row.year_end,
          year_string: row.year_string,
          year_sort: row.year_sort,
          sentences: [],
          count: 0,
        });
      }
      books[books.length - 1].sentences.push(row);
      books[books.length - 1].count += 1;
    }

    return {
      status: "success",
      results: books,
      page_N: PAGE_N,
    };
  } catch (err) {
    console.log(err);
    return {
      status: "error",
      msg: "Database query failed",
    };
  } finally {
    client.release();
  }
}

export async function getStats(query: SearchQuery): Promise<
  | {
      status: "success";
      num_results: number;
      histogram: { period: number; num_hits: number }[];
    }
  | { status: "error"; msg: string }
> {
  // Get current time
  const beginTime = new Date();

  // Get current timestamp
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} | SearchStats text=${query.term} doc=${query.doc}`);

  const pool = await getPool();
  const client = await pool.connect();

  try {
    const queryString = await makeCorpusStatsQuery(
      query.term,
      query.doc,
      query.excludeModern,
      query.ignoreSep,
      await getNgramIndex(),
    );

    if (queryString === null) {
      return {
        status: "success",
        num_results: 0,
        histogram: [],
      };
    }

    const results = await client.query(queryString);

    const elapsed = new Date().getTime() - beginTime.getTime();
    console.log("Successfully retrieved search stats in " + elapsed + "ms");

    let totalCount = 0;
    for (const row of results.rows) {
      totalCount += row.num_hits;
    }
    return {
      status: "success",
      num_results: totalCount,
      histogram: results.rows,
    };
  } catch (err) {
    console.log(err);
    return {
      status: "error",
      msg: "Database query failed",
    };
  } finally {
    client.release();
  }
}

type DocSuggestResult = {
  name: string;
  year: number;
  year_start: number;
  year_end: number;
  year_string: string;
};

export async function docSuggest(
  doc: string,
): Promise<
  | { status: "success"; total_rows: number; results: DocSuggestResult[] }
  | { status: "error"; msg: string }
> {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} | docSuggest doc=${doc}`);

  try {
    const pool = await getPool();
    const docs = await pool.query(
      format(
        `
        SELECT * FROM books
        WHERE filename ~ %L
        ORDER BY year_sort ASC, filename::bytea ASC
        LIMIT 10
      `,
        [escapeStringRegexp(doc)],
      ),
    );

    // rename keys in docs
    const renamedDocs = docs.rows.map((doc) => {
      return {
        name: doc.filename,
        year: doc.year,
        year_start: doc.year_start,
        year_end: doc.year_end,
        year_string: doc.year_string,
      };
    });

    return {
      status: "success",
      total_rows: renamedDocs.length,
      results: renamedDocs,
    };
  } catch (err) {
    console.log(err);
    return {
      status: "error",
      msg: "Database query failed",
    };
  }
}
