import React from 'react';
import './index.css';
import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';
import { Link, useSearchParams } from "react-router-dom";
import ReactPaginate from 'react-paginate';
import { highlight } from './Highlight';


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


class SearchResults extends React.Component {

    render() {
        console.log(this.props.results);
        return this.props.results.map((book, i) => [
            <span key={i + "y"} className="year"><div>{book.year ?? "-"}</div></span>,
            <span key={i + "s"} className="sentence">
                {book.sentences.map((s, i) => (
                    <div key={i}>
                        <span>{highlight(s.text, this.props.romanize, this.props.resultTerm)}</span>
                        <span className="sourceWrapper">
                            &lang;
                            <Link to={`/source?name=${book.name}&n=${s.number_in_book}&hl=${this.props.resultTerm}`} className="source">
                                {book.name}:{s.page}
                            </Link>
                            &rang;
                        </span>
                    </div>
                ))}
            </span>
        ])
    }
}


class SearchPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            romanize: false,
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
            romanize: event.target.checked
        })
    }

    render() {
        let page = this.props.page;
        let searchTerm = this.props.term;
        let doc = this.props.doc;

        const N = 20;
        let num_pages = Math.ceil(this.props.numResults / N);

        return (
            <div>
                <form onSubmit={(e) => this.props.onRefresh(e)}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => this.handleChange(event)}
                    />
                    <button onClick={(e) => this.props.onRefresh(e)}>Search</button>

                    <input
                        type="text"
                        value={doc}
                        placeholder="document name..."
                        onChange={(event) => this.handleDocChange(event)}
                        style={{float: 'right'}}
                    />
                </form>


                <div className="preview">{yale_to_hangul(searchTerm)}</div>
                <div>
                    <span className="numResults">
                        {this.props.numResults} Results&ensp;
                        {
                            this.props.result.length > 0?
                            (<span>(Current page: {this.props.result[0].year} &ndash; {this.props.result[this.props.result.length - 1].year})</span>)
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
                        <label htmlFor="rom_checkbox">Romanization</label>
                    </span>
                </div>

                {/* Results area */}
                <div className="dividerBottom"></div>
                <div className="loadingWrapper">
                    <div className={this.props.loaded? "loading loaded" : "loading"}>Loading...</div>
                    {this.props.result.length === 0? [<div></div>, <div>No match</div>] :
                     <SearchResults
                         results={this.props.result}
                         romanize={this.state.romanize}
                         resultTerm={this.props.resultTerm}
                     />}
                </div>
                <div className="dividerTop"></div>

                {/* Pager */}
                <ReactPaginate
                    className="paginator"
                    pageRangeDisplayed={10}
                    nextLabel="▶"
                    previousLabel="◀"
                    pageCount={num_pages}
                    forcePage={page - 1}
                    onPageChange={(event) => {
                        console.log("page changed to", event.selected + 1);
                        this.props.setSearchParams({
                            term: searchTerm,
                            doc: doc,
                            page: event.selected + 1
                        });
                    }}
                />

            </div>
        );
    }
}


function search(word, doc, page, func) {
    let term = hangul_to_yale(word.normalize("NFKD"));

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
    term = prefix + term + suffix;

    postData('/api/search', {
        term: term,
        doc: doc,
        page: page
    }).then((result) => {
        if (result.status === 'success') {
            console.log(result);
            func(result.results, result.total_rows);
        } else {
            console.log(result);
            func([], 0);
        }
    })
    .catch((err) => {
        console.log(err);
        func([], 0);
    });
}


function SearchPageWrapper(props) {
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

    React.useEffect(() => {
        prevPage.current = page;
        return refresh(prevTerm.current, prevDoc.current, page);
    }, [page, refresh]);

    React.useEffect(() => {
        prevTerm.current = term;
        if (term.length > 4) {
            return refresh(term, prevDoc.current, prevPage.current);
        }
    }, [term, refresh]);

    React.useEffect(() => {
        prevDoc.current = doc;
        //return refresh(prevTerm.current, doc, prevPage.current);
    }, [doc, refresh]);

    React.useEffect(() => {
        // scroll to top
        window.scroll({
            top: 0,
            behavior: 'smooth'
        });

        prevResult.current = result;
    }, [result]);

    function clickSubmit(e) {
        e.preventDefault();
        return refresh(prevTerm.current, prevDoc.current, prevPage.current)
    }

    return <SearchPage {...props}
        page={page} term={term} doc={doc}
        result={result.result}
        numResults={result.num_results}
        resultTerm={result.result_term}
        loaded={result.loaded}
        setSearchParams={setSearchParams}
        onRefresh={clickSubmit}
    />;
}

export default SearchPageWrapper;
