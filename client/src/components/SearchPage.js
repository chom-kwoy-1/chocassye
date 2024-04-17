import React from 'react';
import './index.css';
import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';
import { Link, useSearchParams } from "react-router-dom";
import ReactPaginate from 'react-paginate';
import { highlight } from './Highlight';
import './i18n';
import { useTranslation } from 'react-i18next';


async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        body: JSON.stringify(data)
    });
    return response.json();
}


const zip = (...arr) => Array(Math.max(...arr.map(a => a.length))).fill().map((_,i) => arr.map(a => a[i]));


class SearchResults extends React.Component {

    render() {
        let results_list = zip(
            this.props.results,
            this.props.partsUniqueIndices
        ).filter(([_, unique_idxs]) =>
            !unique_idxs.flat().every(
                elem => this.props.disabledMatches.has(elem)
            )
        ).map(([book, book_unique_idxs]) => {
            let sentences_and_indices = zip(book.sentences, book_unique_idxs).filter(([_, sentence_unique_idxs]) =>
                !sentence_unique_idxs.every(elem => this.props.disabledMatches.has(elem))
            );
            let [sentences, indices] = zip(...sentences_and_indices);
            return [{...book, sentences: sentences}, indices];
        }).map(([book, book_unique_idxs], i) => [
            <span key={"".concat(i, "y")} className="year"><div>{book.year ?? "-"}</div></span>,
            <span key={"".concat(i, "s")} className="sentence">
                {book.sentences.map((s, j) => (
                    <div key={j}>
                        <span>{highlight(
                            s.text,
                            this.props.romanize,
                            this.props.resultTerm,
                            false,
                            book_unique_idxs[j]
                        )}</span>
                        <span className="sourceWrapper">
                            &lang;
                            <Link to={`/source?name=${book.name}&n=${s.number_in_book}&hl=${this.props.resultTerm}`} className="source">
                                {s.page === null? book.name : `${book.name}:${s.page}`}
                            </Link>
                            &rang;
                        </span>
                    </div>
                ))}
            </span>
        ]);

        if (results_list.length === 0) {
            return [<div key="0"></div>, <div key="1">{this.props.t('No match')}</div>];
        }

        return results_list;
    }
}


class SearchPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            romanize: false,
            disabledMatches: new Set()
        };
    }

    handleChange(event) {
        let searchTerm = event.target.value;
        this.props.setSearchParams({
            term: searchTerm,
            doc: this.props.doc,
            page: 1
        });
    }

    handleDocChange(event) {
        let doc = event.target.value;
        this.props.setSearchParams({
            term: this.props.term,
            doc: doc,
            page: 1
        });
    }

    handleRomanizeChange(event) {
        this.setState({
            ...this.state,
            romanize: event.target.checked
        })
    }

    toggleMatch(event, i) {
        let disabledMatches = new Set(this.state.disabledMatches);
        if (disabledMatches.has(i)) {
            disabledMatches.delete(i);
        }
        else {
            disabledMatches.add(i);
        }

        this.setState({
            ...this.state,
            disabledMatches: disabledMatches
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.result.result_term !== this.props.result.result_term
            || prevProps.page !== this.props.page
            || prevProps.doc !== this.props.doc) {
            this.setState({
                ...this.state,
                disabledMatches: new Set()
            });
        }
    }

    render() {
        let page = this.props.page;
        let searchTerm = this.props.term;
        let doc = this.props.doc;

        const N = 20;
        let num_pages = Math.ceil(this.props.numResults / N);

        // Determine highlight colors
        let highlighted_parts = [];

        for (const book of this.props.result) {
            let book_parts = [];
            for (const s of book.sentences) {
                let parts = highlight(s.text, this.props.romanize, this.props.resultTerm, true);
                book_parts.push(parts);
            }
            highlighted_parts.push(book_parts);
        }

        let unique_parts = [...new Set(highlighted_parts.flat(2))];

        let parts_unique_indices = [];
        for (const book_parts of highlighted_parts) {
            let book_parts_indices = [];
            for (const sentence_parts of book_parts) {
                let indices = [];
                for (const part of sentence_parts) {
                    indices.push(unique_parts.indexOf(part));
                }
                book_parts_indices.push(indices);
            }
            parts_unique_indices.push(book_parts_indices);
        }

        return (
            <div>
                <form onSubmit={(e) => this.props.onRefresh(e)}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => this.handleChange(event)}
                    />
                    <button onClick={(e) => this.props.onRefresh(e)}>{this.props.t("Search")}</button>

                    <div className="autoCompleteBox" style={{float: 'right'}}>
                        <input
                            type="text"
                            value={doc}
                            placeholder={this.props.t("document name...")}
                            onChange={(event) => this.handleDocChange(event)}
                        />
                        <div className='suggestionsBox'>
                            {this.props.docSuggestions.result.map((doc, i) =>
                                <Link to={`/source?name=${doc.name}`} key={i} className='suggestionItem'>
                                    {doc.name} ({doc.year_string})
                                </Link>
                            )}
                        </div>
                    </div>
                </form>


                <div className="preview">{yale_to_hangul(searchTerm)}</div>
                <div>
                    <span className="numResults">
                        {this.props.t('number Results', { numResults: this.props.numResults })}&ensp;
                        {
                            this.props.result.length > 0?
                            this.props.t('current page', { startYear: this.props.result[0].year, endYear: this.props.result[this.props.result.length - 1].year})
                            : <span></span>
                        }
                    </span>

                    <span className="romCheckBox">
                        <input
                            type="checkbox"
                            id="rom_checkbox"
                            checked={this.state.romanize}
                            onChange={(event) => this.handleRomanizeChange(event)}
                        />
                        <label htmlFor="rom_checkbox">{this.props.t("Romanization")}</label>
                    </span>
                </div>

                {/* Show highlight match legend */}
                <div className='matchLegend'>
                    {unique_parts.map((part, i) => [
                        <span key={i}
                              className={this.state.disabledMatches.has(i)? "matchLegendItem disabled" : "matchLegendItem"}
                              onClick={(event) => {this.toggleMatch(event, i)}}>
                            <span className={"".concat("colorShower s", i)}></span>
                            <span className="matchLegendWord">{part}</span>
                        </span>,
                        <wbr key={"".concat('wbr', i)}/>
                    ])}
                </div>

                <div className="dividerTop"></div>

                {/* Pager at top */}
                {num_pages > 0?
                    <ReactPaginate
                        className="paginator"
                        pageRangeDisplayed={10}
                        nextLabel="▶"
                        previousLabel="◀"
                        pageCount={num_pages}
                        forcePage={page - 1}
                        onPageChange={(event) => {
                            this.props.setSearchParams({
                                term: searchTerm,
                                doc: doc,
                                page: event.selected + 1
                            });
                        }}
                    /> : ""}

                {/* Results area */}
                <div className="dividerBottom"></div>
                <div className="loadingWrapper">
                    <div className={this.props.loaded? "loading loaded" : "loading"}>Loading...</div>
                     <SearchResults
                         results={this.props.result}
                         romanize={this.state.romanize}
                         resultTerm={this.props.resultTerm}
                         partsUniqueIndices={parts_unique_indices}
                         disabledMatches={this.state.disabledMatches}
                         t={this.props.t}
                     />
                </div>
                <div className="dividerTop"></div>

                {/* Pager on bottom */}
                {num_pages > 0?
                    <ReactPaginate
                        className="paginator"
                        pageRangeDisplayed={10}
                        nextLabel="▶"
                        previousLabel="◀"
                        pageCount={num_pages}
                        forcePage={page - 1}
                        onPageChange={(event) => {
                            this.props.setSearchParams({
                                term: searchTerm,
                                doc: doc,
                                page: event.selected + 1
                            });
                        }}
                    /> : ""}
            </div>
        );
    }
}


