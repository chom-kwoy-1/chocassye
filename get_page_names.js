import { Database, aql } from "arangojs";

// initialize db
const db = new Database({
    url: 'http://127.0.0.1:8529',
    databaseName: "etym_db",
    auth: { username: "root", password: "" },
});


let doc = "훈몽자회 예산문고본";
let query = aql`
    FOR s IN doc_view
        FILTER LIKE(s.filename, ${doc})
        SORT s.number_in_book ASC
        RETURN s
`;
