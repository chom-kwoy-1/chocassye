"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Snackbar,
  Typography,
} from "@mui/material";
import React from "react";

import SearchResults from "@/app/search/SearchResults";
import TextFieldWithGugyeol from "@/components/TextFieldWithGugyeol";
import { useTranslation } from "@/components/TranslationProvider";
import { hangul_to_yale, yale_to_hangul } from "@/components/YaleToHangul.mjs";

import DocSelector from "./DocSelector";

export function SearchPage(props) {
  const { t } = useTranslation();

  const [romanize, setRomanize] = React.useState(false);
  const [displayHangul, setDisplayHangul] = React.useState(true);
  const [copyNotifOpen, setCopyNotifOpen] = React.useState(false);

  const hangulSearchTerm = yale_to_hangul(props.term);
  const normalizedSearchTerm = hangul_to_yale(props.term);

  return (
    <Grid container spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
      <Grid size={{ xs: 9, sm: 6 }}>
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
      <Grid size={{ xs: 3, sm: 1 }}>
        <Button variant="contained" fullWidth onClick={() => props.onRefresh()}>
          {t("Search")}
        </Button>
      </Grid>

      <Grid size={{ xs: 0, sm: 1 }}></Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <DocSelector
          doc={props.doc}
          handleDocChange={(doc) => props.setDoc(doc)}
          onRefresh={() => props.onRefresh()}
        />
      </Grid>

      {props.term !== "" ? (
        <Grid size={12}>
          <Box style={{ display: "inline" }}>{t("Preview")}:&nbsp;</Box>
          <Button
            variant="outlined"
            style={{ textTransform: "none" }}
            onClick={() => {
              setDisplayHangul(!displayHangul);
            }}
          >
            <Typography
              sx={{
                fontSize: "1.5em",
                fontWeight: 500,
                color: "inherit",
                textDecoration: "none",
                fontFamily: displayHangul ? "inherit" : "monospace",
              }}
            >
              {displayHangul ? hangulSearchTerm : normalizedSearchTerm}
            </Typography>
          </Button>
          {displayHangul ? (
            <IconButton
              aria-label="copy"
              onClick={async () => {
                await navigator.clipboard.writeText(hangulSearchTerm);
                setCopyNotifOpen(true);
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          ) : null}
        </Grid>
      ) : null}
      <Snackbar
        open={copyNotifOpen}
        autoHideDuration={1000}
        onClose={() => {
          setCopyNotifOpen(false);
        }}
        message={`Copied ‘${hangulSearchTerm}’ to clipboard.`}
      />

      <Grid
        size={12}
        container
        columnSpacing={1}
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
      >
        <Grid size="auto">
          <FormControlLabel
            control={<Checkbox size="small" sx={{ py: 0 }} />}
            label={
              <Typography sx={{ fontSize: "1em" }}>
                {t("Exclude modern translations")}
              </Typography>
            }
            checked={props.excludeModern}
            onChange={(event) => props.setExcludeModern(event.target.checked)}
          />
        </Grid>
        <Grid size="auto">
          <FormControlLabel
            control={<Checkbox size="small" sx={{ py: 0 }} />}
            label={
              <Typography sx={{ fontSize: "1em" }}>
                {t("Ignore syllable separators")}
              </Typography>
            }
            checked={props.ignoreSep}
            onChange={(event) => props.setIgnoreSep(event.target.checked)}
          />
        </Grid>
      </Grid>

      <Grid size={12}>
        <Typography sx={{ fontSize: "1em", fontWeight: 600 }}>
          {t("number Results", { numResults: props.numResults })}
          &ensp;
          {props.result.length > 0 ? (
            t("current page", {
              startYear: props.result[0].year,
              endYear: props.result[props.result.length - 1].year,
            })
          ) : (
            <span></span>
          )}
        </Typography>
      </Grid>

      <Grid size={12} sx={{ position: "relative" }}>
        <Grid container spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
          <Backdrop
            sx={{
              color: "#fff",
              zIndex: (theme) => theme.zIndex.drawer + 1,
              position: "absolute",
              alignItems: "flex-start",
              pt: 10,
            }}
            open={!props.loaded}
          >
            <CircularProgress color="inherit" />
          </Backdrop>

          <SearchResults
            results={props.result}
            numResults={props.numResults}
            romanize={romanize}
            handleRomanizeChange={setRomanize}
            ignoreSep={props.resultIgnoreSep}
            resultTerm={props.resultTerm} // for triggering re-render
            resultPage={props.resultPage} // for triggering re-render
            resultDoc={props.resultDoc} // for triggering re-render
            histogram={props.histogram}
            statsLoaded={props.statsLoaded}
            statsTerm={props.statsTerm} // for triggering re-render
            pageN={props.pageN}
            page={props.page}
            setPage={props.setPage}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}