function search(word, doc, page, callback) {
    let term = hangul_to_yale(word);

    let prefix = "%";
    let suffix = "%";
    if (term.startsWith('^')) {
        term = term.slice(1);
        prefix = "";
    }
    if (term.endsWith('$')) {
        term = term.slice(0, term.length - 1);
        suffix = "";
    }
    term = "".concat(prefix, term, suffix);
    console.log("Search:", term);

    postData('/api/search', {
        term: term,
        doc: doc,
        page: page
    }).then((result) => {
        if (result.status === 'success') {
            callback(result.results, result.total_rows);
        } else {
            callback([], 0);
        }
    })
    .catch((err) => {
        console.log(err);
        callback([], 0);
    });
}

function suggest(doc, callback) {
    postData('/api/doc_suggest', { doc: doc })
    .then((result) => {
        if (result.status === 'success') {
            callback(result.results, result.total_rows);
        } else {
            callback([], 0);
        }
    })
    .catch((err) => {
        console.log(err);
        callback([], 0);
    });
}


function SearchPageWrapper(props) {
    const { t, i18n } = useTranslation();

    let [searchParams, setSearchParams] = useSearchParams();
    let page = parseInt(searchParams.get('page') ?? '1');
    let term = searchParams.get('term') ?? "";
    let doc = searchParams.get('doc') ?? "";
    let [result, setResult] = React.useState({
        result: [],
        num_results: 0,
        result_term: "",
        loaded: false
    });
    let [docSuggestions, setDocSuggestions] = React.useState({
        result: [],
        num_results: 0
    });

    const isInited = React.useRef(false);
    const prevResult = React.useRef(result);
    const prevTerm = React.useRef(term);
    const prevDoc = React.useRef(doc);
    const prevPage = React.useRef(page);

    const refresh = React.useCallback(
        (term, doc, page) => {
            let active = true;
            setResult({
                ...prevResult.current,
                loaded: false
            });

            search(
                term, doc, page,
                (result, num_results) => {
                    if (active) {
                        setResult({
                            result: result,
                            num_results: num_results,
                            result_term: term,
                            loaded: true
                        });
                    }
                }
            );

            return () => {
                active = false;
            }
        },
        []
    );

    const suggest_doc = React.useCallback(
        (doc) => {
            let active = true;

            console.log("Suggest for", doc);

            suggest(doc, (result, num_results) => {
                if (active) {
                    setDocSuggestions({
                        result: result,
                        num_results: num_results
                    });
                }
            });

            return () => {
                active = false;
            }
        },
        []
    );

    React.useEffect(() => {
        if (!isInited.current || // if first call
            (hangul_to_yale(term).length > 5 && prevTerm.current !== term) || // or current term has changed
            prevPage.current !== page) // or current page has changed
        {
            isInited.current = true;
            prevPage.current = page;
            prevTerm.current = term;
            return refresh(term, prevDoc.current, page);
        }
    }, [term, page, refresh]);

    React.useEffect(() => {
        prevDoc.current = doc;
        return suggest_doc(doc);
    }, [doc, suggest_doc]);

    React.useEffect(() => {
        // scroll to top
        window.scroll({
            top: 0,
            behavior: 'smooth'
        });

        prevResult.current = result;
    }, [result]);

    function forceRefresh(e) {
        e.preventDefault();
        return refresh(term, doc, page);
    }

    return (
        <SearchPage {...props}
            page={page} term={term} doc={doc}
            result={result.result}
            numResults={result.num_results}
            resultTerm={result.result_term}
            loaded={result.loaded}
            setSearchParams={setSearchParams}
            onRefresh={forceRefresh}
            docSuggestions={docSuggestions}
            t={t}
        />
    );
}

export default SearchPageWrapper;
