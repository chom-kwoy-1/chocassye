import React from 'react';
import './index.css';
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
    searchTerm2Regex, 
    toDisplayHTML,
    getMatchingRanges,
    toText,
    toTextIgnoreTone,
    removeOverlappingRanges,
    addHighlights,
} from './Highlight';
import { Interweave } from 'interweave';
import { useTranslation } from 'react-i18next';
import {
    Grid, Typography, FormControlLabel,
    Checkbox, Box, Pagination, Paper,
    TableContainer, Table, TableBody,
    TableRow, TableCell,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import {IMAGE_BASE_URL} from "./config";


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
const NonAlternatingTableRow = styled(TableRow)(({ theme }) => ({
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const allowList = ['mark', 'abbr', 'span'];


function showSentence(bookname, sentence, highlight_term, i) {
    let text = sentence.html ?? sentence.text;
    
    // Into HTML for display
    let [displayHTML, displayHTMLMapping] = toDisplayHTML(text);
    
    // Find matches
    let hlRegex = searchTerm2Regex(highlight_term);
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
    let html = addHighlights(displayHTML, match_ranges);
    
    return (
        <StyledTableRow key={i}>
            <StyledTableCell className={`sourceSentence sentence_type_${sentence.type} sentence_lang_${sentence.lang}`}>
                <Typography
                    component='span'
                    sx={{fontSize: "1.3em"}}>
                    <Interweave className="text" content={html} allowList={allowList} allowAttributes={true} />
                </Typography>
            </StyledTableCell>
            <StyledTableCell align="right">
                {sentence.hasImages && sentence.page !== '' ?
                    <a className="pageNum"
                       style={{color: '#888', userSelect: 'none', textDecoration: 'underline'}}
                       href={IMAGE_BASE_URL + bookname + '/' + sentence.page + '.jpg'}
                       target="blank"
                    >(️{sentence.page})</a>:
                    <span className="pageNum" style={{color: '#888', userSelect: 'none'}}>({sentence.page})</span>
                }
            </StyledTableCell>
        </StyledTableRow>
    );
}


class SourcePage extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.props.initialize();
    }
    
    handleExcludeChineseChange(event) {
        let excludeChinese = event.target.checked;
        this.props.setExcludeChinese(excludeChinese);
    }
    
    render() {
        if (this.props.result.data === null) {
            return <Grid container spacing={{xs: 0.5, sm: 1}} alignItems="center" direction="row">
                <Grid item xs={12}>
                    <Box>
                        <Typography
                            variant='h5'
                            component='span'
                            sx={{
                                fontWeight: 500
                            }}>{this.props.bookName}</Typography>
                    </Box>
                </Grid>
            </Grid>
        }

        let hl = this.props.highlightWord ?? "NULL";

        const PAGE = 20;
        let pageCount = Math.ceil(this.props.result.data.count / PAGE);

        let n = this.props.numberInSource;
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
                            }}>{this.props.bookName}</Typography>
                        &ensp;
                        <span>{this.props.result.data.year_string}</span>
                    </Box>
                </Grid>

                {/* Bibliography and attributions */}
                <Grid item xs={10} sm={8} lg={6} mx="auto">
                    <TableContainer component={Paper} elevation={1}>
                        <Table size="small">
                            <TableBody>
                                {this.props.result.data.bibliography === "" ? null :
                                <StyledTableRow>
                                    <StyledTableCell>
                                        <Typography color={"textSecondary"}>
                                            {this.props.t("Source")}
                                        </Typography>
                                    </StyledTableCell>
                                    <StyledTableCell>
                                            {this.props.result.data.bibliography}
                                    </StyledTableCell>
                                </StyledTableRow>}
                                {this.props.result.data.attributions.length === 0 ? null :
                                <StyledTableRow>
                                    <StyledTableCell>
                                        <Typography color={"textSecondary"}>
                                            {this.props.t("Attributions")}
                                        </Typography>
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <TableContainer component={Paper} elevation={0}>
                                            <Table size="small">
                                                <TableBody>
                                                    {this.props.result.data.attributions.map((attribution, i) => (
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
                
                <Grid item xs={12}>
                    <FormControlLabel
                        control={<Checkbox size="small" sx={{py: 0}} />} 
                        label={
                            <Typography sx={{fontSize: "1em"}}>
                                {this.props.t("Exclude Chinese")}
                            </Typography>
                        }
                        checked={this.props.excludeChinese}
                        onChange={(event) => this.handleExcludeChineseChange(event)}
                    />
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
                            onChange={(_, newPage) => {
                                newPage = newPage - 1;
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
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableBody>
                                {this.props.result.data.sentences.map(
                                    (sentence, i) => showSentence(this.props.bookName, sentence, hl, i)
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
                            onChange={(_, newPage) => {
                                newPage = newPage - 1;
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
                    </Box>
                </Grid>
            </Grid>
        );
    }
}


function load_source(bookName, numberInSource, excludeChinese, resultFunc) {
    fetch("/api/source?" + new URLSearchParams({
        name: bookName,
        number_in_source: numberInSource,
        exclude_chinese: excludeChinese
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
    let [excludeChinese, setExcludeChinese] = React.useState(false);
    let [result, setResult] = React.useState({
        data: null,
        loaded: false
    });

    const prevResult = React.useRef(result);
    const prevBookName = React.useRef(bookName);
    const prevNumberInSource = React.useRef(numberInSource);
    const prevExcludeChinese = React.useRef(excludeChinese);

    const refresh = React.useCallback(
        (bookName, numberInSource, excludeChinese) => {
            let active = true;
            setResult({
                ...prevResult.current,
                loaded: false
            });

            load_source(
                bookName, numberInSource, excludeChinese,
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
        return refresh(bookName, numberInSource, excludeChinese);
    }, [bookName, numberInSource, excludeChinese, refresh]);

    function initialize() {
        refresh(
            prevBookName.current, 
            prevNumberInSource.current, 
            prevExcludeChinese.current
        );
    }

    return <SourcePage {...props}
        navigate={useNavigate()}
        bookName={bookName}
        numberInSource={numberInSource}
        result={result}
        setSearchParams={setSearchParams}
        initialize={initialize}
        highlightWord={highlightWord}
        excludeChinese={excludeChinese}
        setExcludeChinese={setExcludeChinese}
        t={t}
    />;
}


export default SoucePageWrapper;
