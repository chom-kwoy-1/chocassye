import {insert_documents} from "./parse.js";

function main() {
    const BATCH_SIZE = 16;

    function insert_into_db(book_details, sentences) {
        console.log(sentences);
    }

    return insert_documents(insert_into_db, BATCH_SIZE);
}

await main();
