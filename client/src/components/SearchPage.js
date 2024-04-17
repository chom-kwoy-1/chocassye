import React from 'react';
import './index.css';
import { yale_to_hangul } from './YaleToHangul';
import { Link, useNavigate, useSearchParams } from "react-router-dom"


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
        let term = props.searchParams.get("term") ?? "";
        this.state = {
            searchTerm: term,
            result: [],
            num_results: 0,
            romanize: false,
            page: this.getPage()
        };
    }

    getPage(props = this.props) {
        return parseInt(this.props.searchParams.get("page") ?? "1");
    }

    componentDidMount() {
        this.search(this.state.searchTerm, this.state.page);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.page !== this.getPage()) {
            this.setState({
                ...this.state,
                page: this.getPage()
            });
            this.search(this.state.searchTerm, this.getPage());
        }
    }

    handleChange(event) {
        let searchTerm = event.target.value;
        this.setState({
            ...this.state,
            searchTerm: searchTerm,
            page: 1
        });

        this.props.setSearchParams({
            term: searchTerm,
            page: 1
        });

        this.search(searchTerm, 1);
    }

    handleRomanizeChange(event) {
        this.setState({
            ...this.state,
            romanize: event.target.checked
        })
    }

    search(word, page) {
        console.log(word, page);
        let term = yale_to_hangul(word);

        postData('/api/search', {
            term: '*'+term+'*',
            page: page
        }).then((result) => {
            if (result.status === 'success') {
                console.log(result);

                this.setState({
                    ...this.state,
                    result: result.sentences,
                    num_results: result.total_rows
                });

            } else {
                console.log(result);
                this.setState({
                    ...this.state,
                    result: [],
                    num_results: 0
                });
            }
        });
    }

    render() {
        const N = 20;
        let num_pages = Math.ceil(this.state.num_results / N);
        let pages = [];
        let page = this.state.page;
        let page_start = (page - 1) - (page - 1) % N + 1;
        for (let i = page_start; i <= Math.min(page_start + N - 1, num_pages); ++i) {
            pages.push(i);
        }

        let searchTerm = this.state.searchTerm;

        return (
            <div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => this.handleChange(event)}
                />
                <button onClick={() => this.search(searchTerm)}>Search</button>

                <input
                    type="checkbox"
                    id="rom_checkbox"
                    checked={this.state.romanize}
                    onChange={(event) => this.handleRomanizeChange(event)}
                />
                <label htmlFor="rom_checkbox">Romanization</label>

                <div className="preview">{yale_to_hangul(searchTerm)}</div>
                <div className="numResults">{this.state.num_results} Results.</div>

                {/* Results area */}
                <div className="dividerBottom"></div>
                {this.state.result.length == 0?
                    <div>
                        No match
                    </div>
                : <div></div>}
                <SearchResults sentences={this.state.result} romanize={this.state.romanize} />
                <div className="dividerTop"></div>

                {/* Pager */}
                <div className="pager">
                    {page_start > 1 ?
                        <Link to={`/search?term=${searchTerm}&page=${page_start - 1}`} className="pagelinkArrow">◀</Link>
                        : <span></span>}
                    {pages.map((pagenum, i) => (
                        <span key={i}>
                            {
                                pagenum === page? <span className="curpage">{pagenum}</span> :
                                <Link to={`/search?term=${searchTerm}&page=${pagenum}`} className="pagelink">{pagenum}</Link>
                            }
                        </span>
                    ))}
                    {page_start + N <= num_pages?
                        <Link to={`/search?term=${searchTerm}&page=${page_start + N}`} className="pagelinkArrow">▶</Link>
                        : <span></span>}
                </div>

            </div>
        );
    }
}


function withNavigation(Component) {
    return props => <Component {...props}
        navigate={useNavigate()}
        searchParams={useSearchParams()[0]}
        setSearchParams={useSearchParams()[1]}
    />;
}

export default withNavigation(SearchPage);
