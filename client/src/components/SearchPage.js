import React from 'react';
import './index.css';
import {hangul_to_yale, yale_to_hangul} from './YaleToHangul';
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {
    addHighlights,
    getMatchingRanges,
    removeOverlappingRanges,
    searchTerm2Regex,
    toDisplayHTML,
    toText,
    toTextIgnoreTone,
} from './Highlight';
import './i18n';
import {Trans, useTranslation} from 'react-i18next';
import {Interweave} from 'interweave';
import HowToPageWrapper from './HowToPage';
import Histogram from './Histogram';
import {suggestGugyeol} from './Gugyeol';
import {
    Autocomplete, Backdrop, Box, Button, Checkbox,
    Chip, CircularProgress, FormControlLabel, Grid,
    Pagination, Paper, Popper, Table, TableBody,
    TableContainer, TableRow, TextField,
    Tooltip, Typography, IconButton, Stack,
} from '@mui/material';
import {styled} from '@mui/material/styles';
import {IMAGE_BASE_URL} from "./config";
import {tooltipClasses} from '@mui/material/Tooltip';
import {
    highlightColors, StyledTableCell, StyledTableRow,
    postData, zip
} from './utils';
import {SearchResultContext} from "./SearchContext";


function SearchResultsList(props) {
    const { t } = useTranslation();

    let footnotes = [];

    return <React.Fragment>

        <Grid item xs={12}>
            <TableContainer component={Paper} elevation={3}>
                <Table size="small">
                    <TableBody>

                    {/* For each book */}
                    {props.filteredResults.map(([book, match_ids_in_book], i) =>
                        <StyledTableRow key={i}>

                            {/* Year column */}
                            <StyledTableCell component="th" scope="row" sx={{ verticalAlign: 'top' }}>
                                <Grid item sx={{ py: 0.4 }}>
                                    <Tooltip title={book.year_string}>
                                        <Box>{
                                            book.year === null ? (
                                                t("Unknown year")
                                            ) : (
                                                book.year_end - book.year_start > 0 ? (
                                                'c.\u00a0' + book.year
                                                ) : book.year
                                            )
                                        }</Box>
                                    </Tooltip>
                                </Grid>
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
                                                props.resultTerm,
                                                match_ids_in_sentence,
                                                footnotes,
                                                props.romanize,
                                                props.ignoreSep,
                                            )}
                                            allowList={['mark', 'span', 'a']}
                                            allowAttributes={true}
                                        />&#8203;

                                        {/* Add source link */}
                                        <span style={{color: '#888'}}>
                                            &lang;
                                            <Link className="sourceLink"
                                                  to={`/source?name=${book.name}&n=${sentence.number_in_book}&hl=${props.resultTerm}`}
                                                  style={{textDecoration: "underline dotted lightgrey"}}>
                                                {sentence.page === null? book.name : `${book.name}:`}
                                            </Link>
                                            {sentence.hasImages && sentence.page !== '' ?
                                                sentence.page.split('-').map((page, i) => {
                                                    const imageURL = IMAGE_BASE_URL + book.name + '/' + page + '.jpg';
                                                    return <ImageTooltip title={pageImagePreview(page, imageURL, t)}
                                                                         placement="right" key={i}>
                                                        <span>
                                                            <a className="pageNum"
                                                               style={{color: '#888', textDecoration: 'underline'}}
                                                               href={imageURL}
                                                               target="blank"
                                                               key={i}>{page}</a>
                                                            {i < sentence.page.split('-').length - 1? "-" : null}
                                                        </span>
                                                    </ImageTooltip>
                                                }) : (sentence.page !== '' ? sentence.page : null)}
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
}


const ImageTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: '#f5f5f9',
        color: 'rgba(0, 0, 0, 0.87)',
        maxWidth: window.innerWidth * 0.3,
        fontSize: theme.typography.pxToRem(12),
        border: '1px solid #dadde9',
    },
}));


