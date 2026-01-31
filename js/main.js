import { loadResources } from "./resources.js";
import { getImagesForCharacter } from "./images.js";
import { pickIndexWithWeights } from "./generator.js";
import { computeRarityScore, scoreToGrade, RANK_SCORE } from "./rarity.js";
import { drawCharacter, downloadCharacter } from "./renderer.js";
import { setupUI } from "./ui.js";
import { createAudio } from "./audio.js";
import { loadStats, saveStats, increment, renderStats } from "./stats.js";
import { applyI18n, t } from "./i18n.js";
import { VERSION } from "./version.js";

export class CharacterGenerator {
  constructor() {
    this.canvas = document.getElementById("characterCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    this.sfx = {
      wood_block: createAudio("assets/audio/wood_block.mp3"),
      banger_ayo: createAudio("assets/audio/banger_ayo.mp3", 1),
    };

    this.weights = {};
    this.keys = { skin: [], face: [], face2: [], hair: [] };
    this.resourceData = null;

    this.currentCharacter = { skin: 0, face: 0, face2: 0, hair: 0, hairHue: 0 };

    // 생성 버튼 쿨다운 플래그 및 참조
    this.isGenerateCooldown = false;
    this.generateBtn = document.getElementById("generateBtn");
  }

  async init() {
    // i18n 적용
    applyI18n();

    // 버전 표시
    const versionEl = document.getElementById("version");
    if (versionEl) versionEl.textContent = `v${VERSION}`;

    const { resourceData, weights, keys } = await loadResources();
    this.resourceData = resourceData;
    this.weights = weights;
    this.keys = keys;

    // 통계 로드 및 초기 렌더
    this.stats = loadStats();
    renderStats(this.stats);

    setupUI({
      onGenerate: async () => {
        if (this.isGenerateCooldown) return; // 쿨다운 중이면 무시
        await this.generateCharacter();
        this.playSfxByScore();
      },
      onDownload: () => this.downloadCharacter(),
    });

    await this.generateCharacter();
  }

  playSfxByScore() {
    if (this.score >= RANK_SCORE.S) {
      this.playSfx("banger_ayo");
    } else {
      this.playSfx("wood_block");
    }
  }

  playSfx(name) {
    const audio = this.sfx?.[name];
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.play();
    } catch (_) {}
  }

  async generateCharacter() {
    this.currentCharacter = {
      skin: pickIndexWithWeights(this.weights.skin, this.keys.skin?.length || 9),
      face: pickIndexWithWeights(this.weights.face, this.keys.face?.length || 9),
      face2: pickIndexWithWeights(this.weights.face2, this.keys.face2?.length || 12),
      hair: pickIndexWithWeights(this.weights.hair, this.keys.hair?.length || 26),
      hairHue: Math.floor(Math.random() * 12) * 30,
    };

    // 온디맨드 이미지 로딩
    const images = await getImagesForCharacter(this.currentCharacter, this.keys);
    const renderCurrent = {
      skin: 0,
      face: 0,
      face2: 0,
      hair: 0,
      hairHue: this.currentCharacter.hairHue,
    };

    drawCharacter({
      ctx: this.ctx,
      images,
      current: renderCurrent,
    });

    this.score = computeRarityScore(this.resourceData, this.currentCharacter);
    const grade = scoreToGrade(this.score);

    const rarityEl = document.getElementById("rarity");
    if (rarityEl) {
      const gradeClass = `rank-${grade.toLowerCase()}`;
      rarityEl.innerHTML = `${t("rarity")}: <span class="${gradeClass}" style="font-weight: bold;">${grade}</span>`;
    }

    // 통계 업데이트 및 저장/표시
    increment(this.stats, grade);
    saveStats(this.stats);
    renderStats(this.stats);

    if (this.score >= RANK_SCORE.S) {
      this.isGenerateCooldown = true;
      if (this.generateBtn) this.generateBtn.classList.add("cooldown");

      setTimeout(() => {
        this.isGenerateCooldown = false;
        if (this.generateBtn) this.generateBtn.classList.remove("cooldown");
      }, 1000);
    }
  }

  async downloadCharacter() {
    const images = await getImagesForCharacter(this.currentCharacter, this.keys);
    const renderCurrent = {
      skin: 0,
      face: 0,
      face2: 0,
      hair: 0,
      hairHue: this.currentCharacter.hairHue,
    };
    downloadCharacter({
      canvas: this.canvas,
      images,
      current: renderCurrent,
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new CharacterGenerator();
  app.init();
});
