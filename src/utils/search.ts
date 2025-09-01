import { format } from "node-pg-format";
import { PoolClient } from "pg";

import { searchTerm2Regex } from "@/components/Regex.mjs";

import type { NgramMaps } from "./load_ngram_index";
import { find_candidate_ids } from "./regex_index";

export type SentenceRow = {
  filename: string;
  year: number;
  year_start: number;
  year_end: number;
  year_string: string;
  year_sort: number;
  id: number;
  text: string;
  text_without_sep: string;
  number_in_book: number;
};

export async function makeCorpusQuery(
  client: PoolClient,
  term: string,
  doc: string,
  excludeModern: boolean,
  ignoreSep: boolean,
  offset: number,
  count: number,
  ngramIndex: NgramMaps,
): Promise<SentenceRow[] | null> {
  if (term === "") {
    return null;
  }

  const regex = searchTerm2Regex(term, ignoreSep);

  let filterDoc = "";
  if (doc !== "") {
    filterDoc = format(" AND st.filename LIKE %L", ["%" + doc + "%"]);
  }

  let filterLang = "";
  if (excludeModern) {
    filterLang = `
        AND (
          st.lang IS NULL 
          OR (st.lang NOT IN ('mod', 'modern translation', 'pho') 
              AND st.lang NOT LIKE '%역')
        )
      `;
  }

  const textFieldName = ignoreSep ? "st.text_without_sep" : "st.text";

  try {
    const candIds = await getCandidateIds(regex, ignoreSep, ngramIndex);
    if (candIds === null) {
      return null;
    }

    console.log(`Got ${candIds.size} candidate IDs for term "${term}"`);

    if (candIds.size === 0) {
      return null;
    }

    await client.query(
      format(
        `SET cursor_tuple_fraction = %L`,
        Math.min(0.00001, (offset + count) / candIds.size),
      ),
    );

    const queryString = format(
      `
        WITH tmp_ids (id) AS (
          VALUES %L
        )
        SELECT b.filename AS filename,
               b.year AS year,
               b.year_start AS year_start,
               b.year_end AS year_end,
               b.year_string AS year_string,
               b.year_sort AS year_sort,
               st.*
          FROM sentences st
            JOIN tmp_ids t ON st.id = t.id
            JOIN books b ON st.filename = b.filename
          WHERE ${textFieldName} ~ %L ${filterDoc} ${filterLang}
          ORDER BY
            st.year_sort ASC,
            st.filename::bytea ASC,
            st.number_in_book ASC
          OFFSET %L
          LIMIT %L
      `,
      Array.from(candIds).map((id) => [id]),
      [regex.source],
      offset,
      count,
    );

    const result = await client.query(queryString);

    return result.rows;
  } catch (error) {
    console.log(`Error while searching "${term}", falling back to psql`, error);

    const results = await client.query(
      format(
        `
          SELECT b.filename AS filename,
            b.year AS year,
            b.year_start AS year_start,
            b.year_end AS year_end,
            b.year_string AS year_string,
            b.year_sort AS year_sort,
            st.*
            FROM sentences st
              JOIN books b ON st.filename = b.filename
            WHERE ${textFieldName} ~ %L
                  ${filterDoc} ${filterLang}
            ORDER BY
              st.year_sort ASC,
              st.filename::bytea ASC,
              st.number_in_book ASC
            OFFSET %L
            LIMIT %L
        `,
        [regex.source],
        offset,
        count,
      ),
    );

    return results.rows;
  }
}

export async function makeCorpusStatsQuery(
  term: string,
  doc: string,
  excludeModern: boolean,
  ignoreSep: boolean,
  ngramIndex: NgramMaps,
) {
  if (term === "") {
    return null;
  }

  const regex = searchTerm2Regex(term, ignoreSep);

  const textFieldName = ignoreSep ? "st.text_without_sep" : "st.text";

  let filterDoc = "";
  if (doc !== "") {
    filterDoc = format(" AND st.filename LIKE %L", ["%" + doc + "%"]);
  }

  let filterLang = "";
  if (excludeModern) {
    filterLang = `
        AND (
          st.lang IS NULL 
          OR (st.lang NOT IN ('mod', 'modern translation', 'pho') 
              AND st.lang NOT LIKE '%역')
        )
      `;
  }

  let queryString = null;
  try {
    const candIds = await getCandidateIds(regex, ignoreSep, ngramIndex);
    if (candIds === null) {
      return null;
    }
    console.log(`Got ${candIds.size} candidate IDs for term "${term}"`);

    if (candIds.size === 0) {
      return null;
    }

    queryString = format(
      `
        WITH tmp_ids (id) AS (
          VALUES %L
        )
        SELECT 
            st.decade_sort AS period, 
            CAST(COUNT(DISTINCT st.id) AS INTEGER) AS num_hits
          FROM sentences st JOIN tmp_ids t ON st.id = t.id
          WHERE ${textFieldName} ~ %L
                ${filterDoc} ${filterLang}
          GROUP BY st.decade_sort
      `,
      Array.from(candIds).map((id) => [id]),
      [regex.source],
    );
  } catch (error) {
    console.log(`Error while searching "${term}", falling back to psql`, error);

    queryString = format(
      `
        SELECT 
            st.decade_sort AS period, 
            CAST(COUNT(DISTINCT st.id) AS INTEGER) AS num_hits
          FROM sentences st
          WHERE ${textFieldName} ~ %L
                ${filterDoc} ${filterLang}
          GROUP BY st.decade_sort
      `,
      [regex.source],
    );
  }

  return queryString;
}

async function getCandidateIds(
  regex: RegExp,
  ignoreSep: boolean,
  ngramIndex: NgramMaps,
): Promise<Set<number> | null> {
  if (regex.source === "" || regex.source === "(?:)") {
    return null; // No valid regex to search for
  }

  const index = [
    ngramIndex.common,
    ignoreSep ? ngramIndex.nosep : ngramIndex.sep,
  ];

  return find_candidate_ids(regex, index, process.env.SEARCH_VERBOSE === "1");
}
