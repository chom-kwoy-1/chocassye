import { assemble } from "es-hangul";
import fs from "fs";
import { promisify } from "node:util";
import path from "path";

import { phonemize } from "@/utils/phonemize";

export const wordlist = new Map<string, string[]>();
await promisify(fs.readFile)(
  path.join(process.cwd(), "chocassye-corpus/english_pron.csv"),
  "utf8",
)
  .then((data) => {
    // split by new line and remove empty lines
    const lines = data
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    for (const line of lines) {
      const word = line.split(",")[0];
      const pron = line.split(",")[1].replaceAll("\u2009", " ");
      if (wordlist.has(word)) {
        wordlist.get(word)!.push(pron);
      } else {
        wordlist.set(word, [pron]);
      }
    }
    console.log(`Loaded ${wordlist.size} words from english_pron.csv`);
  })
  .catch((err) => {
    console.error("Error reading english_pron.csv:", err);
  });

// prettier-ignore
const vowelDict: {[key: string]: string} = {
  'ɪ': 'i', 'ɪ́': 'i', 'ɪj': 'VY', 'ɪ́j': 'VY', 'ɪː': 'iv', 'ɪ́ː': 'iv',
  'ɛ': 'ë', 'ɛ́': 'ë', 'ɛj': 'ëiY', 'ɛ́j': 'ëiY', 'ɛː': 'ëv', 'ɛ́ː': 'ëv',
  'ɔ': 'o', 'ɔ́': 'o', 'oj': 'oiY', 'ój': 'oiY', 'oː': 'ov', 'óː': 'ov', 'ó': 'o',
  'a': 'a', 'á': 'a', 'ɑj': 'aiY', 'ɑ́j': 'aiY', 'aw': 'au', 'áw': 'au', 'ɑː': 'av', 'ɑ́ː': 'av',
  'ɵ': 'u', 'ɵ́': 'u', 'ʉw': 'vu', 'ʉ́w': 'vu', 'ɵː': 'uv', 'ɵ́ː': 'uv',
  'ə': 'e', 'ə́': 'e', 'əw': 'eu', 'ə́w': 'eu', 'əː': 'ev', 'ə́ː': 'ev', 'ʌ': 'e', 'ʌ́': 'e',
}
// prettier-ignore
const consonantDict: {[key: string]: string[]} = {
  // Consonants (#_, V_V, _#)
  'b': ['b', 'p', 'pv'],
  'd': ['d', 't', 'tv'],
  'f': ['P', 'P', 'Pv'],
  'g': ['g', 'k', 'kv'],
  'h': ['h', 'h', 'hv'],
  'j': ['y', 'y', 'y'],
  'k': ['K', 'K', 'Kv'],
  'K': ['K', 'K', 'Kv'],
  'l': ['l', 'll', 'l'],
  'm': ['m', 'm', 'm'],
  'n': ['n', 'n', 'n'],
  'p': ['P', 'P', 'Pv'],
  'r': ['l', 'l', 'lv'],
  's': ['S', 'S', 'Sv'],
  't': ['T', 'T', 'Tv'],
  'v': ['p', 'p', 'pv'],
  'w': ['w', 'w', 'u'],
  'z': ['c', 'c', 'cv'],
  'ð': ['t', 't', 'tv'],
  'ŋ': ['N', 'N', 'N'],
  'ʃ': ['z', 'z', 'si'],
  'ʒ': ['c', 'c', 'ci'],
  'ʤ': ['j', 'c', 'ci'],
  'ʧ': ['C', 'C', 'Ci'],
  'θ': ['s', 's', 'sv'],
  'ts': ['C', 'C', 'Cv'],
  'dz': ['j', 'c', 'cv'],
}
const sortedPhonKeys = [
  ...Object.keys(consonantDict),
  ...Object.keys(vowelDict),
]
  .filter((k) => !["ts", "dz"].includes(k))
  .sort((a, b) => b.length - a.length);

