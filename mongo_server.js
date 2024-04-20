'use strict';

import express from 'express';
import path from "path";
import http from "http";
import https from "https";
import fs from "fs";
import {MongoClient} from "mongodb";
import escapeStringRegexp from 'escape-string-regexp';

const __dirname = path.resolve();

// create app
const app = express();
const port = process.env.PORT || 5000;

// Connection URL
const db_url = 'mongodb://localhost:27017';

// Create a new MongoClient
const db_client = new MongoClient(db_url);

// start listening
const http_server = http.createServer(app).listen(port, () => console.log(`Listening on port ${port}`));
let https_server = null;

if (process.env.SSL === "ON") {
    const privateKey = fs.readFileSync("/etc/letsencrypt/live/find.xn--gt1b.xyz/privkey.pem");
    const certificate = fs.readFileSync("/etc/letsencrypt/live/find.xn--gt1b.xyz/cert.pem");
    const ca = fs.readFileSync("/etc/letsencrypt/live/find.xn--gt1b.xyz/chain.pem");
    const credentials = { key: privateKey, cert: certificate, ca: ca };
    https_server = https.createServer(credentials, app).listen(443, () => console.log('Listening on port 443 with SSL'));
}


app.use(express.json())
app.use(express.static(path.join(__dirname, "client/build")));


// Use connect method to connect to the Server
db_client.connect().then(function() {
    console.log("Connected successfully to server");
    const db = db_client.db("chocassye");

    app.post('/api/doc_suggest', (req, res) => {
        let doc = req.body.doc;
        console.log(`suggest doc=${doc} ip=${req.socket.remoteAddress}`);

        const book_collection = db.collection('books');
        const regex = new RegExp(escapeStringRegexp(doc), 'i');
        book_collection.find({filename: regex}).sort({year_sort: 1}).limit(10).toArray()
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
        let text = req.body.term;
        let doc = req.body.doc;
        let excludeModern = req.body.excludeModern === "yes";
        let ignoreSep = req.body.ignoreSep === "yes";
        // FIXME: set ignoreSep to false for now
        ignoreSep = false;

        let N = 50;
        if (text === '%%') {
            res.send({
                status: "success",
                total_rows: 0,
                results: [],
                histogram: [],
                page_N: N
            });
            return;
        }
        console.log(`search text=${text} doc=${doc} exMod=${excludeModern} igSep=${ignoreSep} ip=${req.socket.remoteAddress}`);

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
                regex += escapeStringRegexp(strippedText[i]);
                continue;
            }
            if (strippedText[i] === '\\') {
                isEscaping = true;
                continue;
            }
            regex += escapeStringRegexp(strippedText[i]);
        }
        if (!text.startsWith('%')) {
            regex = `^${regex}`;
        }
        if (!text.endsWith('%')) {
            regex = `${regex}$`;
        }
        console.log(`regex=${regex}`);
        let textRegex = new RegExp(regex);
        let offset = (req.body.page - 1) * N;

        const sentences_collection = db.collection('sentences');
        sentences_collection.aggregate([
            {$match: {
                text: textRegex,
                filename: new RegExp(escapeStringRegexp(doc)),
                ...(excludeModern? {
                    lang: {
                        $nin: ["mod", "modern translation", "pho"],
                        $not: /역$/,
                    }
                } : {})
            }},
            {$facet: {
                total: [{$count: "count"}],
                results: [
                    {$sort: {year_sort: 1, number_in_book: 1}},
                    {$skip: offset},
                    {$limit: N},
                    {$group: {
                        _id: "$filename",
                        name: {$first: "$filename"},
                        year: {$first: "$year"},
                        year_start: {$first: "$year_start"},
                        year_end: {$first: "$year_end"},
                        year_string: {$first: "$year_string"},
                        year_sort: {$first: "$year_sort"},
                        count: {$sum: 1},
                        sentences: {$push: "$$ROOT"}
                    }},
                    {$sort: {year_sort: 1, _id: 1}}
                ],
                histogram: [
                    {$group: {
                        _id: "$decade_sort",
                        period: {$first: "$decade_sort"},
                        num_hits: {$sum: 1}
                    }}
                ],
            }}
        ]).toArray().then((results) => {
            console.log("Successfully retrieved search results");
            if (results[0].total.length === 0) {
                res.send({
                    status: "success",
                    total_rows: 0,
                    results: [],
                    histogram: [],
                    page_N: N
                });
            }
            else {
                res.send({
                    status: "success",
                    total_rows: results[0].total[0].count,
                    results: results[0].results,
                    histogram: results[0].histogram,
                    page_N: N,
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
        const PAGE = 20;
        let start = Math.floor(n / PAGE) * PAGE;
        let end = start + PAGE;
        console.log(`source doc=${req.query.name} page=${start}-${end} ${typeof(excludeChinese)}`)

        const sentences_collection = db.collection('sentences');
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
                total: [{$count: "count"}],
                results: [
                    {$sort: {number_in_book: 1}},
                    {$skip: start},
                    {$limit: PAGE},
                ]
            }}
        ]).toArray().then((results) => {
            console.log("Successfully retrieved source results");
            if (results[0].total.length === 0) {
                res.send({
                    status: "error",
                    msg: "No results found"
                });
            }
            else {
                let data = {
                    name: results[0].results[0].filename,
                    year_string: results[0].results[0].year_string,
                    bibliography: results[0].results[0].bibliography,
                    attributions: results[0].results[0].attributions,
                    sentences: results[0].results,
                    count: results[0].total[0].count,
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
