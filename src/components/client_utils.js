'use client';
import {styled} from "@mui/material/styles";
import {TableCell, TableRow} from "@mui/material";
import {tableCellClasses} from '@mui/material/TableCell';
import {
    amber, blue, cyan, deepOrange,
    deepPurple, green, indigo,
    lightBlue, lightGreen, lime,
    orange, pink, purple, red, teal, yellow,
} from '@mui/material/colors';

export async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        body: JSON.stringify(data)
    });
    return response.json();
}

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        fontWeight: 700,
        paddingLeft: 3,
        paddingRight: 3,
        textAlign: "center",
        typography: 'body2'
    },
    [`&.${tableCellClasses.body}`]: {
        typography: 'body2'
    },
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

export const highlightColors = [
    orange, pink, indigo,
    cyan, lightGreen, amber,
    red, deepPurple, lightBlue,
    green, yellow, deepOrange,
    purple, blue, teal, lime,
];
