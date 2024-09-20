'use strict';

import express from 'express';
import path from "path";
import http from "http";
import https from "https";
import fs from "fs";
import {MongoClient} from "mongodb";
import escapeStringRegexp from 'escape-string-regexp';
import nodecallspython from 'node-calls-python';
import {make_ngrams} from './ngram.js';

const __dirname = path.resolve();

// create app
const app = express();
const port = process.env.PORT || 5000;
const sslport = process.env.SSLPORT || 5001;

// Connection URL
const db_url = 'mongodb://localhost:27017';

// Create a new MongoClient
const db_client = new MongoClient(db_url);

let http_server;
if (process.env.SSL === "ON") {
    // start listening
    const http_redirect_app = express();
    const domain = process.env.DOMAIN || "find.xn--gt1b.xyz";
    http_redirect_app.use(function(req, res) {
        res.redirect('https://' + domain + req.originalUrl);
    });
    http_server = http.createServer(http_redirect_app).listen(port, () => console.log(`Listening on port ${port}`));
    let https_server = null;

    const privateKey = fs.readFileSync("/etc/letsencrypt/live/find.xn--gt1b.xyz/privkey.pem");
    const certificate = fs.readFileSync("/etc/letsencrypt/live/find.xn--gt1b.xyz/cert.pem");
    const ca = fs.readFileSync("/etc/letsencrypt/live/find.xn--gt1b.xyz/chain.pem");
    const credentials = { key: privateKey, cert: certificate, ca: ca };
    https_server = https.createServer(credentials, app).listen(sslport, () => console.log(`Listening on port ${sslport} with SSL`));
}  else {
    // start listening
    http_server = http.createServer(app).listen(port, () => console.log(`Listening on port ${port}`));
}

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
    let excludeModern = query.excludeModern === "yes";
    let ignoreSep = query.ignoreSep === "yes";

    if (text === '%%') {
        return null;
    }

    const text_field = ignoreSep? "text_without_sep" : "text";
    const text_ngrams_field = ignoreSep? "text_without_sep_ngrams" : "text_ngrams";

    let searchPattern;
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

        let ngrams = make_ngrams(queryText, Math.min(queryText.length, 4));

        searchPattern = { [text_ngrams_field]: { $all: ngrams } };
        if (queryText.length > 4) {
            searchPattern[text_field] = {$regex: makeSearchRegex(text, ignoreSep)};
        }

    } else {
        searchPattern = {[text_field]: {$regex: makeSearchRegex(text, ignoreSep)}};
    }

    return [
        {$match: {
            ...searchPattern,
            filename: new RegExp(escapeStringRegexp(doc)),
            ...(excludeModern? {
                lang: {
                    $nin: ["mod", "modern translation", "pho"],
                    $not: /역$/,
                }
            } : {})
        }},
    ];
}

const PAGE_N = 50;