// prettier-ignore
const amToBrMapping: {[key: string]: string} = {
  // Vowels
  "ɑɫ": "ɑː", "æ": "a", "ʌ": "ʌ", "aʊ": "aw",
  "ə": "ə", "aɪ": "ɑj", "ɛ": "ɛ", "eɪ": "ɛj",
  "ɪ": "ɪ", "ɨ": "ɪ", "i": "ɪj", "oʊ": "əw",
  "ɔɪ": "oj", "ʊ": "ɵ", "u": "ʉw", "ʉ": "ʉw",
  "ɑ": "ɔ",
  // Long vowels
  "ɔɹ": "oː", "ɝ": "əː", "ɚ": "əː", "ɪɹ": "ɪː",
  "ɛɹ": "ɛː", "ʊɹ": "ɵː", "ɔ": "oː", "ɑɹ": "ɑː",
  // Consonants
  "b": "b", "tʃ": "ʧ", "d": "d", "ð": "ð", "ɾ": "t",
  "l̩": "l", "m̩": "m", "n̩": "n", "f": "f", "ɡ": "g",
  "h": "h", "dʒ": "ʤ", "k": "k", "l": "l", "m": "m",
  "n": "n", "ŋ": "ŋ", "ɾ̃": "nt", "p": "p", "ʔ": "t",
  "ɹ": "r", "s": "s", "ʃ": "ʃ", "t": "t", "θ": "θ",
  "v": "v", "w": "w", "ʍ": "w", "j": "j", "z": "z",
  "ʒ": "ʒ", "ɫ": "l",
};
const amToBrSortedKeys = Object.keys(amToBrMapping).sort(
  (a, b) => b.length - a.length,
);

export function normalizeIPA(ipa: string) {
  const regex = new RegExp(`(${amToBrSortedKeys.join("|")})`, "g");
  ipa = ipa.replaceAll(regex, (match) => {
    return amToBrMapping[match];
  });
  // primary stress
  ipa = ipa.replaceAll(/ˈ([^ɪɛɔoaɑɵʉəʌ]*?)([ɪɛɔoaɑɵʉəʌ])/g, (_, p1, p2) => {
    return `${p1}${p2}\u0301`;
  });
  // secondary stress
  ipa = ipa.replaceAll(/ˌ([^ɪɛɔoaɑɵʉəʌ]*?)([ɪɛɔoaɑɵʉəʌ])/g, (_, p1, p2) => {
    return `${p1}${p2}\u0300`;
  });
  // Replace unstressed "er" as short
  ipa = ipa.replaceAll(/əː/g, "ə");
  // Remove secondary stress marker
  ipa = ipa.replaceAll("\u0300", "");
  // Insert spaces between each phoneme
  const phonRegex = new RegExp(`(${sortedPhonKeys.join("|")})`, "g");
  ipa = ipa
    .replaceAll(phonRegex, (match) => {
      return `${match} `;
    })
    .trim();
  return ipa;
}

function determinePronVariant(
  prons: string[],
  prevProns: string[],
  nextProns: string[],
) {
  // TODO: implement logic
  return prons[0];
}

// prettier-ignore
const voicedConsonants = ['b', 'd', 'g', 'j', 'l', 'm', 'n', 'r', 'v', 'w', 'z', 'ð', 'ŋ', 'ʒ', 'ʤ', 'dz'];
// prettier-ignore
const voicelessConsonants = ['f', 'h', 'k', 'K', 'p', 's', 't', 'ʃ', 'ʧ', 'θ', 'ts'];

function getPhonemeType(phoneme: string): string | null {
  if (Object.keys(vowelDict).includes(phoneme)) {
    return "Vowel";
  } else if (voicedConsonants.includes(phoneme)) {
    return "C[+voiced]";
  } else if (voicelessConsonants.includes(phoneme)) {
    return "C[-voiced]";
  }
  return null;
}

// prettier-ignore
const consHangul: {[key: string]: string} = {
  'k': 'ㄱ', 'g': 'ㄲ', 'K': 'ㅋ', 'n': 'ㄴ', 't': 'ㄷ', 'd': 'ㄸ', 'T': 'ㅌ',
  'l': 'ㄹ', 'm': 'ㅁ', 'p': 'ㅂ', 'b': 'ㅃ', 'P': 'ㅍ', 's': 'ㅅ', 'S': 'ㅆ',
  'c': 'ㅈ', 'j': 'ㅉ', 'C': 'ㅊ', 'h': 'ㅎ', 'N': 'ㅇ', 'z': 'ㅅ',
}
// prettier-ignore
const vowelHangul: {[key: string]: string} = {
  'a': 'ㅏ', 'e': 'ㅓ', 'o': 'ㅗ', 'u': 'ㅜ', 'v': 'ㅡ', 'i': 'ㅣ', 'ä': 'ㅐ', 'ë': 'ㅔ', 'ö': 'ㅚ',
  'ya': 'ㅑ', 'ye': 'ㅕ', 'yo': 'ㅛ', 'yu': 'ㅠ', 'yä': 'ㅒ', 'yë': 'ㅖ',
  'wa': 'ㅘ', 'we': 'ㅝ', 'wä': 'ㅙ', 'wë': 'ㅞ', 'V': 'ㅢ',
}

