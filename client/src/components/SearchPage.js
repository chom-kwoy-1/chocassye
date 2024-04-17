import React from 'react';
import './index.css';
import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';
import { Link, useSearchParams } from "react-router-dom"
import ReactPaginate from 'react-paginate';


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

function escapeRegex(string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

class SearchResults extends React.Component {
    highlight(sentence, searchTerm) {
        if (this.props.romanize) {
            let regexp = new RegExp(escapeRegex(searchTerm), 'g');
            let match;

            let dom = [];
            let last_idx = 0;
            while ((match = regexp.exec(sentence)) !== null) {
                let start = match.index;
                let end = regexp.lastIndex;
                dom.push(<span>{sentence.slice(last_idx, start)}</span>);
                dom.push(<span className="highlight">{sentence.slice(start, end)}</span>);
                last_idx = end;
            }
            dom.push(<span>{sentence.slice(last_idx)}</span>);

            return (
                <span>{dom}</span>
            );
        }
        else {
            let { result, index_map, next_index_map } = yale_to_hangul(sentence, true);

            let regexp = new RegExp(escapeRegex(searchTerm), 'g');
            let match;

            let dom = [];
            let last_idx = 0;
            while ((match = regexp.exec(sentence)) !== null) {
                let start = index_map[match.index];
                let end = next_index_map[regexp.lastIndex];
                if (last_idx < end) {
                    if (last_idx < start) {
                        dom.push(<span key={last_idx} abc={last_idx}>{result.slice(last_idx, start)}</span>);
                    }
                    if (start < end) {
                        dom.push(<span key={start} abc={start} className="highlight">{result.slice(start, end)}</span>);
                    }
                    last_idx = end;
                }
            }
            if (last_idx < result.length) {
                dom.push(<span key={last_idx} abc={last_idx}>{result.slice(last_idx)}</span>);
            }

            return (
                <span>{dom}</span>
            );
        }
    }

    render() {
        console.log(this.props.results);
        return this.props.results.map((book, i) => [
            <span key={i + "y"} className="year">{book.year ?? "-"}</span>,
            <span key={i + "s"} className="sentence">
                {book.sentences.map((s, i) => (
                    <div key={i}>
                        <span>{this.highlight(s.text, this.props.resultTerm)}</span>
                        <span>&lang;{book.name}:{s.page}&rang;</span>
                    </div>
                ))}
                {/*<Link to={`/source?name=${s.source_name}&n=${s.number_in_source}`} className="source">
                    {s.source_name}:{s.page}
                </Link>*/}
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

        const N = 20;
        let num_pages = Math.ceil(this.props.numResults / N);

        return (
            <div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => this.handleChange(event)}
                />
                <button onClick={() => this.props.onRefresh()}>Search</button>

                <input
                    type="checkbox"
                    id="rom_checkbox"
                    checked={this.state.romanize}
                    onChange={(event) => this.handleRomanizeChange(event)}
                />
                <label htmlFor="rom_checkbox">Romanization</label>

                <div className="preview">{yale_to_hangul(searchTerm)}</div>
                <div className="numResults">{this.props.numResults} Results.</div>

                {/* Results area */}
                <div className="dividerBottom"></div>
                <div className="loadingWrapper">
                    <div className={this.props.loaded? "loading loaded" : "loading"}>Loading...</div>
                    {this.props.result.length === 0? <div>No match</div> :
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
                    initialPage={page - 1}
                    onPageChange={(event) => {
                        console.log("page changed to", event.selected + 1);
                        this.props.setSearchParams({term: searchTerm, page: event.selected + 1});
                    }}
                />

            </div>
        );
    }
}


function search(word, page, func) {
    let term = hangul_to_yale(word.normalize("NFKD"));
    term = '%'+term+'%';

    postData('/api/search', {
        term: term,
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
    let [result, setResult] = React.useState({
        result: [],
        num_results: 0,
        result_term: "",
        loaded: false
    });

    function refresh() {
        let active = true;
        setResult({
            ...result,
            loaded: false
        });

        search(term, page, (result, num_results) => {
            if (active) {
                setResult({
                    result: result,
                    num_results: num_results,
                    result_term: term,
                    loaded: true
                });
            }
        });

        return () => {
            active = false;
        }
    }

    React.useEffect(() => {
        return refresh();
    }, [term, page]);

    return <SearchPage {...props}
        page={page} term={term}
        result={result.result}
        numResults={result.num_results}
        resultTerm={result.result_term}
        loaded={result.loaded}
        setSearchParams={setSearchParams}
        onRefresh={refresh}
    />;
}

export default SearchPageWrapper;
