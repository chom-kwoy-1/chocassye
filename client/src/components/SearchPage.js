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
import {highlightColors, StyledTableCell, StyledTableRow} from './utils.js';
import {zip} from './common_utils.mjs';
import {SearchResultContext} from "./SearchContext";
import {search, getStats, suggest} from "./api";


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

function SearchResultsWrapper(props) {
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

        <Grid item xs={12} container sx={{position: 'relative'}}>
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    position: 'absolute',
                }}
                open={!props.statsLoaded}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <Histogram data={props.histogram} setPage={props.setPage} pageN={props.pageN}/>
        </Grid>

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
                onChange={(event) => props.handleRomanizeChange(event.target.checked)}
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
        <Grid item xs={12} marginTop={1}>
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
}

function arePropsEqual(oldProps, newProps) {
    let equal = true;
    for (let key of Object.keys(oldProps)) {
        const isEqual = Object.is(oldProps[key], newProps[key]);
        equal &&= isEqual;
    }
    return equal;
}
SearchResultsWrapper = React.memo(SearchResultsWrapper, arePropsEqual);

function DocSelector(props) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [open, setOpen] = React.useState(false);
    
    function handleChange(ev, doc, reason) {
        if (reason === 'selectOption') {
            navigate(`/source?name=${doc.name}`);
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

    function handleKeyDown(ev) {
        if (ev.key === "Enter") {
            props.onRefresh();
        }
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
        }, { replace: true });
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
                        onChange={(event) => props.setTerm(event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event)}
                        fullWidth
                    />
                    <Box style={{position: "absolute", right: 0, padding: 0, top: "50%", transform: "translateY(-50%)"}}>
                        <Tooltip title={t("Toggle Gugyeol Input")}>
                            <IconButton variant="outlined" onClick={(e) => toggleGugyeolInput(e)}>
                                <Typography sx={{fontSize: "20pt", fontWeight: "900", lineHeight: 0.7,
                                                 color: gugyeolInputOpen? (theme) => theme.palette.primary.main: "inherit"}}>
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
                    onClick={() => props.onRefresh()}>
                    {t("Search")}
                </Button>
            </Grid>

            <Grid item xs={0} sm={1}>
            </Grid>

            <Grid item xs={12} sm={4}>
                <DocSelector
                    doc={props.doc}
                    docSuggestions={props.docSuggestions}
                    handleDocChange={(doc) => props.setDoc(doc)}
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
                            onChange={(event) => props.setExcludeModern(event.target.checked)}
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
                            onChange={(event) => props.setIgnoreSep(event.target.checked)}
                        />
                    </Grid>
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
                            pt: 10,
                        }}
                        open={!props.loaded}>
                        <CircularProgress color="inherit" />
                    </Backdrop>

                    <SearchResultsWrapper
                        results={props.result}
                        numResults={props.numResults}
                        romanize={romanize}
                        handleRomanizeChange={setRomanize}
                        ignoreSep={props.ignoreSep}
                        resultTerm={props.resultTerm}  // for triggering re-render
                        resultPage={props.resultPage}  // for triggering re-render
                        resultDoc={props.resultDoc}  // for triggering re-render
                        histogram={props.histogram}
                        statsLoaded={props.statsLoaded}
                        statsTerm={props.statsTerm}  // for triggering re-render
                        pageN={props.pageN}
                        page={props.page}
                        setPage={props.setPage}
                    />
                </Grid>
            </Grid>

        </Grid>
    );
}

function parseSearchParams(searchParams) {
    return {
        term: searchParams.get("term") ?? "",
        doc: searchParams.get("doc") ?? "",
        page: parseInt(searchParams.get("page") ?? 1),
        excludeModern: searchParams.get("excludeModern") === "yes",
        ignoreSep: searchParams.get("ignoreSep") === "yes",
    };
}

