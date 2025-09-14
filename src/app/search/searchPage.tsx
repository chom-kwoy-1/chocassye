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
import React, { ChangeEvent, Suspense, useState } from "react";

import SearchResults from "@/app/search/SearchResults";
import { Book, StatsResult } from "@/app/search/search";
import TextFieldWithGugyeol from "@/components/TextFieldWithGugyeol";
import { useTranslation } from "@/components/TranslationProvider";
import { hangul_to_yale, yale_to_hangul } from "@/components/YaleToHangul.mjs";

import DocSelector from "./DocSelector";

function TotalNumberWrapper({
  statsPromise,
}: {
  statsPromise: Promise<StatsResult> | null;
}) {
  const { t } = useTranslation();
  const [cachedStats, setCachedStats] = useState<StatsResult | null>(null);
  let stats = cachedStats;
  if (statsPromise) {
    stats = React.use(statsPromise);
    if (stats !== cachedStats) {
      setCachedStats(stats);
    }
  }
  if (stats === null || stats.status === "error") {
    return (
      <div>Error loading total count. Please try refreshing the page.</div>
    );
  }
  return <span>{t("number Results", { numResults: stats.num_results })}</span>;
}

export function SearchPage(props: {
  term: string;
  setTerm: (term: string) => void;
  doc: string;
  setDoc: (doc: string) => void;
  page: number;
  setPage: (page: number) => void;
  excludeModern: boolean;
  setExcludeModern: (value: boolean) => void;
  ignoreSep: boolean;
  setIgnoreSep: (value: boolean) => void;
  // Current Results
  loaded: boolean;
  result: Book[];
  pageN: number;
  resultTerm: string;
  resultPage: number;
  resultDoc: string;
  resultExcludeModern: boolean;
  resultIgnoreSep: boolean;
  // Current Stats
  statsPromise: Promise<StatsResult> | null;
  // Callbacks
  onRefresh: () => void;
}) {
  const { t } = useTranslation();

  const [romanize, setRomanize] = React.useState(false);
  const [displayHangul, setDisplayHangul] = React.useState(true);
  const [copyNotifOpen, setCopyNotifOpen] = React.useState(false);

  const hangulSearchTerm = yale_to_hangul(props.term) as string;
  const normalizedSearchTerm = hangul_to_yale(props.term);

  return (
    <Grid container spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
      <Grid size={{ xs: 9, sm: 6 }}>
        <TextFieldWithGugyeol
          value={props.term}
          setTerm={props.setTerm}
          label={t("Search term...")}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            props.setTerm(event.target.value)
          }
          onKeyDown={(ev: KeyboardEvent) => {
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
          handleDocChange={(doc: string) => props.setDoc(doc)}
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
            onChange={() => props.setExcludeModern(!props.excludeModern)}
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
            onChange={() => props.setIgnoreSep(!props.ignoreSep)}
          />
        </Grid>
      </Grid>

      <Grid size={12}>
        <Typography sx={{ fontSize: "1em", fontWeight: 600 }}>
          <Suspense fallback={<span>{t("Loading...")}</span>}>
            <TotalNumberWrapper statsPromise={props.statsPromise} />
          </Suspense>
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
            romanize={romanize}
            handleRomanizeChange={setRomanize}
            ignoreSep={props.resultIgnoreSep}
            excludeModern={props.resultExcludeModern}
            resultTerm={props.resultTerm} // for triggering re-render
            resultPage={props.resultPage} // for triggering re-render
            resultDoc={props.resultDoc} // for triggering re-render
            statsPromise={props.statsPromise}
            pageN={props.pageN}
            page={props.page}
            setPage={props.setPage}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}
