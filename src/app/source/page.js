import React from "react";

import { fetchSource } from "./fetchSource";
import { SourcePageWrapper } from "./sourcePage";

export default async function Source({ searchParams }) {
  const params = await searchParams;
  const bookName = params.name;
  const numberInSource = parseInt(params.n ?? "0");
  const excludeChinese = false;
  const viewCount = 25;

  const sourceData = await fetchSource(
    bookName,
    numberInSource,
    excludeChinese,
    viewCount,
  );
  if (sourceData.status === "success") {
    return (
      <SourcePageWrapper
        initialExcludeChinese={excludeChinese}
        initialViewCount={viewCount}
        initialData={{
          data: sourceData.data,
          loaded: true,
        }}
      />
    );
  } else {
    return <div>Error loading data: {sourceData.msg}</div>;
  }
}
