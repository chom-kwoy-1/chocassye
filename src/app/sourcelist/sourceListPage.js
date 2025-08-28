"use client";

import { useTranslation } from "@/components/TranslationProvider";
import { StyledTableCell } from "@/components/client_utils";
import {
  Box,
  Grid,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import React from "react";

import { fetchList } from "./fetchList";

function SourceListPage(props) {
  const { t } = useTranslation();

  if (!props.loaded) {
    return (
      <Grid container alignItems="center" spacing={2} sx={{ px: 2 }}>
        <Grid size={12}>
          <Typography variant="h4">{t("List of Sources")}</Typography>
        </Grid>
        <Grid size={12}>
          <Typography variant="h6">{t("Loading...")}</Typography>
        </Grid>
      </Grid>
    );
  }

  const num_pages = Math.ceil(props.data[0].full_count / props.limit);
  const cur_page = Math.floor(props.offset / props.limit) + 1;

  return (
    <Grid container alignItems="center" spacing={2} sx={{ px: 2 }}>
      <Grid size={12}>
        <Typography variant="h4">{t("List of Sources")}</Typography>
      </Grid>

      {/* Pager on top */}
      <Grid size={12}>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Pagination
            color="primary"
            count={num_pages}
            siblingCount={2}
            boundaryCount={2}
            page={cur_page}
            shape="rounded"
            onChange={(_, page) => {
              props.setOffset((page - 1) * props.limit);
            }}
          />
        </Box>
      </Grid>

      <Grid size={12}>
        <TableContainer component={Paper} elevation={3}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <StyledTableCell>{t("Title")}</StyledTableCell>
                <StyledTableCell>{t("Period")}</StyledTableCell>
                <StyledTableCell>{t("No. of Sentences")}</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {props.data &&
                props.data.map((row) => (
                  <TableRow key={row.id}>
                    <StyledTableCell>
                      <Link
                        href={`/source?name=${row.filename}`}
                        style={{ textDecoration: "underline dotted lightgrey" }}
                      >
                        {row.filename}
                      </Link>
                    </StyledTableCell>
                    <StyledTableCell>{row.year_string}</StyledTableCell>
                    <StyledTableCell>{row.num_sentences}</StyledTableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Pager on bottom */}
      <Grid size={12}>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Pagination
            color="primary"
            count={num_pages}
            siblingCount={2}
            boundaryCount={2}
            page={cur_page}
            shape="rounded"
            onChange={(_, page) => {
              props.setOffset((page - 1) * props.limit);
            }}
          />
        </Box>
      </Grid>
    </Grid>
  );
}

export function SourceListPageWrapper(props) {
  let [offset, setOffset] = React.useState(props.initialOffset);
  const prevOffset = React.useRef(offset);
  let [limit, setLimit] = React.useState(props.initialLimit);
  const prevLimit = React.useRef(limit);
  let [result, setResult] = React.useState(props.initialData);

  const prevResult = React.useRef(result);
  React.useEffect(() => {
    prevResult.current = result;
  }, [result]);

  const refresh = React.useCallback(async (offset, limit) => {
    setResult({
      ...prevResult.current,
      loaded: false,
    });

    const newData = await fetchList(offset, limit);
    if (newData.status === "success") {
      setResult({
        data: newData.data,
        loaded: true,
      });
    } else {
      // FIXME: error handling
      console.error("Error loading source:", newData.msg);
    }
  }, []);

  React.useEffect(() => {
    if (offset !== prevOffset.current || limit !== prevLimit.current) {
      refresh(offset, limit);
      prevOffset.current = offset;
      prevLimit.current = limit;
    }
  }, [offset, limit, refresh]);

  return (
    <SourceListPage
      {...props}
      offset={offset}
      setOffset={setOffset}
      limit={limit}
      data={result.data}
      loaded={result.loaded}
    />
  );
}
