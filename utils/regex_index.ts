import { parseRegExpLiteral } from "regexpp";
import type {
    Alternative,
    Character,
    CharacterClass,
    CharacterSet,
    NodeBase,
    Pattern,
    Quantifier,
    RegExpLiteral
} from "regexpp/ast";
// @ts-ignore
import {make_ngrams} from "./ngram.js";
// @ts-ignore
import CompactPrefixTree from "./prefix_tree.js";

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

function unique_matches(matches: Match[]): Match[] {
    const seen = new Set<string>();
    return matches.filter(match => {
        const key = JSON.stringify(match);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

function match_or(a: Match, b: Match): Match {
    if (a.type === 'any' || b.type === 'any') {
        return <Any> { type: 'any' };
    }
    if (a.type === 'or') {
        if (b.type === 'or') {
            return <Or> {
                type: 'or',
                matches: unique_matches([...(a as Or).matches, ...(b as Or).matches]),
            };
        }
        return <Or> {
            type: 'or',
            matches: unique_matches([...(a as Or).matches, b]),
        };
    }
    if (b.type === 'or') {
        return <Or> {
            type: 'or',
            matches: unique_matches([a, ...(b as Or).matches]),
        };
    }
    return <Or> {
        type: 'or',
        matches: unique_matches([a, b]),
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
                matches: unique_matches([...(a as And).matches, ...(b as And).matches]),
            };
        }
        return <And> {
            type: 'and',
            matches: unique_matches([...(a as And).matches, b]),
        };
    }
    if (b.type === 'and') {
        return <And> {
            type: 'and',
            matches: unique_matches([a, ...(b as And).matches]),
        };
    }
    return <And> {
        type: 'and',
        matches: unique_matches([a, b]),
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
                    a.prefix
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

function concat_sets(setA: Set<string>, setB: Set<string>): Set<string> {
    const result = new Set<string>();
    for (const a of setA) {
        for (const b of setB) {
            result.add(a + b);
        }
    }
    return result;
}

function normalize_prefix(prefixes: Set<string>): Set<string> {
    // If prefix(e) contains both s and t where s is a prefix of t, discard t.
    const arr = Array.from(prefixes);
    prefixes = new Set(arr.filter((prefix, index) => {
        const trie = new CompactPrefixTree([
            ...arr.slice(0, index),
            ...arr.slice(index + 1),
        ]);
        return !trie.prefix(prefix).isProper; // filter out if shorter prefix exists
    }));
    return prefixes;
}

function normalize_suffix(suffixes: Set<string>): Set<string> {
    // If suffix(e) contains both s and t where s is a suffix of t, discard t.
    const arr = Array.from(suffixes).map(suffix => suffix.split('').reverse().join(''));
    suffixes = new Set(arr.filter((suffix, index) => {
        const trie = new CompactPrefixTree([
            ...arr.slice(0, index),
            ...arr.slice(index + 1),
        ]);
        return !trie.prefix(suffix).isProper; // filter out if shorter suffix exists
    }).map(suffix => suffix.split('').reverse().join('')));
    return suffixes;
}

function transform(result: ParsedRegExp): ParsedRegExp {
    const MAX_SET_SIZE = 32;

    result.prefix = normalize_prefix(result.prefix);
    result.suffix = normalize_suffix(result.suffix);

    while (result.prefix.size > MAX_SET_SIZE) {
        // Information-saving transformation
        result.match = match_and(result.match, ngrams(result.prefix));

        // Information-discarding transformation
        // If prefix(e) is too large, chop the last character off the longest strings in prefix(e).
        const max_prefix_size = Math.max(...Array.from(result.prefix).map((prefix) => prefix.length)) - 1;
        result.prefix = new Set(Array.from(result.prefix).map((prefix) => {
            if (prefix.length > max_prefix_size) {
                return prefix.slice(0, max_prefix_size);
            }
            return prefix;
        }));

        result.prefix = normalize_prefix(result.prefix);
    }

    while (result.suffix.size > MAX_SET_SIZE) {
        // Information-saving transformation
        result.match = match_and(result.match, ngrams(result.suffix));

        // Information-discarding transformation
        // If suffix(e) is too large, chop the first character off the longest strings in suffix(e).
        const max_suffix_size = Math.max(...Array.from(result.suffix).map((suffix) => suffix.length)) - 1;
        result.suffix = new Set(Array.from(result.suffix).map((suffix) => {
            if (suffix.length > max_suffix_size) {
                return suffix.slice(1);
            }
            return suffix;
        }));

        result.suffix = normalize_suffix(result.suffix);
    }

    if (result.exact !== null && result.exact.size > MAX_SET_SIZE) {
        // Information-saving transformation
        result.match = match_and(result.match, ngrams(result.exact));

        // If exact(e) is too large, set exact(e) = unknown.
        result.exact = null;
    }

    if (result.match.type === 'any') {
        // Information-saving transformation
        result.match = match_and(result.match, ngrams(result.prefix));
        result.match = match_and(result.match, ngrams(result.suffix));
    }
    if (result.exact !== null) {
        result.match = match_and(result.match, ngrams(result.exact));
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
                    result = transform(alternative(result!, cur));
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
                    result = transform(alternative(result!, cur));
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
                    result = transform(concat(result!, cur));
                }
            }
            break;
        }
        case 'Character': {
            const {value} = ast as Character;
            const ch = String.fromCodePoint(value);
            result = <ParsedRegExp> {
                emptyable: false,
                exact: new Set([ch]),
                prefix: new Set([ch]),
                suffix: new Set([ch]),
                match: <Any> { type: 'any' },
            };
            break;
        }
        case 'Quantifier': {
            const {element, min, max} = ast as Quantifier;
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
            result = transform(result);
            break;
        }
        case 'CharacterSet': {
            const {kind} = ast as CharacterSet;
            if (kind !== 'any') {
                throw new Error(`Unsupported character set kind: ${kind}`);
            }
            result = <ParsedRegExp> {
                emptyable: false,
                exact: null,
                prefix: new Set(['']),
                suffix: new Set(['']),
                match: <Any> { type: 'any' },
            };
            break;
        }
        default: {
            throw new Error(`Unknown AST node type: ${ast.type}`);
        }
    }

    return result!;
}