// Use connect method to connect to the Server
db_client.connect().then(function() {
    console.log("Connected successfully to server");
    const db = db_client.db("chocassye");

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

    app.post('/api/doc_suggest', (req, res) => {
        let doc = req.body.doc;
        console.log(`suggest doc=${doc} ip=${req.socket.remoteAddress}`);

        const book_collection = db.collection('books');
        const regex = new RegExp(escapeStringRegexp(doc), 'i');
        book_collection.find({filename: regex}).sort({year_sort: 1, filename: 1}).limit(10).toArray()
        .then((docs) => {
            // rename keys in docs
            docs = docs.map(doc => {
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

        let pipeline = makeCorpusQuery(req.body, PAGE_N);

        if (pipeline === null) {
            res.send({
                status: "success",
                results: [],
                page_N: PAGE_N,
            });
            return;
        }

        const page = req.body.page ?? 1;
        const offset = (page - 1) * PAGE_N;

        pipeline = [
            ...pipeline,
            {$sort: {
                year_sort: 1,
                filename: 1,
                number_in_book: 1,
            }},
            {$skip: offset},
            {$limit: PAGE_N},
            {$project: {_id: 1}},
        ];

        //console.dir(pipeline, {depth: null});

        const sentences_collection = db.collection('sentences');
        sentences_collection.aggregate(pipeline).toArray().then((results) => {
            return sentences_collection.aggregate([
                // Workaround for weird MongoDB behavior
                {$match: {
                    _id: {$in: results.map(result => result._id)}
                }},
                {$project: {
                    text_ngrams: 0,
                    text_without_sep_ngrams: 0,
                }},
                {$group: {
                    _id: "$filename",
                    filename: {$first: "$filename"},
                    year_sort: {$first: "$year_sort"},
                    count: {$sum: 1},
                    sentences: {$push: "$$ROOT"}
                }},
                {$sort: {year_sort: 1, _id: 1}},
                {$lookup: {
                    from: "books",
                    localField: "filename",
                    foreignField: "filename",
                    as: "book_info",
                }},
                {$unwind: "$book_info"},
                {$project: {
                    _id: 0,
                    name: "$filename",
                    year: "$book_info.year",
                    year_start: "$book_info.year_start",
                    year_end: "$book_info.year_end",
                    year_string: "$book_info.year_string",
                    year_sort: "$book_info.year_sort",
                    sentences: 1,
                    count: 1
                }},
            ]).toArray();
        }).then((results) => {
            const elapsed = new Date() - beginTime;
            console.log("Successfully retrieved search results in " + elapsed + "ms");
            res.send({
                status: "success",
                results: results,
                page_N: PAGE_N,
            });
        }).catch(err => {
            console.log(err.message);
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

        let pipeline = makeCorpusQuery(req.body, PAGE_N);

        if (pipeline === null) {
            res.send({
                status: "success",
                num_results: 0,
                histogram: [],
            });
            return;
        }

        pipeline = [
            ...pipeline,
            {$facet: {
                count: [{$count: "count"}],
                histogram: [
                    {$group: {
                        _id: "$decade_sort",
                        period: {$first: "$decade_sort"},
                        num_hits: {$sum: 1}
                    }},
                    {$project: {
                        _id: 0,
                        period: 1,
                        num_hits: 1,
                    }},
                    {$sort: {period: 1}}
                ]
            }}
        ];

        console.dir(pipeline, {depth: null});

        const sentences_collection = db.collection('sentences');
        sentences_collection.aggregate(pipeline).toArray().then((results) => {
            const elapsed = new Date() - beginTime;
            console.log("Successfully retrieved search stats in " + elapsed + "ms");
            if (results[0].count.length === 0) {
                res.send({
                    status: "success",
                    num_results: 0,
                    histogram: [],
                });
            }
            else {
                res.send({
                    status: "success",
                    num_results: results[0].count[0].count,
                    histogram: results[0].histogram,
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

    app.get('/api/source', (req, res) => {
        let n = req.query.number_in_source;
        let excludeChinese = req.query.exclude_chinese === "true";
        const PAGE = parseInt(req.query.view_count);
        if (isNaN(PAGE) || PAGE > 200) {
            res.send({
                status: "error",
                msg: "Invalid view_count"
            });
            return;
        }
        let start = Math.floor(n / PAGE) * PAGE;
        let end = start + PAGE;
        console.log(`source doc=${req.query.name} page=${start}-${end} ${typeof(excludeChinese)}`)

        const book_collection = db.collection('books');
        const sentences_collection = db.collection('sentences');
        Promise.all([
            book_collection.find({filename: req.query.name}).toArray(),
            sentences_collection.aggregate([
                {$match: {
                    filename: req.query.name,
                    ...(excludeChinese? {
                        lang: {
                            $nin: ["chi"]
                        }
                    } : {})
                }},
                {$facet: {
                    results: [
                        {$sort: {number_in_book: 1}},
                        {$skip: start},
                        {$limit: PAGE},
                    ]
                }}
            ]).toArray()
        ]).then((results) => {
            console.log("Successfully retrieved source results");
            const [book, sentences] = results;
            if (sentences[0].results.length === 0) {
                res.send({
                    status: "error",
                    msg: "No results found"
                });
            }
            else {
                let data = {
                    name: book[0].filename,
                    year_string: book[0].year_string,
                    bibliography: book[0].bibliography,
                    attributions: book[0].attributions,
                    sentences: sentences[0].results,
                    count: excludeChinese? book[0].non_chinese_sentence_count : book[0].num_sentences,
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

    // Handles any requests that don't match the ones above
    app.get('*', (req, res) =>{
        res.sendFile(path.join(__dirname, '/client/build/index.html'));
    });
});

process.on('SIGINT', () => {
    if (https_server !== null) {
        https_server.close();
    }
    http_server.close();
    db_client.close();
});
