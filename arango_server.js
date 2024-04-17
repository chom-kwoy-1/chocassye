'use strict';

import express from 'express';
import { Database, aql } from "arangojs";
import path from "path";
import http from "http";
import https from "https";
import fs from "fs";

const __dirname = path.resolve();

// create app
const app = express();
const port = process.env.PORT || 5000;

// initialize db
const db = new Database({
    url: 'http://127.0.0.1:8529',
    databaseName: "etym_db",
    auth: { username: "root", password: "" },
});


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


app.post('/api/doc_suggest', (req, res) => {
    let doc = req.body.doc;
    console.log(`suggest doc=${doc} ip=${req.socket.remoteAddress}`);

    let query = aql`
        LET doc_pattern = ${'%' + doc + '%'}
        FOR d IN book_view
            SEARCH ANALYZER(LIKE(d.filename, doc_pattern), "identity")
            LET nyear = d.year == null? 9999: d.year
            SORT nyear ASC, d.filename ASC
            LIMIT 0, 10
            RETURN {
                name: d.filename,
                year: d.year,
                year_start: d.year_start,
                year_end: d.year_end,
                year_string: d.year_string
            }`;
    db.query(query, {fullCount: true})
    .then(async (cursor) => {
        let rows = await cursor.map(item => item);
        return {
            count: cursor.extra.stats.fullCount,
            rows: rows
        }
    })
    .then((result) => {
        res.send({
            status: "success",
            total_rows: result.count,
            results: result.rows
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

    console.log(`search text=${text} doc=${doc} exMod=${excludeModern} igSep=${ignoreSep} ip=${req.socket.remoteAddress}`);

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


    let offset = (req.body.page - 1) * N;
    let query = aql`
        LET query = ${text}
        LET doc_pattern = ${'%' + doc + '%'}
        LET results = (
        FOR s IN doc_view
            SEARCH ANALYZER(LIKE(s.text, query) AND LIKE(s.filename, doc_pattern), ${ignoreSep? "no_space" : "identity"})
            FILTER ${!excludeModern} OR ((s.lang NOT IN ["mod", "modern translation", "pho"]) AND (s.lang NOT LIKE "%역"))
            RETURN s
        )

        LET histogram = (
        FOR s in results
            LET nyear = s.year == null? 9999: s.year
            LET period = nyear - (nyear % 10)
            COLLECT agg_period = period
                AGGREGATE num_hits = SUM(1)
            RETURN {
                period: agg_period,
                num_hits: num_hits
            }
        )

        LET page = (
        FOR s in results
            LET nyear = s.year == null? 9999: s.year
            SORT nyear ASC, s.filename ASC, s.number_in_book ASC
            LIMIT ${offset}, ${N}
            COLLECT doc = s.filename,
                    year = s.year,
                    year_start = s.year_start,
                    year_end = s.year_end,
                    year_string = s.year_string INTO groups
            LET nyear = year == null? 9999: year
            SORT nyear ASC, doc ASC
            RETURN {
                name: doc,
                year: year,
                year_start: year_start,
                year_end: year_end,
                year_string: year_string,
                count: COUNT(groups),
                sentences: groups[*].s
            }
        )

        RETURN {
            histogram: histogram,
            rows: page,
            full_count: LENGTH(results)
        }
    `;

    db.query(query)
    .then(async (cursor) => {
        let rows = await cursor.map(item => item);
        return {
            count: rows[0]['full_count'],
            rows: rows[0]['rows'],
            histogram: rows[0]['histogram']
        };
    })
    .then((result) => {
        res.send({
            status: "success",
            total_rows: result.count,
            results: result.rows,
            histogram: result.histogram,
            page_N: N
        });
    });

});

app.get('/api/source', (req, res) => {
    let n = req.query.number_in_source;
    const PAGE = 20;
    let start = Math.floor(n / PAGE) * PAGE;
    let end = start + PAGE;
    console.log(`source doc=${req.query.name} page=${start}-${end}`)
    let query = aql`
        LET sentences = (FOR d IN doc_view
            SEARCH ANALYZER(d.filename == ${req.query.name}, "identity")
            return d
        )
        LET count = LENGTH(sentences)
        LET result = (FOR s in sentences
            FILTER ${start} <= s.number_in_book && s.number_in_book <= ${end}
            SORT s.number_in_book ASC
            RETURN s
        )
        RETURN {
            count: count, rows: result
        }`;
    db.query(query)
    .then(async (cursor) => {
        let rows = await cursor.map(item => item);
        return rows[0];
    })
    .then((result) => {
        let data = {
            name: result.rows[0].filename,
            year_string: result.rows[0].year_string,
            sentences: result.rows,
            count: result.count,
        };
        res.send({
            status: "success",
            data: data
        });
    })
    .catch(err => {
        console.log(err.message);
        res.send({
            status: "error",
            msg: err.message
        });
    });

});

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname, '/client/build/index.html'));
});

process.on('SIGINT', () => {
    if (https_server !== null) {
        https_server.close();
    }
    http_server.close();
});
