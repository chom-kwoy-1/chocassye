import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import {
  Backdrop,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableContainer,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import { ThemeProvider, styled } from "@mui/material/styles";
import { Interweave } from "interweave";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import { Trans } from "react-i18next";

import { ImageTooltip } from "@/app/search/ImageTooltip";
import { Book, SentenceWithContext, StatsResult } from "@/app/search/search";
import { darkTheme, lightTheme } from "@/app/themes";
import { findMatchingRanges, highlight, toText } from "@/components/Highlight";
import Histogram from "@/components/Histogram";
import HowToPage from "@/components/HowToPage";
import { ThemeContext } from "@/components/ThemeContext";
import { useTranslation } from "@/components/TranslationProvider";
import { yale_to_hangul } from "@/components/YaleToHangul.mjs";
import {
  StyledTableCell,
  StyledTableRow,
  highlightColors,
} from "@/components/client_utils";
import { IMAGE_BASE_URL } from "@/components/config";
import { Sentence } from "@/utils/search";
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

function useOutsideAlerter<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: () => void,
) {
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // @ts-expect-error I dont know how to suppress this error
      if (ref.current && event.target && !ref.current.contains(event.target)) {
        callback();
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

const AlternatingBox = styled(Box)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
}));

function SentenceWithCtx(props: {
  sentenceWithCtx: SentenceWithContext;
  book: Book;
  matchIdsInSentence: number[];
  highlightTerm: string;
  ignoreSep: boolean;
  romanize: boolean;
}) {
  const { t } = useTranslation();
  const [curTheme, _] = React.useContext(ThemeContext);
  const invTheme = curTheme === lightTheme ? darkTheme : lightTheme;
  const [isCtxOpen, setIsCtxOpen] = React.useState(false);

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  const removeCtxView = React.useCallback(() => {
    setIsCtxOpen(false);
  }, []);
  useOutsideAlerter(wrapperRef, removeCtxView);

  const [isHovered, setIsHovered] = React.useState(false);
  const [copyNotifOpen, setCopyNotifOpen] = React.useState(false);

  const makeWiktionaryCitation = React.useCallback(() => {
    const text = yale_to_hangul(
      props.sentenceWithCtx.mainSentence.text_with_tone ??
        props.sentenceWithCtx.mainSentence.text,
    ) as string;
    const lng = props.book.year > 1600 ? "ko-ear" : "okm";
    const items = [
      `quote-book`,
      `${lng}`,
      `title=ko:${props.book.name}`,
      `year=${props.book.year_string}`,
      `page=${props.sentenceWithCtx.mainSentence.page}`,
      `passage=^${text}.`,
      `t=<enter translation here>`,
    ];

    const prevSentence =
      props.sentenceWithCtx.contextBefore[
        props.sentenceWithCtx.contextBefore.length - 1
      ];
    const chinese =
      prevSentence?.lang === "chi"
        ? (yale_to_hangul(prevSentence.text) as string)
        : undefined;
    if (chinese !== undefined) {
      items.push(`origlang=lzh`);
      items.push(`origtext=lzh:${chinese}`);
    }

    return `{{${items.join("|")}}}`;
  }, [props.sentenceWithCtx, props.book]);

  React.useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (isHovered) {
        // Perform action when key is pressed and mouse is inside
        if (event.key === "w") {
          const citation = makeWiktionaryCitation();
          await navigator.clipboard.writeText(citation);
          setCopyNotifOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [makeWiktionaryCitation, isHovered]); // Re-run effect if isHovered changes

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Snackbar
        open={copyNotifOpen}
        autoHideDuration={1000}
        onClose={() => {
          setCopyNotifOpen(false);
        }}
        message={`Copied Wiktionary citation to clipboard.`}
      />
      <ThemeProvider theme={invTheme}>
        <Box
          className={`${invTheme.palette.mode}ThemeRoot`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: "translateY(-100%)",
            paddingBottom: ".5rem",
            zIndex: 100,
            display: isCtxOpen ? "inherit" : "none",
          }}
        >
          <Paper
            elevation={5}
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              opacity: 0.9,
            }}
          >
            {props.sentenceWithCtx.contextBefore.map((sentence, i) => (
              <AlternatingBox
                key={i}
                className={[
                  `sourceSentence`,
                  `sentence_type_${sentence.type}`,
                  `sentence_lang_${sentence.lang}`,
                ].join(" ")}
                style={{ lineHeight: 2.0 }}
                px={2}
              >
                <SentenceAndPage
                  sentence={sentence}
                  book={props.book}
                  matchIdsInSentence={null}
                  highlightTerm={props.highlightTerm}
                  ignoreSep={props.ignoreSep}
                  romanize={props.romanize}
                  showSource={false}
                />
              </AlternatingBox>
            ))}
          </Paper>
        </Box>
      </ThemeProvider>
      <Box className={"searchResultSentence"} sx={{ py: 0.4 }}>
        <SentenceAndPage
          sentence={props.sentenceWithCtx.mainSentence}
          book={props.book}
          matchIdsInSentence={props.matchIdsInSentence}
          highlightTerm={props.highlightTerm}
          ignoreSep={props.ignoreSep}
          romanize={props.romanize}
          showSource={true}
        />
        <span
          style={{
            position: "absolute", // make it take up no space
            bottom: 0,
            transform: "translateY(16%)",
          }}
        >
          <Tooltip title={t("Click to see context")}>
            <IconButton
              onClick={() => {
                setIsCtxOpen(!isCtxOpen);
              }}
            >
              <UnfoldMoreIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </span>
      </Box>
      <ThemeProvider theme={invTheme}>
        <Box
          className={`${invTheme.palette.mode}ThemeRoot`}
          style={{
            position: "absolute",
            left: 0,
            zIndex: 100,
            paddingTop: ".5rem",
            display: isCtxOpen ? "inherit" : "none",
          }}
        >
          <Paper
            elevation={5}
            style={{
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              opacity: 0.9,
            }}
          >
            {props.sentenceWithCtx.contextAfter.map((sentence, i) => (
              <AlternatingBox
                key={i}
                className={[
                  `sourceSentence`,
                  `sentence_type_${sentence.type}`,
                  `sentence_lang_${sentence.lang}`,
                ].join(" ")}
                style={{ lineHeight: 2.0 }}
                px={2}
              >
                <SentenceAndPage
                  sentence={sentence}
                  book={props.book}
                  matchIdsInSentence={null}
                  highlightTerm={props.highlightTerm}
                  ignoreSep={props.ignoreSep}
                  romanize={props.romanize}
                  showSource={false}
                />
              </AlternatingBox>
            ))}
          </Paper>
        </Box>
      </ThemeProvider>
    </div>
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

