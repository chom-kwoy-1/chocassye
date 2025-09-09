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
  Table,
  TableBody,
  TableContainer,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import React, { Suspense, useState } from "react";
import { Trans } from "react-i18next";

import { SentenceWithCtx } from "@/app/search/SentenceWithCtx";
import { Book, SentenceWithContext, StatsResult } from "@/app/search/search";
import { lightTheme } from "@/app/themes";
import { findMatchingRanges, toText } from "@/components/Highlight";
import Histogram from "@/components/Histogram";
import HowToPage from "@/components/HowToPage";
import { useTranslation } from "@/components/TranslationProvider";
import { yale_to_hangul } from "@/components/YaleToHangul.mjs";
import {
  StyledTableCell,
  StyledTableRow,
  highlightColors,
} from "@/components/client_utils";
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

  return (
    <React.Fragment>
      <Grid size={12}>
        <TableContainer
          component={Paper}
          elevation={3}
          style={{ overflow: "visible" }}
        >
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
                        <Box key={i}>
                          <SentenceWithCtx
                            sentenceWithCtx={sentence}
                            book={book}
                            matchIdsInSentence={match_ids_in_sentence}
                            highlightTerm={props.resultTerm}
                            ignoreSep={props.ignoreSep}
                            romanize={props.romanize}
                          />
                        </Box>
                      ),
                    )}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
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

function HistogramWrapper({
  statsPromise,
  setPage,
  pageN,
}: {
  statsPromise: Promise<StatsResult> | null;
  setPage: (page: number) => void;
  pageN: number;
}) {
  const [cachedStats, setCachedStats] = useState<StatsResult | null>(null);
  let stats = cachedStats;
  if (statsPromise) {
    stats = React.use(statsPromise);
    if (stats !== cachedStats) {
      setCachedStats(stats);
    }
  }
  if (stats === null || stats.status === "error") {
    return <div>Error loading histogram. Please try refreshing the page.</div>;
  }
  return <Histogram data={stats.histogram} setPage={setPage} pageN={pageN} />;
}

function PagerWrapper({
  statsPromise,
  setPage,
  results,
  page,
  pageN,
}: {
  statsPromise: Promise<StatsResult> | null;
  setPage: (page: number) => void;
  results: Book[];
  page: number;
  pageN: number;
}) {
  const [cachedStats, setCachedStats] = useState<StatsResult | null>(null);
  let stats = cachedStats;
  if (statsPromise) {
    stats = React.use(statsPromise);
    if (stats !== cachedStats) {
      setCachedStats(stats);
    }
  }
  if (stats === null || stats.status === "error") {
    return <div>Error loading pager. Please try refreshing the page.</div>;
  }
  const numPages = Math.ceil(stats.num_results / pageN);
  return (
    <Box display="flex" justifyContent="center" alignItems="center">
      {results.length > 0 ? (
        <Pagination
          color="primary"
          count={numPages}
          siblingCount={2}
          boundaryCount={2}
          page={page}
          shape="rounded"
          onChange={(_, page) => setPage(page)}
        />
      ) : null}
    </Box>
  );
}

type SearchResultsProps = {
  results: Book[];
  romanize: boolean;
  handleRomanizeChange: (value: boolean) => void;
  ignoreSep: boolean;
  excludeModern: boolean;
  resultTerm: string;
  resultPage: number;
  resultDoc: string;
  statsPromise: Promise<StatsResult> | null;
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

  const suspenseKey = JSON.stringify({
    term: props.resultTerm,
    doc: props.resultDoc,
    ignoreSep: props.ignoreSep,
    excludeModern: props.excludeModern,
  });

  return (
    <React.Fragment>
      <Suspense
        key={suspenseKey}
        fallback={
          <Grid size={12} container sx={{ position: "relative" }}>
            <Grid size={12}>
              <Backdrop
                sx={{
                  color: "#fff",
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                  position: "absolute",
                }}
                open={true}
              >
                {t("Loading histogram...")}
                <CircularProgress color="inherit" />
              </Backdrop>
            </Grid>
            <Grid size={12}>
              <Histogram data={[]} setPage={null} pageN={props.pageN} />
            </Grid>
          </Grid>
        }
      >
        <HistogramWrapper
          statsPromise={props.statsPromise}
          pageN={props.pageN}
          setPage={props.setPage}
        />
      </Suspense>

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
        <Suspense
          key={suspenseKey}
          fallback={
            <Backdrop
              sx={{
                color: "#fff",
                zIndex: (theme) => theme.zIndex.drawer + 1,
                maxHeight: "100px",
                position: "static",
              }}
              open={true}
            >
              {t("Loading pager...")}
              <CircularProgress color="inherit" />
            </Backdrop>
          }
        >
          <PagerWrapper
            statsPromise={props.statsPromise}
            setPage={props.setPage}
            results={props.results}
            page={props.page}
            pageN={props.pageN}
          />
        </Suspense>
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
        <Suspense
          key={suspenseKey}
          fallback={
            <Backdrop
              sx={{
                color: "#fff",
                zIndex: (theme) => theme.zIndex.drawer + 1,
                maxHeight: "100px",
                position: "static",
              }}
              open={true}
            >
              {t("Loading pager...")}
              <CircularProgress color="inherit" />
            </Backdrop>
          }
        >
          <PagerWrapper
            statsPromise={props.statsPromise}
            setPage={props.setPage}
            results={props.results}
            page={props.page}
            pageN={props.pageN}
          />
        </Suspense>
      </Grid>
    </React.Fragment>
  );
}

export default React.memo(SearchResultsWrapper);
