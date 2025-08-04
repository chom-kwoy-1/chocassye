'use strict';

import express from 'express';
import path from "path";
import http from "http";
import https from "https";
import fs from "fs";
import Rand, { PRNG } from 'rand-seed';

import pg from 'pg';
import { format } from 'node-pg-format';

import escapeStringRegexp from 'escape-string-regexp';
import nodecallspython from 'node-calls-python';
import {make_ngrams} from './ngram.js';

const __dirname = path.resolve();

// create app
const app = express();
const port = process.env.PORT || 5000;
const sslport = process.env.SSLPORT || 5001;
const PAGE_N = process.env.PAGE_N || 50;

const { Pool } = pg;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'chocassye',
    password: 'password',
});
console.log("Connected successfully to DB server");

let http_server;
let https_server = null;
if (process.env.SSL === "ON") {
    // start listening
    const http_redirect_app = express();
    const domain = process.env.DOMAIN || "find.xn--gt1b.xyz";
    http_redirect_app.use(function(req, res) {
        res.redirect('https://' + domain + req.originalUrl);
    });
    http_server = http.createServer(http_redirect_app).listen(port, () => console.log(`Listening on port ${port}`));

    const privateKey = fs.readFileSync("/etc/letsencrypt/live/find.xn--gt1b.xyz/privkey.pem");
    const certificate = fs.readFileSync("/etc/letsencrypt/live/find.xn--gt1b.xyz/cert.pem");
    const ca = fs.readFileSync("/etc/letsencrypt/live/find.xn--gt1b.xyz/chain.pem");
    const credentials = { key: privateKey, cert: certificate, ca: ca };
    https_server = https.createServer(credentials, app).listen(sslport, () => console.log(`Listening on port ${sslport} with SSL`));
}  else {
    // start listening
    http_server = http.createServer(app).listen(port, () => console.log(`Listening on port ${port}`));
}

const wordlist = [];
// read from `chocassye-corpus/wordle.txt`
fs.readFile(path.join(__dirname, 'chocassye-corpus/wordle.txt'), 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading wordle.txt:', err);
        return;
    }
    // split by new line and remove empty lines
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    for (const line of lines) {
        wordlist.push(line);
    }
    console.log(`Loaded ${wordlist.length} words from wordle.txt`);
});

app.use(express.json())
app.use(express.static(path.join(__dirname, "client/build")));


function makeSearchRegex(text, ignoreSep=false) {
    let strippedText = text;
    if (text.startsWith('%')) {
        strippedText = strippedText.substring(1);
    }
    if (text.endsWith('%')) {
        strippedText = strippedText.substring(0, strippedText.length - 1);
    }
    let regex = "";
    let isEscaping = false;
    for (let i = 0; i < strippedText.length; i++) {
        if (strippedText[i] === '%' && !isEscaping) {
            regex += ".*?";
            continue;
        }
        if (strippedText[i] === '_' && !isEscaping) {
            regex += ".";
            continue;
        }
        if (isEscaping) {
            isEscaping = false;
            let s = strippedText[i];
            if (ignoreSep) {
                s = s.replace(/[ .^]/g, "");
            }
            regex += escapeStringRegexp(s);
            continue;
        }
        if (strippedText[i] === '\\') {
            isEscaping = true;
            continue;
        }
        let s = strippedText[i];
        if (ignoreSep) {
            s = s.replace(/[ .^]/g, "");
        }
        regex += escapeStringRegexp(s);
    }
    if (!text.startsWith('%')) {
        regex = `^${regex}`;
    }
    if (!text.endsWith('%')) {
        regex = `${regex}$`;
    }
    return new RegExp(regex);
}


