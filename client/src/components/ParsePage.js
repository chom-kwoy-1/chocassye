import React from 'react';
import './i18n';
import {postData} from './utils';
import {Button, Grid, MenuItem, Select, TextField} from "@mui/material";
import {useTranslation} from "react-i18next";


function ParsePage(props) {
    const { t } = useTranslation();

    const [currentQuery, setCurrentQuery] = React.useState("");
    const [parseResults, setParseResults] = React.useState([]);
    const [selectedParseIndex, setSelectedParseIndex] = React.useState('');

    function refresh() {
        postData('/api/parse', {
            text: currentQuery
        }).then((result) => {
            console.log(result);
            if (result.status === "success") {
                setParseResults(result.data);
            } else {
                setParseResults([]);
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    return <Grid container spacing={{xs: 0.5, sm: 1}} alignItems="center" direction="row">
        <Grid item xs={12}>
            <Select variant="filled" fullWidth value={selectedParseIndex}>
                {parseResults.map((result, i) => {
                    return <MenuItem key={i}>{JSON.stringify(result)}</MenuItem>
                })}
            </Select>
        </Grid>
        <Grid item xs={9} sm={10} md={11}>
            <TextField
                id={"searchTermField"}
                variant="filled"
                value={currentQuery}
                onChange={(event) => setCurrentQuery(event.target.value)}
                label={t("Word or phrase")}
                fullWidth
            />
        </Grid>
        <Grid item xs={3} sm={2} md={1}>
            <Button variant="contained" fullWidth onClick={(event) => refresh()}>
                {t("Parse")}
            </Button>
        </Grid>
    </Grid>;
}

export default ParsePage;
