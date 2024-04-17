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
db.useBasicAuth('root', '');
db.useDatabase('etym_db');


// start listening
const server = app.listen(port, () => console.log(`Listening on port ${port}`));
app.use(express.json())
app.use(express.static(path.join(__dirname, "client/build")));
// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname, '/client/build/index.html'));
});


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
        console.log(result);
        res.send({
            status: "success",
            total_rows: result.count,
            results: result.rows
        });
    });

});

app.get('/api/source', (req, res) => {
    db_all(
        `SELECT
            sentence,
            page,
            number_in_source,
            type,
            lang,
            page,
            number_in_page,
            mark
        FROM examples JOIN sources ON examples.source_id = sources.rowid
        WHERE sources.name = ?
        ORDER BY examples.number_in_source
        LIMIT ?
        OFFSET ?`,
        [req.query.name, 100, req.query.number_in_source]
    ).then(rows => {
        res.send({
            status: "success",
            sentences: rows
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

process.on('SIGINT', () => {
    server.close();
});
