'use strict';

const express = require('express');
const { Database, aql } = require("arangojs");
const YaleHangul = require('./YaleToHangul');
const path = require("path");


// create app
const app = express();
const port = process.env.PORT || 5000;


// initialize db
const db = new Database({
    url: 'http://127.0.0.1:8529'
});
console.log(db);
db.useBasicAuth('root', '');
db.useDatabase('etym_db');


// start listening
const server = app.listen(port, () => console.log(`Listening on port ${port}`));
app.use(express.json())
app.use(express.static(path.join(__dirname, "client/build")));


app.post('/api/search', (req, res) => {
    let text = req.body.term;
    console.log(text);

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

    db.query(aql`
        LET query = ${text}
        FOR d IN doc_view
            SEARCH ANALYZER(LIKE(d.sentences.text, query), "identity")
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
    `, {fullCount: true})
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
            RETURN {
                name: d.filename,
                sentences: sentences,
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
    server.close();
});
