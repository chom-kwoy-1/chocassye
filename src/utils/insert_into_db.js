import fs from "fs";
import { Packr } from "msgpackr";
import { format } from "node-pg-format";
import { promisify } from "util";

import { make_ngrams } from "./ngram.js";

function deadlock_retry(pool, query, args = []) {
  return pool.query(query, args).catch((err) => {
    if (err.code === "40P01") {
      console.error("Deadlock detected, retrying...");
      return deadlock_retry(pool, query, args);
    } else {
      throw err;
    }
  });
}

async function save_to_file(prefix, ngram_map, index) {
  const packr = new Packr();
  const buf = packr.pack(ngram_map);
  await promisify(fs.writeFile)(`./index/${prefix}_${index}.bin`, buf);
}

export async function insert_into_db(pool, index, book_details, sentences) {
  await deadlock_retry(
    pool,
    `
      INSERT INTO books (
        filename, year, year_sort, decade_sort, year_start, year_end, year_string,
        attributions, bibliography, num_sentences, non_chinese_sentence_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      );
    `,
    [
      book_details.filename,
      book_details.year,
      book_details.year_sort,
      book_details.decade_sort,
      book_details.year_start,
      book_details.year_end,
      book_details.year_string,
      JSON.stringify(book_details.attributions),
      book_details.bibliography,
      book_details.num_sentences,
      book_details.non_chinese_sentence_count,
    ],
  );

  const ngram_map_common = new Map();
  const ngram_map_sep = new Map();
  const ngram_map_nosep = new Map();
  for (let sentence of sentences) {
    await deadlock_retry(
      pool,
      `
        INSERT INTO sentences (
          filename, text, text_without_sep, text_with_tone, html, 
          type, lang, page, orig_tag, number_in_page, number_in_book, hasImages, 
          year_sort, decade_sort
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING id;
      `,
      [
        sentence.filename,
        sentence.text,
        sentence.text_without_sep,
        sentence.text_with_tone,
        sentence.html,
        sentence.type,
        sentence.lang,
        sentence.page,
        sentence.orig_tag,
        sentence.number_in_page,
        sentence.number_in_book,
        sentence.hasImages,
        sentence.year_sort,
        sentence.decade_sort,
      ],
    ).then(async (sentence_result) => {
      const sentence_id = sentence_result.rows[0].id;
      if (process.env.PG_INSERT_NGRAMS === "true") {
        await pg_insert_ngrams(sentence, sentence_id, pool);
      }

      const text = sentence.text;
      let ngrams_sep = new Set([
        // ...make_ngrams(text, 1),
        // ...make_ngrams(text, 2),
        ...make_ngrams(text, 3),
      ]);

      const text_without_sep = sentence.text_without_sep;
      let ngrams_nosep = new Set();
      if (text_without_sep !== undefined) {
        ngrams_nosep = new Set([
          // ...make_ngrams(text_without_sep, 1),
          // ...make_ngrams(text_without_sep, 2),
          ...make_ngrams(text_without_sep, 3),
        ]);
      }

      let ngrams_common = new Set();
      for (const ngram of ngrams_sep) {
        if (ngrams_nosep.has(ngram)) {
          ngrams_common.add(ngram);
        }
      }
      ngrams_sep = Array.from(ngrams_sep).filter(
        (ngram) => !ngrams_common.has(ngram),
      );
      ngrams_nosep = Array.from(ngrams_nosep).filter(
        (ngram) => !ngrams_common.has(ngram),
      );
      ngrams_common = Array.from(ngrams_common);

      for (const ngram of ngrams_common) {
        if (ngram_map_common.has(ngram)) {
          ngram_map_common.get(ngram).push(sentence_id);
        } else {
          ngram_map_common.set(ngram, [sentence_id]);
        }
      }
      for (const ngram of ngrams_sep) {
        if (ngram_map_sep.has(ngram)) {
          ngram_map_sep.get(ngram).push(sentence_id);
        } else {
          ngram_map_sep.set(ngram, [sentence_id]);
        }
      }
      for (const ngram of ngrams_nosep) {
        if (ngram_map_nosep.has(ngram)) {
          ngram_map_nosep.get(ngram).push(sentence_id);
        } else {
          ngram_map_nosep.set(ngram, [sentence_id]);
        }
      }
    });
  }
  await save_to_file("common", ngram_map_common, index);
  await save_to_file("sep", ngram_map_sep, index);
  await save_to_file("nosep", ngram_map_nosep, index);
}

function pg_insert_ngrams(sentence, sentence_id, pool) {
  let data = "";
  let cnt = 0;

  const text = sentence.text;
  const text_ngrams = [
    ...make_ngrams(text, 1),
    ...make_ngrams(text, 2),
    ...make_ngrams(text, 3),
  ];
  for (let ngram of text_ngrams) {
    data += format("(%L, false),", ngram);
    cnt += 1;
  }

  if (sentence.text_without_sep !== undefined) {
    const text_without_sep = sentence.text_without_sep;
    const text_without_sep_ngrams = [
      ...make_ngrams(text_without_sep, 1),
      ...make_ngrams(text_without_sep, 2),
      ...make_ngrams(text_without_sep, 3),
    ];
    for (let ngram of text_without_sep_ngrams) {
      data += format("(%L, true),", ngram);
      cnt += 1;
    }
  }

  if (cnt === 0) {
    return Promise.resolve();
  }

  data = data.slice(0, -1);

  const query = `
    WITH 
      input_rows(ngram, is_without_sep) AS (VALUES ${data}),
      ins AS (
        INSERT INTO ngrams(ngram, is_without_sep)
        SELECT * FROM input_rows
        ON CONFLICT DO NOTHING
        RETURNING id
      )
    INSERT INTO ngram_rel(ngram_id, sentence_id)
      SELECT id AS ngram_id, ${sentence_id} AS sentence_id FROM ins
        UNION ALL
      SELECT n.id AS ngram_id, ${sentence_id} AS sentence_id FROM 
        input_rows JOIN ngrams n USING (ngram, is_without_sep)
      ON CONFLICT DO NOTHING;
  `;

  return deadlock_retry(pool, query);
}
