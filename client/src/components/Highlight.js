import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';


function escapeRegex(string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function highlight(sentence, romanize, searchTerm) {
    if (searchTerm === null) {
        searchTerm = "NULL";
    }

    searchTerm = hangul_to_yale(searchTerm);

    let prefix = "";
    let suffix = "";
    if (searchTerm.startsWith('^')) {
        searchTerm = searchTerm.slice(1);
        prefix = "^";
    }
    if (searchTerm.endsWith('$')) {
        searchTerm = searchTerm.slice(0, searchTerm.length - 1);
        suffix = "$";
    }

    let reSearchTerm = [];
    for (let part of searchTerm.split('%')) {
        reSearchTerm.push(escapeRegex(part));
    }
    reSearchTerm = reSearchTerm.join('.+');

    let regexp = new RegExp(prefix + reSearchTerm + suffix, 'g');

    if (romanize) {
        let match;

        let dom = [];
        let last_idx = 0;
        while ((match = regexp.exec(sentence)) !== null) {
            let start = match.index;
            let end = regexp.lastIndex;
            dom.push(<span>{sentence.slice(last_idx, start)}</span>);
            dom.push(<span className="highlight">{sentence.slice(start, end)}</span>);
            last_idx = end;
        }
        dom.push(<span>{sentence.slice(last_idx)}</span>);

        return (
            <span>{dom}</span>
        );
    }
    else {
        let { result, index_map, next_index_map } = yale_to_hangul(sentence, true);

        let match;

        let dom = [];
        let last_idx = 0;
        while ((match = regexp.exec(sentence)) !== null) {
            let start = index_map[match.index];
            let end = next_index_map[regexp.lastIndex];
            if (last_idx < end) {
                if (last_idx < start) {
                    dom.push(<span key={last_idx} abc={last_idx}>{result.slice(last_idx, start)}</span>);
                }
                if (start < end) {
                    dom.push(<span key={start} abc={start} className="highlight">{result.slice(start, end)}</span>);
                }
                last_idx = end;
            }
        }
        if (last_idx < result.length) {
            dom.push(<span key={last_idx} abc={last_idx}>{result.slice(last_idx)}</span>);
        }

        return (
            <span>{dom}</span>
        );
    }
}
