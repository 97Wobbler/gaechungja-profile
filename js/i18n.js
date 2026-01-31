const strings = {
  ko: {
    title: "개청자 생성기",
    grade: "등급",
    count: "개수",
    total: "총 시도",
    rarity_loading: "희귀도 계산중...",
    rarity: "희귀도",
    generate: "생성",
    download: "다운로드",
  },
  en: {
    title: "Gaechungja Generator",
    grade: "Grade",
    count: "Count",
    total: "Total",
    rarity_loading: "Calculating rarity...",
    rarity: "Rarity",
    generate: "Generate",
    download: "Download",
  },
};

let currentLang = "ko";

export function detectLanguage() {
  const lang = navigator.language || navigator.userLanguage || "en";
  return lang.startsWith("ko") ? "ko" : "en";
}

export function setLanguage(lang) {
  currentLang = lang;
}

export function t(key) {
  return strings[currentLang]?.[key] ?? strings.en[key] ?? key;
}

export function applyI18n() {
  currentLang = detectLanguage();
  document.documentElement.lang = currentLang;

  // title 태그 처리
  const titleEl = document.querySelector("title");
  if (titleEl) {
    titleEl.textContent = t("title");
  }

  // data-i18n 속성이 있는 모든 요소 처리
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });
}
