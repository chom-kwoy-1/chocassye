import React from "react";
import {suggestGugyeol} from "./Gugyeol";
import {
    Box,
    Button,
    IconButton,
    Paper,
    Popper,
    Stack,
    Table,
    TableBody,
    TableContainer,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import {StyledTableCell} from "./utils";
import {TranslationContext} from "./TranslationProvider";
import {useTranslation} from "../components/TranslationProvider";

export default function TextFieldWithGugyeol(props) {
    const { t } = useTranslation();
    const uniqueId = "#textfield-with-gugyeol"; // + Math.random().toString(36).substring(7);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [gugyeolInputOpen, setGugyeolInputOpen] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    function toggleGugyeolInput(e) {
        setAnchorEl(document.getElementById(uniqueId));
        setGugyeolInputOpen(!gugyeolInputOpen);
        setIsFocused(!gugyeolInputOpen);
    }

    function replaceGugyeol(suggestion) {
        let term = props.value;
        term = term.slice(0, term.length - suggestion.replaceLength) + suggestion.gugyeol;
        props.onChange({target: {value: term}});
    }

    let text = props.value;
    let suggestedGugyeols = suggestGugyeol(text);
    let groupedSuggestions = [];
    const COLUMNS = 3;
    for (let i = 0; i < suggestedGugyeols.length; i++) {
        if (i % COLUMNS === 0) {
            groupedSuggestions.push([]);
        }
        groupedSuggestions[groupedSuggestions.length - 1].push(suggestedGugyeols[i]);
    }

    return <Box>
        <Box position="relative">
            <TextField
                id={uniqueId}  // FIXME: This should be a unique ID
                variant="filled"
                value={props.value}
                label={props.label}
                onChange={(event) => props.onChange(event)}
                onKeyDown={(event) => props.onKeyDown(event)}
                fullWidth
            />
            <Box style={{position: "absolute", right: 0, padding: 0, top: "50%", transform: "translateY(-50%)"}}>
                <Tooltip title={t("Toggle Gugyeol Input")}>
                    <IconButton variant="outlined" onClick={(e) => toggleGugyeolInput(e)}>
                        <Typography sx={{
                            fontSize: "20pt", fontWeight: "900", lineHeight: 0.7,
                            color: gugyeolInputOpen ? (theme) => theme.palette.primary.main : "inherit"
                        }}>
                            <br/>
                        </Typography>
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
        <Popper open={gugyeolInputOpen && isFocused} anchorEl={anchorEl}
                placement='bottom-end' style={{zIndex: 1000}}>
            <TableContainer component={Paper} elevation={3}>
                <Table size="small">
                    <TableBody>
                        {groupedSuggestions.map((group, i) =>
                            <TableRow key={i}>
                                {group.map((suggestion, j) =>
                                    <StyledTableCell key={j} sx={{padding: 0}}>
                                        <Button onClick={() => replaceGugyeol(suggestion)}>
                                            <Stack direction="column" justifyContent="center" alignItems="center">
                                                <Typography sx={{fontSize: "15pt", fontWeight: "900", lineHeight: 0.8}}>
                                                    {suggestion.gugyeol}
                                                </Typography>
                                                <Typography sx={{fontSize: "8pt", lineHeight: 0.8}}>
                                                    {suggestion.pron}
                                                </Typography>
                                            </Stack>
                                        </Button>
                                    </StyledTableCell>
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Popper>
    </Box>;
}