function makeCorpusQuery(query) {
    let text = query.term;
    let doc = query.doc;
    let excludeModern = query.excludeModern;
    let ignoreSep = query.ignoreSep;

    if (text === '%%') {
        return null;
    }

    const textFieldName = ignoreSep? "s.text_without_sep" : "s.text";

    let queryString;
    if (text.startsWith('%') && text.endsWith('%')
        && !text.slice(1, text.length - 1).includes('%')
        && !text.slice(1, text.length - 1).includes('_')) {
        let queryText = text.slice(1, text.length - 1);
        if (ignoreSep) {
            queryText = queryText.replace(/[ .^]/g, "");
        }

        if (queryText.length === 0) {
            return null;
        }

        const ngrams = make_ngrams(queryText, Math.min(queryText.length, 4));
        const ngramsString = ngrams.map(ngram => format('%L', ngram)).join(", ");
        const regex = makeSearchRegex(text, ignoreSep);

        const ignoreSepString = ignoreSep? "is_without_sep" : "NOT is_without_sep";

        queryString = `
            r.ngram_id = ANY((SELECT array(
                SELECT id FROM ngrams
                WHERE ngram IN (${ngramsString})
                AND ${ignoreSepString}
            ))::integer[])
        `;

        if (queryText.length > 4) {
            queryString += format(` AND ${textFieldName} ~ %L`, [regex.source]);
        }
    } else {
        const regex = makeSearchRegex(text, ignoreSep);
        queryString = format(`${textFieldName} ~ %L`, [regex.source]);
    }

    if (doc !== '') {
        queryString += format(" AND s.filename LIKE %L", ['%' + doc + '%']);
    }

    if (excludeModern) {
        queryString += " AND (s.lang IS NULL OR (s.lang NOT IN ('mod', 'modern translation', 'pho') AND s.lang NOT LIKE '%역'))";
    }

    return queryString;
}

app.post('/api/doc_suggest', (req, res) => {
    let doc = req.body.doc;
    console.log(`suggest doc=${doc} ip=${req.socket.remoteAddress}`);

    pool.query(format(`
        SELECT * FROM books
        WHERE filename ~ %L
        ORDER BY year_sort ASC, filename::bytea ASC
        LIMIT 10
    `, [escapeStringRegexp(doc)]))
    .then((docs) => {
        // rename keys in docs
        docs = docs.rows.map(doc => {
            return {
                name: doc.filename,
                year: doc.year,
                year_start: doc.year_start,
                year_end: doc.year_end,
                year_string: doc.year_string
            };
        });
        res.send({
            status: "success",
            total_rows: docs.length,
            results: docs
        });
    });
});

