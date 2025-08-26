'use client'
import React from "react";
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
    Typography
} from "@mui/material";
import { StyledTableCell } from "../../components/utils";
import {useTranslation} from "../i18n/client";
import Link from 'next/link';
import {TranslationContext} from "../../components/TranslationProvider";

function SourceListPage(props) {
    const lng = React.useContext(TranslationContext);
    const { t } = useTranslation(lng);

    if (!props.loaded) {
        return (
            <Grid container alignItems="center" spacing={2} sx={{px: 2}}>
                <Grid size={12}>
                    <Typography variant='h4'>{t('List of Sources')}</Typography>
                </Grid>
                <Grid size={12}>
                    <Typography variant='h6'>{t('Loading...')}</Typography>
                </Grid>
            </Grid>
        );
    }

    const num_pages = Math.ceil(props.data[0].full_count / props.limit);
    const cur_page = Math.floor(props.offset / props.limit) + 1;

    return (
      <Grid container alignItems="center" spacing={2} sx={{px: 2}}>
            <Grid size={12}>
                <Typography variant='h4'>{t('List of Sources')}</Typography>
            </Grid>

          {/* Pager on top */}
          <Grid size={12}>
              <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center">
                  <Pagination
                      color="primary"
                      count={num_pages}
                      siblingCount={2}
                      boundaryCount={2}
                      page={cur_page}
                      shape="rounded"
                      onChange={(_, page) => {props.setOffset((page - 1) * props.limit)}}
                  />
              </Box>
          </Grid>

          <Grid size={12}>
              <TableContainer component={Paper} elevation={3}>
                  <Table size="small">
                      <TableHead>
                          <TableRow>
                              <StyledTableCell>{t('Title')}</StyledTableCell>
                              <StyledTableCell>{t('Period')}</StyledTableCell>
                              <StyledTableCell>{t('No. of Sentences')}</StyledTableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                        {props.data && props.data.map((row) => (
                            <TableRow key={row.id}>
                                <StyledTableCell>
                                    <Link
                                        href={`/source?name=${row.filename}`}
                                        style={{textDecoration: "underline dotted lightgrey"}}
                                    >{row.filename}</Link>
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
              <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center">
                  <Pagination
                      color="primary"
                      count={num_pages}
                      siblingCount={2}
                      boundaryCount={2}
                      page={cur_page}
                      shape="rounded"
                      onChange={(_, page) => {props.setOffset((page - 1) * props.limit)}}
                  />
              </Box>
          </Grid>

      </Grid>
  );
}

function load_source_list(offset, limit, resultFunc) {
    fetch("/api/source_list?" + new URLSearchParams({
        offset: offset,
        limit: limit,
    }))
        .then((res) => res.json())
        .then((result) => {
            if (result.status === 'success') {
                resultFunc(result.data);
            }
            else {
                console.log(result);
                // resultFunc(null);
            }
        })
        .catch(err => {
            console.log(err);
            // resultFunc(null);
        });
}

function SourceListPageWrapper(props) {
    let [offset, setOffset] = React.useState(0);
    let [limit, setLimit] = React.useState(20);

    let [result, setResult] = React.useState({
        data: null,
        loaded: false
    });

    const prevResult = React.useRef(result);

    const refresh = React.useCallback(
        (offset, limit) => {
            let active = true;
            setResult({
                ...prevResult.current,
                loaded: false
            });

            load_source_list(
                offset, limit,
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
        return refresh(offset, limit);
    }, [offset, limit, refresh]);

    return <SourceListPage
        {...props}
        offset={offset}
        setOffset={setOffset}
        limit={limit}
        data={result.data}
        loaded={result.loaded}
    />;
}

export default SourceListPageWrapper;
