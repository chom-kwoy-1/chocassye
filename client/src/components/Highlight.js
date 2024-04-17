import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';


function escapeRegex(string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function highlight(sentences, romanize, searchTerm,
                          return_highlighted_parts=false,
                          highlight_colors=null,
                          transformText=null) {
    if (searchTerm === null) {
        searchTerm = "NULL";
    }
    if (transformText === null) {
        transformText = function (x) { return x; };
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
    for (let part of searchTerm.split(/([%|_])/)) {
        if (part === '%') {
            reSearchTerm.push('.*');
        }
        else if (part === '_') {
            reSearchTerm.push('.');
        }
        else {
            reSearchTerm.push(escapeRegex(part));
        }
    }
    reSearchTerm = reSearchTerm.join('');

    let regexp = new RegExp(prefix + reSearchTerm + suffix, 'g');

    // Convert to array if string
    if (!Array.isArray(sentences)) {
        sentences = [sentences];
    }

    let dom = [];
    let highlighted_parts = [];
    let hl_idx = 0;

    if (romanize) {

        for (let sentence of sentences) {

            let match;

            let last_idx = 0;
            while ((match = regexp.exec(sentence)) !== null) {
                let start = match.index;
                let end = regexp.lastIndex;

                dom.push(<span key={last_idx}>{transformText(sentence.slice(last_idx, start))}</span>);

                let highlighted_part = sentence.slice(start, end);
                let highlight_class = ["highlight"];
                if (highlight_colors !== null) {
                    highlight_class.push('s'+highlight_colors[hl_idx]);
                }
                dom.push(<span key={start} className={highlight_class.join(' ')}>{transformText(highlighted_part)}</span>);
                highlighted_parts.push(highlighted_part);
                hl_idx += 1;

                last_idx = end;
            }
            dom.push(<span key={last_idx}>{transformText(sentence.slice(last_idx))}</span>);
        }
    }
    else {

        for (let sentence of sentences) {

            if (typeof sentence !== 'string') {
                dom.push(sentence);
            }
            else {
                let { result, index_map, next_index_map } = yale_to_hangul(sentence, true);

                let match;

                let last_idx = 0;
                while ((match = regexp.exec(sentence)) !== null) {
                    let start = index_map[match.index];
                    let end = next_index_map[regexp.lastIndex];
                    if (last_idx < end) {
                        if (last_idx < start) {
                            dom.push(<span key={last_idx}>{transformText(result.slice(last_idx, start))}</span>);
                        }
                        if (start < end) {
                            let highlighted_part = result.slice(start, end);
                            let highlight_class = ["highlight"];
                            if (highlight_colors !== null) {
                                highlight_class.push('s'+highlight_colors[hl_idx]);
                            }
                            dom.push(<span key={start} className={highlight_class.join(' ')}>{transformText(highlighted_part)}</span>);
                            highlighted_parts.push(highlighted_part);
                            hl_idx += 1;
                        }
                        last_idx = end;
                    }
                }
                if (last_idx < result.length) {
                    dom.push(<span key={last_idx}>{transformText(result.slice(last_idx))}</span>);
                }
            }
        }
    }

    if (return_highlighted_parts) {
        return highlighted_parts;
    }
    return (
        <span>{dom}</span>
    );
}
