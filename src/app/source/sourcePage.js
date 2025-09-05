"use client";

import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableContainer,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import { styled } from "@mui/material/styles";
import { Interweave } from "interweave";
import { useRouter } from "next/navigation";
import React from "react";

import { highlight } from "@/components/Highlight";
import { useTranslation } from "@/components/TranslationProvider";
import { StyledTableCell, StyledTableRow } from "@/components/client_utils";
import { IMAGE_BASE_URL } from "@/components/config";

const NonAlternatingTableRow = styled(TableRow)(({}) => ({
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));
const allowList = ["mark", "abbr", "span"];

function Sentence(props) {
  const { t } = useTranslation();
  const bookname = props.bookname;
  const sentence = props.sentence;
  const highlight_term = props.highlight_term;
  const ignoreSep = props.ignoreSep;
  const text = sentence.html ?? sentence.text;
  const html = highlight(text, highlight_term, null, false, ignoreSep);

  const theme = useTheme();
  const sourceTextColor =
    theme.palette.mode === "light" ? grey["600"] : grey["400"];

  let displayPage = sentence.page;
  if (sentence.hasimages && sentence.page !== "") {
    displayPage = sentence.page.split("-").map((page, i) => (
      <Tooltip key={i} title={t("Image for page", { page: page })}>
        <span style={{ whiteSpace: "nowrap" }}>
          <a
            className="pageNum"
            style={{
              color: sourceTextColor,
              textDecoration: "underline dotted",
            }}
            href={`${IMAGE_BASE_URL}/${bookname}/${page}.jpg`}
            target="blank"
            key={i}
          >
            {page}
          </a>
          {i < sentence.page.split("-").length - 1 ? "-" : null}
        </span>
      </Tooltip>
    ));
  }

  return (
    <StyledTableRow>
      <StyledTableCell
        className={[
          `sourceSentence`,
          `sentence_type_${sentence.type}`,
          `sentence_lang_${sentence.lang}`,
        ].join(" ")}
      >
        <Typography component="span" sx={{ fontSize: "1.3em" }}>
          <Interweave
            className="text"
            content={html}
            allowList={allowList}
            allowAttributes={true}
          />
        </Typography>
      </StyledTableCell>
      <StyledTableCell align="right">
        <span
          className="pageNum"
          style={{ color: sourceTextColor, userSelect: "none" }}
        >
          ({displayPage})
        </span>
      </StyledTableCell>
    </StyledTableRow>
  );
}

function makeSearchParams(
  bookName,
  numberInSource,
  excludeChinese,
  viewCount,
  highlightWord,
  ignoreSep,
) {
  console.log(highlightWord);
  const params = new URLSearchParams();
  params.set("name", bookName);
  if (numberInSource !== 0) {
    params.set("n", numberInSource.toString());
  }
  if (excludeChinese) {
    params.set("nozh", "yes");
  }
  if (viewCount !== 25) {
    params.set("N", viewCount.toString());
  }
  if (highlightWord) {
    params.set("hl", highlightWord);
  }
  if (ignoreSep) {
    params.set("is", "yes");
  }
  return params;
}

export function SourcePage(props) {
  const router = useRouter();

  const { t } = useTranslation();

  function setNumberInSource(n) {
    const params = makeSearchParams(
      props.bookName,
      n,
      props.excludeChinese,
      props.viewCount,
      props.highlightWord,
      props.ignoreSep,
    );
    router.push(`/source?${params.toString()}`);
  }

  function handleExcludeChineseChange(event) {
    let excludeChinese = event.target.checked;
    const params = makeSearchParams(
      props.bookName,
      0,
      excludeChinese,
      props.viewCount,
      props.highlightWord,
      props.ignoreSep,
    );
    router.push(`/source?${params.toString()}`);
  }

  function handleViewCountChange(event) {
    let viewCount = event.target.value;
    const params = makeSearchParams(
      props.bookName,
      props.numberInSource,
      props.excludeChinese,
      viewCount,
      props.highlightWord,
      props.ignoreSep,
    );
    router.push(`/source?${params.toString()}`);
  }

  if (props.result.data === null) {
    return (
      <Grid
        container
        spacing={{ xs: 0.5, sm: 1 }}
        alignItems="center"
        direction="row"
      >
        <Grid size={12}>
          <Box>
            <Typography
              variant="h5"
              component="span"
              sx={{
                fontWeight: 500,
              }}
            >
              {props.bookName}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    );
  }

  let hl = props.highlightWord ?? "NULL";

  const PAGE = props.viewCount;
  let pageCount = Math.ceil(props.result.data.count / PAGE);

  let n = props.numberInSource;
  let page = Math.floor(n / PAGE);

  return (
    <Grid
      container
      spacing={{ xs: 0.5, sm: 1 }}
      alignItems="center"
      direction="row"
    >
      <Grid size={12}>
        <Box>
          <Typography
            variant="h5"
            component="span"
            sx={{
              fontWeight: 500,
            }}
          >
            {props.bookName}
          </Typography>
          &ensp;
          <span>{props.result.data.year_string}</span>
        </Box>
      </Grid>

      {/* Bibliography and attributions */}
      <Grid size={{ xs: 10, sm: 8, lg: 6 }} mx="auto">
        <TableContainer
          component={Paper}
          elevation={1}
          style={{ overflow: "visible" }}
        >
          <Table size="small">
            <TableBody>
              {props.result.data.bibliography === "" ? null : (
                <StyledTableRow>
                  <StyledTableCell>
                    <Typography color={"textSecondary"}>
                      {t("Source")}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    {props.result.data.bibliography}
                  </StyledTableCell>
                </StyledTableRow>
              )}
              {props.result.data.attributions.length === 0 ? null : (
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
                          {props.result.data.attributions.map(
                            (attribution, i) => (
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
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </StyledTableCell>
                </StyledTableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      <Grid container size={12} alignItems="center">
        <Grid size={{ xs: 8, md: 10 }}>
          <FormControlLabel
            control={<Checkbox size="small" sx={{ py: 0 }} />}
            label={
              <Typography sx={{ fontSize: "1em" }}>
                {t("Exclude Chinese")}
              </Typography>
            }
            checked={props.excludeChinese}
            onChange={(event) => handleExcludeChineseChange(event)}
          />
        </Grid>
        <Grid size={{ xs: 4, md: 2 }}>
          <FormControl variant="standard" fullWidth>
            <InputLabel id="view-count-select-label">
              {t("Results per page")}
            </InputLabel>
            <Select
              labelId="view-count-select-label"
              id="view-count-select"
              label={t("Results per page")}
              value={props.viewCount}
              onChange={(event) => handleViewCountChange(event)}
              variant="standard"
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Pager */}
      <Grid size={12}>
        <Box display="flex" justifyContent="center" alignItems="center">
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
              setNumberInSource(newN);
            }}
          />
        </Box>
      </Grid>

      <Grid size={12}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableBody>
              {props.result.data.sentences.map((sentence, i) => (
                <Sentence
                  key={i}
                  bookname={props.bookName}
                  sentence={sentence}
                  highlight_term={hl}
                  ignoreSep={props.ignoreSep}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Pager */}
      <Grid size={12} my={1}>
        <Box display="flex" justifyContent="center" alignItems="center">
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
              setNumberInSource(newN);
            }}
          />
        </Box>
      </Grid>
    </Grid>
  );
}
