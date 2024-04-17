
const YALE_TO_HANGUL_INITIAL_CONSONANTS = {
    'k': '\u1100',
    'kk': '\u1101',
    'n': '\u1102',
    't': '\u1103',
    'tt': '\u1104',
    'l': '\u1105',
    'm': '\u1106',
    'p': '\u1107',
    'pp': '\u1108',
    's': '\u1109',
    'ss': '\u110a',
    'G': '\u110B',
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

    '`': '\u115f',
};

const YALE_TO_HANGUL_FINAL_CONSONANTS = {
    'k': '\u11a8',
    'kk': '\u11a9',
    'ks': '\u11aa',
    'n': '\u11ab',
    'nc': '\u11ac',
    'nh': '\u11ad',
    't': '\u11ae',
    'l': '\u11af',
    'lk': '\u11b0',
    'lm': '\u11b1',
    'lp': '\u11b2',
    'ls': '\u11b3',
    'lth': '\u11b4',
    'lph': '\u11b5',
    'lh': '\u11b6',
    'm': '\u11b7',
    'p': '\u11b8',
    'ps': '\u11b9',
    's': '\u11ba',
    'ss': '\u11bb',
    'G': '\u11bc',
    'c': '\u11bd',
    'ch': '\u11be',
    'kh': '\u11bf',
    'th': '\u11c0',
    'ph': '\u11c1',
    'h': '\u11c2',
    'nt': '\u11c6',
    'ns': '\u11c7',
    'nz': '\u11c8',
    'nth': '\u11c9',
    'lks': '\u11cc',
    'lz': '\u11d7',
    'lq': '\u11d9',
    'mk': '\u11da',
    'mp': '\u11dc',
    'ms': '\u11dd',
    'mz': '\u11df',
    'mch': '\u11e0',
    'M': '\u11e2',
    'W': '\u11e6',
    'sk': '\u11e7',
    'st': '\u11e8',
    'z': '\u11eb',
    'ng': '\u11f0',
    'f': '\u11f4',
    'q': '\u11f9',
    'ngs': '\u11f1'
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
    'yuy': '\u1194'
};

const YALE_TO_HANGUL_INITIALS = {
    ...YALE_TO_HANGUL_INITIAL_CONSONANTS,
    ...YALE_TO_HANGUL_VOWELS
};
const YALE_TO_HANGUL_FINALS = {
    ...YALE_TO_HANGUL_FINAL_CONSONANTS,
    ...YALE_TO_HANGUL_VOWELS
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


function yale_to_hangul(string) {
    let result = "";
    let wasLastVowel = false;
    for (let i = 0; i < string.length;) {
        let skip = false;

        for (let l = 3; l >= 1; --l) {
            if (i < string.length - l + 1) {
                let ch = string.substring(i, i + l);
                if (wasLastVowel) {
                    if (YALE_TO_HANGUL_FINALS.hasOwnProperty(ch)) {
                        result += YALE_TO_HANGUL_FINALS[ch]
                        i += l;

                        if (YALE_TO_HANGUL_FINAL_CONSONANTS.hasOwnProperty(ch)) {
                            wasLastVowel = false;
                        }
                        skip = true;
                        break;
                    }
                }
                else if (YALE_TO_HANGUL_INITIALS.hasOwnProperty(ch)) {
                    result += YALE_TO_HANGUL_INITIALS[ch]
                    i += l;

                    wasLastVowel = YALE_TO_HANGUL_VOWELS.hasOwnProperty(ch);
                    skip = true;
                    break;
                }
            }
        }

        if (skip) {
            continue;
        } else {
            wasLastVowel = false;
            if (string[i] !== '.') {
                result += string[i];
            }
            i += 1;
        }
    }
    return result;
}

function hangul_to_yale(string) {
    let result = "";
    let wasHangul = false;

    for (let ch of string) {
        if (HANGUL_TO_YALE.hasOwnProperty(ch)) {
            if (wasHangul && INITIAL_HANGUL_TO_YALE.hasOwnProperty(ch)) {
                result += '.';
            }

            result += HANGUL_TO_YALE[ch];
            wasHangul = true;
        }
        else {
            result += ch;
            wasHangul = false;
        }
    }

    return result;
}

module.exports = { yale_to_hangul, hangul_to_yale };
