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
        return uni(year_elem.textContent).trim();
    }

    return null;
}


function add_file(collection, book_collection, file, xml) {
    const errorNode = xml.querySelector('parsererror');
    if (errorNode) {
        throw new Error("parse failed: " + errorNode.innerHTML);
    }

    file = file.normalize('NFKC')
    let filename = path.parse(file).name;
    let year_string = null;
    if (!path.parse(file).dir.includes("unknown") && !path.parse(file).dir.includes("sktot")) {
        let splits = filename.split('_');
        filename = splits.splice(1).join(' ');
        year_string = splits[0];
    }
    filename = filename.split('_').join(' ');

    let doc = xml.documentElement;

    if (year_string === null) {
        year_string = find_year(doc).normalize('NFKC');
    }
    let ys_norm = year_string.replace(/\[[^\]]*\]/g, '').replace(/\([^\)]*\)/g, '');

    let year = null;
    let year_start = null;
    let year_end = null;
    if (ys_norm.match(/^[0-9][0-9][0-9][0-9]$/) !== null ||
        ys_norm.match(/^[0-9][0-9][0-9][0-9]년$/) !== null ||
        ys_norm.match(/^[0-9][0-9][0-9][0-9]年$/) !== null) {
        year = parseInt(ys_norm.slice(0, 4));
        year_start = year_end = year;
    }
    else if (ys_norm.match(/^[0-9][0-9][0-9][0-9]년대/) !== null) {
        year = parseInt(ys_norm.slice(0, 4)) + 5;
        year_start = year - 5;
        year_end = year + 4;
    }
    else if (year_string.match(/[0-9][0-9]세기 ?(전기|전반|전반기|초|초반|초기)/) !== null) {
        let matched = year_string.match(/[0-9][0-9]세기 ?(전기|전반|전반기|초|초반|초기)/)[0];
        year = parseInt(matched.slice(0, 2)) * 100 - 75;
        year_start = year - 25;
        year_end = year + 24;
    }
    else if (year_string.match(/[0-9][0-9]세기 ?(후기|후반|후반기|말|말기)/) !== null) {
        let matched = year_string.match(/[0-9][0-9]세기 ?(후기|후반|후반기|말|말기)/)[0];
        year = parseInt(matched.slice(0, 2)) * 100 - 25;
        year_start = year - 25;
        year_end = year + 24;
    }
    else if (year_string.match(/[0-9][0-9]세기/) !== null) {
        let matched = year_string.match(/[0-9][0-9]세기/)[0];
        year = parseInt(matched.slice(0, 2)) * 100 - 50;
        year_start = year - 50;
        year_end = year + 49;
    }
    else if (ys_norm.match(/^[0-9][0-9]--$/) !== null ||
             ys_norm.match(/^[0-9][0-9]--년$/) !== null ||
             ys_norm.match(/^[0-9][0-9]\?$/) !== null ||
             ys_norm.match(/^[0-9][0-9]\?\?$/) !== null ||
             ys_norm.match(/^[0-9][0-9]\?\?년$/) !== null ||
             ys_norm.match(/^[0-9][0-9]X$/) !== null ||
             ys_norm.match(/^[0-9][0-9]XX$/) !== null ||
             ys_norm.match(/^[0-9][0-9]XX년$/) !== null) {
        year = parseInt(ys_norm.slice(0, 2)) * 100 + 50;
        year_start = year - 50;
        year_end = year + 49;
    }
    else if (ys_norm.match(/^[0-9][0-9][0-9]-$/) !== null ||
             ys_norm.match(/^[0-9][0-9][0-9]-년$/) !== null ||
             ys_norm.match(/^[0-9][0-9][0-9]\?$/) !== null ||
             ys_norm.match(/^[0-9][0-9][0-9]\?년$/) !== null ||
             ys_norm.match(/^[0-9][0-9][0-9]X$/) !== null ||
             ys_norm.match(/^[0-9][0-9][0-9]X년$/) !== null) {
        year = parseInt(ys_norm.slice(0, 3)) * 10 + 5;
        year_start = year - 5;
        year_end = year + 4;
    }
    else {
        year = parseInt(ys_norm.slice(0, 4));
        year_start = year_end = year;
    }

    let elements = doc.querySelectorAll(
        ':not(meta):not(titleStmt) > sent,' +
        ':not(meta):not(titleStmt) > mark,' +
        ':not(meta):not(titleStmt) > title,' +
        ':not(meta):not(titleStmt) > head,' +
        ':not(meta):not(titleStmt) > chr,' +
        ':not(meta):not(titleStmt) > c'
    );
    console.log(`${filename}: ${elements.length} sentences selected.`);
    let sentences = [];

    let book_details = {
        filename: filename,
        year: year,
        year_start: year_start,
        year_end: year_end,
        year_string: year_string,
    };

    // iterate over sentences
    let index = 0;
    for (let sentence of elements) {
        if (sentence.tagName === "mark") {
            let attr = sentence.attributes;
            let type = attr.type === undefined? null : uni(attr.type.value.trim());
            let text = uni(sentence.textContent);

            sentences.push({
                ...book_details,
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
                let page = attr.page === undefined? null : uni(attr.page.value.trim());
                let type = attr.type === undefined? null : uni(attr.type.value.trim());
                let lang = attr.lang === undefined? null : uni(attr.lang.value.trim());
                let number_in_page = null;
                if (attr.n !== undefined) {
                    number_in_page = uni(attr.n.value);
                } else if (attr.num !== undefined) {
                    number_in_page = uni(attr.num.value);
                }

                sentences.push({
                    ...book_details,
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
                console.error(filename, " Error:", error, uni(sentence.textContent));
                throw error;
            }
        }

        index += 1;
    }

    return Promise.all([
        collection.saveAll(sentences),
        book_collection.save(book_details)
    ]);
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
        const book_collection = etym_db.createCollection('books');

        return Promise.all([Promise.resolve(etym_db), collection, book_collection]);
    })
    .catch((err) => {
        console.log("Failed to create collection", err);
    })
    .then(([etym_db, collection, book_collection]) => {
        const dom = new jsdom.JSDOM("");
        const DOMParser = dom.window.DOMParser;
        const parser = new DOMParser;

        const result = promisify(glob)("data/*/*.xml")
        .then(async (files) => {
            console.log("total", files.length, "files");
            console.dir(files, {depth: null, 'maxArrayLength': null});

            let promises = [];
            for (let [i, file] of files.entries()) {
                promises.push(promisify(fs.readFile)(file, "utf8")
                .then((data) => {
                    data = data.replace(/^\uFEFF/, '').replace(/[^\0-~]/g, function(ch) {
                        return "{{{" + ("0000" + ch.charCodeAt().toString(16)).slice(-5) + "}}}";
                    });
                    return parser.parseFromString(data, "text/xml");
                })
                .then((xml) => add_file(collection, book_collection, file, xml))
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
        return Promise.all([
            etym_db,
            etym_db.createView("doc_view", {
                type: "arangosearch",
                links: {
                    "documents": {
                        "includeAllFields": true,
                    }
                }
            })
        ]);
    })
    .then(([etym_db, _]) => {
        return etym_db.createView("book_view", {
            type: "arangosearch",
            links: {
                "books": {
                    "includeAllFields": true,
                }
            }
        });
    })
    .catch((err) => {
        console.log("Failed to create view", err);
    });
}
populate_db();
