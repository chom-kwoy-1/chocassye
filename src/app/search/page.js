import React from "react";

import { getTranslation } from "../../components/detectLanguage";
import { search } from "./search";
import { SearchPageWrapper } from "./searchPageWrapper";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const searchTerm = params.term ?? "";
  const { t } = await getTranslation();
  return {
    title:
      searchTerm === ""
        ? t("page-title")
        : t("page-title-with-searchTerm", { searchTerm: searchTerm }),
    description: t("page-description"),
  };
}

export default async function Search({ searchParams }) {
  const params = await searchParams;
  const query = {
    term: params.term ?? "",
    doc: params.doc ?? "",
    page: parseInt(params.page ?? "1"),
    excludeModern: params.excludeModern === "yes",
    ignoreSep: params.ignoreSep === "yes",
  };
  const results = await search(query);
  if (results.status === "success") {
    return (
      <SearchPageWrapper
        result={{
          loaded: true,
          result: results.results,
          page_N: results.page_N,
          result_term: query.term,
          result_doc: query.doc,
          result_page: query.page,
          excludeModern: query.excludeModern,
          ignoreSep: query.ignoreSep,
        }}
      />
    );
  } else {
    return <div>Error loading data</div>;
  }
}
