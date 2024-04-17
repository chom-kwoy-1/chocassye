import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';


function escapeRegex(string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function serializeTextNode(text) {
    return new XMLSerializer().serializeToString(document.createTextNode(text));
}

export function highlight(sentences, romanize, searchTerm,
                          return_highlighted_parts=false,
                          highlight_colors=null,
                          transformText=null,
                          inline=false) {
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

                dom.push(transformText(sentence.slice(last_idx, start)));

                let highlighted_part = sentence.slice(start, end);
                let highlight_class = ["highlight"];
                if (highlight_colors !== null) {
                    highlight_class.push('s'+highlight_colors[hl_idx]);
                }

                let mark_class = highlight_class.join(' ');
                let mark_text = serializeTextNode(transformText(highlighted_part));
                dom.push(`<mark class=${mark_class}>${mark_text}</mark>`);
                highlighted_parts.push(highlighted_part);
                hl_idx += 1;

                last_idx = end;
            }
            dom.push(transformText(sentence.slice(last_idx)));
        }
    }
    else {

        for (let sentence of sentences) {

            let splits = sentence.split(inline? /(<[^>]*>z)/ : /(<[^>]*>|\[|\])/);

            for (let string of splits) {

                if (string.match(/^<!--[^>]*-->$/)) {
                    dom.push(yale_to_hangul(string));
                }
                else if (!inline && string == '[') {
                    dom.push(`<span orig-tag="anno">`);
                }
                else if (!inline && string == ']') {
                    dom.push(`</span>`);
                }
                else if (string.match(/^<[^>]*>$/) !== null) {
                    dom.push(string.replace(/^<(\/)?([^>]*)>$/, (_, closing, tag) => {
                        if (closing) {
                            return "</span>";
                        }
                        return `<span orig-tag=${tag}>`;
                    }));
                }
                else {
                    let { result, index_map, next_index_map } = yale_to_hangul(string, true);

                    let match;

                    let last_idx = 0;
                    while ((match = regexp.exec(string)) !== null) {
                        let start = index_map[match.index];
                        let end = next_index_map[regexp.lastIndex];
                        if (last_idx < end) {
                            if (last_idx < start) {
                                dom.push(transformText(result.slice(last_idx, start)));
                            }
                            if (start < end) {
                                let highlighted_part = result.slice(start, end);
                                let highlight_class = ["highlight"];
                                if (highlight_colors !== null) {
                                    highlight_class.push('s'+highlight_colors[hl_idx]);
                                }

                                let mark_class = highlight_class.join(' ');
                                let mark_text = serializeTextNode(transformText(highlighted_part));
                                dom.push(`<mark class="${mark_class}">${mark_text}</mark>`);

                                highlighted_parts.push(highlighted_part);
                                hl_idx += 1;
                            }
                            last_idx = end;
                        }
                    }
                    if (last_idx < result.length) {
                        dom.push(transformText(result.slice(last_idx)));
                    }
                }
            }
        }
    }

    if (return_highlighted_parts) {
        return highlighted_parts;
    }
    return dom.join('');
}
