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

class SearchResults extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return this.props.sentences.map((s, i) => (
            <div key={i} className="searchEntry">
                <span className="sentence">{this.props.romanize? s.sentence : yale_to_hangul(s.sentence)}</span>
                <Link to={`/source?name=${s.source_name}&page=${s.page}`} className="source">
                    {s.source_name}:{s.page}
                </Link>
            </div>
        ))
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
                    {this.props.loaded? <div></div> : <div className="loading">Loading...</div>}
                    {this.props.result.length === 0? <div>No match</div>
                        : <SearchResults sentences={this.props.result} romanize={this.state.romanize} />}
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

    postData('/api/search', {
        term: '*'+term+'*',
        page: page
    }).then((result) => {
        if (result.status === 'success') {
            console.log(result);
            func(result.sentences, result.total_rows);
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
    let [result, setResult] = React.useState([]);
    let [numResults, setNumResults] = React.useState(0);
    let [loaded, setLoaded] = React.useState(false);

    function refresh() {
        let active = true;
        setLoaded(false);

        search(term, page, (result, num_results) => {
            if (active) {
                setResult(result);
                setNumResults(num_results);
                setLoaded(true);
            }
        });

        return () => {
            active = false;
        }
    }

    React.useEffect(() => {
        console.log("term/page changed", term, page);
        return refresh();
    }, [term, page]);

    return <SearchPage {...props}
        loaded={loaded}
        page={page} term={term}
        result={result} numResults={numResults}
        setSearchParams={setSearchParams}
        onRefresh={refresh}
    />;
}

export default SearchPageWrapper;
