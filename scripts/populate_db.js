'use strict';

import pg from 'pg';
import {insert_into_db} from "../src/utils/insert_into_db.js";
import {insert_documents} from "../src/utils/parse_xml.js";
import fs from "fs";
import {insert_txt_documents} from "./add_txt_to_db";

async function populate_db(database_name, doc_cnt) {
  const {Pool} = pg;
  const startPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'password',
  });

  // drop tables `books` and `sentences`
  const pool = await startPool.query(`
    CREATE DATABASE ${database_name} 
      WITH OWNER postgres ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' TEMPLATE template0;
    `)
    .catch(err => {})
    .then(() => {
      const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: database_name,
        password: 'password',
      });
      console.log("Connected successfully to server");
      return pool;
    });

  // make new directory called `index`
  fs.mkdirSync('index', { recursive: true });

  return pool.query('DROP TABLE IF EXISTS books, sentences, ngrams, ngram_rel CASCADE;')
    .then(() => {
      console.log("Dropped tables.");
      const create_books = `
        CREATE TABLE books (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          filename TEXT,
          year INTEGER,
          year_sort INTEGER, 
          decade_sort INTEGER, 
          year_start INTEGER, 
          year_end INTEGER, 
          year_string TEXT, 
          attributions JSONB, 
          bibliography TEXT, 
          num_sentences INTEGER, 
          non_chinese_sentence_count INTEGER
        );
      `;
      const create_sentences = `
        CREATE TABLE sentences (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          filename TEXT,
          text TEXT,
          text_without_sep TEXT,
          text_with_tone TEXT,
          html TEXT, 
          type TEXT, 
          lang TEXT, 
          page TEXT, 
          orig_tag TEXT, 
          number_in_page TEXT, 
          number_in_book INTEGER, 
          hasImages BOOLEAN, 
          year_sort INTEGER, 
          decade_sort INTEGER
        );
      `;
      const create_ngrams = `
        CREATE TABLE ngrams (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          ngram VARCHAR(4),
          is_without_sep BOOLEAN,
          UNIQUE(ngram, is_without_sep)
        );
      `;
      return Promise.all([
        pool.query(create_books),
        pool.query(create_sentences),
        pool.query(create_ngrams),
      ]);
    })
    .then(() => {
      const create_ngram_rel = `
        CREATE TABLE ngram_rel (
          ngram_id INTEGER REFERENCES ngrams(id),
          sentence_id INTEGER REFERENCES sentences(id),
          PRIMARY KEY(ngram_id, sentence_id)
        );
      `;
      return pool.query(create_ngram_rel);
    })
    .then(async () => {
      const BATCH_SIZE = process.env.BATCH ? parseInt(process.env.BATCH) : 16;
      console.log("Batch size:", BATCH_SIZE);

      function insert(index, book_details, sentences) {
        return insert_into_db(pool, index, book_details, sentences);
      }

      await insert_txt_documents(pool, doc_cnt);
      await insert_documents(insert, BATCH_SIZE, doc_cnt);
    })
    .then(() => {
      console.log("Populated tables.");
      console.log("Creating indexes...");
      return pool.query(`
        CREATE INDEX IF NOT EXISTS sentence_id
          ON public.ngram_rel USING btree
          (sentence_id ASC NULLS LAST)
          WITH (deduplicate_items=True)
          TABLESPACE pg_default; 
      `);
    })
    .then(() => {
      return pool.query(`
        CREATE INDEX IF NOT EXISTS decade_sort
          ON public.sentences USING btree
          (decade_sort ASC NULLS LAST)
          WITH (deduplicate_items=True)
          TABLESPACE pg_default;
      `);
    })
    .then(() => {
      return pool.query(`
        CREATE INDEX IF NOT EXISTS sentences_year_sort_filename_number_in_book_idx
          ON public.sentences USING btree
          (year_sort ASC NULLS LAST, filename COLLATE pg_catalog."default" ASC NULLS LAST, number_in_book ASC NULLS LAST)
          WITH (deduplicate_items=True)
          TABLESPACE pg_default;
      `);
    })
    .then(() => {
      console.log("Created indexes.");
      console.log("Cleaning up...");
    });
}

if (!process.env.DB_NAME) {
  console.error("Please set the DB_NAME environment variable.");
  process.exit(1);
}
const doc_cnt = process.env.DOC_CNT ? parseInt(process.env.DOC_CNT) : null;
populate_db(process.env.DB_NAME, doc_cnt)
  .then(() => {
    console.log("Database populated successfully.");
  })
