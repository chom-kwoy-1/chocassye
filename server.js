const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const glob = require("glob");
const xml2js = require('xml2js');
const xmldom = require('xmldom');
const fs = require('fs');
const promisify = require('util').promisify;


// initialize db
db.serialize(async () => {
    db.run(`CREATE TABLE lemmas (
        id INTEGER PRIMARY KEY,
        lemma TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE definitions (
        id INTEGER PRIMARY KEY,
        desc TEXT DEFAULT '',
        lemma_id INTEGER NOT NULL,
        def_index INTEGER NOT NULL,
        FOREIGN KEY(lemma_id) REFERENCES lemmas(id)
    )`);

    var stmt = db.prepare('INSERT INTO lemmas (lemma) VALUES (?)');
    stmt.run('-no.ni.ngi.ta');
    stmt.finalize();

    var stmt = db.prepare('INSERT INTO definitions (desc, lemma_id, def_index) VALUES (?, ?, ?)');
    stmt.run('Processive indicative polite declarative sentence ending.', 1, 0);
    stmt.finalize();

    db.run(`CREATE TABLE examples(
        id INTEGER PRIMARY KEY,
        sentence TEXT NOT NULL
    )`);
    db.run(`CREATE VIRTUAL TABLE fts_examples USING fts5(
        sentence,
        content='examples',
        content_rowid='id'
    )`);
    db.run(`CREATE TRIGGER tbl_ai AFTER INSERT ON examples BEGIN
        INSERT INTO fts_examples(rowid, sentence) VALUES (new.rowid, new.sentence);
    END`);
    db.run(`CREATE TRIGGER tbl_ad AFTER DELETE ON examples BEGIN
        INSERT INTO fts_examples(rowid, sentence) VALUES ('delete', old.rowid, old.sentence);
    END`);
    db.run(`CREATE TRIGGER tbl_au AFTER UPDATE ON examples BEGIN
        INSERT INTO fts_examples(rowid, sentence) VALUES ('delete', old.rowid, old.sentence);
        INSERT INTO fts_examples(rowid, sentence) VALUES (new.rowid, new.sentence);
    END`);

    console.log("parsing xml files");

    await promisify(glob)("**/*.xml")
    .then(async (files) => {
        const parser = new xml2js.Parser({ attrkey: "ATTR" });

        let promises = [];
        for (let file of files) {
            let promise = promisify(fs.readFile)(file, "utf8")
            .then((data) => {
                function manageXmlParseError(msg, errorLevel, errorLog) {
                    if (errorLevel > 0) {
                        console.log(errorLevel, file, msg);
                    }
                }

                const domparser = new xmldom.DOMParser({
                    errorHandler: {
                        warning: (msg) => {manageXmlParseError(msg, 1)},
                        error: (msg) => {manageXmlParseError(msg, 2)},
                        fatalError: (msg) => {manageXmlParseError(msg, 3)},
                    }
                });
                data = domparser.parseFromString(data, "text/xml");
                return promisify(parser.parseString)(data);
            })
            .then((xml) => {
                // console.log(xml);
            })
            .catch((err) => {
                console.log(file, err.message);
            });
            promises.push(promise);
        }

        return Promise.all(promises);
    });

    console.log("finished initializing db.");
});


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


// start listening
const server = app.listen(port, () => console.log(`Listening on port ${port}`));
app.use(express.json())

app.get('/api/lemma', (req, res) => {
    let lemma = db_get(
        `SELECT lemmas.id, lemmas.lemma
        FROM lemmas WHERE lemmas.id = ?`,
        [req.query.id]
    );
    let definitions = db_all(
        `SELECT definitions.id, desc, def_index
        FROM lemmas INNER JOIN definitions ON lemmas.id = definitions.lemma_id
        WHERE lemmas.id = ?
        ORDER BY definitions.def_index`,
        [req.query.id]
    );

    Promise.all([lemma, definitions])
    .then(values => {
        [lemma, definitions] = values;
        res.send({
            status: "success",
            id: lemma.id,
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
        db.run(`INSERT INTO definitions(lemma_id, def_index) VALUES (?, ?)`,
               [req.body.lemma_id, req.body.position]);
        db_get(`SELECT id FROM definitions WHERE def_index = ?`,
               [req.body.position])
        .then(row => {
            res.send({
                status: "success",
                id: row.id
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
        db.run(`UPDATE definitions SET desc = ? WHERE id = ?`,
               [req.body.desc, req.body.def_id]);
        res.send({
            status: "success",
        });
    });
});

app.post('/api/remove_def', (req, res) => {
    console.log(req.body);
    db.serialize(() => {
        db.run(`DELETE FROM definitions WHERE id = ?`,
               [req.body.def_id]);
        res.send({
            status: "success",
        });
    });
});

process.on('SIGINT', () => {
    db.close();
    server.close();
});
