import React from "react";
import {SourceListPageWrapper} from "./sourceListPage";
import {fetchList} from "./fetchList";

export default async function SourceList() {
  const offset = 0;
  const limit = 25;
  const initialData = await fetchList(offset, limit);
  if (initialData.status === "success") {
    return <SourceListPageWrapper
      initialOffset={offset}
      initialLimit={limit}
      initialData={{
        data: initialData.data,
        loaded: true
      }}
    />;
  }
  else {
    return <div>Error loading data</div>;
  }
}
