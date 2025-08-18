// @ts-ignore
import {insert_documents} from "./parse.js";
// @ts-ignore
import {make_ngrams} from "../ngram.js";
import {
    parseRegExpLiteral
} from "regexpp";
import type {Alternative, Character, CharacterClass, NodeBase, Pattern, RegExpLiteral} from "regexpp/ast";


interface Match {
    type: 'and' | 'or' | 'any' | 'ngram';
}

interface And extends Match {
    type: 'and';
    matches: Match[];
}

interface Or extends Match {
    type: 'or';
    matches: Match[];
}

interface Any extends Match {
    type: 'any';
}

interface Ngram extends Match {
    type: 'ngram';
    ngram: string;
}

function match_or(a: Match, b: Match): Match {
    if (a.type === 'any' || b.type === 'any') {
        return <Any> { type: 'any' };
    }
    if (a.type === 'or') {
        if (b.type === 'or') {
            return <Or> {
                type: 'or',
                matches: [...(a as Or).matches, ...(b as Or).matches],
            };
        }
        return <Or> {
            type: 'or',
            matches: [...(a as Or).matches, b],
        };
    }
    if (b.type === 'or') {
        return <Or> {
            type: 'or',
            matches: [a, ...(b as Or).matches],
        };
    }
    return <Or> {
        type: 'or',
        matches: [a, b],
    };
}

function match_and(a: Match, b: Match): Match {
    if (a.type === 'any') {
        return b;
    }
    if (b.type === 'any') {
        return a;
    }
    if (a.type === 'and') {
        if (b.type === 'and') {
            return <And> {
                type: 'and',
                matches: [...(a as And).matches, ...(b as And).matches],
            };
        }
        return <And> {
            type: 'and',
            matches: [...(a as And).matches, b],
        };
    }
    if (b.type === 'and') {
        return <And> {
            type: 'and',
            matches: [a, ...(b as And).matches],
        };
    }
    return <And> {
        type: 'and',
        matches: [a, b],
    };
}

function ngrams_single(text: string): Match {
    let result: Match = <Any> { type: 'any' };
    for (const ng of make_ngrams(text, 3)) {
        result = match_and(result, <Ngram> { type: 'ngram', ngram: ng });
    }
    return result;
}

function ngrams(set: Set<string>): Match {
    if (set.size === 0) {
        throw new Error("Empty set cannot be converted to ngrams");
    }
    const values = Array.from(set);
    let result: Match = ngrams_single(values[0]!);
    for (let i = 1; i < values.length; i++) {
        result = match_or(result, ngrams_single(values[i]!));
    }
    return result;
}

interface ParsedRegExp {
    emptyable: boolean;
    exact: Set<string> | null;  // null is unknown
    prefix: Set<string>;
    suffix: Set<string>;
    match: Match;
}

function alternative(a: ParsedRegExp, b: ParsedRegExp): ParsedRegExp {
    return <ParsedRegExp> {
        emptyable: a.emptyable || b.emptyable,
        exact: (
            a.exact !== null && b.exact !== null ?
                new Set([...a.exact, ...b.exact]) : null
        ),
        prefix: new Set([...a.prefix, ...b.prefix]),
        suffix: new Set([...a.suffix, ...b.suffix]),
        match: match_or(a.match, b.match),
    };
}

function concat(a: ParsedRegExp, b: ParsedRegExp): ParsedRegExp {
    return <ParsedRegExp> {
        emptyable: a.emptyable && b.emptyable,
        exact: (
            a.exact !== null && b.exact !== null ?
                concat_sets(a.exact, b.exact) : null
        ),
        prefix: (
            a.exact !== null ?
                concat_sets(a.exact, b.prefix) :
                a.emptyable ?
                    new Set([...a.prefix, ...b.prefix]) :
                    b.prefix
        ),
        suffix: (
            b.exact !== null ?
                concat_sets(a.suffix, b.exact) :
                b.emptyable ?
                    new Set([...b.suffix, ...a.suffix]) :
                    b.suffix
        ),
        match: match_and(a.match, b.match),
    };
}


