import React from "react";

import { getTranslation } from "@/components/detectLanguage";

import { EnglishClient } from "./client";

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("page-title-about"),
    description: t("page-description"),
  };
}

export default async function English() {
  return <EnglishClient />;
}
