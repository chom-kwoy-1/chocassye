import React from "react";

import { getStats, search } from "./search";
import { SearchPageWrapper } from "./searchPageWrapper";

export default async function Search({ searchParams }) {
  const params = await searchParams;
  const query = {
    term: params.term ?? "",
    doc: params.doc ?? "",
    page: parseInt(params.page ?? "1"),
    excludeModern: params.excludeModern === "yes",
    ignoreSep: params.ignoreSep === "yes",
  };
  const [initialData, initialStats] = await Promise.all([
    search(query),
    getStats(query),
  ]);
  if (initialData.status === "success" && initialStats.status === "success") {
    return (
      <SearchPageWrapper
        result={{
          loaded: true,
          result: initialData.results,
          page_N: initialData.page_N,
          result_term: query.term,
          result_doc: query.doc,
          result_page: query.page,
          excludeModern: query.excludeModern,
          ignoreSep: query.ignoreSep,
          // Search stats
          statsLoaded: true,
          num_results: initialStats.num_results,
          histogram: initialStats.histogram,
          stats_term: query.term,
        }}
      />
    );
  } else {
    return <div>Error loading data</div>;
  }
}