function get_all_ngrams(match: Match): Set<string> {
    if (match.type === 'any') {
        return new Set();
    }
    if (match.type === 'ngram') {
        return new Set([(match as Ngram).ngram]);
    }
    if (match.type === 'and') {
        const ngrams = new Set<string>();
        for (const m of (match as And).matches) {
            const ngram_set = get_all_ngrams(m);
            for (const ngram of ngram_set) {
                ngrams.add(ngram);
            }
        }
        return ngrams;
    }
    if (match.type === 'or') {
        const ngrams = new Set<string>();
        for (const m of (match as Or).matches) {
            const ngram_set = get_all_ngrams(m);
            for (const ngram of ngram_set) {
                ngrams.add(ngram);
            }
        }
        return ngrams;
    }
    throw new Error(`Unknown match type: ${match.type}`);
}

function setIntersection(setA: Set<number>, setB: Set<number>): Set<number> {
    if (setA.size > setB.size) {
        [setA, setB] = [setB, setA];  // Ensure setA is the smaller set
    }
    const intersection = new Set<number>();
    for (const item of setA) {
        if (setB.has(item)) {
            intersection.add(item);
        }
    }
    return intersection;
}

function find_ids(match: Match, match_sids: Map<string, number[][]>): Set<number> {
    if (match.type === 'any') {
        throw new Error("Cannot find IDs for 'any' match type");
    }
    if (match.type === 'ngram') {
        const ngram = (match as Ngram).ngram;
        if (!match_sids.has(ngram)) {
            throw new Error(`Ngram not found in match_sids: ${ngram}`);
        }
        const arrays = match_sids.get(ngram)!;
        const ids = new Set<number>();
        for (const array of arrays) {
            for (const id of array) {
                ids.add(id);
            }
        }
        return ids;
    }
    if (match.type === 'and') {
        return (match as And).matches.reduce((acc: Set<number> | null, m: Match): Set<number> => {
            const ids = find_ids(m, match_sids);
            if (acc === null) {
                return ids;
            }
            return setIntersection(acc, ids);
        }, null)!;
    }
    if (match.type === 'or') {
        return (match as Or).matches.reduce((acc, m) => {
            const ids = find_ids(m, match_sids);
            return new Set([...acc, ...ids]);
        }, new Set<number>());
    }
    throw new Error(`Unknown match type: ${match.type}`);
}

export function find_candidate_ids(
  regex: RegExp,
  ngram_maps: Map<string, number[]>[],
  verbose: boolean = false,
) {
    const ast = parseRegExpLiteral(regex);
    const result = visit(ast);
    if (verbose) {
        console.log("Parsed regex:", regex);
        console.dir(result, { depth: 10, colors: true });
    }

    const match_ngrams = get_all_ngrams(result.match);
    if (verbose) {
        console.log("Extracted", match_ngrams.size, "ngrams:");
        console.log(match_ngrams);
    }

    const match_sids = new Map<string, number[][]>();
    for (const ngram of match_ngrams) {
        const ids: number[][] = [];
        let count = 0;
        for (const ngram_map of ngram_maps) {
            const new_ids = ngram_map.get(ngram);
            if (new_ids) {
                count += new_ids.length;
                ids.push(new_ids);
            }
        }
        match_sids.set(ngram, ids);
        if (verbose) {
            console.log(count, "IDs found for ngram:", ngram);
        }
    }

    return find_ids(result.match, match_sids);
}
