const fs = require('fs');
const glob = require("glob");
const path = require('path');
const jsdom = require("jsdom");
const promisify = require('util').promisify;
const { Database, aql } = require("arangojs");
const YaleHangul = require('./client/src/components/YaleToHangul');


function find_year(doc) {
    let year_elem = doc.querySelector('meta year');
    if (year_elem !== null) {
        return year_elem.attributes.n.value.trim();
    }
    year_elem = doc.querySelector('teiHeader date');
    if (year_elem !== null) {
        return year_elem.textContent;
    }

    return null;
}


function add_file(collection, file, xml) {
    const errorNode = xml.querySelector('parsererror');
    if (errorNode) {
        throw new Error("parse failed: " + errorNode.innerHTML);
    }

    let filename = path.parse(file).name;
    let doc = xml.documentElement;

    let year_string = find_year(doc);
    let year = parseInt(year_string);
    if (year < 100) {
        year = year * 100;
    }

    let elements = doc.querySelectorAll('sent, mark');
    let sentences = [];

    // iterate over sentences
    let index = 0;
    for (let sentence of elements) {
        if (sentence.tagName === "mark") {
            let type = sentence.attributes.type.value.trim();
            let text = sentence.textContent;

            sentences.push({
                date: Date(),
                text: text,
                type: type,
                number_in_book: index
            });
        }
        else {
            let text = sentence.textContent ?? "";
            text = YaleHangul.hangul_to_yale(text);

            let attr = sentence.attributes;
            let page = attr.page === undefined? null : attr.page.value.trim();
            let type = attr.type === undefined? null : attr.type.value.trim();
            let lang = attr.lang === undefined? null : attr.lang.value.trim();
            let number_in_page = null;
            if (attr.n !== undefined) {
                number_in_page = attr.n.value;
            } else if (attr.num !== undefined) {
                number_in_page = attr.num.value;
            }

            sentences.push({
                date: Date(),
                text: text,
                type: type,
                lang: lang,
                page: page,
                number_in_page: number_in_page,
                number_in_book: index
            });
        }

        index += 1;
    }

    return collection.save({
        filename: filename,
        year: year,
        year_string: year_string,
        sentences: sentences
    });
}


function populate_db() {
    const db = new Database({
        url: 'http://127.0.0.1:8529'
    });
    db.useBasicAuth('root', '');

    db.dropDatabase('etym_db')
    .then(() => {
        console.log("Database dropped");
    })
    .catch(() => {})
    .then(() => db.createDatabase('etym_db'))
    .then(() => {
        console.log("Database created");

        db.useDatabase('etym_db');
        collection = db.collection('documents');

        return collection.create().then(() => collection);
    })
    .then((collection) => {
        const dom = new jsdom.JSDOM("");
        const DOMParser = dom.window.DOMParser;
        const parser = new DOMParser;

        promisify(glob)("data/**/*.xml")
        .then(async (files) => {
            console.log("total", files.length, "files");

            for (let [i, file] of files.entries()) {
                promisify(fs.readFile)(file, "utf8")
                .then((data) => parser.parseFromString(data, "text/xml"))
                .then((xml) => add_file(collection, file, xml))
                .then(() => {
                    // TODO: indicate progress
                })
                .catch((err) => {
                    console.error(i, "ERROR", file, err.stack);
                });
            }
        });
    })
    .then(() => {
        return db.createView("doc_view", {
            links: {
                "documents": {
                    fields: {
                        "sentences": {
                            includeAllFields: true
                        }
                    }
                }
            }
        });
    })
    .catch((err) => {
        console.log("Failed to create database", err);
    });
}
populate_db();
