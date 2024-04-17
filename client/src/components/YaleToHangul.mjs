import { PUA_CONV_TABLE } from './PuaToUni.mjs';


const YALE_TO_HANGUL_INITIAL_CONSONANTS = {
    'k': '\u1100',
    'kk': '\u1101',
    'n': '\u1102',
    'nn': '\u1114',
    't': '\u1103',
    'tt': '\u1104',
    'l': '\u1105',
    'm': '\u1106',
    'p': '\u1107',
    'pp': '\u1108',
    's': '\u1109',
    'ss': '\u110a',
    'G': '\u110B',
    'GG': '\u1147',
    'c': '\u110C',
    'cc': '\u110D',
    'ch': '\u110e',
    'kh': '\u110f',
    'th': '\u1110',
    'ph': '\u1111',
    'h': '\u1112',

    'pk': '\u111e',
    'pt': '\u1120',
    'ps': '\u1121',
    'psk': '\u1122',
    'pst': '\u1123',
    'psc': '\u1126',
    'pc': '\u1127',
    'pth': '\u1129',
    'W': '\u112b',
    'sk': '\u112d',
    'sn': '\u112e',
    'st': '\u112f',
    'sp': '\u1132',
    'sc': '\u1136',
    'sh': '\u113b',
    'z': '\u1140',
    'hh': '\u1158',
    'q': '\u1159',

    'ng': '\u114c',

    's/': '\u113C',
    'ss/': '\u113D',
    'c/': '\u114E',
    'cc/': '\u114F',
    'ch/': '\u1154',

    's\\': '\u113E',
    'ss\\': '\u113F',
    'c\\': '\u1150',
    'cc\\': '\u1151',
    'ch\\': '\u1155',

    '`': '\u115f',
};

const YALE_TO_HANGUL_FINAL_CONSONANTS = {
    'k':   '\u11a8',
    'kk':  '\u11a9',
    'ks':  '\u11aa',
    'n':   '\u11ab',
    'nc':  '\u11ac',
    'nh':  '\u11ad',
    't':   '\u11ae',
    'l':   '\u11af',
    'lk':  '\u11b0',
    'lm':  '\u11b1',
    'lp':  '\u11b2',
    'ls':  '\u11b3',
    'lth': '\u11b4',
    'lph': '\u11b5',
    'lh':  '\u11b6',
    'm':   '\u11b7',
    'p':   '\u11b8',
    'ps':  '\u11b9',
    's':   '\u11ba',
    'ss':  '\u11bb',
    'G':   '\u11bc',
    'c':   '\u11bd',
    'ch':  '\u11be',
    'kh':  '\u11bf',
    'th':  '\u11c0',
    'ph':  '\u11c1',
    'h':   '\u11c2',
    'nt':  '\u11c6',
    'ns':  '\u11c7',
    'nz':  '\u11c8',
    'nth': '\u11c9',
    'lks': '\u11cc',
    'lz':  '\u11d7',
    'lq':  '\u11d9',
    'mk':  '\u11da',
    'mp':  '\u11dc',
    'ms':  '\u11dd',
    'mz':  '\u11df',
    'mch': '\u11e0',
    'M':   '\u11e2',
    'W':   '\u11e6',
    'sk':  '\u11e7',
    'st':  '\u11e8',
    'z':   '\u11eb',
    'ng':  '\u11f0',
    'f':   '\u11f4',
    'q':   '\u11f9',
    'ngs': '\u11f1',
    'pl':  '\u11e3',
};

