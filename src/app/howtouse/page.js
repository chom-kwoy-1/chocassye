import HowToPage from "../../components/HowToPage";
import { getTranslation } from "../../components/detectLanguage";

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("page-title-howto"),
    description: t("page-description"),
  };
}

export default function Page() {
  return <HowToPage />;
}
