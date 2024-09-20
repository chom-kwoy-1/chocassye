import csv
import hgtk
import re
import zerorpc


def read_csv(file_name):
    with open(file_name, 'r') as f:
        reader = csv.reader(f)
        return [row for row in reader]


def read_dictionary():
    data = read_csv('chocassye-corpus/english_pron.csv')

    dictionary = {}

    for spelling, sound in data:
        phonemes = sound.split('\u2009')
        if spelling not in dictionary:
            dictionary[spelling] = []
        dictionary[spelling].append(phonemes)

    return dictionary


words = read_dictionary()

vowel_dict = {
    # Vowels
    'ɪ': 'i', 'ɪ́': 'i', 'ɪj': 'VY', 'ɪ́j': 'VY', 'ɪː': 'iv', 'ɪ́ː': 'iv',
    'ɛ': 'ë', 'ɛ́': 'ë', 'ɛj': 'ëiY', 'ɛ́j': 'ëiY', 'ɛː': 'ëv', 'ɛ́ː': 'ëv',
    'ɔ': 'o', 'ɔ́': 'o', 'oj': 'oiY', 'ój': 'oiY', 'oː': 'ov', 'óː': 'ov', 'ó': 'o',
    'a': 'a', 'á': 'a', 'ɑj': 'aiY', 'ɑ́j': 'aiY', 'aw': 'au', 'áw': 'au', 'ɑː': 'av', 'ɑ́ː': 'av',
    'ɵ': 'u', 'ɵ́': 'u', 'ʉw': 'vu', 'ʉ́w': 'vu', 'ɵː': 'uv', 'ɵ́ː': 'uv',
    'ə': 'e', 'ə́': 'e', 'əw': 'eu', 'ə́w': 'eu', 'əː': 'ev', 'ə́ː': 'ev', 'ʌ': 'e', 'ʌ́': 'e',
}

consonants_dict = {
    # Consonants (#_, V_V, _#)
    'b': ('b', 'p', 'pv'),
    'd': ('d', 't', 'tv'),
    'f': ('P', 'P', 'Pv'),
    'g': ('g', 'k', 'kv'),
    'h': ('h', 'h', 'hv'),
    'j': ('y', 'y', 'y'),
    'k': ('K', 'K', 'Kv'),
    'K': ('K', 'K', 'Kv'),
    'l': ('l', 'll', 'l'),
    'm': ('m', 'm', 'm'),
    'n': ('n', 'n', 'n'),
    'p': ('P', 'P', 'Pv'),
    'r': ('l', 'l', 'lv'),
    's': ('S', 'S', 'Sv'),
    't': ('T', 'T', 'Tv'),
    'v': ('p', 'p', 'pv'),
    'w': ('w', 'w', 'u'),
    'z': ('c', 'c', 'cv'),
    'ð': ('t', 't', 'tv'),
    'ŋ': ('N', 'N', 'N'),
    'ʃ': ('z', 'z', 'si'),
    'ʒ': ('c', 'c', 'ci'),
    'ʤ': ('j', 'c', 'ci'),
    'ʧ': ('C', 'C', 'Ci'),
    'θ': ('s', 's', 'sv'),
    'ts': ('C', 'C', 'Cv'),
    'dz': ('j', 'c', 'cv'),
}

voiced_consonants = ['b', 'd', 'g', 'j', 'l', 'm', 'n', 'r', 'v', 'w', 'z', 'ð', 'ŋ', 'ʒ', 'ʤ', 'dz']
voiceless_consonants = ['f', 'h', 'k', 'K', 'p', 's', 't', 'ʃ', 'ʧ', 'θ', 'ts']

korean_vowels = ['a', 'e', 'o', 'u', 'v', 'i', 'ä', 'ë', 'ö']
korean_consonants = ['k', 'g', 'K', 'n', 't', 'd', 'T', 'l', 'm', 'p', 'b', 'P', 's', 'S', 'c', 'j', 'C', 'h']

V_regex = r'[' + ''.join(korean_vowels) + ']'  # r'[aeouviäëö]'
C_regex = r'[' + ''.join(korean_consonants) + ']'  # r'[kgKntdTlmpbPsScjCh]'

syllable_regex = (r'('  # group 1: syllable
                  r'([kgKntdTlmpbPsScjChz]?)'  # group 2: initial consonant
                  r'([aeouviäëöV]|(?:y|Y)[aeouäë]|w[aeäë])'  # group 3: vowel
                  r'(Y?[kntlmpN](?=[kgKntdTlmpbPsScjChz]+|$)|)'  # group 4: final consonant
                  r')|(.)')  # group 5: other character