async function main(): Promise<[string[], Map<string, number[]>]> {
    const BATCH_SIZE = 16;

    const all_sentences: string[] = [];
    const ngram_map: Map<string, number[]> = new Map();

    function insert_into_db(book_details: any, sentences: any[]) {
        for (const sentence of sentences) {
            const sentence_id = all_sentences.length;
            all_sentences.push(sentence.text);

            const ngram_3 = make_ngrams(sentence.text, 3);
            for (const ch of ngram_3) {
                if (!ngram_map.has(ch)) {
                    ngram_map.set(ch, []);
                }
                ngram_map.get(ch)!.push(sentence_id);
            }
        }
    }

    return insert_documents(insert_into_db, BATCH_SIZE, 10)
        .then(() => {
            console.log("All sentences collected:", all_sentences.length);
            return [all_sentences, ngram_map];
        });
}

const [sentences, ngram_map] = await main();

const regex = /[ou]?[nl]q?\.tt?[ae]y|w[ou]\.t[ou]y/g;

// find all sentences that match the regex
const matching_sentences = sentences.filter(sentence => regex.test(sentence));
console.log("Matching sentences:", matching_sentences);

function concat_sets(setA: Set<string>, setB: Set<string>): Set<string> {
    const result = new Set<string>();
    for (const a of setA) {
        for (const b of setB) {
            result.add(a + b);
        }
    }
    return result;
}

function visit(ast: NodeBase): ParsedRegExp {
    let result: ParsedRegExp;
    switch (ast.type) {
        case 'RegExpLiteral': {
            const {pattern} = ast as RegExpLiteral;
            return visit(pattern);
        }
        case 'Pattern': {  // Alternation
            const {alternatives} = ast as Pattern;
            for (const [idx, element] of alternatives.entries()) {
                const cur = visit(element);
                if (idx === 0) {
                    result = cur;
                } else {
                    result = alternative(result!, cur);
                }
            }
            break;
        }
        case 'CharacterClass': {  // Character class (Alternation)
            const {negate, elements} = ast as CharacterClass;
            if (negate) {
                throw new Error("Negated character classes are not supported");
            }
            for (const [idx, element] of elements.entries()) {
                const cur = visit(element);
                if (idx === 0) {
                    result = cur;
                } else {
                    result = alternative(result!, cur);
                }
            }
            break;
        }
        case 'Alternative': {  // Concatenation
            const {elements} = ast as Alternative;
            for (const [idx, element] of elements.entries()) {
                const cur = visit(element);
                if (idx === 0) {
                    result = cur;
                } else {
                    result = concat(result!, cur);
                }
            }
            break;
        }
        case 'Character': {
            const {raw} = ast as Character;
            result = <ParsedRegExp> {
                emptyable: false,
                exact: new Set([raw]),
                prefix: new Set([raw]),
                suffix: new Set([raw]),
                match: <Any> { type: 'any' },
            };
            break;
        }
        case 'Quantifier': {
            const {element, min, max} = ast as any;
            const cur = visit(element);
            if (min === 0 && max === 1) {  // Zero or one
                result = <ParsedRegExp> {
                    emptyable: true,
                    exact: cur.exact !== null ? new Set([...cur.exact, '']) : null,
                    prefix: new Set(['']),
                    suffix: new Set(['']),
                    match: <Any> { type: 'any' },
                }
            }
            else if (min === 0 && max === Infinity) {  // Zero or more
                result = <ParsedRegExp> {
                    emptyable: true,
                    exact: null,
                    prefix: new Set(['']),
                    suffix: new Set(['']),
                    match: <Any> { type: 'any' },
                }
            }
            else if (min === 1 && max === Infinity) {  // One or more
                result = <ParsedRegExp> {
                    emptyable: cur.emptyable,
                    exact: null,
                    prefix: cur.prefix,
                    suffix: cur.suffix,
                    match: cur.match,
                }
            }
            else {
                throw new Error(`Unsupported quantifier: {${min}, ${max}}`);
            }
            break;
        }
        default: {
            throw new Error(`Unknown AST node type: ${ast.type}`);
        }
    }

    // Information-saving transformations
    result!.match = match_and(result!.match, ngrams(result!.prefix));
    result!.match = match_and(result!.match, ngrams(result!.suffix));
    if (result!.exact !== null) {
        result!.match = match_and(result!.match, ngrams(result!.exact));
    }

    // Information-discarding transformations

    return result!;
}

const ast = parseRegExpLiteral(regex);
const result = visit(ast);
console.dir(result, { depth: 10, colors: true });
