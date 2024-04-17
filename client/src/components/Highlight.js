import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';


function escapeRegex(string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function highlight(sentence, romanize, searchTerm) {
    if (searchTerm === null) {
        searchTerm = "NULL";
    }
    if (romanize) {
        let regexp = new RegExp(escapeRegex(searchTerm), 'g');
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

        let regexp = new RegExp(escapeRegex(searchTerm), 'g');
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