const YALE_TO_HANGUL_VOWELS = {
    'a': '\u1161',
    'ay': '\u1162',
    'ya': '\u1163',
    'yay': '\u1164',
    'e': '\u1165',
    'ey': '\u1166',
    'ye': '\u1167',
    'yey': '\u1168',
    'wo': '\u1169',
    'wa': '\u116a',
    'way': '\u116b',
    'woy': '\u116c',
    'yo': '\u116d',
    'wu': '\u116e',
    'we': '\u116f',
    'wey': '\u1170',
    'wuy': '\u1171',
    'yu': '\u1172',
    'u': '\u1173',
    'uy': '\u1174',
    'i': '\u1175',

    'o': '\u119e',
    'oy': '\u11a1',
    'yoy': '\u1188',
    'yuy': '\u1194',
    'ywe': '\u1191',
    'ywey': '\u1192',
    'ywa': '\u1184',
    'yway': '\u1185',
};

function inv(obj) {
    return Object.fromEntries(Object.entries(obj).map(a => a.reverse()));
}

const HANGUL_TO_YALE = {
    ...inv(YALE_TO_HANGUL_INITIAL_CONSONANTS),
    ...inv(YALE_TO_HANGUL_VOWELS),
    ...inv(YALE_TO_HANGUL_FINAL_CONSONANTS)
};

const INITIAL_HANGUL_TO_YALE = {
    ...inv(YALE_TO_HANGUL_INITIAL_CONSONANTS),
};

