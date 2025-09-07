"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { Book, SearchQuery, StatsResult } from "./search";
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
  statsPromise,
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
  statsPromise: Promise<StatsResult>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const searchParams = useSearchParams();

  // Currently displayed search query
  const initialQuery = React.useMemo(
    () => parseSearchParams(searchParams),
    [searchParams],
  );
  const [query, setQuery] = React.useState(initialQuery);

  React.useEffect(() => {
    const newParams = parseSearchParams(searchParams);
    setQuery(newParams);
  }, [searchParams]);

  const refresh = React.useCallback(
    (query: SearchQuery) => {
      startTransition(() => {
        // Reset page if search term changed
        if (
          initialQuery.term !== query.term ||
          initialQuery.doc !== query.doc ||
          initialQuery.excludeModern !== query.excludeModern ||
          initialQuery.ignoreSep !== query.ignoreSep
        ) {
          query.page = 1;
          setQuery(query);
        }
        // Update URL
        const params = makeSearchParams(query).toString();
        const url = params ? `/search?${params}` : "/search";
        router.push(url);
      });
    },
    [initialQuery, setQuery, router],
  );

  // Convenience function to set page
  const setPage = React.useCallback(
    (page: number) => {
      if (page === initialQuery.page) {
        return;
      }
      startTransition(() => {
        const newQuery = { ...initialQuery, page: page };
        setQuery(newQuery);
        refresh(newQuery);
      });
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
      loaded={!isPending}
      result={result.result}
      pageN={result.page_N}
      resultTerm={result.result_term}
      resultPage={result.result_page}
      resultDoc={result.result_doc}
      resultExcludeModern={result.excludeModern}
      resultIgnoreSep={result.ignoreSep}
      // Current Stats
      statsPromise={statsPromise}
      // Callbacks
      onRefresh={forceRefreshResults}
    />
  );
}