function pageImagePreview(page, imageURL, t) {
    return <React.Fragment>
        <Grid container>
            <Grid item xs={12}>
                <img src={imageURL}
                     alt={t("Image for page", { page: page })}
                     height={window.innerHeight - 50}
                     width={window.innerWidth - 50}
                     style={{maxHeight: "100%", maxWidth: "100%", objectFit: "scale-down"}}
                />
            </Grid>
            <Grid item xs={12}>
                {t("Image for page", { page: page })}
            </Grid>
        </Grid>
    </React.Fragment>;
}

function highlight(text, searchTerm, match_ids, footnotes, romanize, ignoreSep) {
    
    // Into HTML for display
    let [displayHTML, displayHTMLMapping] = toDisplayHTML(text, footnotes, romanize);
    
    // Find matches
    let hlRegex = searchTerm2Regex(searchTerm, ignoreSep);
    let match_ranges = [
        ...getMatchingRanges(
            hlRegex,
            ...toText(text, ignoreSep),  // Remove HTML tags, retain tones
            displayHTMLMapping
        ),
        ...getMatchingRanges(
            hlRegex,
            ...toTextIgnoreTone(text, ignoreSep),  // Remove HTML tags and tones
            displayHTMLMapping
        )
    ];
    
    // Remove overlapping ranges
    match_ranges = removeOverlappingRanges(match_ranges, displayHTML.length);
    
    // Add highlights
    return addHighlights(displayHTML, match_ranges, match_ids, highlightColors);
}

