import React from 'react';
import './index.css';
import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';
import { Link, useSearchParams } from "react-router-dom";
import ReactPaginate from 'react-paginate';
import { highlight } from './Highlight';
import './i18n';
import { useTranslation } from 'react-i18next';
import { Interweave } from 'interweave';
import HowToPageWrapper from './HowToPage';
import { Trans } from 'react-i18next';
import Histogram from './Histogram';


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


class SearchResultsList extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {

        // Array(book)[Array(sentence)[Array(matches)[int]]]
        let match_ids = this.props.matches.map(
            (matches_in_book) => matches_in_book.map(
                (matches_in_sentence) => matches_in_sentence.map(
                    (match) => this.props.uniqueMatches.indexOf(match)
                )
            )
        );

        let filtered_results_list = zip(
            this.props.results,
            match_ids
        )
        .filter(
            ([_, match_ids_in_book]) => // filter out entire book if there are no valid matches in it
                !match_ids_in_book.flat().every(
                    id => this.props.disabledMatches.has(id)
                )
        )
        .map(([book, match_ids_in_book]) => { // filter out sentence if there are no valid matches in it

            let sentences_and_indices =
                zip(book.sentences, match_ids_in_book)
                .filter(
                    ([_, match_ids_in_sentence]) =>
                        !match_ids_in_sentence.every(
                            id => this.props.disabledMatches.has(id)
                        )
                );

            let [sentences, indices] = zip(...sentences_and_indices);

            return [{...book, sentences: sentences}, indices];
        });

        // Construct HTML for results list
        if (filtered_results_list.length === 0) {
            return <React.Fragment>

                {/* Year column */}
                <div>{/* Empty div for 'year' column */}</div>

                {/* Sentences column */}
                {this.props.loaded?
                    <div>
                        <Trans i18nKey='No match. Please follow the instructions below for better results.' />
                        <HowToPageWrapper title=""/>
                    </div>
                    : this.props.t('number Results', { numResults: filtered_results_list.length })}

            </React.Fragment>;
        }

        return <React.Fragment>

            {/* For each book */}
            {filtered_results_list.map(([book, match_ids_in_book], i) =>
                <React.Fragment key={i}>

                    {/* Year column */}
                    <span className="year"><div>{book.year ?? "-"}</div></span>

                    {/* Sentences column */}
                    <span className="sentence">

                        {/* For each sentence */}
                        {zip(book.sentences, match_ids_in_book)
                         .map(([sentence, match_ids_in_sentence], i) =>
                            <div key={i}>

                                {/* Highlighted sentence */}
                                <Interweave
                                    content={highlight(
                                        sentence.text,
                                        this.props.romanize,
                                        this.props.resultTerm,
                                        false,
                                        match_ids_in_sentence,
                                        null,
                                        true
                                    )}
                                    allowList={['mark']}
                                />&thinsp;

                                {/* Add source link */}
                                <span className="sourceWrapper">
                                    &lang;
                                    <Link to={`/source?name=${book.name}&n=${sentence.number_in_book}&hl=${this.props.resultTerm}`} className="source">
                                        {sentence.page === null? book.name : `${book.name}:${sentence.page}`}
                                    </Link>
                                    &rang;
                                </span>

                            </div>
                        )}

                    </span>

                </React.Fragment>
            )}

        </React.Fragment>;
    }
}


