import { format } from "node-pg-format";

import { searchTerm2Regex } from "@/components/Regex.mjs";

import type { NgramMaps } from "./load_ngram_index";
import { make_ngrams } from "./ngram";
import { find_candidate_ids } from "./regex_index";

export function makeCorpusQuery(
  term: string,
  doc: string,
  excludeModern: boolean,
  ignoreSep: boolean,
  ngramIndex: NgramMaps,
): string | null {
  if (term === "") {
    return null;
  }

  const use_legacy_search = process.env.USE_LEGACY_SEARCH === "1";
  if (use_legacy_search) {
    return makeCorpusQueryLegacy(term, doc, excludeModern, ignoreSep);
  }

  const regex = searchTerm2Regex(term, ignoreSep);
  console.log(regex.source);
  if (regex.source === "" || regex.source === "(?:)") {
    return null; // No valid regex to search for
  }
  const index = [
    ngramIndex.common,
    ignoreSep ? ngramIndex.nosep : ngramIndex.sep,
  ];

  const textFieldName = ignoreSep ? "s.text_without_sep" : "s.text";

  let queryString = null;
  try {
    const cand_ids = find_candidate_ids(
      regex,
      index,
      process.env.SEARCH_VERBOSE === "1",
    );
    console.log(`Got ${cand_ids.size} candidate IDs for term "${term}"`);

    if (cand_ids.size === 0) {
      return null;
    }

    queryString = format(
      `sentences s WHERE s.id IN (%L) AND ${textFieldName} ~ %L`,
      Array.from(cand_ids),
      [regex.source],
    );
  } catch (error) {
    console.error(
      `Error while searching "${term}", falling back to psql`,
      error,
    );
    queryString = format(`sentences s WHERE ${textFieldName} ~ %L`, [
      regex.source,
    ]);
  }

  if (doc !== "") {
    queryString += format(" AND s.filename LIKE %L", ["%" + doc + "%"]);
  }

  if (excludeModern) {
    queryString +=
      " AND (s.lang IS NULL OR (s.lang NOT IN ('mod', 'modern translation', 'pho') AND s.lang NOT LIKE '%역'))";
  }
  return queryString;
}

function makeCorpusQueryLegacy(
  term: string,
  doc: string,
  excludeModern: boolean,
  ignoreSep: boolean,
): string | null {
  const textFieldName = ignoreSep ? "s.text_without_sep" : "s.text";

  let queryString;
  if (
    !term.includes("%") &&
    !term.includes("_") &&
    !term.startsWith("^") &&
    !term.endsWith("$")
  ) {
    let queryText = term;
    if (ignoreSep) {
      queryText = queryText.replace(/[ .^]/g, "");
    }

    if (queryText.length === 0) {
      return null;
    }

    const ngrams: string[] = make_ngrams(
      queryText,
      Math.min(queryText.length, 4),
    );
    const ngramsString = ngrams.map((ngram) => format("%L", ngram)).join(", ");
    const regex = searchTerm2Regex(term, ignoreSep);

    const ignoreSepString = ignoreSep ? "is_without_sep" : "NOT is_without_sep";

    queryString = `
      ngram_rel r JOIN sentences s ON s.id = r.sentence_id
        WHERE r.ngram_id = ANY((SELECT array(
          SELECT id FROM ngrams
          WHERE ngram IN (${ngramsString})
          AND ${ignoreSepString}
        ))::integer[])
    `;

    if (queryText.length > 4) {
      queryString += format(` AND ${textFieldName} ~ %L`, [regex.source]);
    }
  } else {
    const regex = searchTerm2Regex(term, ignoreSep);
    queryString = format(
      `
        ngram_rel r JOIN sentences s ON s.id = r.sentence_id
          WHERE ${textFieldName} ~ %L
      `,
      [regex.source],
    );
  }

  if (doc !== "") {
    queryString += format(" AND s.filename LIKE %L", ["%" + doc + "%"]);
  }

  if (excludeModern) {
    queryString +=
      " AND (s.lang IS NULL OR (s.lang NOT IN ('mod', 'modern translation', 'pho') AND s.lang NOT LIKE '%역'))";
  }

  return queryString;
}
