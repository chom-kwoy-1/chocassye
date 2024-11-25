import React from 'react';
import './index.css';
import { useNavigate, useSearchParams } from "react-router-dom";
import { highlight } from './Highlight';
import { Interweave } from 'interweave';
import { useTranslation } from 'react-i18next';
import {
    Grid, Typography, FormControlLabel,
    Checkbox, Box, Pagination, Paper,
    TableContainer, Table, TableBody,
    TableRow, Tooltip, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {IMAGE_BASE_URL} from "./config";
import { StyledTableCell, StyledTableRow } from './utils.js';


const NonAlternatingTableRow = styled(TableRow)(({ theme }) => ({
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const allowList = ['mark', 'abbr', 'span'];


function Sentence(props) {
    const { t } = useTranslation();
    const bookname = props.bookname;
    const sentence = props.sentence;
    const highlight_term = props.highlight_term;
    const ignoreSep = props.ignoreSep;
    const text = sentence.html ?? sentence.text;
    const html = highlight(
        text,
        highlight_term,
        null,
        false,
        ignoreSep,
        null,
    );
    
    return (
        <StyledTableRow>
            <StyledTableCell className={`sourceSentence sentence_type_${sentence.type} sentence_lang_${sentence.lang}`}>
                <Typography
                    component='span'
                    sx={{fontSize: "1.3em"}}>
                    <Interweave className="text" content={html} allowList={allowList} allowAttributes={true} />
                </Typography>
            </StyledTableCell>
            <StyledTableCell align="right">
                <span className="pageNum" style={{color: '#888', userSelect: 'none'}}>
                    ({sentence.hasimages && sentence.page !== '' ?
                        sentence.page.split('-').map((page, i) =>
                            <Tooltip key={i} title={t("Image for page", { page: page })}>
                                <span>
                                    <a className="pageNum"
                                       style={{color: '#888', textDecoration: 'underline'}}
                                       href={`${IMAGE_BASE_URL}${bookname}/${page}.jpg`}
                                       target="blank"
                                       key={i}>{page}</a>
                                    {i < sentence.page.split('-').length - 1? "-" : null}
                                </span>
                            </Tooltip>) : sentence.page
                    })
                </span>
            </StyledTableCell>
        </StyledTableRow>
    );
}


function SourcePage(props) {
    const { t } = useTranslation();
    
    function handleExcludeChineseChange(event) {
        let excludeChinese = event.target.checked;
        if (excludeChinese) {
            props.setSearchParams(searchParams => {
                searchParams.set("n", 0);
                return searchParams;
            })
        }
        props.setExcludeChinese(excludeChinese);
    }

    function handleViewCountChange(event) {
        let viewCount = event.target.value;
        props.setViewCount(viewCount);
    }

    if (props.result.data === null) {
        return <Grid container spacing={{xs: 0.5, sm: 1}} alignItems="center" direction="row">
            <Grid item xs={12}>
                <Box>
                    <Typography
                        variant='h5'
                        component='span'
                        sx={{
                            fontWeight: 500
                        }}>{props.bookName}</Typography>
                </Box>
            </Grid>
        </Grid>
    }

    let hl = props.highlightWord ?? "NULL";

    const PAGE = props.viewCount;
    let pageCount = Math.ceil(props.result.data.count / PAGE);

    let n = props.numberInSource;
    let page = Math.floor(n / PAGE);

    return (
        <Grid container spacing={{xs: 0.5, sm: 1}} alignItems="center" direction="row">
            <Grid item xs={12}>
                <Box>
                    <Typography
                        variant='h5'
                        component='span'
                        sx={{
                            fontWeight: 500
                        }}>{props.bookName}</Typography>
                    &ensp;
                    <span>{props.result.data.year_string}</span>
                </Box>
            </Grid>

            {/* Bibliography and attributions */}
            <Grid item xs={10} sm={8} lg={6} mx="auto">
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableBody>
                            {props.result.data.bibliography === "" ? null :
                            <StyledTableRow>
                                <StyledTableCell>
                                    <Typography color={"textSecondary"}>
                                        {t("Source")}
                                    </Typography>
                                </StyledTableCell>
                                <StyledTableCell>
                                        {props.result.data.bibliography}
                                </StyledTableCell>
                            </StyledTableRow>}
                            {props.result.data.attributions.length === 0 ? null :
                            <StyledTableRow>
                                <StyledTableCell>
                                    <Typography color={"textSecondary"}>
                                        {t("Attributions")}
                                    </Typography>
                                </StyledTableCell>
                                <StyledTableCell>
                                    <TableContainer component={Paper} elevation={0}>
                                        <Table size="small">
                                            <TableBody>
                                                {props.result.data.attributions.map((attribution, i) => (
                                                    <NonAlternatingTableRow key={i}>
                                                        <StyledTableCell>
                                                            <Typography color={"textSecondary"}>
                                                                {attribution.role}
                                                            </Typography>
                                                        </StyledTableCell>
                                                        <StyledTableCell>
                                                            {attribution.name}
                                                        </StyledTableCell>
                                                    </NonAlternatingTableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </StyledTableCell>
                            </StyledTableRow>}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>

            <Grid item container xs={12} alignItems="center">
                <Grid item xs={8} md={10}>
                    <FormControlLabel
                        control={<Checkbox size="small" sx={{py: 0}} />}
                        label={
                            <Typography sx={{fontSize: "1em"}}>
                                {t("Exclude Chinese")}
                            </Typography>
                        }
                        checked={props.excludeChinese}
                        onChange={(event) => handleExcludeChineseChange(event)}
                    />
                </Grid>
                <Grid item xs={4} md={2}>
                    <FormControl variant="standard" fullWidth>
                        <InputLabel id="view-count-select-label">{t("Results per page")}</InputLabel>
                        <Select
                            labelId="view-count-select-label"
                            id="view-count-select"
                            label={t("Results per page")}
                            value={props.viewCount}
                            onChange={(event) => handleViewCountChange(event)}
                            >
                            <MenuItem value={20}>20</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                            <MenuItem value={100}>100</MenuItem>
                            <MenuItem value={200}>200</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Pager */}
            <Grid item xs={12}>
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center">
                    <Pagination
                        color="primary"
                        count={pageCount}
                        siblingCount={2}
                        boundaryCount={2}
                        page={page + 1}
                        shape="rounded"
                        onChange={(_, newPage) => {
                            newPage = newPage - 1;
                            let newN = props.numberInSource;
                            if (newPage !== page) {
                                newN = newPage * PAGE;
                            }
                            props.setSearchParams(searchParams => {
                                searchParams.set("n", newN);
                                return searchParams;
                            });
                        }}
                    />
                </Box>
            </Grid>

            <Grid item xs={12}>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableBody>
                            {props.result.data.sentences.map(
                                (sentence, i) => <Sentence
                                    key={i}
                                    bookname={props.bookName}
                                    sentence={sentence}
                                    highlight_term={hl}
                                    ignoreSep={props.ignoreSep}
                                />
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>

            {/* Pager */}
            <Grid item xs={12} my={1}>
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center">
                    <Pagination
                        color="primary"
                        count={pageCount}
                        siblingCount={2}
                        boundaryCount={2}
                        page={page + 1}
                        shape="rounded"
                        onChange={(_, newPage) => {
                            newPage = newPage - 1;
                            let newN = props.numberInSource;
                            if (newPage !== page) {
                                newN = newPage * PAGE;
                            }
                            props.setSearchParams(searchParams => {
                                searchParams.set("n", newN);
                                return searchParams;
                            });
                        }}
                    />
                </Box>
            </Grid>
        </Grid>
    );
}


function load_source(bookName, numberInSource, excludeChinese, viewCount, resultFunc) {
    fetch("/api/source?" + new URLSearchParams({
        name: bookName,
        number_in_source: numberInSource,
        exclude_chinese: excludeChinese,
        view_count: viewCount,
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
    let [searchParams, setSearchParams] = useSearchParams();
    let bookName = searchParams.get("name");
    let numberInSource = searchParams.get("n") ?? 0;
    let highlightWord = searchParams.get("hl");
    let ignoreSep = (searchParams.get("is") ?? 'no') === 'yes';
    let [excludeChinese, setExcludeChinese] = React.useState(false);
    let [viewCount, setViewCount] = React.useState(20);
    let [result, setResult] = React.useState({
        data: null,
        loaded: false
    });

    const prevResult = React.useRef(result);

    const refresh = React.useCallback(
        (bookName, numberInSource, excludeChinese, viewCount) => {
            let active = true;
            setResult({
                ...prevResult.current,
                loaded: false
            });

            load_source(
                bookName, numberInSource, excludeChinese, viewCount,
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
        return refresh(bookName, numberInSource, excludeChinese, viewCount);
    }, [bookName, numberInSource, excludeChinese, viewCount, refresh]);

    return <SourcePage
        {...props}
        navigate={useNavigate()}
        bookName={bookName}
        numberInSource={numberInSource}
        result={result}
        setSearchParams={setSearchParams}
        highlightWord={highlightWord}
        ignoreSep={ignoreSep}
        excludeChinese={excludeChinese}
        setExcludeChinese={setExcludeChinese}
        viewCount={viewCount}
        setViewCount={setViewCount}
    />;
}


export default SoucePageWrapper;
