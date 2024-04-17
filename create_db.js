const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db/database.sqlite3');

const glob = require("glob");
const jsdom = require("jsdom");
const fs = require('fs');
const promisify = require('util').promisify;
const path = require('path');

const YaleHangul = require('./client/src/components/YaleToHangul');


// initialize db
db.serialize(() => {
    db.run(`CREATE TABLE lemmas (
        lemma TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE definitions (
        desc TEXT DEFAULT '',
        lemma_id INTEGER NOT NULL,
        def_index INTEGER NOT NULL,
        FOREIGN KEY(lemma_id) REFERENCES lemmas(rowid)
    )`);

    db.run(`CREATE TABLE sources(
        name TEXT NOT NULL
    )`);

    // examples
    db.run(`CREATE TABLE examples(
        sentence TEXT,
        source_id INTEGER NOT NULL,
        type TEXT,
        lang TEXT,
        page TEXT,
        number_in_page INTEGER,
        number_in_source INTEGER NOT NULL,
        mark TEXT,
        FOREIGN KEY(source_id) REFERENCES sources(rowid)
    )`);
    db.run(`CREATE VIRTUAL TABLE fts_examples USING fts5(
        sentence,
        content='examples',
        content_rowid='rowid',
        tokenize="trigram case_sensitive 1"
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

    console.log("finished initializing db.");
});

db.serialize(() => {
    var stmt = db.prepare('INSERT INTO lemmas (lemma) VALUES (?)');
    stmt.run('-no.ni.ngi.ta');
    stmt.finalize();

    var stmt = db.prepare('INSERT INTO definitions (desc, lemma_id, def_index) VALUES (?, ?, ?)');
    stmt.run('Processive indicative polite declarative sentence ending.', 1, 0);
    stmt.finalize();
});


function insert_db(sql, values) {
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


function add_file(file, xml) {
    let filename = path.parse(file).name;

    return insert_db(`INSERT INTO sources (name) VALUES (?)`, [filename])
    .then(async (stmt) => {
        let source_id = stmt.lastID;

        let elements = xml.documentElement.querySelectorAll('sent, mark');

        let promises = []

        // iterate over sentences
        let index = 0;
        for (let sentence of elements) {
            if (sentence.tagName === "mark") {
                let promise = await insert_db(
                    `INSERT INTO examples (source_id, type, number_in_source, mark)
                    VALUES (?, ?, ?, ?)`, [
                    source_id,
                    sentence.attributes.type.value,
                    index,
                    sentence.textContent
                ]);
                promises.push(promise);
            }
            else {
                let text = sentence.textContent ?? "";
                text = YaleHangul.hangul_to_yale(text);

                let promise = await insert_db(
                    `INSERT INTO examples (sentence, source_id, type, lang, page, number_in_page, number_in_source)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                    text,
                    source_id,
                    sentence.attributes.type.value,
                    sentence.attributes.lang.value,
                    sentence.attributes.page.value,
                    sentence.attributes.n.value,
                    index
                ]);
                promises.push(promise);
            }

            index += 1;
        }

        return Promise.all(promises);
    });
}

async function populate_db() {
    console.log("populating db");

    const dom = new jsdom.JSDOM("");
    const DOMParser = dom.window.DOMParser;
    const parser = new DOMParser;

    await promisify(glob)("**/*.xml")
    .then(async (files) => {
        console.log("total", files.length, "files");

        for (let [i, file] of files.entries()) {
            await promisify(fs.readFile)(file, "utf8")
            .then((data) => parser.parseFromString(data, "text/xml"))
            .then((xml) => add_file(file, xml))
            .then(() => {
                console.log(i, file);
            })
            .catch((err) => {
                console.log(file, err.message);
            });
        }
    });

    console.log("finished populating db.");

    db.close();
}
populate_db();
