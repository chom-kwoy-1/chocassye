"use server";

import escapeStringRegexp from "escape-string-regexp";
import { format } from "node-pg-format";

import { getNgramIndex, getPool } from "@/app/db";
import { makeCorpusQuery } from "@/utils/search";

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

  let queryString = makeCorpusQuery(
    query.term,
    query.doc,
    query.excludeModern,
    query.ignoreSep,
    await getNgramIndex(),
  );

  if (queryString === null) {
    return {
      status: "success",
      results: [],
      page_N: PAGE_N,
    };
  }

  queryString = `
    WITH 
      ids AS (
        SELECT s.id AS id
          FROM ${queryString}
          GROUP BY s.id, s.year_sort, s.filename, s.number_in_book
          ORDER BY
            s.year_sort ASC,
            s.filename::bytea ASC,
            s.number_in_book ASC
        OFFSET $1
        LIMIT $2
      )
    SELECT 
      b.filename AS filename,
      b.year AS year,
      b.year_start AS year_start,
      b.year_end AS year_end,
      b.year_string AS year_string,
      b.year_sort AS year_sort,
      st.*
      FROM sentences st JOIN ids ON st.id = ids.id
        JOIN books b ON st.filename = b.filename
      ORDER BY
        st.year_sort ASC,
        st.filename ASC,
        st.number_in_book ASC
  `;

  const page = query.page ?? 1;
  const offset = (page - 1) * PAGE_N;

  try {
    const pool = await getPool();
    const results = await pool.query(queryString, [offset, PAGE_N]);

    const elapsed = new Date().getTime() - beginTime.getTime();
    console.log("Successfully retrieved search results in " + elapsed + "ms");

    const books: Book[] = [];
    for (const row of results.rows) {
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

  let queryString = makeCorpusQuery(
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

  queryString = `
    SELECT s.decade_sort AS period, CAST(COUNT(DISTINCT s.id) AS INTEGER) AS num_hits
      FROM ${queryString}
      GROUP BY s.decade_sort
  `;

  try {
    const pool = await getPool();
    const results = await pool.query(queryString);

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
