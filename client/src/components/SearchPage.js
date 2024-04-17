import React from 'react';
import './index.css';
import { yale_to_hangul, hangul_to_yale } from './YaleToHangul';
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { 
    searchTerm2Regex, 
    toDisplayHTML,
    getMatchingRanges,
    toText,
    toTextIgnoreTone,
    removeOverlappingRanges,
    addHighlights,
} from './Highlight';
import './i18n';
import { useTranslation } from 'react-i18next';
import { Interweave } from 'interweave';
import HowToPageWrapper from './HowToPage';
import { Trans } from 'react-i18next';
import Histogram from './Histogram';
import {
    TextField, Button, Grid, Autocomplete,
    CircularProgress, Typography, FormControlLabel,
    Checkbox, Box, Pagination, Paper,
    Backdrop, TableContainer, Table, Chip, 
    TableBody, TableRow, TableCell,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import { 
    orange, pink, indigo,     
    cyan, lightGreen, amber,      
    red, deepPurple, lightBlue,  
    green, yellow, deepOrange,
    purple, blue, teal, lime, 
} from '@mui/material/colors';


const highlightColors = [
    orange, pink, indigo,     
    cyan, lightGreen, amber,      
    red, deepPurple, lightBlue,  
    green, yellow, deepOrange,
    purple, blue, teal, lime, 
].map((x) => x['A100']);


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


const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));


class SearchResultsList extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        
        let footnotes = [];
        
        let dom = <React.Fragment>
        
            <Grid item xs={12}>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableBody>
                        
                        {/* For each book */}
                        {this.props.filteredResults.map(([book, match_ids_in_book], i) =>
                            <StyledTableRow key={i}>

                                {/* Year column */}
                                <StyledTableCell component="th" scope="row" sx={{verticalAlign: 'top'}}>
                                    {book.year ?? "-"}
                                </StyledTableCell>

                                {/* Sentences column */}
                                <StyledTableCell>

                                    {/* For each sentence */}
                                    {zip(book.sentences, match_ids_in_book)
                                    .map(([sentence, match_ids_in_sentence], i) =>
                                        <Grid item key={i} sx={{ py: 0.4 }}>

                                            {/* Highlighted sentence */}
                                            <Interweave
                                                content={highlight(
                                                    sentence.html ?? sentence.text,
                                                    this.props.resultTerm,
                                                    match_ids_in_sentence,
                                                    footnotes
                                                )}
                                                allowList={['mark', 'span', 'a']}
                                                allowAttributes={true}
                                            />&#8203;
                                            
                                            {/* Add source link */}
                                            <span style={{color: '#888'}}>
                                                &lang;
                                                <Link to={`/source?name=${book.name}&n=${sentence.number_in_book}&hl=${this.props.resultTerm}`} className="source">
                                                    {sentence.page === null? book.name : `${book.name}:${sentence.page}`}
                                                </Link>
                                                &rang;
                                            </span>

                                        </Grid>
                                    )}

                                </StyledTableCell>

                            </StyledTableRow>
                        )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
            
            <Grid item xs={12} container alignItems="flex-start" spacing={1.5} className="searchResultsList">
                {footnotes.length > 0? <div className="dividerFootnote"></div> : null}
                
                {/* Show footnotes */}
                {footnotes.map((footnote, i) => 
                    <div key={i} className="footnoteContent">
                        <a className="footnoteLink" id={`note${i+1}`} href={`#notefrom${i+1}`} data-footnotenum={`${i+1}`}></a>
                        &nbsp;
                        {footnote}
                    </div>
                )}
            </Grid>
            
        </React.Fragment>;
        
        return dom;
    }
}