cons_hangul = {
    'k': 'ㄱ', 'g': 'ㄲ', 'K': 'ㅋ', 'n': 'ㄴ', 't': 'ㄷ', 'd': 'ㄸ', 'T': 'ㅌ',
    'l': 'ㄹ', 'm': 'ㅁ', 'p': 'ㅂ', 'b': 'ㅃ', 'P': 'ㅍ', 's': 'ㅅ', 'S': 'ㅆ',
    'c': 'ㅈ', 'j': 'ㅉ', 'C': 'ㅊ', 'h': 'ㅎ', 'N': 'ㅇ', 'z': 'ㅅ',
}
vowel_hangul = {
    'a': 'ㅏ', 'e': 'ㅓ', 'o': 'ㅗ', 'u': 'ㅜ', 'v': 'ㅡ', 'i': 'ㅣ', 'ä': 'ㅐ', 'ë': 'ㅔ', 'ö': 'ㅚ',
    'ya': 'ㅑ', 'ye': 'ㅕ', 'yo': 'ㅛ', 'yu': 'ㅠ', 'yä': 'ㅒ', 'yë': 'ㅖ',
    'wa': 'ㅘ', 'we': 'ㅝ', 'wä': 'ㅙ', 'wë': 'ㅞ', 'V': 'ㅢ',
}


def get_type(phoneme):
    if phoneme in vowel_dict:
        return 'Vowel'
    elif phoneme in voiced_consonants:
        return 'C[+voiced]'
    elif phoneme in voiceless_consonants:
        return 'C[-voiced]'
    else:
        return None


def merge_ts_dz(phonemes):
    phonemes = list(phonemes)
    for idx in range(len(phonemes) - 1):
        if phonemes[idx] == 't' and phonemes[idx + 1] == 's':
            phonemes[idx] = 'ts'
            phonemes[idx + 1] = ''
        elif phonemes[idx] == 'd' and phonemes[idx + 1] == 'z':
            phonemes[idx] = 'dz'
            phonemes[idx + 1] = ''
    return list(filter(lambda x: x != '', phonemes))


def convert_phonemes_to_hangul(phonemes):
    phonemes = merge_ts_dz(phonemes)
    phonemes = list(filter(lambda x: x != ' ', phonemes))

    if len(phonemes) == 0:
        return ''

    converted = []

    for idx in range(len(phonemes)):
        phoneme = phonemes[idx]
        last_phoneme = phonemes[idx - 1] if idx > 0 else None
        next_phoneme = phonemes[idx + 1] if idx < len(phonemes) - 1 else None
        last_type = get_type(last_phoneme) if last_phoneme else None
        next_type = get_type(next_phoneme) if next_phoneme else None

        if phoneme in vowel_dict:
            converted.append(vowel_dict[phoneme])
        elif phoneme in consonants_dict:
            if last_phoneme is None:
                converted.append(consonants_dict[phoneme][0])
            elif next_phoneme is None:
                converted.append(consonants_dict[phoneme][2])
            else:
                converted.append(consonants_dict[phoneme][1])
        else:
            pass

    converted = ''.join(converted)

    syllables = re.findall(syllable_regex, converted)

    result = ""
    for syllable in syllables:
        if syllable[0] == '':
            if syllable[4] == 'Y':
                syllable = ''
            elif syllable[4] == 'z':
                syllable = '시'
            elif syllable[4] == 'y':
                syllable = '이'
            elif syllable[4] == 'w':
                syllable = '우'
            elif syllable[4] in cons_hangul:
                initial = cons_hangul[syllable[4]]
                syllable = hgtk.letter.compose(initial, 'ㅡ', '')
            else:
                syllable = ''

        else:
            initial, vowel, final = syllable[1], syllable[2], syllable[3]
            if final.startswith('Y'):
                final = final[1:]
            initial = cons_hangul[initial] if initial else 'ㅇ'
            vowel = vowel_hangul[vowel.replace('Y', 'y')]
            final = cons_hangul[final.replace('t', 's')] if final else ''
            syllable = hgtk.letter.compose(initial, vowel, final)

        result += syllable

    return result


def convert_sentence_to_phonemes(sentence):
    # cleanup punctuation
    sentence = sentence.replace('.', '').replace(',', '').replace('?', '').replace('!', '')
    sentence = sentence.replace(' \'', ' ').replace('\' ', ' ').replace(' \"', ' ').replace('\" ', ' ')
    sentence = sentence.replace(';', '').replace(':', '')

    if len(sentence) == 0:
        return []

    phonemes = []
    for word in sentence.split():
        word = word.lower() if word not in words else word
        if word in words:
            phonemes.extend(words[word][0])
        else:
            phonemes.append(word)
    return phonemes


def hangulize(sentence):
    phonemes = convert_sentence_to_phonemes(sentence)
    result = convert_phonemes_to_hangul(phonemes)
    return ' '.join(phonemes), result


def test():
    sentence = "I am trying to replace parts of file extensions in a list of files."
    phonemes = convert_sentence_to_phonemes(sentence)
    print(phonemes)
    result = convert_phonemes_to_hangul(phonemes)
    print(result)

    result = convert_phonemes_to_hangul(words['unsheathed'][0])
    for word, sounds in words.items():
        print(f"Word: {word}")
        for phonemes in sounds:
            result = convert_phonemes_to_hangul(phonemes)
            print(f"  Phonemes: {phonemes}")
            print(f"  Hangul: {result}")