function ImagePreviewLink({
  sentence,
  bookName,
  sourceTextColor,
}: {
  sentence: Sentence;
  bookName: string;
  sourceTextColor: "#757575" | "#bdbdbd";
}) {
  if (sentence.hasimages && sentence.page !== "") {
    return (
      <>
        {sentence.page.split("-").map((page, i) => {
          const imageURL = `${IMAGE_BASE_URL}/${bookName}/${page}.jpg`;
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
        })}
      </>
    );
  } else {
    return <>{sentence.page !== "" ? sentence.page : null}</>;
  }
}

function SentenceAndPage(props: {
  sentence: Sentence;
  book: Book;
  matchIdsInSentence: number[] | null;
  highlightTerm: string;
  ignoreSep: boolean;
  romanize: boolean;
  showSource: boolean;
}) {
  const theme = useTheme();
  const sourceTextColor =
    theme.palette.mode === "light" ? grey["600"] : grey["400"];

  const sentence = props.sentence;

  return (
    <React.Fragment>
      {/* Highlighted sentence */}
      <Interweave
        className="text"
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
      {props.showSource ? (
        <>
          &nbsp;
          <wbr />
          {/* Add source link */}
          <span style={{ color: sourceTextColor }}>
            [
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
            <ImagePreviewLink
              sentence={sentence}
              bookName={props.book.name}
              sourceTextColor={sourceTextColor}
            />
            ]
          </span>
        </>
      ) : null}
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
  statsPromise: Promise<StatsResult>;
  setPage: (page: number) => void;
  pageN: number;
}) {
  console.log("Loading histogram...");
  const stats: StatsResult = React.use(statsPromise);
  console.log("Loaded histogram:", stats);
  if (stats.status === "error") {
    return <div>Error loading histogram: {stats.msg}</div>;
  }
  return <Histogram data={stats.histogram} setPage={setPage} pageN={pageN} />;
}

type SearchResultsProps = {
  results: Book[];
  romanize: boolean;
  handleRomanizeChange: (value: boolean) => void;
  ignoreSep: boolean;
  resultTerm: string;
  resultPage: number;
  resultDoc: string;
  statsPromise: Promise<StatsResult>;
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

  // const numPages = Math.ceil(props.numResults / props.pageN);

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
      <Suspense
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
      {/*<Grid size={12}>*/}
      {/*  <Box display="flex" justifyContent="center" alignItems="center">*/}
      {/*    {filteredResultsList.length > 0 ? (*/}
      {/*      <Pagination*/}
      {/*        color="primary"*/}
      {/*        count={numPages}*/}
      {/*        siblingCount={2}*/}
      {/*        boundaryCount={2}*/}
      {/*        page={props.page}*/}
      {/*        shape="rounded"*/}
      {/*        onChange={(_, page) => props.setPage(page)}*/}
      {/*      />*/}
      {/*    ) : null}*/}
      {/*  </Box>*/}
      {/*</Grid>*/}

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
      {/*<Grid size={12} marginTop={1}>*/}
      {/*  <Box display="flex" justifyContent="center" alignItems="center">*/}
      {/*    {filteredResultsList.length > 0 ? (*/}
      {/*      <Pagination*/}
      {/*        color="primary"*/}
      {/*        count={numPages}*/}
      {/*        siblingCount={2}*/}
      {/*        boundaryCount={2}*/}
      {/*        page={props.page}*/}
      {/*        shape="rounded"*/}
      {/*        onChange={(_, page) => props.setPage(page)}*/}
      {/*      />*/}
      {/*    ) : null}*/}
      {/*  </Box>*/}
      {/*</Grid>*/}
    </React.Fragment>
  );
}

export default React.memo(SearchResultsWrapper);
