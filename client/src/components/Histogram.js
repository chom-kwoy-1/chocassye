import React from 'react';
import './index.css';
import './i18n';

import {
    Box, Grid, Card, Tooltip
} from '@mui/material';


const range = (start, stop, step) =>
  Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));


export default class Histogram extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const BEGIN = 1400;
        const END = 2000;

        const data = this.props.data.toSorted((a, b) => a.period - b.period);
        let hits = data.map((decade) => decade.num_hits).sort((a, b) => a - b);
        let median_hits = hits.length > 0 ? hits[Math.floor(hits.length / 2)] : 0;
        let acc_count = 0;

        // Sum number of hits between 1400 and 1600
        let middleKoreanHits = data.filter((decade) => decade.period >= 1400 && decade.period < 1600)
            .map((decade) => decade.num_hits)
            .reduce((a, b) => a + b, 0);

        // Sum number of hits from 1600
        let modernKoreanHits = data.filter((decade) => decade.period >= 1600)
            .map((decade) => decade.num_hits)
            .reduce((a, b) => a + b, 0);

        return <Grid item container xs={12}>
            <Grid item xs={12}>
                <Card elevation={3}>
                    <Box position="relative">
                        <Grid container spacing={0}>
                            {range(BEGIN, END - 50, 50).map((year, i) => {
                                return (
                                    <Grid item key={i}
                                        xs={12 / (END - BEGIN) * 100}
                                        sm={12 / (END - BEGIN) * 50}
                                        sx={{
                                            display: {xs: year % 100 === 0? 'flex' : 'none', sm: 'flex'},
                                            borderLeft: year === BEGIN? 0 : 1.5,
                                            borderColor: 'text.secondary',
                                            zIndex: 100,
                                            pointerEvents: "none",
                                            fontSize: "0.9em",
                                        }}
                                        minHeight="50px">
                                        {year}
                                    </Grid>
                                );
                            })}
                        </Grid>
                        <Box position="absolute" top={0} minHeight="50px" width="100%">
                            {data.map((decade, i) => {
                                let percentage = (decade.period - BEGIN) / (END - BEGIN) * 100;
                                let left = percentage + "%";
                                let width = (100 / ((END - BEGIN) / 10)) * 1.01 + "%";
                                let opacity = decade.num_hits / median_hits + 0.1;
                                let tooltip = this.props.t('number decade', { decade: decade.period }) + ': '
                                            + this.props.t('number Results', { numResults: decade.num_hits });

                                let page_idx = 1 + Math.floor(acc_count / this.props.pageN);
                                acc_count += decade.num_hits;
                                let click = () => {
                                    this.props.setPage(page_idx);
                                };

                                return <Tooltip key={i} title={tooltip}>
                                    <Box
                                        sx={{
                                            bgcolor: 'secondary.main',
                                            opacity: opacity,
                                            cursor: 'pointer',
                                            borderColor: 'text.disabled',
                                        }}
                                        position="absolute"
                                        left={left}
                                        width={width}
                                        minHeight="50px"
                                        onClick={click}>
                                    </Box>
                                </Tooltip>
                            })}
                        </Box>
                    </Box>
                </Card>
            </Grid>
            <Grid item xs={4} style={{
                borderBottom: "1px solid lightgrey",
                borderLeft: "1px solid lightgrey",
                borderRight: "1px solid lightgrey",
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
                textAlign: "center",
            }}>
                <span style={{position: "relative", top: 10, backgroundColor: "white"}}>
                    {this.props.t('number Results', { numResults: middleKoreanHits })}
                </span>
            </Grid>

            <Grid item xs={8} style={{
                borderBottom: "1px solid lightgrey",
                borderLeft: "1px solid lightgrey",
                borderRight: "1px solid lightgrey",
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
                textAlign: "center",
            }}>
                <span style={{position: "relative", top: 10, backgroundColor: "white"}}>
                    {this.props.t('number Results', { numResults: modernKoreanHits })}
                </span>
            </Grid>
        </Grid>
    }
}