const syllableRegex =
  "(" + // group 1: syllable
  "([kgKntdTlmpbPsScjChz]?)" + // group 2: initial consonant
  "([aeouviäëöV]|[yY][aeouäë]|w[aeäë])" + // group 3: vowel
  "(Y?[kntlmpN](?=[kgKntdTlmpbPsScjChz]+|$)|)" + // group 4: final consonant
  ")" +
  "|([kgKntdTlmpbPsScjChz][yY])" + // group 5: Cy
  "|(.)"; // group 6: other character

function convPhonemesToHangul(phonemes: string) {
  phonemes = phonemes.replaceAll("t s", "ts").replaceAll("d z", "dz");
  const phonemeList = phonemes.split(" ");

  // Skip puncutations
  if (phonemeList.every((phoneme) => getPhonemeType(phoneme) === null)) {
    return { result: phonemes, isPunc: true };
  }

  const converted = phonemeList
    .map((phoneme, idx) => {
      const lastPhoneme = phonemeList[idx - 1];
      const nextPhoneme = phonemeList[idx + 1];
      const curType = getPhonemeType(phoneme);
      if (curType === null) {
        return null;
      }
      if (curType === "Vowel") {
        return vowelDict[phoneme];
      } else if (curType.startsWith("C")) {
        if (lastPhoneme === undefined) {
          return consonantDict[phoneme][0];
        } else if (nextPhoneme === undefined) {
          return consonantDict[phoneme][2];
        } else {
          // change depending on prev/next sound type
          const lastType = getPhonemeType(lastPhoneme);
          const nextType = getPhonemeType(nextPhoneme);
          if (lastType === "Vowel" && nextType === "Vowel") {
            return consonantDict[phoneme][1];
          } else if (lastType?.startsWith("C")) {
            return consonantDict[phoneme][0];
          } else {
            return consonantDict[phoneme][2];
          }
        }
      }
    })
    .filter((phoneme) => phoneme !== null)
    .join("");

  const syllables = [...converted.matchAll(new RegExp(syllableRegex, "g"))];
  const result = syllables
    .map((match) => {
      // eslint-disable-next-line prefer-const
      let [_, syllable, initial, vowel, final, cy, other] = match;
      if (cy !== undefined) {
        return compose(consHangul[cy[0]], "ㅣ", "");
      } else if (syllable === undefined) {
        switch (other) {
          case "Y":
            return "";
          case "z":
            return "시";
          case "y":
            return "이";
          case "w":
            return "우";
          default:
            if (Object.keys(consHangul).includes(other)) {
              const initial = consHangul[other];
              return compose(initial, "ㅡ", "");
            }
            return ""; // give up
        }
      } else {
        if (final && final.startsWith("Y")) {
          final = final.substring(1);
        }
        initial = initial ? consHangul[initial] : "ㅇ";
        vowel = vowelHangul[vowel.replaceAll("Y", "y")];
        final = final ? consHangul[final.replaceAll("t", "s")] : "";
        return compose(initial, vowel, final);
      }
    })
    .join("");

  return { result: result, isPunc: false };
}

function compose(initial: string, vowel: string, final: string) {
  return assemble([initial, vowel, final]);
}

export async function convert(text: string): Promise<string> {
  const words = phonemize(text, {
    returnArray: true,
    format: "ipa",
    stripStress: false,
  });

  // 1. Determine all the variant pronunciations for each word
  const pronCandidates: string[][] = [];
  for (const word of words) {
    const pron =
      wordlist.get(word.word) ?? wordlist.get(word.word.toLowerCase()) ?? [];
    if (pron.length === 0) {
      pron.push(normalizeIPA(word.phoneme));
    }
    pronCandidates.push(pron);
  }

  // 2. Determine the precise pronunciation of each word,
  //  considering the environment. Also apply intrusive R
  const precisePronunciations = pronCandidates.map((prons, idx) => {
    const prevProns = pronCandidates[idx - 1];
    const nextProns = pronCandidates[idx + 1];
    return determinePronVariant(prons, prevProns, nextProns);
  });

  // 3. Convert pronunciation into Korean phonemes
  const korean = precisePronunciations.map(convPhonemesToHangul);

  let result = "";
  for (const word of korean) {
    if (word.isPunc) {
      result += word.result;
    } else {
      result += " " + word.result;
    }
  }

  return result.trim();
}
