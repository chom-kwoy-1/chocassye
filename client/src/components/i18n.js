import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ICU from 'i18next-icu';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "Search": "Search",
      "How to Use": "How to Use",
      "Search Engine": "Search Engine",
      "Chocassye": "Chocassye",
      "Romanization": "Romanization",
      "Search term...": "Search term...",
      "document name...": "Filter by document name...",
      "Exclude modern translations": "Exclude modern translations",
      "Ignore syllable separators": "Ignore separators",
      "number Results": "{numResults, plural, =0 {No Results} =1 {1 Result} other {# Results}}",
      "number decade": "{decade}s",
      "current page": "(Current page: {startYear} — {endYear})",
      "nextpage": "Next Page ▶",
      "prevpage": "◀ Prev Page",
      "No match": "No match",
      "No match. Please follow the instructions below for better results.": "<strong>No match.</strong> Please follow the instructions below for better results.",
      "How to Use Chocassye": "How to Use Chocassye",
      "Basic Usage": "Basic Usage",
      "Advanced Usage": "Advanced Usage",
      "You can search the database with": "You can search the database with <strong>Hangul</strong>, <strong>romanization</strong>, or a <strong>mix of both</strong>, as demonstrated below. All queries are automatically converted to romanized form before querying the database, as the internal format of the database is in romanized form.",
      "Input": "Input",
      "Hangul Form": "Hangul Form",
      "Actual Query": "Actual Query",
      "We use a modified Yale Romanization": "We use a <strong>modified Yale Romanization</strong> system. Here are the most important differences:",
      "rom-detail-1": "<strong>‘ㅇ’ is always romanized into <i>‘G’</i></strong> (a capital G) regardless of the environment it appears in.",
      "rom-detail-2": "<strong>Letter blocks are always separated by a ‘.’</strong> (full stop), unless already separated by a space.",
      "rom-detail-3": "For ‘ㅛ’ and ‘ㅠ’, we use <strong><i>‘yo’</i> and <i>‘yu’</i></strong> instead of <i>‘ywo’</i> and <i>‘ywu’</i>.",
      "rom-detail-4": "A letter block without an initial letter (e.g. ‘ᅟᅵᆫ’) is romanized as if the initial letter is ‘`’ (a single backtick).",
      "The chart below shows": "The chart below shows the full correspondence between Hangul letters and our romanization.",
      "Wildcards": "Wildcards",
      "Find sentences that starts with or ends with a certain phrase": "Find sentences that starts with or ends with a certain phrase",
      "We support two types of wildcards": "We support two types of wildcards for advanced searching.",
      "wildcard-detail-1": "The <strong>‘_’</strong> (underscore) matches any <strong>one</strong> romanized letter.",
      "wildcard-detail-2": "The <strong>‘%’</strong> (percent sign) matches <strong>any number</strong> of letters, including zero.",
      "startend-detail-1": "To find a sentence that <strong>starts with</strong> a certain phrase, prepend a <strong>‘^’</strong> (caret) to the query string.",
      "startend-detail-2": "To find a sentence that <strong>ends with</strong> a certain phrase, append a <strong>‘$’</strong> (dollar sign) to the query string.",
      "Exclude Chinese": "Exclude Chinese",
      "Source": "Source",
      "Attributions": "Attributions",
      "Image for page": "Image for {page}",
      "Toggle Gugyeol Input": "Toggle Gugyeol Input",
      "Results per page": "Results per page",
      "Unknown year": "-",
      "Preview": "Preview",
    }
  },
  ko: {
    translation: {
      "Search": "찾기",
      "How to Use": "도움말",
      "About": "소개",
      "About Chocassye": "ᄎᆞ자쎠 소개",
      "Search Engine": "검색엔진",
      "Chocassye": "ᄎᆞ자쎠",
      "Romanization": "로마자로 보기",
      "Search term...": "검색어 입력...",
      "document name...": "문서 제목으로 거르기...",
      "Exclude modern translations": "현대어 번역 제외",
      "Ignore syllable separators": "음절·어절구분 무시",
      "number Results": "{numResults, plural, =0 {결과 없음} other {결과 #개}}",
      "number decade": "{decade}년대",
      "current page": "(현재 페이지: {startYear}년 — {endYear}년)",
      "nextpage": "다음 페이지 ▶",
      "prevpage": "◀ 이전 페이지",
      "No match": "결과 없음",
      "No match. Please follow the instructions below for better results.": "<strong>검색 결과 없음.</strong> 아래 사용방법을 참고하여 검색어를 입력하시기 바랍니다.",
      "How to Use Chocassye": "ᄎᆞ자쎠 사용방법",
      "Basic Usage": "기본 용법",
      "Advanced Usage": "고급 용법",
      "You can search the database with": "아래 예시와 같이 <strong>한글 표기</strong>, <strong>로마자 표기</strong>, 또는 <strong>둘을 섞은 형태</strong>로써 말뭉치 데이터베이스를 검색할 수 있습니다. 데이터베이스의 내부 형식이 로마자로 표현되어 있기 때문에, 모든 입력값은 내부적으로 자동으로 로마자로 변환되어 검색됩니다.",
      "Input": "검색어",
      "Hangul Form": "한글 변환값",
      "Actual Query": "실제 검색되는 값",
      "We use a modified Yale Romanization": "로마자 표기법은 <strong>조금 변형된 예일대 표기법</strong> 체계를 사용하고 있습니다. 주요 차이점은 아래와 같습니다.",
      "rom-detail-1": "<strong>‘ㅇ’은 환경에 상관없이 항상 <i>‘G’</i> (대문자 G)에 대응됩니다.</strong>",
      "rom-detail-2": "<strong>모든 음절은 ‘.’ (마침표)로 구분됩니다.</strong> (단, 이미 공백으로 구분되어 있지 않은 경우에만)",
      "rom-detail-3": "‘ㅛ’ 와 ‘ㅠ’ 모음은 <i>‘ywo’</i>와 <i>‘ywu’</i> 대신에 <strong><i>‘yo’</i>와 <i>‘yu’</i>를 사용합니다</strong>.",
      "rom-detail-4": "‘ᅟᅵᆫ’과 같이 초성 글자가 없는 음절은 로마자 표기법에서 초성 자리에 ‘`’ 기호로 표시합니다.",
      "The chart below shows": "아래 표는 한글 자모와 로마자 대응 관계를 나타냅니다.",
      "Wildcards": "와일드카드",
      "Find sentences that starts with or ends with a certain phrase": "특정 문자열로 시작하거나 끝나는 문장 찾기",
      "We support two types of wildcards": "두 가지 와일드카드 검색어를 지원합니다.",
      "wildcard-detail-1": "<strong>‘_’</strong> (밑줄 기호)는 아무 로마자 1글자를 대신합니다.",
      "wildcard-detail-2": "<strong>‘%’</strong> (퍼센트 기호)는 아무 길이의 문자열을 대신할 수 있습니다 (길이가 0인 경우도 포함).",
      "startend-detail-1": "<strong>‘^’</strong> (캐럿) 기호를 검색어 맨 앞에 붙이면 그 문자열로 시작하는 문장만 검색됩니다.",
      "startend-detail-2": "<strong>‘$’</strong> (달러) 기호를 검색어 맨 뒤에 붙이면 그 문자열로 끝나는 문장만 검색됩니다.",
      "Exclude Chinese": "한문 숨기기",
      "Source": "출처 서지정보",
      "Attributions": "입력 및 교정",
      "Image for page": "{page} 원문사진",
      "Toggle Gugyeol Input": "구결자 입력기",
      "Results per page": "개씩 보기",
      "Unknown year": "연도미상",
      "Preview": "보기",
      "Sources": "자료",
      "List of Sources": "자료 목록",
      "Title": "제목",
      "Period": "시기",
      "No. of Sentences": "문장 수",
      "Korean": "한국어",
      "English": "영어",
      "Language": "언어",
      "Machwoassye": "마초아쎠",
    }
  }
};

i18n
  .use(ICU)
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: 'en',
    // lng: "ko", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

    interpolation: {
      escapeValue: false // react already safes from xss
    },
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i']
  });

export default i18n;
