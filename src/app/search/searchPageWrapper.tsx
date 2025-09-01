"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { Book, SearchQuery, getStats } from "./search";
import { SearchPage } from "./searchPage";

function parseSearchParams(searchParams: URLSearchParams): SearchQuery {
  return {
    term: searchParams.get("term") ?? "",
    doc: searchParams.get("doc") ?? "",
    page: parseInt(searchParams.get("page") ?? "1"),
    excludeModern: searchParams.get("excludeModern") === "yes",
    ignoreSep: searchParams.get("ignoreSep") === "yes",
  };
}

function makeSearchParams(query: SearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.term !== "") {
    params.set("term", query.term);
  }
  if (query.doc !== "") {
    params.set("doc", query.doc);
  }
  if (query.page !== 1) {
    params.set("page", query.page.toString());
  }
  if (query.excludeModern) {
    params.set("excludeModern", "yes");
  }
  if (query.ignoreSep) {
    params.set("ignoreSep", "yes");
  }
  return params;
}

export function SearchPageWrapper({
  result,
}: {
  result: {
    loaded: boolean;
    result: Book[];
    page_N: number;
    result_term: string;
    result_page: number;
    result_doc: string;
    excludeModern: boolean;
    ignoreSep: boolean;
  };
}) {
  const router = useRouter();

  const searchParams = useSearchParams();

  // Currently displayed search query
  const initialQuery = React.useMemo(
    () => parseSearchParams(searchParams),
    [searchParams],
  );
  const [query, setQuery] = React.useState(initialQuery);

  const [loaded, setLoaded] = React.useState(result.loaded);
  React.useEffect(() => {
    setLoaded(result.loaded);
  }, [result]);

  const [stats, setStats] = React.useState<{
    statsLoaded: boolean;
    statsTerm: string;
    statsDoc: string;
    statsExcludeModern: boolean;
    statsIgnoreSep: boolean;
    numResults: number;
    histogram: { period: number; num_hits: number }[];
  }>({
    statsLoaded: false,
    statsTerm: "",
    statsDoc: "",
    statsExcludeModern: false,
    statsIgnoreSep: false,
    numResults: 0,
    histogram: [],
  });

  const refreshStats = React.useCallback((query: SearchQuery) => {
    async function fetchStats() {
      const result = await getStats(query);
      if (result.status === "success") {
        setStats({
          statsLoaded: true,
          statsTerm: query.term,
          statsDoc: query.doc,
          statsExcludeModern: query.excludeModern,
          statsIgnoreSep: query.ignoreSep,
          numResults: result.num_results,
          histogram: result.histogram,
        });
      }
    }
    fetchStats();
  }, []);

  React.useEffect(() => {
    const newParams = parseSearchParams(searchParams);
    setQuery(newParams);
    refreshStats(newParams);
  }, [searchParams, refreshStats]);

  const refresh = React.useCallback(
    (query: SearchQuery) => {
      // Show loading state
      setLoaded(false);
      // Reset page if search term changed
      if (
        initialQuery.term !== query.term ||
        initialQuery.doc !== query.doc ||
        initialQuery.excludeModern !== query.excludeModern ||
        initialQuery.ignoreSep !== query.ignoreSep
      ) {
        query.page = 1;
        setQuery(query);
        setStats({ ...stats, statsLoaded: false });
      }
      // Update URL
      const params = makeSearchParams(query).toString();
      const url = params ? `/search?${params}` : "/search";
      router.push(url);
    },
    [initialQuery, setQuery, stats, router],
  );

  // Convenience function to set page
  const setPage = React.useCallback(
    (page: number) => {
      const newQuery = { ...initialQuery, page: page };
      setQuery(newQuery);
      refresh(newQuery);
    },
    [refresh, initialQuery],
  );

  function forceRefreshResults() {
    refresh(query);
  }

  return (
    <SearchPage
      // Search parameters
      term={query.term}
      setTerm={(value: string) => setQuery({ ...query, term: value })}
      doc={query.doc}
      setDoc={(value: string) => setQuery({ ...query, doc: value })}
      page={query.page}
      setPage={setPage}
      excludeModern={query.excludeModern}
      setExcludeModern={(value: boolean) =>
        setQuery({ ...query, excludeModern: value })
      }
      ignoreSep={query.ignoreSep}
      setIgnoreSep={(value: boolean) =>
        setQuery({ ...query, ignoreSep: value })
      }
      // Current Results
      loaded={loaded}
      result={result.result}
      pageN={result.page_N}
      resultTerm={result.result_term}
      resultPage={result.result_page}
      resultDoc={result.result_doc}
      resultExcludeModern={result.excludeModern}
      resultIgnoreSep={result.ignoreSep}
      // Current Stats
      statsLoaded={stats.statsLoaded}
      statsTerm={stats.statsTerm}
      numResults={stats.numResults}
      histogram={stats.histogram}
      // Callbacks
      onRefresh={forceRefreshResults}
    />
  );
}
