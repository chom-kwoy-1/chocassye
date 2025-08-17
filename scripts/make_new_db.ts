import {insert_documents} from "./parse.js";

function main() {
    const BATCH_SIZE = 16;
    return insert_documents(insert_into_db, BATCH_SIZE);
}

function insert_into_db(book_details, sentences) {
    console.log(book_details);
}

await main();
