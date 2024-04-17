import React from 'react';
import './index.css';
import { useNavigate, useSearchParams } from "react-router-dom";
import { highlight } from './Highlight';
import ReactPaginate from 'react-paginate';
import { GUGYEOL_READINGS, GUGYEOL_REGEX } from './Gugyeol'
import { Interweave } from 'interweave';
import { useTranslation } from 'react-i18next';


const allowList = ['mark', 'abbr', 'span'];


const HANGUL_REGEX = /((?:ᄀ|ᄁ|ᄂ|ᄔ|ᄃ|ᄄ|ᄅ|ᄆ|ᄇ|ᄈ|ᄉ|ᄊ|ᄋ|ᅇ|ᄌ|ᄍ|ᄎ|ᄏ|ᄐ|ᄑ|ᄒ|ᄞ|ᄠ|ᄡ|ᄢ|ᄣ|ᄧ|ᄩ|ᄫ|ᄭ|ᄮ|ᄯ|ᄲ|ᄶ|ᄻ|ᅀ|ᅘ|ᅙ|ᅌ|ᅟ)(?:ᅡ|ᅢ|ᅣ|ᅤ|ᅥ|ᅦ|ᅧ|ᅨ|ᅩ|ᅪ|ᅫ|ᅬ|ᅭ|ᅮ|ᅯ|ᅰ|ᅱ|ᅲ|ᅳ|ᅴ|ᅵ|ᆞ|ᆡ|ᆈ|ᆔ|ᆑ|ᆒ|ᆄ|ᆅ)(?:ᆨ|ᆪ|ᆫ|ᆮ|ᆯ|ᆰ|ᆱ|ᆲ|ᆳ|ᆷ|ᆸ|ᆹ|ᆺ|ᆼ|ᇆ|ᇇ|ᇈ|ᇌ|ᇗ|ᇙ|ᇜ|ᇝ|ᇟ|ᇢ|ᇦ|ᇫ|ᇰ|ᇹ|ᇱ|))(〮|〯|)/g;


function invert_mapping(mapping) {
    let inv_mapping = Array(mapping[mapping.length - 1][1]);
    for (let i = 0; i < inv_mapping.length; ++i) {
        inv_mapping[i] = [Infinity, 0];
    }
    for (let i = 0; i < mapping.length; ++i) {
        for (let j = mapping[i][0]; j < mapping[i][1]; ++j) {
            inv_mapping[j] = [
                Math.min(inv_mapping[j][0], i),
                Math.max(inv_mapping[j][1], i + 1),
            ];
        }
    }
    return inv_mapping;
}


function replace_and_map(string, pattern, replace_func, prev_mapping=null) {

    let inv_mapper_begin, inv_mapper_end;
    let mapping_size;
    if (prev_mapping === null) {
        inv_mapper_begin = function(i) { return i; };
        inv_mapper_end = function(i) { return i + 1; };
        mapping_size = string.length;
    }
    else {
        let inv_mapping = invert_mapping(prev_mapping);
        inv_mapper_begin = function(i) { return inv_mapping[i][0] };
        inv_mapper_end = function(i) { return inv_mapping[i][1] };
        mapping_size = prev_mapping.length;
    }

    let last_offset = 0;
    let dst_offset = 0;
    let mapping = Array(mapping_size);
    for (let i = 0; i < mapping.length; ++i) {
        mapping[i] = [Infinity, 0];
    }

    let orig_string_length = string.length;
    string = string.replace(pattern, function(match, ...rest) {
        let sub = replace_func(match, ...rest);

        let offset = rest[rest.length - 2];

        // before replaced part
        for (let i = 0; i < offset - last_offset; ++i) {
            for (let j = inv_mapper_begin(last_offset + i);
                 j < inv_mapper_end(last_offset + i); ++j) {
                mapping[j] = [
                    Math.min(mapping[j][0], dst_offset + i),
                    Math.max(mapping[j][1], dst_offset + i + 1)
                ];
            }
        }

        dst_offset += offset - last_offset;
        last_offset = offset;

        // replaced part
        for (let i = 0; i < match.length; ++i) {
            for (let j = inv_mapper_begin(last_offset + i);
                 j < inv_mapper_end(last_offset + i); ++j) {
                mapping[j] = [
                    Math.min(mapping[j][0], dst_offset),
                    Math.max(mapping[j][1], dst_offset + sub.length)
                ];
            }
        }

        dst_offset += sub.length;
        last_offset += match.length;

        return sub;
    });


    // remaining part
    let offset = orig_string_length;
    for (let i = 0; i < offset - last_offset; ++i) {
        for (let j = inv_mapper_begin(last_offset + i);
             j < inv_mapper_end(last_offset + i); ++j) {
            mapping[j] = [
                Math.min(mapping[j][0], dst_offset + i),
                Math.max(mapping[j][1], dst_offset + i + 1)
            ];
        }
    }

    return [string, mapping];
}


const TONED_SYLLABLE_REGEX = /((?:psk|pst|psc|pth|ss\/|cc\/|ch\/|ss\\|cc\\|ch\\|kk|nn|tt|pp|ss|GG|cc|ch|kh|th|ph|pk|pt|ps|pc|sk|sn|st|sp|sc|sh|hh|ng|s\/|c\/|s\\|c\\|k|n|t|l|m|p|s|G|c|h|W|z|q|`)(?:ywey|yway|yay|yey|way|woy|wey|wuy|yoy|yuy|ywe|ywa|ay|ya|ey|ye|wo|wa|yo|wu|we|yu|uy|oy|a|e|u|i|o)(?:lth|lph|nth|lks|mch|ngs|kk|ks|nc|nh|lk|lm|lp|ls|lh|ps|ss|ch|kh|th|ph|nt|ns|nz|lz|lq|mk|mp|ms|mz|sk|st|ng|pl|k|n|t|l|m|p|s|G|c|h|M|W|z|f|q|))(L|H|R|)(?![^<]*>)/g;


function showSentence(sentence, highlight_term, i) {
    let text = sentence.html ?? sentence.text;
    
    console.log(text);
    function toDisplayForm2(sentence) {

        // Render tone marks on top of syllable
        let mapping;
        [sentence, mapping] = replace_and_map(
            sentence, TONED_SYLLABLE_REGEX,
            function(_, syllable, tone) {
                if (tone === 'L') {
                    return `<span data-tone="L">${syllable}</span>`;
                }
                else if (tone === 'H') {
                    return `<span data-tone="H">${syllable}<span is-tone>${tone}</span></span>`;
                }
                else if (tone === 'R') {
                    return `<span data-tone="R">${syllable}<span is-tone>${tone}</span></span>`;
                }
            });

        // Add tooltips to gugyeol characters
        [sentence, mapping] = replace_and_map(
            sentence, GUGYEOL_REGEX,
            function (ch) {
                return `<abbr data-title=${GUGYEOL_READINGS[ch]} tabindex="0">${ch}</abbr>`;
            },
            mapping
        );

        return sentence;
    };
    console.log(toDisplayForm2(text));

    function toDisplayForm(sentence) {

        // Render tone marks on top of syllable
        let mapping;
        [sentence, mapping] = replace_and_map(
            sentence, HANGUL_REGEX,
            function(_, syllable, tone) {
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

        // Add tooltips to gugyeol characters
        [sentence, mapping] = replace_and_map(
            sentence, GUGYEOL_REGEX,
            function (ch) {
                return `<abbr data-title=${GUGYEOL_READINGS[ch]} tabindex="0">${ch}</abbr>`;
            },
            mapping
        );

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
