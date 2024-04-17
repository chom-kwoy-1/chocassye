
const YALE_TO_HANGUL = {
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

    'o': '\u119e',
    'i': '\u1175',
    'a': '\u1161',
    'ng': '\u114c',
    '-': '–',
};

function yale_to_hangul(string) {
    let result = "";
    for (let i = 0; i < string.length;) {
        if (i < string.length - 1) {
            let ch = string.substring(i, i + 2);
            if (YALE_TO_HANGUL.hasOwnProperty(ch)) {
                result += YALE_TO_HANGUL[ch]
                i += 2;
                continue;
            }
        }
        let ch = string.substring(i, i + 1);
        if (YALE_TO_HANGUL.hasOwnProperty(ch)) {
            result += YALE_TO_HANGUL[ch]
            i += 1;
            continue;
        }

        i += 1;
    }
    return result;
}

export default yale_to_hangul;