function highlight(text, searchTerm, match_ids, footnotes) {
    
    // Into HTML for display
    let [displayHTML, displayHTMLMapping] = toDisplayHTML(text, footnotes);
    
    // Find matches
    let hlRegex = searchTerm2Regex(searchTerm);
    let match_ranges = [
        ...getMatchingRanges(
            hlRegex, 
            ...toText(text),
            displayHTMLMapping
        ),
        ...getMatchingRanges(
            hlRegex, 
            ...toTextIgnoreTone(text),
            displayHTMLMapping
        )
    ];
    
    // Remove overlapping ranges
    match_ranges = removeOverlappingRanges(match_ranges, displayHTML.length);
    
    // Add highlights
    let html = addHighlights(displayHTML, match_ranges, match_ids, highlightColors);
    
    return html;
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
            for (const sentence of book.sentences) {
                
                let text = sentence.html ?? sentence.text;
                
                // Find matches
                let hlRegex = searchTerm2Regex(this.props.resultTerm);
                let [rawText, rawTextRanges] = toText(text);
                let match_ranges = [
                    ...getMatchingRanges(hlRegex, rawText, rawTextRanges, rawTextRanges),
                    ...getMatchingRanges(hlRegex, ...toTextIgnoreTone(text), rawTextRanges),
                ];
                
                // Remove overlapping ranges
                match_ranges = removeOverlappingRanges(match_ranges, rawText.length);
                
                let parts = [];
                for (let range of match_ranges) {
                    parts.push(yale_to_hangul(rawText.slice(...range)));
                }
                
                book_parts.push(parts);
            }
            matches.push(book_parts);
        }

        // List of unique matches in current page
        let uniqueMatches = [...new Set(matches.flat(2))];

        // Array(book)[Array(sentence)[Array(matches)[int]]]
        let match_ids = matches.map(
            (matches_in_book) => matches_in_book.map(
                (matches_in_sentence) => matches_in_sentence.map(
                    (match) => uniqueMatches.indexOf(match)
                )
            )
        );

        let filtered_results_list = zip(
            this.props.results,
            match_ids
        )
        //.filter(
        //    ([_, match_ids_in_book]) => // filter out entire book if there are no valid matches in it
        //        !match_ids_in_book.flat().every(
        //            id => this.props.disabledMatches.has(id)
        //        )
        //)
        .map(([book, match_ids_in_book]) => { // filter out sentence if there are no valid matches in it

            let sentences_and_indices =
                zip(book.sentences, match_ids_in_book);
                //.filter(
                //    ([_, match_ids_in_sentence]) =>
                //        !match_ids_in_sentence.every(
                //            id => this.props.disabledMatches.has(id)
                //        )
                //);

            let [sentences, indices] = zip(...sentences_and_indices);

            return [{...book, sentences: sentences}, indices];
        });

        return <React.Fragment>

            <Histogram
                data={this.props.histogram}
                t={this.props.t}
                setPage={this.props.setPage}
                pageN={this.props.pageN}
            />
            
            {/* Show highlight match legend */}
            <Grid item xs mt={1} mb={2} container columnSpacing={1} spacing={1}>
                {uniqueMatches.map((part, i) =>
                    <Grid key={i} item xs="auto">
                        <Chip 
                            label={part} 
                            sx={{backgroundColor: highlightColors[i % highlightColors.length]}}
                            size="small" 
                            onDelete={() => null} 
                            clickable>
                            {/*<span
                                className={this.state.disabledMatches.has(i)? "matchLegendItem disabled" : "matchLegendItem"}
                                onClick={(event) => {this.toggleMatch(event, i)}}>
                                <span className={"".concat("colorShower s", i)}></span>
                                <span className="matchLegendWord">{part}</span>
                            </span>*/}
                        </Chip>
                    </Grid>
                )}
            </Grid>
            
            <Grid item sm="auto" sx={{display: {'xs': 'none', 'sm': 'flex'}}}>
                <FormControlLabel
                    control={<Checkbox size="small" sx={{py: 0}} />} 
                    label={
                        <Typography sx={{fontSize: "1em"}}>
                            {this.props.t("Romanization")}
                        </Typography>
                    }
                    checked={this.props.romanize}
                    onChange={(event) => this.props.handleRomanizeChange(event)}
                />
            </Grid>
            
            {/* Pager on top */}
            <Grid item xs={12}>
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center">
                    {filtered_results_list.length > 0?
                        <Pagination 
                            color="primary"
                            count={num_pages}
                            siblingCount={2}
                            boundaryCount={2}
                            page={this.props.page}
                            onChange={(_, page) => this.props.setPage(page)}
                        /> : null}
                </Box>
            </Grid>

            {/* Results area */}
            <Grid item xs={12}>
                {filtered_results_list.length > 0?
                    null:
                    <div>
                        <Trans i18nKey='No match. Please follow the instructions below for better results.' />
                        <HowToPageWrapper title=""/>
                    </div>
                }
            </Grid>
            
            <SearchResultsList
                filteredResults={filtered_results_list}
                romanize={this.props.romanize}
                ignoreSep={this.props.ignoreSep}
                resultTerm={this.props.resultTerm}
                t={this.props.t}
            />

            {/* Pager on bottom */}
            <Grid item xs={12} my={1}>
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center">
                    {filtered_results_list.length > 0?
                        <Pagination 
                            color="primary"
                            count={num_pages}
                            siblingCount={2}
                            boundaryCount={2}
                            page={this.props.page}
                            onChange={(_, page) => this.props.setPage(page)}
                        /> : null}
                </Box>
            </Grid>
        </React.Fragment>;
    }
}

