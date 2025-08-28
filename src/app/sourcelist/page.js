import React from "react";

import { fetchList } from "./fetchList";
import { SourceListPageWrapper } from "./sourceListPage";

export default async function SourceList() {
  const offset = 0;
  const limit = 25;
  const initialData = await fetchList(offset, limit);
  if (initialData.status === "success") {
    return (
      <SourceListPageWrapper
        initialOffset={offset}
        initialLimit={limit}
        initialData={{
          data: initialData.data,
          loaded: true,
        }}
      />
    );
  } else {
    return <div>Error loading data: {initialData.msg}</div>;
  }
}
