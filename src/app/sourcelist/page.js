import React from "react";

import { getTranslation } from "@/components/detectLanguage";

import { fetchList } from "./fetchList";
import { SourceListPageWrapper } from "./sourceListPage";

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("page-title-sourcelist"),
    description: t("page-description"),
  };
}

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