app.post('/api/search', (req, res) => {
    // Get current time
    const beginTime = new Date();

    // Get current timestamp
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ip=${req.socket.remoteAddress} | Search text=${req.body.term} doc=${req.body.doc}`);

    let queryString = makeCorpusQuery(req.body, PAGE_N);

    if (queryString === null) {
        res.send({
            status: "success",
            results: [],
            page_N: PAGE_N,
        });
        return;
    }

    queryString = `
        WITH 
            ids AS (
                SELECT s.id AS id
                    FROM
                    ngram_rel r JOIN sentences s ON s.id = r.sentence_id
                    WHERE ${queryString}
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

    const page = req.body.page ?? 1;
    const offset = (page - 1) * PAGE_N;

    pool.query(queryString, [offset, PAGE_N]).then((results) => {
        const elapsed = new Date() - beginTime;
        console.log("Successfully retrieved search results in " + elapsed + "ms");
        let books = [];
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
        res.send({
            status: "success",
            results: books,
            page_N: PAGE_N,
        });
    }).catch(err => {
        console.log(err.stack);
        res.send({
            status: "error",
            msg: err.message
        });
    });
});

app.post('/api/search_stats', (req, res) => {
    // Get current time
    const beginTime = new Date();

    // Get current timestamp
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ip=${req.socket.remoteAddress} | SearchStats text=${req.body.term} doc=${req.body.doc}`);

    let queryString = makeCorpusQuery(req.body, PAGE_N);

    if (queryString === null) {
        res.send({
            status: "success",
            num_results: 0,
            histogram: [],
        });
        return;
    }

    queryString = `
        SELECT s.decade_sort AS period, CAST(COUNT(DISTINCT s.id) AS INTEGER) AS num_hits
            FROM
            ngram_rel r JOIN sentences s ON s.id = r.sentence_id
            WHERE ${queryString}
            GROUP BY s.decade_sort
    `;

    pool.query(queryString).then((results) => {
        const elapsed = new Date() - beginTime;
        console.log("Successfully retrieved search stats in " + elapsed + "ms");
        let totalCount = 0;
        for (const row of results.rows) {
            totalCount += row.num_hits;
        }
        res.send({
            status: "success",
            num_results: totalCount,
            histogram: results.rows,
        });
    }).catch(err => {
        console.log(err.message);
        res.send({
            status: "error",
            msg: err.message
        });
    });
});

app.get('/api/source', (req, res) => {
    let n = req.query.number_in_source;
    let excludeChinese = req.query.exclude_chinese === "true";
    const page_size = parseInt(req.query.view_count);
    if (isNaN(page_size) || page_size > 200) {
        res.send({
            status: "error",
            msg: "Invalid view_count"
        });
        return;
    }
    let start = Math.floor(n / page_size) * page_size;
    let end = start + page_size;
    console.log(`source doc=${req.query.name} page=${start}-${end} ${typeof(excludeChinese)}`)

    const excludeChineseString = excludeChinese? "AND lang NOT IN ('chi')" : "";

    Promise.all([
        pool.query(`SELECT * FROM books WHERE filename = $1`, [req.query.name]),
        pool.query(`
            SELECT * FROM sentences
                WHERE
                    filename = $1
                    ${excludeChineseString}
                ORDER BY number_in_book ASC
                OFFSET $2
                limit $3
        `, [req.query.name, start, page_size])
    ]).then(([book, sentences]) => {
        console.log("Successfully retrieved source");
        if (book.rows.length === 0 || sentences.rows.length === 0) {
            res.send({
                status: "error",
                msg: "No results found"
            });
        }
        else {
            book = book.rows[0];
            sentences = sentences.rows;
            let data = {
                name: book.filename,
                year_string: book.year_string,
                bibliography: book.bibliography,
                attributions: book.attributions,
                sentences: sentences,
                count: excludeChinese? book.non_chinese_sentence_count : book.num_sentences,
            };
            res.send({
                status: "success",
                data: data,
            });
        }
    }).catch(err => {
        console.log(err.message);
        res.send({
            status: "error",
            msg: err.message
        });
    });
});

app.get('/api/source_list', (req, res) => {
    let offset = req.query.offset;
    let limit = req.query.limit;
    console.log(`source_list offset=${offset} limit=${limit}`);

    pool.query(`
        SELECT *, count(*) OVER() AS full_count FROM books
        ORDER BY year_sort ASC, filename::bytea ASC
        OFFSET $1
        LIMIT $2
    `, [offset, limit])
    .then((result) => {
        console.log("Successfully retrieved source list");
        res.send({
            status: "success",
            data: result.rows,
        });
    }).catch(err => {
        console.log(err.message);
        res.send({
            status: "error",
            msg: err.message
        });
    });
});

app.post('/api/parse', (req, res) => {
    nodecallspython.import("./KoreanVerbParser/main.py").then(async function (pymodule) {
        nodecallspython.call(pymodule, "parse_into_json", req.body.text, 20).then(result => {
            result = JSON.parse(result);
            if (result.error !== undefined) {
                res.send({
                    status: "error",
                    msg: result.error
                });
            } else {
                res.send({
                    status: "success",
                    data: result,
                });
            }
        }).catch(err => {
            console.log(err);
            res.send({
                status: "error",
                msg: err.msg
            });
        });
    }).catch(err => {
        console.log(err);
        res.send({
            status: "error",
            msg: err.msg
        });
    });
});

app.post('/api/hangulize', (req, res) => {
    let text = req.body.text;
    nodecallspython.import("./english_hangul.py").then(async function (pymodule) {
        nodecallspython.call(pymodule, "hangulize", text).then(result => {
            res.send({
                status: "success",
                phonemes: result[0],
                hangul: result[1],
            });
        }).catch(err => {
            console.log(err);
            res.send({
                status: "error",
                msg: err.msg
            });
        });
    }).catch(err => {
        console.log(err);
        res.send({
            status: "error",
            msg: err.msg
        });
    })
});

app.get('/api/wordle', (req, res) => {
    // Get current timestamp
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ip=${req.socket.remoteAddress} | Wordle request`);

    // Get today's number (offset from 2025-08-04)
    const today = new Date();
    const startDate = new Date('2025-08-04');
    const diffTime = today - startDate;
    const todayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    console.log(`Today's number: ${todayNum}`);

    // randomly select a word from the wordlist using the today's number as seed
    const rand = new Rand(todayNum.toString());
    const index = Math.floor(rand.next() * (wordlist.length - 1));
    const word = wordlist[index];

    console.log(`Today's word: ${word}`);

    res.send({
        status: "success",
        todayNum: todayNum,
        word: word,
    })
});

// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/build/index.html'));
});

process.on('SIGINT', () => {
    if (https_server !== null) {
        https_server.close();
    }
    http_server.close();
});
