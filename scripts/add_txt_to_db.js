'use strict';

import pg from "pg";
import {promisify} from "util";
import {glob} from "glob";
import fs from "fs";
import {insert_into_db} from "../src/utils/insert_into_db.js";
import {parse_year_string, year_and_bookname_from_filename} from "../src/utils/parse_utils.js";
import {hangul_to_yale, normalize_string} from "../src/components/YaleToHangul.mjs";
import path from "path";

function parse_format_1(file, lines) {
    const hasImages = false;

    let {filename, year_string} = year_and_bookname_from_filename(file);

    let {year, year_start, year_end} = parse_year_string(year_string);

    const attributions = [];  // TODO
    const bibliography = null;  // TODO

    let book_details = {
        filename: filename,
        year: year,
        year_sort: year ?? 9999,
        decade_sort: year === null ? 9999 : Math.floor(year / 10) * 10,
        year_start: year_start,
        year_end: year_end,
        year_string: year_string,
        attributions: attributions,
        bibliography: bibliography,
    };

    let sentences = [];

    let pageno = "";
    const pageno_re = /<[^>]*?(\d+[a-z])>/;

    let index = 0;
    let number_in_page = 0;

    for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line === "") {
            continue;
        }

        const found = line.match(pageno_re);
        if (found !== null) {
            pageno = found[1];
            number_in_page = 0;
        }

        // Remove page numbers
        line = line.replace(pageno_re, '').trim();

        const type = line.includes("[head]")? "title" : "main";

        const text = hangul_to_yale(line)
            .replaceAll('[note]', '[')
            .replaceAll('[/note]', ']')
            .replaceAll('[head]', '')
            .replaceAll('[/head]', '')
            .replaceAll('[add]', '')
            .replaceAll('[/add]', '').trim();

        const text_without_sep = text.replace(/[ .^]/g, '');

        sentences.push({
            filename: filename,
            text: text,
            text_without_sep: text_without_sep,
            text_with_tone: null,
            html: text,
            type: type,
            lang: null,
            page: pageno,
            orig_tag: "sent",
            number_in_page: number_in_page,
            number_in_book: index,
            hasImages: hasImages,
            year_sort: book_details.year_sort,
            decade_sort: book_details.decade_sort,
        });

        number_in_page = number_in_page + 1;
        index = index + 1;
    }

    book_details['num_sentences'] = sentences.length;
    book_details['non_chinese_sentence_count'] = sentences.length;

    return [ book_details, sentences ];
}

function parse_format_2(file, lines) {
    const hasImages = false;

    file = file.normalize('NFKC')
    let filename = path.parse(file).name;

    let year_string = "미상";
    let splits = filename.split('_');
    if (splits.length > 1) {
        filename = splits.splice(1).join(' ');
        year_string = splits[0];
    }

    let {year, year_start, year_end} = parse_year_string(year_string);

    const attributions = [];  // TODO
    const bibliography = file.includes("장서각")? "장서각" : null;

    let book_details = {
        filename: filename,
        year: year,
        year_sort: year ?? 9999,
        decade_sort: year === null ? 9999 : Math.floor(year / 10) * 10,
        year_start: year_start,
        year_end: year_end,
        year_string: year_string,
        attributions: attributions,
        bibliography: bibliography,
    };

    let sentences = [];

    let pageno = "";
    let index = 0;
    let number_in_page = 0;

    const xml_tag_re = /<[^>]*?>/g;
    const page_tag_re = /<page id="([^"]*)"\/>/;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line === "") {
            continue;
        }

        const page_tag = line.match(page_tag_re);
        if (page_tag !== null) {
            pageno = page_tag[1];
            number_in_page = 0;
        }

        line = line.replaceAll('+', '^');  // page break marker
        line = line.replaceAll('ː', ' ');
        line = line.replaceAll('[격자1]', '');
        line = line.replaceAll('[격자2]', '');
        line = line.replaceAll('[대두1]', '');
        line = normalize_string(line);
        line = line.replaceAll('<title>', '[title]');
        line = line.replaceAll('</title>', '.');
        line = line.replace(xml_tag_re, '').trim();  // remove xml tags
        line = line.replace('/', ' @ ');  // stanza break marker
        line = line.replace(/\s+/g, ' ');  // remove extra spaces

        for (let sent of line.split('.')) {
            sent = sent.trim();
            if (sent === "") {
                continue;
            }

            let type = "main";
            if (sent.includes("[title]")) {
                type = "title";
                sent = sent.replaceAll('[title]', '');
            }

            const text = hangul_to_yale(sent);
            const text_without_sep = text.replace(/[ .^]/g, '');

            sentences.push({
                filename: filename,
                text: text,
                text_without_sep: text_without_sep,
                text_with_tone: null,
                html: text,
                type: type,
                lang: null,
                page: pageno,
                orig_tag: "sent",
                number_in_page: number_in_page,
                number_in_book: index,
                hasImages: hasImages,
                year_sort: book_details.year_sort,
                decade_sort: book_details.decade_sort,
            });

            number_in_page = number_in_page + 1;
            index = index + 1;
        }
    }

    book_details['num_sentences'] = sentences.length;
    book_details['non_chinese_sentence_count'] = sentences.length;

    return [ book_details, sentences ];
}

function add_text_file(file, text) {
    const lines = text.split("\n");

    if (lines.length < 2) {
        throw new Error("File is too short: " + file);
    }

    if (lines[0].includes('<title>')) {
        const SKIP_FORMAT_1 = (process.env.SKIP_FORMAT_1 || "no") === "yes";
        if (SKIP_FORMAT_1) {
            throw new Error("Skipping format 1: " + file);
        }
        return parse_format_1(file, lines);
    }
    else if (lines[0].startsWith('<item ')) {
        const SKIP_FORMAT_2 = (process.env.SKIP_FORMAT_2 || "no") === "yes";
        if (SKIP_FORMAT_2) {
            throw new Error("Skipping format 2: " + file);
        }
        return parse_format_2(file, lines);
    }
    else {
        throw new Error("Unknown format: " + file);
    }
}

function insert_documents(pool) {
    return glob(
        "chocassye-corpus/data/*/*.txt"
    ).then(async files => {
        console.log("Total", files.length, "files");

        let inserted_books = [];
        let promises = [];
        for (let [i, file] of files.entries()) {
            const pushTask = promisify(fs.readFile)(file, "utf8")
                .then(async text => {
                    text = text.replace(/^\uFEFF/, '');  // remove BOM
                    const [book_details, sentences] = add_text_file(file, text);
                    const DRY_RUN = (process.env.DRY_RUN || "no") === "yes";
                    if (!DRY_RUN) {
                        return insert_into_db(pool, book_details, sentences);
                    }
                })
                .then(() => {
                    console.log(i, "DONE", file);
                    inserted_books.push(file);
                })
                .catch((err) => {
                    console.error(i, "ERROR", file, err.code, err.stack);
                });

            promises.push(pushTask);

            const BATCH_SIZE = process.env.BATCH || 16;
            if (i % BATCH_SIZE === BATCH_SIZE - 1) {
                await Promise.all(promises);
                promises = [];
            }
        }
        await Promise.all(promises);

        console.log("Inserted", inserted_books.length, "books:");
        for (let book of inserted_books) {
            console.log(book);
        }
    });
}

function populate_db() {
    const {Pool} = pg;
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'chocassye',
        password: 'password',
    });
    console.log("Connected successfully to server");

    return insert_documents(pool);
}

await populate_db();
