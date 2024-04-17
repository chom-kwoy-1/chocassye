import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';
import { GUGYEOL_READINGS, GUGYEOL_REGEX } from './Gugyeol'


function escapeRegex(string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function serializeTextNode(text) {
    return new XMLSerializer().serializeToString(document.createTextNode(text));
}

export function searchTerm2Regex(searchTerm) {
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
            reSearchTerm.push('.*?');
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
    
    return regexp;
}


const HANGUL_REGEX = /((?:ᄀ|ᄁ|ᄂ|ᄔ|ᄃ|ᄄ|ᄅ|ᄆ|ᄇ|ᄈ|ᄉ|ᄊ|ᄋ|ᅇ|ᄌ|ᄍ|ᄎ|ᄏ|ᄐ|ᄑ|ᄒ|ᄞ|ᄠ|ᄡ|ᄢ|ᄣ|ᄧ|ᄩ|ᄫ|ᄭ|ᄮ|ᄯ|ᄲ|ᄶ|ᄻ|ᅀ|ᅘ|ᅙ|ᅌ|ᅟ)(?:ᅡ|ᅢ|ᅣ|ᅤ|ᅥ|ᅦ|ᅧ|ᅨ|ᅩ|ᅪ|ᅫ|ᅬ|ᅭ|ᅮ|ᅯ|ᅰ|ᅱ|ᅲ|ᅳ|ᅴ|ᅵ|ᆞ|ᆡ|ᆈ|ᆔ|ᆑ|ᆒ|ᆄ|ᆅ)(?:ᆨ|ᆪ|ᆫ|ᆮ|ᆯ|ᆰ|ᆱ|ᆲ|ᆳ|ᆷ|ᆸ|ᆹ|ᆺ|ᆼ|ᇆ|ᇇ|ᇈ|ᇌ|ᇗ|ᇙ|ᇜ|ᇝ|ᇟ|ᇢ|ᇦ|ᇫ|ᇰ|ᇹ|ᇱ|))(〮|〯|)/g;

const TONED_SYLLABLE_REGEX = /((?:psk|pst|psc|pth|ss\/|cc\/|ch\/|ss\\|cc\\|ch\\|kk|nn|tt|pp|ss|GG|cc|ch|kh|th|ph|pk|pt|ps|pc|sk|sn|st|sp|sc|sh|hh|ng|s\/|c\/|s\\|c\\|k|n|t|l|m|p|s|G|c|h|W|z|q|`)(?:ywey|yway|yay|yey|way|woy|wey|wuy|yoy|yuy|ywe|ywa|ay|ya|ey|ye|wo|wa|yo|wu|we|yu|uy|oy|a|e|u|i|o)(?:lth|lph|nth|lks|mch|ngs|kk|ks|nc|nh|lk|lm|lp|ls|lh|ps|ss|ch|kh|th|ph|nt|ns|nz|lz|lq|mk|mp|ms|mz|sk|st|ng|pl|k|n|t|l|m|p|s|G|c|h|M|W|z|f|q|))(L|H|R|)(?![^<]*>)/g;


export function invert_mapping(mapping) {
    let inv_mapping = Array(mapping[mapping.length - 1][1]);
    for (let i = 0; i < inv_mapping.length; ++i) {
        inv_mapping[i] = [Infinity, 0];
    }
    for (let i = 0; i < mapping.length; ++i) {
        for (let j = mapping[i][0]; j < mapping[i][1]; ++j) {
            inv_mapping[j] = [
                Math.min(inv_mapping[j][0], i),
                Math.max(inv_mapping[j][1], i + 1),
            ];
        }
    }
    return inv_mapping;
}


export function replace_and_map(string, pattern, replace_func, prev_mapping=null) {

    let inv_mapper_begin, inv_mapper_end;
    let mapping_size;
    if (prev_mapping === null) {
        inv_mapper_begin = function(i) { return i; };
        inv_mapper_end = function(i) { return i + 1; };
        mapping_size = string.length;
    }
    else {
        let inv_mapping = invert_mapping(prev_mapping);
        inv_mapper_begin = function(i) { return inv_mapping[i][0] };
        inv_mapper_end = function(i) { return inv_mapping[i][1] };
        mapping_size = prev_mapping.length;
    }

    let last_offset = 0;
    let dst_offset = 0;
    let mapping = Array(mapping_size);
    for (let i = 0; i < mapping.length; ++i) {
        mapping[i] = [Infinity, 0];
    }

    let orig_string_length = string.length;
    string = string.replace(pattern, function(match, ...rest) {
        let sub = replace_func(match, ...rest);
        let sub_mapping = null;
        if (Array.isArray(sub)) {
            [sub, sub_mapping] = sub;
        }

        let offset = rest[rest.length - 2];

        // before replaced part
        for (let i = 0; i < offset - last_offset; ++i) {
            for (let j = inv_mapper_begin(last_offset + i);
                 j < inv_mapper_end(last_offset + i); ++j) {
                mapping[j] = [
                    Math.min(mapping[j][0], dst_offset + i),
                    Math.max(mapping[j][1], dst_offset + i + 1)
                ];
            }
        }

        dst_offset += offset - last_offset;
        last_offset = offset;

        // replaced part
        for (let i = 0; i < match.length; ++i) {
            let dst_begin = dst_offset;
            let dst_end = dst_offset + sub.length;
            
            if (sub_mapping !== null) {
                dst_begin = dst_offset + sub_mapping[i][0];
                dst_end = dst_offset + sub_mapping[i][1];
            }
            
            for (let j = inv_mapper_begin(last_offset + i);
                 j < inv_mapper_end(last_offset + i); ++j) {
                mapping[j] = [
                    Math.min(mapping[j][0], dst_begin),
                    Math.max(mapping[j][1], dst_end)
                ];
            }
        }

        dst_offset += sub.length;
        last_offset += match.length;

        return sub;
    });


    // remaining part
    let offset = orig_string_length;
    for (let i = 0; i < offset - last_offset; ++i) {
        for (let j = inv_mapper_begin(last_offset + i);
             j < inv_mapper_end(last_offset + i); ++j) {
            mapping[j] = [
                Math.min(mapping[j][0], dst_offset + i),
                Math.max(mapping[j][1], dst_offset + i + 1)
            ];
        }
    }

    return [string, mapping];
}

export function toText(sentence) {
    let mapping;
    
    [sentence, mapping] = replace_and_map(
        sentence, /(<[^>]*>)/g,
        function (match) {
            return "";
        });
    
    return [sentence, mapping];
}

export function toTextIgnoreTone(sentence) {
    let mapping;
    
    [sentence, mapping] = replace_and_map(
        sentence, /(<[^>]*>)/g,
        function (match) {
            return "";
        });
    
    [sentence, mapping] = replace_and_map(
        sentence, TONED_SYLLABLE_REGEX,
        function (_, syllable, tone) {
            return syllable;
        },
        mapping
    );
    
    return [sentence, mapping];
}

export function toDisplayHTML(sentence) {
    
    let mapping = null;

    // yale to hangul (ignoring tags)
    [sentence, mapping] = replace_and_map(
        sentence, /([^>\[\]]+)(?![^<]*>)/g,
        function (match) {
            let { result, mapping } = yale_to_hangul(match, true);
            return [result, mapping];
        },
        mapping
    );

    // replace [] with <span> anno tags
    [sentence, mapping] = replace_and_map(
        sentence, /(\[|\])/g,
        function (match) {
            if (match === '[') {
                return `<span orig-tag="anno">`;
            }
            else {
                return `</span>`;
            }
        },
        mapping
    );
    
    // replace opening/closing custom tags with span
    [sentence, mapping] = replace_and_map(
        sentence, /<(\/)?([^>]*)>/g,
        function (_, closing, tag) {
            if (closing) {
                return "</span>";
            }
            return `<span orig-tag=${tag}>`;
        },
        mapping
    );
    
    // Render tone marks on top of syllable
    [sentence, mapping] = replace_and_map(
        sentence, HANGUL_REGEX,
        function(_, syllable, tone) {
            if (tone === '') {
                return `<span data-tone="L">${syllable}</span>`;
            }
            else if (tone === '\u302e') {
                return `<span data-tone="H">${syllable}<span is-tone>${tone}</span></span>`;
            }
            else if (tone === '\u302f') {
                return `<span data-tone="R">${syllable}<span is-tone>${tone}</span></span>`;
            }
        },
        mapping
    );
    
    // Add tooltips to gugyeol characters
    [sentence, mapping] = replace_and_map(
        sentence, GUGYEOL_REGEX,
        function (ch) {
            return `<abbr data-title=${GUGYEOL_READINGS[ch]} tabindex="0">${ch}</abbr>`;
        },
        mapping
    );
    
    return [sentence, mapping];
};

export function getMatchingRanges(hlRegex, targetText, targetMapping, displayHTMLMapping=null) {
    let inv_mapping = invert_mapping(targetMapping);
    
    let match_ranges = [];
    let match;
    while ((match = hlRegex.exec(targetText)) !== null) {
        let matchBegin = match.index;
        let matchEnd = match.index + match[0].length;
        let match_range = [
            inv_mapping[matchBegin][0],
            inv_mapping[matchEnd - 1][1],
        ];
        if (displayHTMLMapping !== null) {
            match_range = [
                displayHTMLMapping[match_range[0]][0], 
                displayHTMLMapping[match_range[1] - 1][1],
            ];
        }
        match_ranges.push(match_range);
    }
    
    return match_ranges;
}

export function removeOverlappingRanges(match_ranges, max_length) {
    let match_ranges_unique = [];
    let matched = Array(max_length).fill(false);
    for (let range of match_ranges) {
        if (matched.slice(...range).some(v => v)) {
            continue;
        }
        match_ranges_unique.push(range);
        for (let i = range[0]; i < range[1]; ++i) {
            matched[i] = true;
        }
    }
    match_ranges_unique.sort((a, b) => a[0] - b[0]);
    return match_ranges_unique;
}

export function addHighlights(displayHTML, match_ranges, highlight_colors=null) {
    let output = "";
    let last_idx = 0;
    let hl_idx = 0;
    for (let range of match_ranges) {
        output += displayHTML.slice(last_idx, range[0]);

        let highlight_class = ["highlight"];
        if (highlight_colors !== null) {
            highlight_class.push('s'+highlight_colors[hl_idx]);
        }
        let mark_class = highlight_class.join(' ');
        let mark_text = displayHTML.slice(range[0], range[1]);
        output += `<mark class="${mark_class}">${mark_text}</mark>`;
        
        hl_idx += 1;
        last_idx = range[1];
    }
    output += displayHTML.slice(last_idx);
    return output;
}