const SearchResultsWrapper = React.memo(function SearchResultsWrapper(props) {
    return <SearchResults {...props} />;
}, arePropsEqual);

function arePropsEqual(oldProps, newProps) {
    //console.log("Begin comparison");
    let equal = true;
    for (let key of Object.keys(oldProps)) {
        if (key === 't' || key === 'handleRomanizeChange') {
            continue;
        }
        equal &&= Object.is(oldProps[key], newProps[key]);
        if (!Object.is(oldProps[key], newProps[key])) {
            //console.log(key, Object.is(oldProps[key], newProps[key]), oldProps[key], newProps[key]);
        }
    }
    //console.log("Props equal=", equal);
    return equal;
}

class DocSelector extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            open: false
        };
    }
    
    handleChange(ev, doc, reason) {
        if (reason === 'selectOption') {
            this.props.navigate(`/source?name=${doc.name}`);
        }
    }
    
    handleKeyDown(ev) {
        if (ev.key === "Enter") {
            this.props.onRefresh();
        }
    }
    
    handleDocChange(ev, value, reason) {
        if (reason === 'input') {
            this.props.handleDocChange(value);
        }
    }
    
    render() {
        let docCandLoading = !this.props.docSuggestions.loaded;
        
        return <Autocomplete
            fullWidth
            open={this.state.open}
            onOpen={() => this.setState({...this.state, open: true})}
            onClose={() => this.setState({...this.state, open: false})}
            options={this.props.docSuggestions.result}
            getOptionLabel={(doc) => typeof doc === 'string'? doc : `${doc.name} (${doc.year_string})`}
            loading={docCandLoading}
            freeSolo
            onChange={(ev, value, reason) => this.handleChange(ev, value, reason)}
            onInputChange={(ev, value, reason) => this.handleDocChange(ev, value, reason)}
            onKeyDown={(ev) => this.handleKeyDown(ev)}
            filterOptions={(x) => x}
            inputValue={this.props.doc}
            renderInput={(params) => (
                <TextField
                    {...params}
                    variant="standard" 
                    label={this.props.t("document name...")}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {docCandLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
        />;
    }
}

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

    handleDocChange(doc) {
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
    
    handleKeyDown(ev) {
        if (ev.key === "Enter") {
            this.props.onRefresh();
        }
    }

    setPage(page) {
        this.setSearchParams({page: page});
    }

    render() {
        console.log("SearchPage rerender");
        let searchTerm = this.props.term;
        
        return (
            <Grid container spacing={{xs: 0.5, sm: 1}} alignItems="center">
                <Grid item xs={9} sm={6}>
                    <TextField
                        variant="filled"
                        value={searchTerm}
                        label={this.props.t("Search term...")}
                        onChange={(event) => this.handleChange(event)}
                        onKeyDown={(event) => this.handleKeyDown(event)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={3} sm={1}>
                    <Button 
                        variant="contained" 
                        fullWidth 
                        onClick={(e) => this.props.onRefresh(e)}>
                        {this.props.t("Search")}
                    </Button>
                </Grid>
                
                <Grid item xs={0} sm={1}>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                    <DocSelector 
                        t={this.props.t}
                        doc={this.props.doc}
                        docSuggestions={this.props.docSuggestions}
                        navigate={this.props.navigate}
                        handleDocChange={(ev) => this.handleDocChange(ev)}
                        onRefresh={() => this.props.onRefresh()}
                    />
                </Grid>
                
                <Grid item xs={12} sm={12}>
                    <Typography
                        variant="h5"
                        noWrap
                        sx={{
                            mr: 2,
                            display: 'flex',
                            flexGrow: 1,
                            fontWeight: 500,
                            color: 'inherit',
                            textDecoration: 'none',
                        }}>
                        {yale_to_hangul(searchTerm)}
                    </Typography>
                </Grid>

                <Grid item xs="auto" sm="auto">
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center">
                        <Grid item xs="auto" sm="auto">
                            <FormControlLabel
                                control={<Checkbox size="small" sx={{py: 0}} />} 
                                label={
                                    <Typography sx={{fontSize: "1em"}}>
                                        {this.props.t("Exclude modern translations")}
                                    </Typography>
                                }
                                checked={this.props.excludeModern === "yes"}
                                onChange={(event) => this.handleExcludeModernChange(event)}
                            />
                        </Grid>
                        {/*
                        <Grid item xs="auto" sm="auto">
                            <FormControlLabel 
                                fontSize="tiny"
                                control={<Checkbox size="tiny" />} 
                                label={this.props.t("Ignore syllable separators")}
                                checked={this.props.ignoreSep === "yes"}
                                onChange={(event) => this.handleIgnoreSepChange(event)}
                            />
                        </Grid>
                        */}
                    </Grid>
                </Grid>

                <Grid item xs={12} sm={12}>
                    <Typography sx={{fontSize: "1em", fontWeight: 600}}>
                        {this.props.t('number Results', { numResults: this.props.numResults })}&ensp;
                        {
                            this.props.result.length > 0?
                            this.props.t('current page', { startYear: this.props.result[0].year, endYear: this.props.result[this.props.result.length - 1].year})
                            : <span></span>
                        }
                    </Typography>
                </Grid>
                
                
                <Grid item xs={12} sm={12} sx={{position: 'relative'}}>
                    <Grid container spacing={{xs: 0.5, sm: 1}} alignItems="center">
                        <Backdrop
                            sx={{ 
                                color: '#fff', 
                                zIndex: (theme) => theme.zIndex.drawer + 1,
                                position: 'absolute',
                                alignItems: 'flex-start',
                                pt: 5,
                            }}
                            open={!this.props.loaded}>
                            <CircularProgress color="inherit" />
                        </Backdrop>
                        
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
                            t={this.props.t}
                        />
                    </Grid>
                </Grid>
                
            </Grid>
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
    
    let navigate = useNavigate();
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
        page_N: 20,
        loaded: false
    });
    let [docSuggestions, setDocSuggestions] = React.useState({
        result: [],
        num_results: 0,
        loaded: false,
    });

    const isInited = React.useRef(false);
    const prevResult = React.useRef(result);
    const prevTerm = React.useRef(term);
    const prevDoc = React.useRef(doc);
    const prevPage = React.useRef(page);

    const prevExcludeModern = React.useRef(excludeModern);
    const prevIgnoreSep = React.useRef(ignoreSep);
    
    const prevDocSuggestions = React.useRef(docSuggestions);

    const refresh = React.useCallback(
        (term, doc, page, excludeModern, ignoreSep) => {
            let active = true;

            if (page !== 1 && (
                prevTerm.current !== term ||
                prevDoc.current !== doc ||
                prevExcludeModern.current !== excludeModern)) {
                
                console.log("setSearchParams");
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
                            console.log("setResult");
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
        [setSearchParams, setResult],
    );

    const suggest_doc = React.useCallback(
        (doc) => {
            let active = true;

            setDocSuggestions({
                ...prevDocSuggestions.current,
                loaded: false,
            });
            
            suggest(doc, (result, num_results) => {
                if (active) {
                    setDocSuggestions({
                        result: result,
                        num_results: num_results,
                        loaded: true,
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
        // Scroll to top of the page when result changes
        window.scroll({
            top: 0,
            behavior: 'smooth'
        });

        prevResult.current = result;
    }, [result]);

    React.useEffect(() => {
        prevDocSuggestions.current = docSuggestions;
    }, [docSuggestions]);

    function forceRefresh() {
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
            navigate={navigate}
            t={t}
        />
    );
}

export default SearchPageWrapper;
