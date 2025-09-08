import { Metadata } from "next";
import React from "react";

import { getTranslation } from "@/components/detectLanguage";

import { getStats, search } from "./search";
import { SearchPageWrapper } from "./searchPageWrapper";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}): Promise<Metadata> {
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

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const query = {
    term: params.term ?? "",
    doc: params.doc ?? "",
    page: parseInt(params.page ?? "1"),
    excludeModern: params.excludeModern === "yes",
    ignoreSep: params.ignoreSep === "yes",
  };
  const statsPromise = getStats(query);
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
        statsPromise={statsPromise}
      />
    );
  } else {
    return <div>Error loading data</div>;
  }
}