function SearchPageWrapper(props) {
    const [searchParams, setSearchParams] = useSearchParams();

    // Currently displayed search query
    const initialQuery = parseSearchParams(searchParams);
    const [term, setTerm] = React.useState(initialQuery.term);
    const [doc, setDoc] = React.useState(initialQuery.doc);
    const [page, setPage] = React.useState(initialQuery.page);
    const [excludeModern, setExcludeModern] = React.useState(initialQuery.excludeModern);
    const [ignoreSep, setIgnoreSep] = React.useState(initialQuery.ignoreSep);

    // Currently displayed search results
    const [result, setResult] = React.useContext(SearchResultContext);
    const prevResult = React.useRef(result);  // for preventing infinite loops

    // Previously sent search query (may be on the run)
    const [curQuery, setCurQuery] = React.useState({
        term: result.result_term,
        doc: result.result_doc,
        page: result.result_page,
        excludeModern: result.excludeModern,
        ignoreSep: result.ignoreSep,
    });
    const prevQuery = React.useRef(curQuery);

    const pageValid = React.useRef(true);
    const forceRefresh = React.useRef(false);

    function refreshSearchResults(query) {
        let active = true;

        search(
            query,
            async (result, page_N) => {
                if (active) {
                    setResult({
                        ...prevResult.current,
                        loaded: true,
                        result: result,
                        page_N: page_N,
                        result_term: query.term,
                        result_page: query.page,
                        result_doc: query.doc,
                        excludeModern: query.excludeModern,
                        ignoreSep: query.ignoreSep,
                    });

                    // Scroll to top of the page when result changes
                    window.scroll({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            },
            async (error) => {
                // TODO: handle error
                console.error(error);
            }
        );

        let invalidateStats = (
            prevQuery.current.term !== query.term ||
            prevQuery.current.doc !== query.doc ||
            prevQuery.current.excludeModern !== query.excludeModern ||
            prevQuery.current.ignoreSep !== query.ignoreSep
        );

        // Do not update stats when only page changes
        if (invalidateStats) {
            getStats(
                query,
                async (numResults, histogram) => {
                    if (active) {
                        setResult({
                            ...prevResult.current,
                            statsLoaded: true,
                            num_results: numResults,
                            histogram: histogram,
                            stats_term: query.term,
                        });
                    }
                },
                async (error) => {
                    console.error(error);
                    // TODO: handle error
                }
            );
        }

        setResult({
            ...prevResult.current,
            statsLoaded: invalidateStats? false : prevResult.current.statsLoaded,
            loaded: false,
        });

        return () => {
            active = false;
        }
    }

    function commitQuery() {
        // Reset page when search query changes
        if (page !== 1 && !pageValid.current &&
            (term !== curQuery.term ||
            doc !== curQuery.doc ||
            excludeModern !== curQuery.excludeModern ||
            ignoreSep !== curQuery.ignoreSep)) {
            setPage(1);
        }
        else {
            setCurQuery({
                term: term,
                doc: doc,
                page: page,
                excludeModern: excludeModern,
                ignoreSep: ignoreSep,
            });

            const params = parseSearchParams(searchParams);
            if (params.term !== term ||
                params.doc !== doc ||
                params.page !== page ||
                params.excludeModern !== excludeModern ||
                params.ignoreSep !== ignoreSep) {
                let params = {};
                if (term !== "") {
                    params.term = term;
                }
                if (doc !== "") {
                    params.doc = doc;
                }
                if (page !== 1) {
                    params.page = page;
                }
                if (excludeModern) {
                    params.excludeModern = "yes";
                }
                if (ignoreSep) {
                    params.ignoreSep = "yes";
                }
                setSearchParams(params);
            }
        }
        pageValid.current = false;
    }

    React.useEffect(() => {
        if (prevQuery.current.term !== curQuery.term ||
            prevQuery.current.doc !== curQuery.doc ||
            prevQuery.current.page !== curQuery.page ||
            prevQuery.current.excludeModern !== curQuery.excludeModern ||
            prevQuery.current.ignoreSep !== curQuery.ignoreSep) {
            const result = refreshSearchResults(curQuery);
            prevQuery.current = curQuery;
            return result;
        }
    }, [curQuery]);

    React.useEffect(() => {
        prevResult.current = result;
    }, [result]);

    React.useEffect(() => {
        commitQuery();
    }, [page, excludeModern, ignoreSep]);

    React.useEffect(() => {
        if (forceRefresh.current) {
            commitQuery();
            forceRefresh.current = false;
        }
    }, [term, doc]);

    React.useEffect(() => {
        console.log("SearchParams changed to ", searchParams);
        const params = parseSearchParams(searchParams);
        if (params.term !== term ||
            params.doc !== doc ||
            params.page !== page ||
            params.excludeModern !== excludeModern ||
            params.ignoreSep !== ignoreSep) {
            setTerm(params.term);
            setDoc(params.doc);
            setPage(params.page);
            setExcludeModern(params.excludeModern);
            setIgnoreSep(params.ignoreSep);
            pageValid.current = true;
            forceRefresh.current = true;
        }
    }, [searchParams]);

    // Document suggestions
    let [docSuggestions, setDocSuggestions] = React.useState({
        loaded: false,
        result: [],
        num_results: 0,
    });
    const prevDocSuggestions = React.useRef(docSuggestions);

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
        // Retrieve document suggestions when doc changes
        return suggest_doc(doc);
    }, [doc, suggest_doc]);

    React.useEffect(() => {
        prevDocSuggestions.current = docSuggestions;
    }, [docSuggestions]);

    return <SearchPage
        {...props}
        // Search parameters
        term={term} setTerm={setTerm}
        doc={doc} setDoc={setDoc}
        page={page} setPage={setPage}
        excludeModern={excludeModern} setExcludeModern={setExcludeModern}
        ignoreSep={ignoreSep} setIgnoreSep={setIgnoreSep}
        // Current Results
        loaded={result.loaded}
        result={result.result}
        resultTerm={result.result_term}
        resultPage={result.result_page}
        resultDoc={result.result_doc}
        // Current Stats
        statsLoaded={result.statsLoaded}
        statsTerm={result.stats_term}
        pageN={result.page_N}
        numResults={result.num_results}
        histogram={result.histogram}
        // Callbacks
        onRefresh={commitQuery}
        docSuggestions={docSuggestions}
    />;
}

export default SearchPageWrapper;
