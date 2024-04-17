const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db/database.sqlite3');

const glob = require("glob");
const promisify = require('util').promisify;
const YaleHangul = require('./client/src/components/YaleToHangul');


function db_get(sql, values) {
    return new Promise((resolve, reject) => {
        db.get(sql, values, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function db_all(sql, values) {
    return new Promise((resolve, reject) => {
        db.all(sql, values, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function db_run(sql, values) {
    return new Promise((resolve, reject) => {
        db.run(sql, values, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}


// start listening
const server = app.listen(port, () => console.log(`Listening on port ${port}`));
app.use(express.json())

app.get('/api/lemma', (req, res) => {
    let lemma = db_get(
        `SELECT lemmas.rowid, lemmas.lemma
        FROM lemmas WHERE lemmas.rowid = ?`,
        [req.query.id]
    );
    let definitions = db_all(
        `SELECT definitions.rowid, desc, def_index
        FROM lemmas INNER JOIN definitions ON lemmas.rowid = definitions.lemma_id
        WHERE lemmas.rowid = ?
        ORDER BY definitions.def_index`,
        [req.query.id]
    );

    Promise.all([lemma, definitions])
    .then(values => {
        [lemma, definitions] = values;
        res.send({
            status: "success",
            id: lemma.rowid,
            name: lemma.lemma,
            definitions: definitions
        });
    })
    .catch(error => {
        console.log(error.message);
        res.send({
            status: "error",
            msg: "database error"
        });
    })
});

app.post('/api/add_def', (req, res) => {
    console.log(req.body);
    db.serialize(() => {
        db.run(`UPDATE definitions SET def_index = def_index + 1 WHERE def_index >= ?`,
               [req.body.position]);
        db_run(`INSERT INTO definitions(lemma_id, def_index) VALUES (?, ?)`,
               [req.body.lemma_id, req.body.position])
        .then(stmt => {
            res.send({
                status: "success",
                id: stmt.lastID
            });
        })
        .catch(error => {
            console.log(error.message);
            res.send({
                status: "error",
                msg: "database error"
            });
        });
    });
});

app.post('/api/update_def', (req, res) => {
    console.log(req.body);
    db.serialize(() => {
        db.run(`UPDATE definitions SET desc = ? WHERE rowid = ?`,
               [req.body.desc, req.body.def_id]);
        res.send({
            status: "success",
        });
    });
});

app.post('/api/remove_def', (req, res) => {
    console.log(req.body);
    db.serialize(() => {
        db.run(`DELETE FROM definitions WHERE rowid = ?`,
               [req.body.def_id]);
        res.send({
            status: "success",
        });
    });
});

app.post('/api/search', (req, res) => {
    let text = YaleHangul.hangul_to_yale(req.body.term);
    console.log(text);

    if (text === '**') {
        res.send({
            status: "success",
            total_rows: 0,
            sentences: []
        });
        return;
    }

    let N = 20;

    db_all(
        `SELECT
            examples.rowid AS rowid,
            examples.sentence AS sentence,
            sources.name AS source_name,
            type,
            lang,
            page,
            number_in_page,
            rank,
            count(*) OVER() AS total_rows
        FROM ((fts_examples JOIN examples ON fts_examples.rowid = examples.rowid)
              JOIN sources ON examples.source_id = sources.rowid)
        WHERE fts_examples.sentence GLOB ?
        ORDER BY rank
        LIMIT ? OFFSET ?`, [text, N, (req.body.page - 1) * N]
    ).then((rows) => {
        let total_rows = 0;
        if (rows.length > 0) {
            total_rows = rows[0].total_rows;
        }

        // remove 'total_rows' column
        for (let row of rows) {
            delete row.total_rows;
        }

        res.send({
            status: "success",
            total_rows: total_rows,
            sentences: rows
        });
    }).catch(err => {
        res.send({
            status: "error",
            msg: err.message
        });
    });

});

app.get('/api/source', (req, res) => {
    console.log(req.query);

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
        OFFSET (
            SELECT min(examples.number_in_source)
            FROM examples JOIN sources ON examples.source_id = sources.rowid
            WHERE sources.name = ? AND page = ?
        )`,
        [req.query.name, 100, req.query.name, req.query.page]
    ).then(rows => {
        res.send({
            status: "success",
            sentences: rows
        });
    })
    .catch(err => {
        res.send({
            status: "error",
            msg: err.message
        });
    });

});

process.on('SIGINT', () => {
    db.close();
    server.close();
});
