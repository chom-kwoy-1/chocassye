'use strict';

const express = require('express');
const { Database, aql } = require("arangojs");
const YaleHangul = require('./YaleToHangul');
const path = require("path");
const http = require("http");
const https = require("https");
const fs = require("fs");

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


app.post('/api/search', (req, res) => {
    let text = req.body.term;
    let doc = req.body.doc;
    console.log(text, doc);

    if (text === '%%') {
        res.send({
            status: "success",
            total_rows: 0,
            results: []
        });
        return;
    }

    let N = 20;
    let offset = (req.body.page - 1) * N;
    let query = aql`
        LET query = ${text}
        LET doc_pattern = ${'%' + doc + '%'}
        FOR d IN doc_view
            SEARCH ANALYZER(LIKE(d.sentences.text, query), "identity")
            FILTER d.filename LIKE doc_pattern
            LET year = d.year == null? 9999: d.year
            SORT year ASC, TFIDF(d) DESC
            LIMIT ${offset}, ${N}
            RETURN {
                name: d.filename,
                year: d.year,
                year_string: d.year_string,
                count: COUNT(
                    FOR s IN d.sentences
                    FILTER LIKE(s.text, query)
                    RETURN s
                ),
                sentences: (
                    FOR s IN d.sentences
                    FILTER LIKE(s.text, query)
                    LIMIT 1000
                    RETURN s
                )
            }
    `;

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

app.get('/api/source', (req, res) => {
    let n = req.query.number_in_source;
    const PAGE = 20;
    let start = Math.floor(n / PAGE) * PAGE;
    let end = start + PAGE;
    db.query(aql`
        FOR d IN doc_view
            FILTER d.filename == ${req.query.name}
            LET sentences = ( // subquery start
                FOR s IN d.sentences
                FILTER ${start} <= s.number_in_book && s.number_in_book <= ${end}
                SORT s.number_in_book ASC
                RETURN s
            ) // subquery end
            LET count = LENGTH(d.sentences)
            RETURN {
                name: d.filename,
                sentences: sentences,
                count: count,
                year_string: d.year_string
            }`)
    .then(async (cursor) => {
        let rows = await cursor.map(item => item);
        return rows[0];
    })
    .then(row => {
        res.send({
            status: "success",
            data: row
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
