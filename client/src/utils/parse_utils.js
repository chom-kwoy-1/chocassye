import path from "path";

export function year_and_bookname_from_filename(file) {
    file = file.normalize('NFKC')
    let filename = path.parse(file).name;
    let year_string = null;
    if (!path.parse(file).dir.includes("unknown") && !path.parse(file).dir.includes("sktot")) {
        let splits = filename.split('_');
        filename = splits.splice(1).join(' ');
        year_string = splits[0];
    }
    filename = filename.split('_').join(' ');
    return {filename: filename, year_string: year_string};
}

export function parse_year_string(year_string) {
    let ys_norm = year_string.replace(/\[[^\]]*\]/g, '').replace(/\([^\)]*\)/g, '');

    let year, year_start, year_end;
    if (ys_norm.match(/^[0-9][0-9][0-9][0-9]$/) !== null ||
        ys_norm.match(/^[0-9][0-9][0-9][0-9]년$/) !== null ||
        ys_norm.match(/^[0-9][0-9][0-9][0-9]年$/) !== null) {
        year = parseInt(ys_norm.slice(0, 4));
        year_start = year_end = year;
    }
    else if (ys_norm.match(/^[0-9][0-9][0-9][0-9]년대/) !== null) {
        year = parseInt(ys_norm.slice(0, 4)) + 5;
        year_start = year - 5;
        year_end = year + 4;
    }
    else if (year_string.match(/[0-9][0-9]세기 ?(전기|전반|전반기|초|초반|초기)/) !== null) {
        let matched = year_string.match(/[0-9][0-9]세기 ?(전기|전반|전반기|초|초반|초기)/)[0];
        year = parseInt(matched.slice(0, 2)) * 100 - 75;
        year_start = year - 25;
        year_end = year + 24;
    }
    else if (year_string.match(/[0-9][0-9]세기 ?(후기|후반|후반기|말|말기)/) !== null) {
        let matched = year_string.match(/[0-9][0-9]세기 ?(후기|후반|후반기|말|말기)/)[0];
        year = parseInt(matched.slice(0, 2)) * 100 - 25;
        year_start = year - 25;
        year_end = year + 24;
    }
    else if (year_string.match(/[0-9][0-9]세기/) !== null) {
        let matched = year_string.match(/[0-9][0-9]세기/)[0];
        year = parseInt(matched.slice(0, 2)) * 100 - 50;
        year_start = year - 50;
        year_end = year + 49;
    }
    else if (ys_norm.match(/^[0-9][0-9]--$/) !== null ||
        ys_norm.match(/^[0-9][0-9]--년$/) !== null ||
        ys_norm.match(/^[0-9][0-9]\?$/) !== null ||
        ys_norm.match(/^[0-9][0-9]\?\?$/) !== null ||
        ys_norm.match(/^[0-9][0-9]\?\?년$/) !== null ||
        ys_norm.match(/^[0-9][0-9]X$/) !== null ||
        ys_norm.match(/^[0-9][0-9]XX$/) !== null ||
        ys_norm.match(/^[0-9][0-9]XX년$/) !== null) {
        year = parseInt(ys_norm.slice(0, 2)) * 100 + 50;
        year_start = year - 50;
        year_end = year + 49;
    }
    else if (ys_norm.match(/^[0-9][0-9][0-9]-$/) !== null ||
        ys_norm.match(/^[0-9][0-9][0-9]-년$/) !== null ||
        ys_norm.match(/^[0-9][0-9][0-9]\?$/) !== null ||
        ys_norm.match(/^[0-9][0-9][0-9]\?년$/) !== null ||
        ys_norm.match(/^[0-9][0-9][0-9]X$/) !== null ||
        ys_norm.match(/^[0-9][0-9][0-9]X년$/) !== null) {
        year = parseInt(ys_norm.slice(0, 3)) * 10 + 5;
        year_start = year - 5;
        year_end = year + 4;
    }
    else {
        year = parseInt(ys_norm.slice(0, 4));
        year_start = year_end = year;
    }

    year = Number.isNaN(year)? null : year;
    year_start = Number.isNaN(year_start)? null : year_start;
    year_end = Number.isNaN(year_end)? null : year_end;

    return {year: year, year_start: year_start, year_end: year_end};
}
