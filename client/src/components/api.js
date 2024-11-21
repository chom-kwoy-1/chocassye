import {postData} from "./utils";
import {hangul_to_yale} from "./YaleToHangul.mjs";

function makeQuery(query) {
    let term = hangul_to_yale(query.term);

    let prefix = "%";
    let suffix = "%";
    if (term.startsWith('^')) {
        term = term.slice(1);
        prefix = "";
    }
    if (term.endsWith('$')) {
        term = term.slice(0, term.length - 1);
        suffix = "";
    }
    term = "".concat(prefix, term, suffix);

    query = {...query, term: term};

    return query;
}

export function search(query, callback, errorCallback) {
    query = makeQuery(query);

    postData('/api/search', query).then((result) => {
        if (result.status === 'success') {
            callback(result.results, result.page_N);
        } else {
            console.log(result);
            errorCallback('Server responded with error');
        }
    }).catch((err) => {
        console.log(err);
        errorCallback('Could not connect to server');
    });
}

export function getStats(query, callback, errorCallback) {
    query = makeQuery(query);

    postData('/api/search_stats', query).then((result) => {
        if (result.status === 'success') {
            callback(result.num_results, result.histogram);
        } else {
            console.log(result);
            errorCallback('Server responded with error');
        }
    }).catch((err) => {
        console.log(err);
        errorCallback('Could not connect to server');
    });
}

export function suggest(doc, callback) {
    postData('/api/doc_suggest', { doc: doc })
        .then((result) => {
            if (result.status === 'success') {
                callback(result.results, result.total_rows);
            } else {
                callback([], 0);
                // TODO: handle error
            }
        })
        .catch((err) => {
            console.log(err);
            callback([], 0);
            // TODO: handle error
        });
}
