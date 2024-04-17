import fs from 'fs';
import path from 'path';
import glob from 'glob';
import jsdom from 'jsdom';
import { promisify } from 'util';
import { Database, aql } from "arangojs";
import { hangul_to_yale } from './client/src/components/YaleToHangul.mjs'


function uni(str) {
    return str.replace(/{{{[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]}}}/g, function(ch) {
        return String.fromCharCode(parseInt(ch.slice(3, 8), 16));
    });
}


function find_year(doc) {
    let year_elem = doc.querySelector('meta year');
    if (year_elem !== null) {
        return uni(year_elem.attributes.n.value).trim();
    }
    year_elem = doc.querySelector('teiHeader date');
    if (year_elem !== null) {
        return uni(year_elem.textContent);
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

    let elements = doc.querySelectorAll(':not(meta) > sent, mark, title, head, chr, c');
    console.log(`${filename}: ${elements.length} sentences selected.`);
    let sentences = [];

    // iterate over sentences
    let index = 0;
    for (let sentence of elements) {
        if (sentence.tagName === "mark") {
            let attr = sentence.attributes;
            let type = attr.type === undefined? null : attr.type.value.trim();
            let text = uni(sentence.textContent);

            sentences.push({
                date: Date(),
                text: text,
                type: type,
                number_in_book: index
            });
        }
        else {
            try {
                let html = uni(sentence.innerHTML);
                html = hangul_to_yale(html);
                let text = uni(sentence.textContent);
                text = hangul_to_yale(text);

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
                    html: html,
                    type: type,
                    lang: lang,
                    page: page,
                    orig_tag: sentence.tagName,
                    number_in_page: number_in_page,
                    number_in_book: index
                });
            } catch (error) {
                console.error("Error:", error, sentence.textContent);
                throw error;
            }
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
        url: 'http://127.0.0.1:8529',
        auth: { username: "root", password: "" },
    });

    console.log("DB acceess success");

    db.dropDatabase('etym_db')
    .then(() => {
        console.log("Database dropped");
    })
    .catch(() => {})
    .then(() => db.createDatabase('etym_db'))
    .catch((err) => {
        console.log("Failed to create database", err);
    })
    .then(() => {
        console.log("Database created");

        const etym_db = db.database('etym_db');
        const collection = etym_db.createCollection('documents');

        return Promise.all([Promise.resolve(etym_db), collection]);
    })
    .catch((err) => {
        console.log("Failed to create collection", err);
    })
    .then(([etym_db, collection]) => {
        const dom = new jsdom.JSDOM("");
        const DOMParser = dom.window.DOMParser;
        const parser = new DOMParser;

        const result = promisify(glob)("data/**/훈몽자회.xml")
        .then(async (files) => {
            console.log("total", files.length, "files");

            let promises = [];
            for (let [i, file] of files.entries()) {
                promises.push(promisify(fs.readFile)(file, "utf8")
                .then((data) => {
                    data = data.replace(/^\uFEFF/, '').replace(/[^\0-~]/g, function(ch) {
                        return "{{{" + ("0000" + ch.charCodeAt().toString(16)).slice(-5) + "}}}";
                    });
                    return parser.parseFromString(data, "text/xml");
                })
                .then((xml) => add_file(collection, file, xml))
                .then(() => {
                    // TODO: indicate progress
                })
                .catch((err) => {
                    console.error(i, "ERROR", file, err.stack);
                }));
            }

            return Promise.all(promises);
        });

        return Promise.all([Promise.resolve(etym_db), result]);
    })
    .catch((err) => {
        console.log("Failed to populate collection", err);
    })
    .then(([etym_db, _]) => {
        return etym_db.createView("doc_view", {
            type: "arangosearch",
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
        console.log("Failed to create view", err);
    });
}
populate_db();