class SearchResults extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            disabledMatches: new Set(),
        };
    }

    toggleMatch(_, i) {
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
        if (prevProps.resultTerm !== this.props.resultTerm
            || prevProps.page !== this.props.page
            || prevProps.doc !== this.props.doc) {
            this.setState({
                ...this.state,
                disabledMatches: new Set()
            });
        }
    }

    render() {
        console.log("Rerender  SearchResults!!!");

        let num_pages = Math.ceil(this.props.numResults / this.props.pageN);

        // Determine highlight colors
        let matches = [];

        for (const book of this.props.results) {
            let book_parts = [];
            for (const s of book.sentences) {
                let parts = highlight(
                    s.text,                // sentences
                    this.props.romanize,   // romanize
                    this.props.resultTerm, // searchTerm
                    true,                  // return_highlighted_parts
                    null,                  // highlight_colors
                    null,                  // transformText
                    true,                  // inline
                );
                book_parts.push(parts);
            }
            matches.push(book_parts);
        }

        // List of unique matches in current page
        let uniqueMatches = [...new Set(matches.flat(2))];

        return <React.Fragment>

            <Histogram
                data={this.props.histogram}
                t={this.props.t}
                setPage={this.props.setPage}
                pageN={this.props.pageN}
            />

            <div className="flowRoot">
                <span className="romCheckBox">
                    <input
                        type="checkbox"
                        id="rom_checkbox"
                        checked={this.props.romanize}
                        onChange={(event) => this.props.handleRomanizeChange(event)}
                    />
                    <label htmlFor="rom_checkbox">{this.props.t("Romanization")}</label>
                </span>

                {/* Show highlight match legend */}
                <div className='matchLegend'>
                    {uniqueMatches.map((part, i) => [
                        <span key={i}
                              className={this.state.disabledMatches.has(i)? "matchLegendItem disabled" : "matchLegendItem"}
                              onClick={(event) => {this.toggleMatch(event, i)}}>
                            <span className={"".concat("colorShower s", i)}></span>
                            <span className="matchLegendWord">{part}</span>
                        </span>,
                        <wbr key={"".concat('wbr', i)}/>
                    ])}
                </div>
            </div>

            <div className="dividerTop"></div>

            {/* Pager at top */}
            {num_pages > 0?
                <ReactPaginate
                    className="paginator"
                    pageRangeDisplayed={10}
                    nextLabel={this.props.t("nextpage")}
                    previousLabel={this.props.t("prevpage")}
                    pageCount={num_pages}
                    forcePage={this.props.page - 1}
                    onPageChange={(event) => {
                        this.props.setPage(event.selected + 1);
                    }}
                /> : ""}

            {/* Results area */}
            <div className="dividerBottom"></div>
            <div className="loadingWrapper">
                <div className={this.props.loaded? "loading loaded" : "loading"}>Loading...</div>
                <SearchResultsList
                    matches={matches}
                    uniqueMatches={uniqueMatches}
                    disabledMatches={this.state.disabledMatches}
                    results={this.props.results}
                    loaded={this.props.loaded}
                    romanize={this.props.romanize}
                    ignoreSep={this.props.ignoreSep}
                    resultTerm={this.props.resultTerm}
                    t={this.props.t}
                />
            </div>
            <div className="dividerTop"></div>

            {/* Pager on bottom */}
            {num_pages > 0?
                <ReactPaginate
                    className="paginator"
                    pageRangeDisplayed={10}
                    nextLabel={this.props.t("nextpage")}
                    previousLabel={this.props.t("prevpage")}
                    pageCount={num_pages}
                    forcePage={this.props.page - 1}
                    onPageChange={(event) => {
                        this.props.setPage(event.selected + 1);
                    }}
                /> : ""}
        </React.Fragment>;
    }
}

const SearchResultsWrapper = React.memo(function SearchResultsWrapper(props) {
    return <SearchResults {...props} />;
});


class SearchPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            romanize: false,
        };

        this.setPage = this.setPage.bind(this);
    }

    setSearchParams(args) {
        this.props.setSearchParams({
            term: this.props.term,
            doc: this.props.doc,
            page: this.props.page,
            excludeModern: this.props.excludeModern,
            ignoreSep: this.props.ignoreSep,
            ...args
        });
    }

    handleChange(event) {
        let searchTerm = event.target.value;
        this.setSearchParams({term: searchTerm});
    }

    handleDocChange(event) {
        let doc = event.target.value;
        this.setSearchParams({doc: doc});
    }

    handleExcludeModernChange(event) {
        let excludeModern = event.target.checked;
        this.setSearchParams({excludeModern: excludeModern? "yes" : "no"});
    }

    handleIgnoreSepChange(event) {
        let ignoreSep = event.target.checked;
        this.setSearchParams({ignoreSep: ignoreSep? "yes" : "no"});
    }

    handleRomanizeChange(event) {
        this.setState({
            ...this.state,
            romanize: event.target.checked
        })
    }

    setPage(page) {
        this.setSearchParams({page: page});
    }

    render() {
        let searchTerm = this.props.term;
        let doc = this.props.doc;

        return (
            <React.Fragment>
                <form onSubmit={(e) => this.props.onRefresh(e)}>
                    <input
                        type="text"
                        value={searchTerm}
                        placeholder={this.props.t("Search term...")}
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

                <span className="searchOptionBox">
                    <input
                        type="checkbox"
                        id="except_modern_checkbox"
                        checked={this.props.excludeModern === "yes"}
                        onChange={(event) => this.handleExcludeModernChange(event)}
                    />
                    <label htmlFor="except_modern_checkbox">{this.props.t("Exclude modern translations")}</label>
                </span>
                <span className="searchOptionBox">
                    <input
                        type="checkbox"
                        id="ignore_sep_checkbox"
                        checked={this.props.ignoreSep === "yes"}
                        onChange={(event) => this.handleIgnoreSepChange(event)}
                    />
                    <label htmlFor="ignore_sep_checkbox">{this.props.t("Ignore syllable separators")}</label>
                </span>

                <div className="flowRoot">
                    <span className="numResults">
                        {this.props.t('number Results', { numResults: this.props.numResults })}&ensp;
                        {
                            this.props.result.length > 0?
                            this.props.t('current page', { startYear: this.props.result[0].year, endYear: this.props.result[this.props.result.length - 1].year})
                            : <span></span>
                        }
                    </span>
                </div>

                <SearchResultsWrapper
                    results={this.props.result}
                    numResults={this.props.numResults}
                    romanize={this.state.romanize}
                    handleRomanizeChange={(event) => this.handleRomanizeChange(event)}
                    ignoreSep={this.props.ignoreSep}
                    resultTerm={this.props.resultTerm}
                    histogram={this.props.histogram}
                    pageN={this.props.pageN}
                    page={this.props.page}
                    setPage={this.setPage}
                    loaded={this.props.loaded}
                    t={this.props.t}
                />
            </React.Fragment>
        );
    }
}


