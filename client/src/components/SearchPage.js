import React from 'react';
import './index.css';
import {hangul_to_yale, yale_to_hangul} from './YaleToHangul';
import {useSearchParams} from "react-router-dom";
import './i18n';
import {useTranslation} from 'react-i18next';
import {
    Backdrop, Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    Grid, IconButton, Snackbar,
    Typography
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {SearchResultContext} from "./SearchContext";
import {getStats, search} from "./api";
import DocSelector from "./DocSelector";
import SearchResults from "./SearchResults";
import TextFieldWithGugyeol from "./TextFieldWithGugyeol";


function SearchPage(props) {
    const { t } = useTranslation();

    const [romanize, setRomanize] = React.useState(false);
    const [displayHangul, setDisplayHangul] = React.useState(true);
    const [copyNotifOpen, setCopyNotifOpen] = React.useState(false);

    const hangulSearchTerm = yale_to_hangul(props.term);
    const normalizedSearchTerm = hangul_to_yale(props.term);

    return (
        <Grid container spacing={{xs: 0.5, sm: 1}} alignItems="center">
            <Grid item xs={9} sm={6}>
                <TextFieldWithGugyeol
                    value={props.term}
                    setTerm={props.setTerm}
                    label={t("Search term...")}
                    onChange={(event) => props.setTerm(event.target.value)}
                    onKeyDown={(ev) => {
                        if (ev.key === "Enter") {
                            props.onRefresh();
                        }
                    }}
                />
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
                    handleDocChange={(doc) => props.setDoc(doc)}
                    onRefresh={() => props.onRefresh()}
                />
            </Grid>

            {props.term !== ""?
                <Grid item xs={12} sm={12}>
                    <Box style={{display: "inline"}}>{t("Preview")}:&nbsp;</Box>
                    <Button variant="outlined" style={{textTransform: 'none'}}
                            onClick={() => {setDisplayHangul(!displayHangul);}}>
                        <Typography
                            sx={{
                                fontSize: "1.5em",
                                fontWeight: 500,
                                color: 'inherit',
                                textDecoration: 'none',
                                fontFamily: displayHangul ? 'inherit' : 'monospace',
                            }}>
                            {displayHangul ? hangulSearchTerm : normalizedSearchTerm}
                        </Typography>
                    </Button>
                    {displayHangul?
                        <IconButton aria-label="copy" onClick={async () => {
                            await navigator.clipboard.writeText(hangulSearchTerm);
                            setCopyNotifOpen(true);
                        }}>
                            <ContentCopyIcon />
                        </IconButton> : null}
                </Grid> : null}
            <Snackbar
                open={copyNotifOpen}
                autoHideDuration={1000}
                onClose={() => {setCopyNotifOpen(false)}}
                message={`Copied ‘${hangulSearchTerm}’ to clipboard.`}
            />

            <Grid item xs={12} container columnSpacing={1}
                  direction="row" justifyContent="flex-start" alignItems="center">
                <Grid item xs="auto">
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
                <Grid item xs="auto">
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

                    <SearchResults
                        results={props.result}
                        numResults={props.numResults}
                        romanize={romanize}
                        handleRomanizeChange={setRomanize}
                        ignoreSep={props.resultIgnoreSep}
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

function makeSearchParams(query) {
    let params = {};
    if (query.term !== "") {
        params.term = query.term;
    }
    if (query.doc !== "") {
        params.doc = query.doc;
    }
    if (query.page !== 1) {
        params.page = query.page;
    }
    if (query.excludeModern) {
        params.excludeModern = "yes";
    }
    if (query.ignoreSep) {
        params.ignoreSep = "yes";
    }
    return params;
}

function commitQuery(query, pageValid, setPage, curQuery, setCurQuery, searchParams, setSearchParams) {
    // Reset page when search query changes
    if (query.page !== 1 && !pageValid.current && (
        query.term !== curQuery.term ||
        query.doc !== curQuery.doc ||
        query.excludeModern !== curQuery.excludeModern ||
        query.ignoreSep !== curQuery.ignoreSep)) {
        setPage(1);
    }
    else {
        setCurQuery(query);

        const params = parseSearchParams(searchParams);
        if (params.term !== query.term ||
            params.doc !== query.doc ||
            params.page !== query.page ||
            params.excludeModern !== query.excludeModern ||
            params.ignoreSep !== query.ignoreSep) {
            setSearchParams(makeSearchParams(query));
        }
    }
    pageValid.current = false;
}

function SearchPageWrapper(props) {
    const [searchParams, setSearchParams] = useSearchParams();
    const refSearchParams = React.useRef(searchParams);

    // Currently displayed search query
    const initialQuery = parseSearchParams(searchParams);
    const [query, setQuery] = React.useState(initialQuery);
    const refQuery = React.useRef(query);
    React.useEffect(() => { refQuery.current = query; }, [query]);

    // Currently displayed search results
    const [result, setResult] = React.useContext(SearchResultContext);
    const prevResult = React.useRef(result);  // for preventing infinite loops
    React.useEffect(() => { prevResult.current = result; }, [result]);

    // Previously sent search query (may be on the run)
    const [curQuery, setCurQuery] = React.useState({
        term: result.result_term,
        doc: result.result_doc,
        page: result.result_page,
        excludeModern: result.excludeModern,
        ignoreSep: result.ignoreSep,
    });
    const prevQuery = React.useRef(curQuery);

    // Refresh search results when curQuery changes
    React.useEffect(() => {

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

        if (prevQuery.current.term !== curQuery.term ||
            prevQuery.current.doc !== curQuery.doc ||
            prevQuery.current.page !== curQuery.page ||
            prevQuery.current.excludeModern !== curQuery.excludeModern ||
            prevQuery.current.ignoreSep !== curQuery.ignoreSep) {
            const result = refreshSearchResults(curQuery);
            prevQuery.current = curQuery;
            return result;
        }
    }, [curQuery, setResult]);

    // Convenience function to set page
    const setPage = React.useCallback((page) => {
        setQuery((query) => { return {...query, page: page}; });
    }, [setQuery]);

    const pageValid = React.useRef(true);  // true if page is valid, false if page needs to be reset
    const forceRefresh = React.useRef(true);  // true if search results need to be refreshed

    // Update query and results when page, excludeModern, or ignoreSep changes or when forceRefresh is set
    React.useEffect(() => {
        if (forceRefresh.current ||
            query.page !== prevQuery.current.page ||
            query.excludeModern !== prevQuery.current.excludeModern ||
            query.ignoreSep !== prevQuery.current.ignoreSep) {
            commitQuery(query, pageValid, setPage, prevQuery.current, setCurQuery, refSearchParams.current, setSearchParams);
            forceRefresh.current = false;
        }
    }, [query, setPage, setSearchParams]);

    // Update query and results when back button is pressed
    React.useEffect(() => {
        const params = parseSearchParams(searchParams);
        if (params.term !== refQuery.current.term ||
            params.doc !== refQuery.current.doc ||
            params.page !== refQuery.current.page ||
            params.excludeModern !== refQuery.current.excludeModern ||
            params.ignoreSep !== refQuery.current.ignoreSep) {
            setQuery(params);
            pageValid.current = true;
            forceRefresh.current = true;
        }
        refSearchParams.current = searchParams;
    }, [searchParams]);

    function forceRefreshResults() {
        commitQuery(query, pageValid, setPage, curQuery, setCurQuery, searchParams, setSearchParams);
    }

    return <SearchPage
        {...props}
        // Search parameters
        term={query.term}
        setTerm={(value) => setQuery({...query, term: value})}
        doc={query.doc}
        setDoc={(value) => setQuery({...query, doc: value})}
        page={query.page}
        setPage={(value) => setQuery({...query, page: value})}
        excludeModern={query.excludeModern}
        setExcludeModern={(value) => setQuery({...query, excludeModern: value})}
        ignoreSep={query.ignoreSep}
        setIgnoreSep={(value) => setQuery({...query, ignoreSep: value})}
        // Current Results
        loaded={result.loaded}
        result={result.result}
        resultTerm={result.result_term}
        resultPage={result.result_page}
        resultDoc={result.result_doc}
        resultExcludeModern={result.excludeModern}
        resultIgnoreSep={result.ignoreSep}
        // Current Stats
        statsLoaded={result.statsLoaded}
        statsTerm={result.stats_term}
        pageN={result.page_N}
        numResults={result.num_results}
        histogram={result.histogram}
        // Callbacks
        onRefresh={forceRefreshResults}
    />;
}

export default SearchPageWrapper;