const SearchResultsWrapper = React.memo(function (props) {
    const { t } = useTranslation();

    const [disabledMatches, setDisabledMatches] = React.useState(new Set());

    let num_pages = Math.ceil(props.numResults / props.pageN);

    // Determine highlight colors
    let matches = [];

    function toggleMatch(_, i) {
        let disabledMatches_ = new Set(disabledMatches);
        if (disabledMatches_.has(i)) {
            disabledMatches_.delete(i);
        }
        else {
            disabledMatches_.add(i);
        }

        setDisabledMatches(disabledMatches_);
    }

    React.useEffect(() => {
        setDisabledMatches(new Set());
    }, [props.resultTerm, props.page, props.doc]);

    for (const book of props.results) {
        let book_parts = [];
        for (const sentence of book.sentences) {

            let text = sentence.html ?? sentence.text;

            // Find matches
            let hlRegex = searchTerm2Regex(props.resultTerm, props.ignoreSep);
            let [rawText, rawTextRanges] = toText(text, props.ignoreSep);
            let match_ranges = [
                ...getMatchingRanges(hlRegex, rawText, rawTextRanges, rawTextRanges),
                ...getMatchingRanges(hlRegex, ...toTextIgnoreTone(text, props.ignoreSep), rawTextRanges),
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
        props.results,
        match_ids
    )
        //.filter(
        //    ([_, match_ids_in_book]) => // filter out entire book if there are no valid matches in it
        //        !match_ids_in_book.flat().every(
        //            id => props.disabledMatches.has(id)
        //        )
        //)
        .map(([book, match_ids_in_book]) => { // filter out sentence if there are no valid matches in it

            let sentences_and_indices =
                zip(book.sentences, match_ids_in_book);
            //.filter(
            //    ([_, match_ids_in_sentence]) =>
            //        !match_ids_in_sentence.every(
            //            id => props.disabledMatches.has(id)
            //        )
            //);

            let [sentences, indices] = zip(...sentences_and_indices);

            return [{...book, sentences: sentences}, indices];
        });

    return <React.Fragment>

        <Histogram data={props.histogram} setPage={props.setPage} pageN={props.pageN}/>

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
                        {/*<span className={disabledMatches.has(i)? "matchLegendItem disabled" : "matchLegendItem"}
                               onClick={(event) => {toggleMatch(event, i)}}>
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
                        {t("Romanization")}
                    </Typography>
                }
                checked={props.romanize}
                onChange={(event) => props.handleRomanizeChange(event)}
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
                        page={props.page}
                        onChange={(_, page) => props.setPage(page)}
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
            romanize={props.romanize}
            ignoreSep={props.ignoreSep}
            resultTerm={props.resultTerm}
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
                        page={props.page}
                        onChange={(_, page) => props.setPage(page)}
                    /> : null}
            </Box>
        </Grid>
    </React.Fragment>;

}, arePropsEqual);

function arePropsEqual(oldProps, newProps) {
    let equal = true;
    for (let key of Object.keys(oldProps)) {
        if (key === 'handleRomanizeChange' || key === 'setPage') {
            continue;
        }
        equal &&= Object.is(oldProps[key], newProps[key]);
    }
    return equal;
}

function DocSelector(props) {
    const { t } = useTranslation();

    const [open, setOpen] = React.useState(false);
    
    function handleChange(ev, doc, reason) {
        if (reason === 'selectOption') {
            props.navigate(`/source?name=${doc.name}`);
        }
    }

    function handleKeyDown(ev) {
        if (ev.key === "Enter") {
            props.onRefresh();
        }
    }

    function handleDocChange(ev, value, reason) {
        if (reason === 'input') {
            props.handleDocChange(value);
        }
    }

    let docCandLoading = !props.docSuggestions.loaded;

    return <Autocomplete
        fullWidth
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        options={props.docSuggestions.result}
        getOptionLabel={(doc) => typeof doc === 'string'? doc : `${doc.name} (${doc.year_string})`}
        loading={docCandLoading}
        freeSolo
        onChange={(ev, value, reason) => handleChange(ev, value, reason)}
        onInputChange={(ev, value, reason) => handleDocChange(ev, value, reason)}
        onKeyDown={(ev) => handleKeyDown(ev)}
        filterOptions={(x) => x}
        inputValue={props.doc}
        renderInput={(params) => (
            <TextField
                {...params}
                variant="standard"
                label={t("document name...")}
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

function SearchPage(props) {
    const { t } = useTranslation();

    const [romanize, setRomanize] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [gugyeolInputOpen, setGugyeolInputOpen] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    function handleChange(event) {
        let searchTerm = event.target.value;
        props.setSearchParams(searchParams => {
            if (searchTerm === "") {
                searchParams.delete("term");
            } else {
                searchParams.set("term", searchTerm);
            }
            return searchParams;
        })
    }

    function handleDocChange(doc) {
        props.setSearchParams(searchParams => {
            if (doc === "") {
                searchParams.delete("doc");
            } else {
                searchParams.set("doc", doc);
            }
            return searchParams;
        })
    }

    function handleExcludeModernChange(event) {
        let excludeModern = event.target.checked;
        props.setSearchParams(searchParams => {
            if (excludeModern) {
                searchParams.set("excludeModern", "yes");
            } else {
                searchParams.delete("excludeModern");
            }
            return searchParams;
        })
    }

    function handleIgnoreSepChange(event) {
        let ignoreSep = event.target.checked;
        props.setSearchParams(searchParams => {
            if (ignoreSep) {
                searchParams.set("ignoreSep", "yes");
            } else {
                searchParams.delete("ignoreSep");
            }
            return searchParams;
        })
    }

    function handleRomanizeChange(event) {
        setRomanize(event.target.checked);
    }

    function handleKeyDown(ev) {
        if (ev.key === "Enter") {
            props.onRefresh();
        }
    }

    function setPage(page) {
        props.setSearchParams(searchParams => {
            if (page === 1) {
                searchParams.delete("page");
            } else {
                searchParams.set("page", page);
            }
            return searchParams;
        });
    }

    function toggleGugyeolInput(e) {
        setAnchorEl(document.getElementById('searchTermField'));
        setGugyeolInputOpen(!gugyeolInputOpen);
        setIsFocused(!gugyeolInputOpen);
    }

    function replaceGugyeol(suggestion) {
        let term = props.term;
        term = term.slice(0, term.length - suggestion.replaceLength) + suggestion.gugyeol;
        props.setSearchParams(searchParams => {
            searchParams.set("term", term);
            return searchParams;
        });
    }

    let searchTerm = props.term;
    let suggestedGugyeols = suggestGugyeol(searchTerm);
    let groupedSuggestions = [];
    const COLUMNS = 3;
    for (let i = 0; i < suggestedGugyeols.length; i++) {
        if (i % COLUMNS === 0) {
            groupedSuggestions.push([]);
        }
        groupedSuggestions[groupedSuggestions.length - 1].push(suggestedGugyeols[i]);
    }

    return (
        <Grid container spacing={{xs: 0.5, sm: 1}} alignItems="center">
            <Grid item xs={9} sm={6}>
                <Box position="relative">
                    <TextField
                        id={"searchTermField"}
                        variant="filled"
                        value={searchTerm}
                        label={t("Search term...")}
                        onChange={(event) => handleChange(event)}
                        onKeyDown={(event) => handleKeyDown(event)}
                        fullWidth
                    />
                    <Box style={{position: "absolute", right: 0, padding: 0, top: "50%", transform: "translateY(-50%)"}}>
                        <Tooltip title={t("Toggle Gugyeol Input")}>
                            <IconButton variant="outlined" onClick={(e) => toggleGugyeolInput(e)}>
                                <Typography sx={{fontSize: "20pt", fontWeight: "900", lineHeight: 0.7,
                                                 color: gugyeolInputOpen? "#4e342e": "inherit"}}>
                                    <br/>
                                </Typography>
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                <Popper open={gugyeolInputOpen && isFocused} anchorEl={anchorEl}
                        placement='bottom-end' style={{ zIndex: 1000 }}>
                    <TableContainer component={Paper} elevation={3}>
                        <Table size="small">
                            <TableBody>
                                {groupedSuggestions.map((group, i) =>
                                    <TableRow key={i}>
                                        {group.map((suggestion, j) =>
                                            <StyledTableCell key={j} sx={{padding: 0}}>
                                                <Button onClick={() => replaceGugyeol(suggestion)}>
                                                    <Stack direction="column" justifyContent="center" alignItems="center">
                                                        <Typography sx={{fontSize: "15pt", fontWeight: "900", lineHeight: 0.8}}>
                                                            {suggestion.gugyeol}
                                                        </Typography>
                                                        <Typography sx={{fontSize: "8pt", lineHeight: 0.8}}>
                                                            {suggestion.pron}
                                                        </Typography>
                                                    </Stack>
                                                </Button>
                                            </StyledTableCell>
                                        )}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Popper>
            </Grid>
            <Grid item xs={3} sm={1}>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={(e) => props.onRefresh(e)}>
                    {t("Search")}
                </Button>
            </Grid>

            <Grid item xs={0} sm={1}>
            </Grid>

            <Grid item xs={12} sm={4}>
                <DocSelector
                    doc={props.doc}
                    docSuggestions={props.docSuggestions}
                    navigate={props.navigate}
                    handleDocChange={(ev) => handleDocChange(ev)}
                    onRefresh={() => props.onRefresh()}
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
                                    {t("Exclude modern translations")}
                                </Typography>
                            }
                            checked={props.excludeModern}
                            onChange={(event) => handleExcludeModernChange(event)}
                        />
                    </Grid>
                    <Grid item xs="auto" sm="auto">
                        <FormControlLabel
                            control={<Checkbox size="small" sx={{py: 0}} />}
                            label={
                                <Typography sx={{fontSize: "1em"}}>
                                    {t("Ignore syllable separators")}
                                </Typography>
                            }
                            checked={props.ignoreSep}
                            onChange={(event) => handleIgnoreSepChange(event)}
                        />
                    </Grid>
                    {/*
                    <Grid item xs="auto" sm="auto">
                        <FormControlLabel
                            control={<Checkbox size="small" sx={{py: 0}} />}
                            label={
                                <Typography sx={{fontSize: "1em"}}>
                                    {this.props.t("Regex")}
                                </Typography>
                            }
                            checked={this.props.excludeModern === "yes"}
                            onChange={(event) => this.handleExcludeModernChange(event)}
                        />
                    </Grid>
                    */}
                </Grid>
            </Grid>

            <Grid item xs={12} sm={12}>
                <Typography sx={{fontSize: "1em", fontWeight: 600}}>
                    {t('number Results', { numResults: props.numResults })}&ensp;
                    {
                        props.result.length > 0?
                        t('current page', { startYear: props.result[0].year, endYear: props.result[props.result.length - 1].year })
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
                        open={!props.loaded}>
                        <CircularProgress color="inherit" />
                    </Backdrop>

                    <SearchResultsWrapper
                        results={props.result}
                        numResults={props.numResults}
                        romanize={romanize}
                        handleRomanizeChange={(event) => handleRomanizeChange(event)}
                        ignoreSep={props.ignoreSep}
                        resultTerm={props.resultTerm}  // for triggering re-render
                        resultPage={props.resultPage}  // for triggering re-render
                        resultDoc={props.resultDoc}  // for triggering re-render
                        histogram={props.histogram}
                        statsTerm={props.statsTerm}  // for triggering re-render
                        pageN={props.pageN}
                        page={props.page}
                        setPage={setPage}
                    />
                </Grid>
            </Grid>

        </Grid>
    );
}


function makeQuery(query) {
    let term = hangul_to_yale(query.term);

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

    query = {...query, term: term};

    return query;
}


function search(query, callback, errorCallback) {
    query = makeQuery(query);

    postData('/api/search', query).then((result) => {
        if (result.status === 'success') {
            callback(result.results, result.page_N);
        } else {
            console.log(result);
            errorCallback('Server responded with error');
        }
    }).catch((err) => {
        console.log(err);
        errorCallback('Could not connect to server');
    });
}

function getStats(query, callback, errorCallback) {
    query = makeQuery(query);

    postData('/api/search_stats', query).then((result) => {
        if (result.status === 'success') {
            callback(result.num_results, result.histogram);
        } else {
            console.log(result);
            errorCallback('Server responded with error');
        }
    }).catch((err) => {
        console.log(err);
        errorCallback('Could not connect to server');
    });
}

function suggest(doc, callback) {
    postData('/api/doc_suggest', { doc: doc })
    .then((result) => {
        if (result.status === 'success') {
            callback(result.results, result.total_rows);
        } else {
            callback([], 0);
            // TODO: handle error
        }
    })
    .catch((err) => {
        console.log(err);
        callback([], 0);
        // TODO: handle error
    });
}

const ENABLE_SEARCH_AS_YOU_TYPE = false;

function SearchPageWrapper(props) {
    let navigate = useNavigate();
    let [searchParams, setSearchParams] = useSearchParams();
    let page = parseInt(searchParams.get('page') ?? '1');
    let term = searchParams.get('term') ?? "";
    let doc = searchParams.get('doc') ?? "";

    // Search options
    let excludeModern = searchParams.get('excludeModern') ?? 'no';
    let ignoreSep = searchParams.get('ignoreSep') ?? 'no';
    const [result, setResult] = React.useContext(SearchResultContext);

    let [docSuggestions, setDocSuggestions] = React.useState({
        result: [],
        num_results: 0,
        loaded: false,
    });

    const isInited = React.useRef(
        result.result_term === term
        && result.result_page === page
        && result.result_doc === doc
        && result.stats_term === term
        && result.loaded && result.statsLoaded
    );

    const prevResult = React.useRef(result);
    const prevQuery = React.useRef({
        term: term,
        doc: doc,
        page: page,
        excludeModern: excludeModern,
        ignoreSep: ignoreSep,
    });

    const prevDocSuggestions = React.useRef(docSuggestions);

    const refresh = React.useCallback(
        (query) => {
            if (isInited.current && prevQuery.current.page === query.page && query.page !== 1) {
                // Set page to 1 if term or doc changed
                setSearchParams(searchParams => {
                    searchParams.set("page", "1");
                    return searchParams;
                });
            } else {
                let active = true;

                setResult({
                    ...prevResult.current,
                    loaded: false
                });

                search(
                    query,
                    async (result, page_N) => {
                        if (active) {
                            setResult({
                                ...prevResult.current,
                                result: result,
                                page_N: page_N,
                                result_term: query.term,
                                result_page: query.page,
                                result_doc: query.doc,
                                loaded: true
                            });
                        }
                    },
                    async (error) => {
                        console.error(error);
                        // TODO: handle error
                    }
                );

                getStats(
                    query,
                    async (numResults, histogram) => {
                        if (active) {
                            setResult({
                                ...prevResult.current,
                                num_results: numResults,
                                histogram: histogram,
                                stats_term: query.term,
                                statsLoaded: true
                            });
                        }
                    },
                    async (error) => {
                        console.error(error);
                        // TODO: handle error
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
        if (prevQuery.current.term !== term) {
            if (ENABLE_SEARCH_AS_YOU_TYPE) {
                const result = refresh({...prevQuery.current, term: term});
                isInited.current = true;
                prevQuery.current.term = term;
                return result;
            } else {
                prevQuery.current.term = term;
            }
        }
    }, [term, refresh]);

    React.useEffect(() => {
        if (prevQuery.current.page !== page || !isInited.current) {
            console.log("Page changed: ", prevQuery.current.page, " -> ", page);
            const result = refresh({...prevQuery.current, page: page});
            isInited.current = true;
            prevQuery.current.page = page;
            return result;
        }
    }, [page, refresh]);

    React.useEffect(() => {
        if (prevQuery.current.doc !== doc) {
            console.log("Doc changed: ", prevQuery.current.doc, " -> ", doc);
            if (ENABLE_SEARCH_AS_YOU_TYPE) {
                const result = refresh({...prevQuery.current, doc: doc});
                isInited.current = true;
                prevQuery.current.doc = doc;
                return result;
            } else {
                prevQuery.current.doc = doc;
            }
        }
    }, [doc, refresh]);

    React.useEffect(() => {
        if (prevQuery.current.excludeModern !== excludeModern) {
            console.log("Exclude modern changed: ", prevQuery.current.excludeModern, " -> ", excludeModern);
            const result = refresh({...prevQuery.current, excludeModern: excludeModern});
            isInited.current = true;
            prevQuery.current.excludeModern = excludeModern;
            return result;
        }
    }, [excludeModern, refresh]);

    React.useEffect(() => {
        if (prevQuery.current.ignoreSep !== ignoreSep) {
            console.log("Ignore separator changed: ", prevQuery.current.ignoreSep, " -> ", ignoreSep);
            const result = refresh({...prevQuery.current, ignoreSep: ignoreSep});
            isInited.current = true;
            prevQuery.current.ignoreSep = ignoreSep;
            return result;
        }
    }, [ignoreSep, refresh]);

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
        return refresh({
            term: term,
            doc: doc,
            page: page,
            excludeModern: excludeModern,
            ignoreSep: ignoreSep,
        });
    }

    return <SearchPage
        {...props}
        page={page} term={term} doc={doc}
        excludeModern={excludeModern === "yes"}
        ignoreSep={ignoreSep === "yes"}
        result={result.result}
        resultTerm={result.result_term}
        resultPage={result.result_page}
        resultDoc={result.result_doc}
        statsTerm={result.stats_term}
        pageN={result.page_N}
        loaded={result.loaded}
        numResults={result.num_results}
        histogram={result.histogram}
        statsLoaded={result.statsLoaded}
        setSearchParams={setSearchParams}
        onRefresh={forceRefresh}
        docSuggestions={docSuggestions}
        navigate={navigate}
    />;
}

export default SearchPageWrapper;