const VOWELS_RE = /(ywey|yway|yay|yey|way|woy|wey|wuy|yoy|yuy|ywe|ywa|ay|ya|ey|ye|wo|wa|yo|wu|we|yu|uy|oy|a|e|u|i|o)/g;
const CONS_RE = /psk|pst|psc|pth|ss\/|cc\/|ch\/|ss\\|cc\\|ch\\|kk|nn|tt|pp|ss|GG|cc|ch|kh|th|ph|pk|pt|ps|pc|sk|sn|st|sp|sc|sh|hh|ng|s\/|c\/|s\\|c\\|k|n|t|l|m|p|s|G|c|h|W|z|q|`/g;


function normalize_string(string) {
    string = string.normalize('NFKD');

    let conv_string = "";
    for (let ch of string) {
        if (PUA_CONV_TABLE.hasOwnProperty(ch)) {
            conv_string += PUA_CONV_TABLE[ch];
        }
        else {
            conv_string += ch;
        }
    }
    return conv_string;
}


export function yale_to_hangul(string, get_index_map=false) {

    string = normalize_string(string);

    let splits = string.split(VOWELS_RE);

    let result = "";

    let split_idx = 0;
    let input_idx = 0;
    let syllable_begin_pos = 0;

    let index_map = {};

    for (const split of splits) {

        if (split.match(VOWELS_RE)) {
            // Vowel
            result += YALE_TO_HANGUL_VOWELS[split];

            for (let i = 0; i < split.length; ++i) {
                index_map[input_idx + i] = syllable_begin_pos;
            }
        }
        else {
            // Consonant cluster
            let max_prefix_len = Math.min(3, split.length - 1);
            if (split_idx == 0) {
                max_prefix_len = 0;
            }
            else if (split_idx == splits.length - 1) {
                max_prefix_len = Math.min(3, split.length)
            }

            let remaining = split;

            let found_prefix = false;
            let prefix_len = max_prefix_len;
            let prefix = '';
            for (; prefix_len >= 1; --prefix_len) {
                let part = remaining.slice(0, prefix_len);
                if (YALE_TO_HANGUL_FINAL_CONSONANTS.hasOwnProperty(part)) {
                    prefix = YALE_TO_HANGUL_FINAL_CONSONANTS[part];
                    remaining = remaining.slice(prefix_len);
                    found_prefix = true;
                    break
                }
            }

            let found_suffix = false;
            let suffix_len = Math.min(3, remaining.length);
            let suffix = '';
            for (; suffix_len >= 1; --suffix_len) {
                let part = remaining.slice(remaining.length - suffix_len);
                if (YALE_TO_HANGUL_INITIAL_CONSONANTS.hasOwnProperty(part)) {
                    remaining = remaining.slice(0, remaining.length - suffix_len);
                    suffix = YALE_TO_HANGUL_INITIAL_CONSONANTS[part];
                    found_suffix = true;
                    break
                }
            }

            // Add choseong filler
            if (!found_suffix) {
                suffix = '\u115f';
            }

            // Make index mapping
            // Prefix belongs to current syllable
            for (let i = 0; i < prefix_len; ++i) {
                index_map[input_idx + i] = syllable_begin_pos;
            }

            syllable_begin_pos = result.length + (found_prefix? 1 : 0);

            let i = prefix_len;
            let middle_part_output = "";
            for (const part of remaining.split('.')) {

                let match;
                let last_idx = 0;
                while ((match = CONS_RE.exec(part)) !== null) {
                    let start = match.index;
                    let end = CONS_RE.lastIndex;
                    if (last_idx < end) {
                        if (last_idx < start) {
                            let piece = part.slice(last_idx, start);
                            for (let j = i; j < i + piece.length; ++j) {
                                index_map[input_idx + j] = syllable_begin_pos;
                                syllable_begin_pos += 1;
                            }
                            middle_part_output += piece;
                            i += piece.length;
                        }
                        if (start < end) {
                            let piece = match[0];
                            for (let j = i; j < i + piece.length; ++j) {
                                index_map[input_idx + j] = syllable_begin_pos;
                            }
                            middle_part_output += YALE_TO_HANGUL_INITIAL_CONSONANTS[piece];
                            syllable_begin_pos += 1;
                            i += piece.length;
                        }
                        last_idx = end;
                    }
                }
                if (last_idx < part.length) {
                    let piece = part.slice(last_idx);
                    for (let j = i; j < i + piece.length; ++j) {
                        index_map[input_idx + j] = syllable_begin_pos;
                        syllable_begin_pos += 1;
                    }
                    middle_part_output += piece;
                    i += piece.length;
                }

                // '.'
                index_map[input_idx + i] = syllable_begin_pos;
                i += 1;
            }

            let output = (
                prefix
                + middle_part_output
                + suffix
            );

            // Suffix belongs to next syllable
            for (let i = split.length - suffix_len; i < split.length; ++i) {
                index_map[input_idx + i] = syllable_begin_pos;
            }

            result += output;
        }

        split_idx++;
        input_idx += split.length;
    }

    // Next index
    let to_next_index = {};
    let last_output_index = 0;
    for (let i = 0; i < string.length; ++i) {
        if (last_output_index != index_map[i]) {
            to_next_index[last_output_index] = index_map[i];
            last_output_index = index_map[i];
        }
    }
    to_next_index[last_output_index] = result.length;

    let next_index_map = {};
    last_output_index = 0;
    for (let i = 0; i < string.length; ++i) {
        if (index_map[i] != last_output_index) {
            next_index_map[i] = index_map[i];
        } else {
            next_index_map[i] = to_next_index[index_map[i]];
        }
        last_output_index = index_map[i];
    }
    next_index_map[string.length] = next_index_map[string.length - 1];

    if (get_index_map) {
        return {
            result: result,

            // map from original char index -> position of syllable's beginning in output
            index_map: index_map,

            // map from original char index -> position of next syllable's beginning in output
            next_index_map: next_index_map
        }
    }


    return result;
}


export function hangul_to_yale(string) {
    let result = "";
    let wasHangul = false;

    string = normalize_string(string);

    for (let ch of string) {
        if (HANGUL_TO_YALE.hasOwnProperty(ch)) {
            if (wasHangul && INITIAL_HANGUL_TO_YALE.hasOwnProperty(ch)) {
                result += '.';
            }

            result += HANGUL_TO_YALE[ch];
            wasHangul = true;
        }
        else {
            if (wasHangul && ch !== '.' && ch !== ' ' && ch !== '$') {
                result += '.';
            }
            result += ch;
            wasHangul = false;
        }
    }

    return result;
}

