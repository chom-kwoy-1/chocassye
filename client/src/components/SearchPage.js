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
    Autocomplete,
    Backdrop,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    FormControlLabel,
    Grid,
    Pagination,
    Paper,
    Popper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    IconButton,
    Stack,
} from '@mui/material';
import {styled} from '@mui/material/styles';
import {tableCellClasses} from '@mui/material/TableCell';
import {
    amber,
    blue,
    cyan,
    deepOrange,
    deepPurple,
    green,
    indigo,
    lightBlue,
    lightGreen,
    lime,
    orange,
    pink,
    purple,
    red,
    teal,
    yellow,
} from '@mui/material/colors';
import {IMAGE_BASE_URL} from "./config";
import {tooltipClasses} from '@mui/material/Tooltip';

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
                                    {book.year ?? "-"}
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

function highlight(text, searchTerm, match_ids, footnotes, romanize) {
    
    // Into HTML for display
    let [displayHTML, displayHTMLMapping] = toDisplayHTML(text, footnotes, romanize);
    
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
            let hlRegex = searchTerm2Regex(props.resultTerm);
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

        <Histogram
            data={props.histogram}
            setPage={props.setPage}
            pageN={props.pageN}
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
                        {<span
                            className={disabledMatches.has(i)? "matchLegendItem disabled" : "matchLegendItem"}
                            onClick={(event) => {toggleMatch(event, i)}}>
                            <span className={"".concat("colorShower s", i)}></span>
                            <span className="matchLegendWord">{part}</span>
                        </span>}
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

    function setSearchParams(args) {
        props.setSearchParams({
            term: props.term,
            doc: props.doc,
            page: props.page,
            excludeModern: props.excludeModern,
            ignoreSep: props.ignoreSep,
            ...args
        });
    }

    function handleChange(event) {
        let searchTerm = event.target.value;
        setSearchParams({term: searchTerm});
    }

    function  handleDocChange(doc) {
        setSearchParams({doc: doc});
    }

    function handleExcludeModernChange(event) {
        let excludeModern = event.target.checked;
        setSearchParams({excludeModern: excludeModern? "yes" : "no"});
    }

    function handleIgnoreSepChange(event) {
        let ignoreSep = event.target.checked;
        setSearchParams({ignoreSep: ignoreSep? "yes" : "no"});
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
        setSearchParams({page: page});
    }

    function toggleGugyeolInput(e) {
        setAnchorEl(document.getElementById('searchTermField'));
        setGugyeolInputOpen(!gugyeolInputOpen);
        setIsFocused(!gugyeolInputOpen);
    }

    function replaceGugyeol(suggestion) {
        let term = props.term;
        term = term.slice(0, term.length - suggestion.replaceLength) + suggestion.gugyeol;
        props.setSearchParams({
            term: term,
            doc: props.doc,
            page: props.page,
            excludeModern: props.excludeModern,
            ignoreSep: props.ignoreSep,
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
                            checked={props.excludeModern === "yes"}
                            onChange={(event) => handleExcludeModernChange(event)}
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
                        t('current page', { startYear: props.result[0].year, endYear: props.result[props.result.length - 1].year})
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
                        resultTerm={props.resultTerm}
                        histogram={props.histogram}
                        pageN={props.pageN}
                        page={props.page}
                        setPage={setPage}
                        t={props.t}
                    />
                </Grid>
            </Grid>

        </Grid>
    );
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
            if (isInited.current && prevPage.current === page && page !== 1) {
                setSearchParams({
                    page: "1",
                    term: prevTerm.current,
                    doc: prevDoc.current,
                    excludeModern: prevExcludeModern.current,
                    ignoreSep: prevIgnoreSep.current,
                });
            } else {
                let active = true;

                setResult({
                    ...prevResult.current,
                    loaded: false
                });

                search(
                    term, doc, page, excludeModern, ignoreSep,
                    async (result, num_results, histogram, page_N) => {
                        if (active) {
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
        if (prevTerm.current !== term) {
            if (ENABLE_SEARCH_AS_YOU_TYPE) {
                const result = refresh(
                    term,
                    prevDoc.current,
                    prevPage.current,
                    prevExcludeModern.current,
                    prevIgnoreSep.current
                );
                isInited.current = true;
                prevTerm.current = term;
                return result;
            }
            else {
                prevTerm.current = term;
            }
        }
    }, [term, refresh]);

    React.useEffect(() => {
        if (prevPage.current !== page || !isInited.current) {
            console.log("Page changed: ", prevPage.current, " -> ", page);
            const result = refresh(
                prevTerm.current,
                prevDoc.current,
                page,
                prevExcludeModern.current,
                prevIgnoreSep.current
            );
            isInited.current = true;
            prevPage.current = page;
            return result;
        }
    }, [page, refresh]);

    React.useEffect(() => {
        if (prevDoc.current !== doc) {
            console.log("Doc changed: ", prevDoc.current, " -> ", doc);
            if (ENABLE_SEARCH_AS_YOU_TYPE) {
                const result = refresh(
                    prevTerm.current,
                    doc,
                    prevPage.current,
                    prevExcludeModern.current,
                    prevIgnoreSep.current
                );
                isInited.current = true;
                prevDoc.current = doc;
                return result;
            } else {
                prevDoc.current = doc;
            }
        }
    }, [doc, refresh]);

    React.useEffect(() => {
        if (prevExcludeModern.current !== excludeModern) {
            console.log("Exclude modern changed: ", prevExcludeModern.current, " -> ", excludeModern);
            const result = refresh(
                prevTerm.current,
                prevDoc.current,
                prevPage.current,
                excludeModern,
                prevIgnoreSep.current
            );
            isInited.current = true;
            prevExcludeModern.current = excludeModern;
            return result;
        }
    }, [excludeModern, refresh]);

    React.useEffect(() => {
        if (prevIgnoreSep.current !== ignoreSep) {
            console.log("Ignore separator changed: ", prevIgnoreSep.current, " -> ", ignoreSep);
            const result = refresh(
                prevTerm.current,
                prevDoc.current,
                prevPage.current,
                prevExcludeModern.current,
                ignoreSep
            );
            isInited.current = true;
            prevIgnoreSep.current = ignoreSep;
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
        return refresh(term, doc, page, excludeModern, ignoreSep);
    }

    const startTime = performance.now();
    const dom = <SearchPage {...props}
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
    />;
    const endTime = performance.now();
    console.log("SearchPage render time:", endTime - startTime);

    return dom;
}

export default SearchPageWrapper;
