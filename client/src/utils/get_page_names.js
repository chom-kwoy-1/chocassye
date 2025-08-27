import { Database, aql } from "arangojs";
import fs from "fs";

// initialize db
const db = new Database({
    url: 'http://127.0.0.1:8529',
    databaseName: "etym_db",
    auth: { username: "root", password: "" },
});


let doc = process.argv[2];
console.log(doc);
let query = aql`
    FOR s IN doc_view
        FILTER LIKE(s.filename, ${doc})
        SORT s.number_in_book ASC
        RETURN s
`;
db.query(query)
.then(async (cursor) => {
    let result = await cursor.all();
    let pages = [];
    let last_page_name = null;
    for (let i = 0; i < result.length; i++) {
        if (result[i].page !== '' && result[i].page !== undefined) {
            console.log(result[i].page);
            let cur_pages = result[i].page.split('-');
            for (let j = 1; j < cur_pages.length; j++) {
                cur_pages[j] = cur_pages[0].split(/(\d+)/)[0] + cur_pages[j];
            }
            for (let cur_page of cur_pages) {
                if (!pages.includes(cur_page)) {
                    pages.push(cur_page);
                }
                last_page_name = cur_page;
            }
        }
    }

    // Write pages to file, each page on a new line
    fs.writeFileSync('pages.txt', pages.join('\n'));
});
