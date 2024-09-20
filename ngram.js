
export function make_ngrams(text, n) {
    let ngrams = [];
    for (let i = 0; i < text.length - n + 1; i++) {
        ngrams.push(text.slice(i, i + n));
    }
    return [...new Set(ngrams)];
}
