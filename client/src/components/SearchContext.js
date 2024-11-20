import React, { createContext } from 'react';

export const SearchResultContext = createContext([
    {}, (value) => {},
]);

export function SearchResultProvider(props) {
    let [searchResult, setSearchResult] = React.useState({
        // Search query
        loaded: true,
        result: [],
        result_term: "",
        result_page: 1,
        result_doc: "",
        excludeModern: false,
        ignoreSep: false,
        // Search stats
        statsLoaded: true,
        page_N: 50,
        num_results: 0,
        histogram: [],
        stats_term: "",
    });

    return (
        <SearchResultContext.Provider value={[ searchResult, setSearchResult ]}>
            {props.children}
        </SearchResultContext.Provider>
    );
}