function search(word, doc, page, excludeModern, ignoreSep, callback) {
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
        page: page,
        excludeModern: excludeModern,
        ignoreSep: ignoreSep
    }).then((result) => {
        if (result.status === 'success') {
            callback(result.results, result.total_rows, result.histogram, result.page_N);
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

    // Search options
    let excludeModern = searchParams.get('excludeModern') ?? 'no';
    let ignoreSep = searchParams.get('ignoreSep') ?? 'no';

    let [result, setResult] = React.useState({
        result: [],
        histogram: [],
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

    const prevExcludeModern = React.useRef(excludeModern);
    const prevIgnoreSep = React.useRef(ignoreSep);

    const refresh = React.useCallback(
        (term, doc, page, excludeModern, ignoreSep) => {
            let active = true;

            if (page !== 1 && (
                prevTerm.current !== term ||
                prevDoc.current !== doc ||
                prevExcludeModern.current !== excludeModern)) {

                setSearchParams({
                    page: 1,
                    term: term,
                    doc: doc,
                    excludeModern: excludeModern,
                    ignoreSep: ignoreSep,
                });
            }
            else {
                setResult({
                    ...prevResult.current,
                    loaded: false
                });

                search(
                    term, doc, page, excludeModern, ignoreSep,
                    (result, num_results, histogram, page_N) => {
                        if (active) {
                            setResult({
                                result: result,
                                num_results: num_results,
                                page_N: page_N,
                                histogram: histogram,
                                result_term: term,
                                loaded: true
                            });
                        }
                    }
                );

                return () => {
                    active = false;
                }
            }
        },
        [setSearchParams]
    );

    const suggest_doc = React.useCallback(
        (doc) => {
            let active = true;

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
            prevPage.current !== page ||   // or current page has changed
            prevExcludeModern.current !== excludeModern ||
            prevIgnoreSep.current !== ignoreSep)
        {
            isInited.current = true;
            prevPage.current = page;
            prevTerm.current = term;
            prevDoc.current = doc;

            prevExcludeModern.current = excludeModern;
            prevIgnoreSep.current = ignoreSep;

            return refresh(term, prevDoc.current, page, excludeModern, ignoreSep);
        }
    }, [term, page, doc, excludeModern, ignoreSep, refresh]);

    React.useEffect(() => {
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
        return refresh(term, doc, page, excludeModern, ignoreSep);
    }

    return (
        <SearchPage {...props}
            page={page} term={term} doc={doc}
            excludeModern={excludeModern} ignoreSep={ignoreSep}
            result={result.result}
            numResults={result.num_results}
            resultTerm={result.result_term}
            pageN={result.page_N}
            histogram={result.histogram}
            loaded={result.loaded}
            setSearchParams={setSearchParams}
            onRefresh={forceRefresh}
            docSuggestions={docSuggestions}
            t={t}
        />
    );
}

export default SearchPageWrapper;
