import React from "react";

import { getTranslation } from "@/components/detectLanguage";

import { fetchSource } from "./fetchSource";
import { SourcePage } from "./sourcePage";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const bookName = params.name;
  const { t } = await getTranslation();
  return {
    title: t("page-title-with-bookname", { bookName: bookName }),
    description: t("page-description"),
  };
}

export default async function Source({ searchParams }) {
  const params = await searchParams;
  const bookName = params.name;
  const numberInSource = parseInt(params.n ?? "0");
  const excludeChinese = params.nozh === "yes";
  const viewCount = parseInt(params.N ?? "25");

  const highlightWord = params.hl;
  const ignoreSep = params.is === "yes";

  const sourceData = await fetchSource(
    bookName,
    numberInSource,
    excludeChinese,
    viewCount,
  );

  if (sourceData.status === "success") {
    return (
      <SourcePage
        bookName={bookName}
        numberInSource={numberInSource}
        result={sourceData}
        highlightWord={highlightWord}
        ignoreSep={ignoreSep}
        excludeChinese={excludeChinese}
        viewCount={viewCount}
      />
    );
  } else {
    return <div>Error loading data: {sourceData.msg}</div>;
  }
}
