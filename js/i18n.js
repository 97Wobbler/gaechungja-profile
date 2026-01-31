const strings = {
  ko: {
    title: "개청자 생성기",
    grade: "등급",
    count: "개수",
    total: "총",
    stats_title: "수집 현황",
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
    stats_title: "Collection",
    rarity_loading: "Calculating rarity...",
    rarity: "Rarity",
    generate: "Generate",
    download: "Download",
  },
};

let currentLang = "ko";

export function detectLanguage() {
  const saved = localStorage.getItem("lang");
  if (saved && (saved === "ko" || saved === "en")) {
    return saved;
  }
  const lang = navigator.language || navigator.userLanguage || "en";
  return lang.startsWith("ko") ? "ko" : "en";
}

export function getCurrentLang() {
  return currentLang;
}

export function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  applyI18n();
  updateLangSwitch();
}

export function t(key) {
  return strings[currentLang]?.[key] ?? strings.en[key] ?? key;
}

function updateLangSwitch() {
  const switchEl = document.getElementById("langSwitch");
  if (switchEl) {
    switchEl.checked = currentLang === "en";
  }
}

export function applyI18n() {
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

  // 희귀도 요소 업데이트 (현재 등급 유지)
  const rarityEl = document.getElementById("rarity");
  if (rarityEl) {
    const gradeSpan = rarityEl.querySelector("span");
    if (gradeSpan) {
      const grade = gradeSpan.textContent;
      rarityEl.innerHTML = `${t("rarity")}: <span class="${gradeSpan.className}" style="font-weight: bold;">${grade}</span>`;
    }
  }
}

export function initI18n() {
  currentLang = detectLanguage();
  applyI18n();
  updateLangSwitch();
}
