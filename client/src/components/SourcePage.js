import React from 'react';
import './index.css';
import { yale_to_hangul } from './YaleToHangul';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { highlight } from './Highlight';
import ReactPaginate from 'react-paginate';


function showSentence(sentence, highlight_term, i) {
    return (
        <div key={i} className={`sourceSentence sentence_type_${sentence.type} sentence_lang_${sentence.lang}`}>
            <span className="text">{highlight(sentence.text, false, highlight_term)}</span>
            <span className="pageNum">{sentence.page}</span>
        </div>
    );
}


class SourcePage extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.props.initialize();
    }

    render() {
        if (this.props.result.data === null) {
            return (
                <div>
                    <h1>{this.props.bookName}</h1>
                    Loading...
                </div>
            );
        }

        let hl = this.props.highlightWord

        const PAGE = 20;
        let pageCount = Math.ceil(this.props.result.data.count / PAGE);

        let n = this.props.numberInSource;
        let page = Math.floor(n / PAGE);

        return (
            <div>
                <div>
                    <h1 className="docname">{this.props.bookName}</h1>
                    <span className="yearstring">{this.props.result.data.year_string}</span>
                    {this.props.result.data.sentences.map(
                        (sentence, i) => showSentence(sentence, hl, i)
                    )}
                </div>

                {/* Pager */}
                <ReactPaginate
                    className="paginator"
                    pageRangeDisplayed={10}
                    nextLabel="▶"
                    previousLabel="◀"
                    pageCount={pageCount}
                    forcePage={page}
                    disableInitialCallback={true}
                    onPageChange={(event) => {
                        let newPage = event.selected;
                        let newN = this.props.numberInSource;
                        if (newPage !== page) {
                            newN = newPage * PAGE;
                        }
                        this.props.setSearchParams({
                            name: this.props.bookName,
                            n: newN,
                            hl: this.props.highlightWord
                        });
                    }}
                />
            </div>
        );
    }
}


function load_source(bookName, numberInSource, resultFunc) {
    fetch("/api/source?" + new URLSearchParams({
        name: bookName,
        number_in_source: numberInSource
    }))
    .then((res) => res.json())
    .then((result) => {
        console.log(result);
        if (result.status === 'success') {
            resultFunc(result.data);
        }
        else {
            console.log(result);
            resultFunc(null);
        }
    })
    .catch(err => {
        console.log(err);
        resultFunc(null);
    });
}


function SoucePageWrapper(props) {
    let [searchParams, setSearchParams] = useSearchParams();
    let bookName = searchParams.get("name");
    let numberInSource = searchParams.get("n") ?? 0;
    let highlightWord = searchParams.get("hl");
    let [result, setResult] = React.useState({
        data: null,
        loaded: false
    });

    const prevResult = React.useRef(result);
    const prevBookName = React.useRef(bookName);
    const prevNumberInSource = React.useRef(numberInSource);

    const refresh = React.useCallback(
        (bookName, numberInSource) => {
            let active = true;
            setResult({
                ...prevResult.current,
                loaded: false
            });

            load_source(
                bookName, numberInSource,
                (data) => {
                    if (active) {
                        setResult({
                            data: data,
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
        prevBookName.current = bookName;
        prevNumberInSource.current = numberInSource;
        return refresh(bookName, numberInSource);
    }, [bookName, numberInSource, refresh]);

    function initialize() {
        refresh(prevBookName.current, prevNumberInSource.current);
    }

    return <SourcePage {...props}
        navigate={useNavigate()}
        bookName={bookName}
        numberInSource={numberInSource}
        result={result}
        setSearchParams={setSearchParams}
        initialize={initialize}
        highlightWord={highlightWord}
    />;
}


export default SoucePageWrapper;
