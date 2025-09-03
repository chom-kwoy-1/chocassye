import {
  Backdrop,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import { ThemeProvider } from "@mui/material/styles";
import { Interweave } from "interweave";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Trans } from "react-i18next";

import { ImageTooltip } from "@/app/search/ImageTooltip";
import { Book, SentenceWithContext } from "@/app/search/search";
import { lightTheme } from "@/app/themes";
import { findMatchingRanges, highlight, toText } from "@/components/Highlight";
import Histogram from "@/components/Histogram";
import HowToPage from "@/components/HowToPage";
import { useTranslation } from "@/components/TranslationProvider";
import { yale_to_hangul } from "@/components/YaleToHangul.mjs";
import {
  StyledTableCell,
  StyledTableRow,
  highlightColors,
} from "@/components/client_utils";
import { IMAGE_BASE_URL } from "@/components/config";
import useDimensions from "@/utils/useDimensions";
import { zip } from "@/utils/zip";

function SearchResultsList(props: {
  filteredResults: {
    sentences: SentenceWithContext[];
    matchIdsInBook: number[][];
    name: string;
    year: number;
    year_start: number;
    year_end: number;
    year_string: string;
    year_sort: number;
    count: number;
  }[];
  romanize: boolean;
  ignoreSep: boolean;
  resultTerm: string;
}) {
  const { t } = useTranslation();

  const footnotes: string[] = []; // TODO: fix footnotes

  return (
    <React.Fragment>
      <Grid size={12}>
        <TableContainer component={Paper} elevation={3}>
          <Table size="small">
            <TableBody>
              {/* For each book */}
              {props.filteredResults.map((book, i) => (
                <StyledTableRow key={i}>
                  {/* Year column */}
                  <StyledTableCell
                    component="th"
                    scope="row"
                    sx={{ verticalAlign: "top" }}
                  >
                    <Grid sx={{ py: 0.4 }}>
                      <Tooltip title={book.year_string}>
                        <Box>
                          {book.year === null
                            ? t("Unknown year")
                            : book.year_end - book.year_start > 0
                              ? "c.\u00a0" + book.year
                              : book.year}
                        </Box>
                      </Tooltip>
                    </Grid>
                  </StyledTableCell>

                  {/* Sentences column */}
                  <StyledTableCell>
                    {/* For each sentence */}
                    {zip(book.sentences, book.matchIdsInBook).map(
                      ([sentence, match_ids_in_sentence], i) => (
                        <Grid key={i} sx={{ py: 0.4 }}>
                          <SentenceWithCtx
                            sentenceWithCtx={sentence}
                            book={book}
                            matchIdsInSentence={match_ids_in_sentence}
                            highlightTerm={props.resultTerm}
                            ignoreSep={props.ignoreSep}
                            romanize={props.romanize}
                          />
                        </Grid>
                      ),
                    )}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      <Grid
        size={12}
        container
        alignItems="flex-start"
        spacing={1.5}
        className="searchResultsList"
      >
        {footnotes.length > 0 ? <div className="dividerFootnote"></div> : null}

        {/* Show footnotes */}
        {footnotes.map((footnote, i) => (
          <div key={i} className="footnoteContent">
            <a
              className="footnoteLink"
              id={`note${i + 1}`}
              href={`#notefrom${i + 1}`}
              data-footnotenum={`${i + 1}`}
            ></a>
            &nbsp;
            {footnote}
          </div>
        ))}
      </Grid>
    </React.Fragment>
  );
}

function SentenceWithCtx(props: {
  sentenceWithCtx: SentenceWithContext;
  book: Book;
  matchIdsInSentence: number[];
  highlightTerm: string;
  ignoreSep: boolean;
  romanize: boolean;
}) {
  return (
    <SentenceAndPage
      sentenceWithCtx={props.sentenceWithCtx}
      book={props.book}
      matchIdsInSentence={props.matchIdsInSentence}
      highlightTerm={props.highlightTerm}
      ignoreSep={props.ignoreSep}
      romanize={props.romanize}
    />
  );
}

const BLUR_DATA_URL = // Blurred image of a page
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAARCAYAAADkIz3lAAAA" +
  "CXBIWXMAAA7EAAAOxAGVKw4bAAABsklEQVQokY3SvW4TQRTF8f/cmdmdXa+TeIkdK1YIUh" +
  "6AgtemTUUBJUiIAgqQQEIoEEBK4u/12jsfFMsD5NY/nXOKq1JKiUecAdgsvqNEEFEoUYjS" +
  "zH99ARIhBHzoeria32KsRWmN1pr95oHVn88oY1HG0nVtD19fvyQvC3TmiMGT/AFXHVEUJa" +
  "IFkdjDD5++cnE+wrqCgGHdHKhHnhfPp/z4+Ztmu+yhtRnL5YZKMqLkrNYNSmlevXmL0cJ4" +
  "5HpY5pqz2hFtxvbQMRyUzKYTijwjJc++3SAA5XHNpo0E31EPM+qTiu12i0ikaRrmi//Vzy" +
  "YF94sOHwJ1lfN3vmO12fFtcU/XeSonfeLBR6rhCbOLS7LMcXN7x/jIMR2VpK5Fi/SJ0XfY" +
  "wQBEo1WHyx1aoCwLTsdPiOge6szh/QFHTm41xwPFw2KB6JrZ+RlN6/tqrwzJt6yXc7wS7p" +
  "YN8/WO8emIoiyxmelhKJ5iRleEENHGcnkxZTisGAxKrLWICCqllN6/u2bfttzffEQkIWKQ" +
  "5FEIAUPu8n7jeDzhsFsS7iKiLXleYrRASqQY8b7rEx/zj/8AKXG2WTJjYXMAAAAASUVORK" +
  "5CYII=";

function PageImagePreview(props: { page: string; imageURL: string }) {
  const { t } = useTranslation();

  const ref = React.useRef<HTMLDivElement | null>(null);
  const { width } = useDimensions(ref);

  return (
    <Stack ref={ref} direction="column" spacing={0}>
      <Image
        src={props.imageURL}
        alt={t("Image for page", { page: props.page })}
        style={{ objectFit: "contain" }}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        width={width}
        height={width * 1.4}
      />
      <span>{t("Image for page", { page: props.page })}</span>
    </Stack>
  );
}

function SentenceAndPage(props: {
  sentenceWithCtx: SentenceWithContext;
  book: Book;
  matchIdsInSentence: number[];
  highlightTerm: string;
  ignoreSep: boolean;
  romanize: boolean;
}) {
  const theme = useTheme();
  const sourceTextColor =
    theme.palette.mode === "light" ? grey["600"] : grey["400"];

  const sentence = props.sentenceWithCtx.mainSentence;

  let imagePreviewLink;
  if (sentence.hasimages && sentence.page !== "") {
    imagePreviewLink = sentence.page.split("-").map((page, i) => {
      const imageURL = `${IMAGE_BASE_URL}/${props.book.name}/${page}.jpg`;
      return (
        <ImageTooltip
          title={<PageImagePreview page={page} imageURL={imageURL} />}
          placement="right"
          key={i}
        >
          <span>
            <a
              className="pageNum"
              style={{
                color: sourceTextColor,
                textDecoration: `underline solid ${sourceTextColor}`,
              }}
              href={imageURL}
              target="blank"
              key={i}
            >
              {page}
            </a>
            {i < sentence.page.split("-").length - 1 ? "-" : null}
          </span>
        </ImageTooltip>
      );
    });
  } else {
    imagePreviewLink = sentence.page !== "" ? sentence.page : null;
  }

  return (
    <React.Fragment>
      {/* Highlighted sentence */}
      <Interweave
        content={highlight(
          sentence.html ?? sentence.text,
          props.highlightTerm,
          props.matchIdsInSentence,
          props.romanize,
          props.ignoreSep,
        )}
        allowList={["mark", "span", "a"]}
        allowAttributes={true}
      />
      <wbr />
      {/* Add source link */}
      <span style={{ color: sourceTextColor }}>
        &lang;
        <Link
          className="sourceLink"
          rel="noopener noreferrer"
          target="_blank" // Open in new tab
          href={
            "/source?" +
            new URLSearchParams({
              name: props.book.name,
              n: `${sentence.number_in_book}`,
              hl: props.highlightTerm,
              is: props.ignoreSep ? "yes" : "no",
            }).toString()
          }
          style={{ textDecoration: `underline dotted ${sourceTextColor}` }}
        >
          {sentence.page === null ? props.book.name : `${props.book.name}:`}
        </Link>
        {imagePreviewLink}
        &rang;
      </span>
    </React.Fragment>
  );
}

function getResultMatches(
  results: Book[],
  searchTerm: string,
  ignoreSep: boolean,
): string[][][] {
  const matches: string[][][] = [];

  for (const book of results) {
    const book_parts: string[][] = [];
    for (const sentenceWithCtx of book.sentences) {
      const sentence = sentenceWithCtx.mainSentence;
      const text = sentence.html ?? sentence.text;

      const [rawText, rawTextMapping] = toText(text, false);

      const match_ranges = findMatchingRanges(
        text,
        rawText,
        rawTextMapping,
        searchTerm,
        ignoreSep,
      );

      const parts: string[] = [];
      for (const range of match_ranges) {
        parts.push(yale_to_hangul(rawText.slice(range[0], range[1])) as string);
      }

      book_parts.push(parts);
    }
    matches.push(book_parts);
  }

  // List of unique matches in current page
  return matches;
}

type SearchResultsProps = {
  results: Book[];
  numResults: number;
  romanize: boolean;
  handleRomanizeChange: (value: boolean) => void;
  ignoreSep: boolean;
  resultTerm: string;
  resultPage: number;
  resultDoc: string;
  histogram: { period: number; num_hits: number }[];
  statsLoaded: boolean;
  statsTerm: string;
  pageN: number;
  page: number;
  setPage: (page: number) => void;
};

function SearchResultsWrapper(props: SearchResultsProps) {
  const { t } = useTranslation();

  const [disabledMatches, setDisabledMatches] = React.useState(new Set());

  function toggleMatch(i: number) {
    const newDisabledMatches = new Set(disabledMatches);
    if (newDisabledMatches.has(i)) {
      newDisabledMatches.delete(i);
    } else {
      newDisabledMatches.add(i);
    }
    setDisabledMatches(newDisabledMatches);
  }

  React.useEffect(() => {
    setDisabledMatches(new Set());
  }, [props.resultTerm, props.page]);

  const numPages = Math.ceil(props.numResults / props.pageN);

  const matches = getResultMatches(
    props.results,
    props.resultTerm,
    props.ignoreSep,
  );
  const uniqueMatches = [...new Set(matches.flat(2))];

  // Array(book)[Array(sentence)[Array(matches)[int]]]
  const matchIndices = matches.map((matchesInBook) =>
    matchesInBook.map((matchesInSentence) =>
      matchesInSentence.map((match) => uniqueMatches.indexOf(match)),
    ),
  );

  const filteredResultsList = zip(props.results, matchIndices)
    // filter out entire book if all matches in it are disabled
    .filter(
      ([_, matchIdsInBook]) =>
        !matchIdsInBook.flat().every((id) => disabledMatches.has(id)) ||
        matchIdsInBook.flat().length === 0,
    )
    // filter out sentence if all matches in it are disabled
    .map(([book, matchIdsInBook]) => {
      const sentencesAndIndices = zip(book.sentences, matchIdsInBook).filter(
        ([_, matchIdsInSentence]) =>
          !matchIdsInSentence.every((id) => disabledMatches.has(id)) ||
          matchIdsInSentence.flat().length === 0,
      );

      return {
        ...book,
        sentences: sentencesAndIndices.map(([sentence, _]) => sentence),
        matchIdsInBook: sentencesAndIndices.map(([_, index]) => index),
      };
    });

  const theme = useTheme();
  const hlColors = highlightColors.map(
    (color) => color[theme.palette.mode === "light" ? "A100" : "300"],
  );

  return (
    <React.Fragment>
      <Grid size={12} container sx={{ position: "relative" }}>
        <Grid size={12}>
          <Backdrop
            sx={{
              color: "#fff",
              zIndex: (theme) => theme.zIndex.drawer + 1,
              position: "absolute",
            }}
            open={!props.statsLoaded}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        </Grid>
        <Grid size={12}>
          <Histogram
            data={props.histogram}
            setPage={props.setPage}
            pageN={props.pageN}
          />
        </Grid>
      </Grid>

      {/* Show highlight match legend */}
      <Grid size="grow" mt={1} mb={2} container columnSpacing={1} spacing={1}>
        {uniqueMatches.map((part, i) => {
          const isEnabled = !disabledMatches.has(i);
          const color = isEnabled ? hlColors[i % hlColors.length] : "lightgrey";
          return (
            <Grid key={i} size="auto">
              <ThemeProvider theme={lightTheme}>
                <Chip
                  label={part}
                  sx={{ backgroundColor: color }}
                  size="small"
                  onDelete={() => {
                    toggleMatch(i);
                  }}
                  variant={isEnabled ? "filled" : "outlined"}
                  clickable
                ></Chip>
              </ThemeProvider>
            </Grid>
          );
        })}
      </Grid>

      <Grid size="auto" sx={{ display: { xs: "none", sm: "flex" } }}>
        <FormControlLabel
          control={<Checkbox size="small" sx={{ py: 0 }} />}
          label={
            <Typography sx={{ fontSize: "1em" }}>
              {t("Romanization")}
            </Typography>
          }
          checked={props.romanize}
          onChange={() => props.handleRomanizeChange(!props.romanize)}
        />
      </Grid>

      {/* Pager on top */}
      <Grid size={12}>
        <Box display="flex" justifyContent="center" alignItems="center">
          {filteredResultsList.length > 0 ? (
            <Pagination
              color="primary"
              count={numPages}
              siblingCount={2}
              boundaryCount={2}
              page={props.page}
              shape="rounded"
              onChange={(_, page) => props.setPage(page)}
            />
          ) : null}
        </Box>
      </Grid>

      {/* Results area */}
      <Grid size={12}>
        {filteredResultsList.length > 0 ? null : (
          <div>
            <Trans i18nKey="No match. Please follow the instructions below for better results." />
            <HowToPage title="" />
          </div>
        )}
      </Grid>

      <SearchResultsList
        filteredResults={filteredResultsList}
        romanize={props.romanize}
        ignoreSep={props.ignoreSep}
        resultTerm={props.resultTerm}
      />

      {/* Pager on bottom */}
      <Grid size={12} marginTop={1}>
        <Box display="flex" justifyContent="center" alignItems="center">
          {filteredResultsList.length > 0 ? (
            <Pagination
              color="primary"
              count={numPages}
              siblingCount={2}
              boundaryCount={2}
              page={props.page}
              shape="rounded"
              onChange={(_, page) => props.setPage(page)}
            />
          ) : null}
        </Box>
      </Grid>
    </React.Fragment>
  );
}

export default React.memo(SearchResultsWrapper);
