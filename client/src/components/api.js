import {postData} from "./utils";

export function search(query, callback, errorCallback) {
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
