import React from 'react';
import './index.css';
import { useNavigate, useSearchParams } from "react-router-dom";
import { highlight } from './Highlight';
import ReactPaginate from 'react-paginate';
import { addHintToGugyeol } from './Gugyeol'
import { Interweave } from 'interweave';
import { useTranslation } from 'react-i18next';


const allowList = ['mark', 'abbr', 'span'];


const HANGUL_REGEX = /((?:ᄀ|ᄁ|ᄂ|ᄔ|ᄃ|ᄄ|ᄅ|ᄆ|ᄇ|ᄈ|ᄉ|ᄊ|ᄋ|ᅇ|ᄌ|ᄍ|ᄎ|ᄏ|ᄐ|ᄑ|ᄒ|ᄞ|ᄠ|ᄡ|ᄢ|ᄣ|ᄧ|ᄩ|ᄫ|ᄭ|ᄮ|ᄯ|ᄲ|ᄶ|ᄻ|ᅀ|ᅘ|ᅙ|ᅌ|ᅟ)(?:ᅡ|ᅢ|ᅣ|ᅤ|ᅥ|ᅦ|ᅧ|ᅨ|ᅩ|ᅪ|ᅫ|ᅬ|ᅭ|ᅮ|ᅯ|ᅰ|ᅱ|ᅲ|ᅳ|ᅴ|ᅵ|ᆞ|ᆡ|ᆈ|ᆔ|ᆑ|ᆒ|ᆄ|ᆅ)(?:ᆨ|ᆪ|ᆫ|ᆮ|ᆯ|ᆰ|ᆱ|ᆲ|ᆳ|ᆷ|ᆸ|ᆹ|ᆺ|ᆼ|ᇆ|ᇇ|ᇈ|ᇌ|ᇗ|ᇙ|ᇜ|ᇝ|ᇟ|ᇢ|ᇦ|ᇫ|ᇰ|ᇹ|ᇱ|))(〮|〯|)/g;


function showSentence(sentence, highlight_term, i) {
    let text = sentence.html ?? sentence.text;
    
    function toDisplayForm(sentence) {
        sentence = sentence.replace(HANGUL_REGEX, function(match, syllable, tone) {
            if (tone === '') {
                return `<span data-tone="L">${syllable}</span>`;
            }
            else if (tone === '\u302e') {
                return `<span data-tone="H">${syllable}<span is-tone>${tone}</span></span>`;
            }
            else if (tone === '\u302f') {
                return `<span data-tone="R">${syllable}<span is-tone>${tone}</span></span>`;
            }
        });
        sentence = addHintToGugyeol(sentence);
        return sentence;
    };
    
    let html = highlight(text, false, highlight_term, false, null, toDisplayForm);
    return (
        <div key={i} className={`sourceSentence sentence_type_${sentence.type} sentence_lang_${sentence.lang}`}>
            <Interweave className="text" content={html} allowList={allowList} allowAttributes={true} />
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
            <React.Fragment>
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
                    nextLabel={this.props.t("nextpage")}
                    previousLabel={this.props.t("prevpage")}
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
            </React.Fragment>
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
    const { t, i18n } = useTranslation();

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
        t={t}
    />;
}


export default SoucePageWrapper;
