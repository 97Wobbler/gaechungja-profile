import { loadResources } from "./resources.js";
import { loadAllImages } from "./images.js";
import { pickIndexWithWeights } from "./generator.js";
import { computeRarityScore, scoreToGrade, RANK_SCORE } from "./rarity.js";
import { drawCharacter, downloadCharacter } from "./renderer.js";
import { setupUI } from "./ui.js";
import { createAudio } from "./audio.js";
import { loadStats, saveStats, increment, renderStats } from "./stats.js";

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
    this.images = { skin: [], face: [], face2: [], hair: [] };
    this.keys = { skin: [], face: [], face2: [], hair: [] };
    this.resourceData = null;

    this.currentCharacter = { skin: 0, face: 0, face2: 0, hair: 0, hairHue: 0 };

    // 생성 버튼 쿨다운 플래그 및 참조
    this.isGenerateCooldown = false;
    this.generateBtn = document.getElementById("generateBtn");
  }

  async init() {
    const { resourceData, weights, keys } = await loadResources();
    this.resourceData = resourceData;
    this.weights = weights;
    this.keys = keys;

    this.images = await loadAllImages(this.keys);

    // 통계 로드 및 초기 렌더
    this.stats = loadStats();
    renderStats(this.stats);

    setupUI({
      onGenerate: () => {
        if (this.isGenerateCooldown) return; // 쿨다운 중이면 무시
        this.generateCharacter();
        this.playSfxByScore();
      },
      onDownload: () => this.downloadCharacter(),
    });

    this.generateCharacter();
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

  generateCharacter() {
    this.currentCharacter = {
      skin: pickIndexWithWeights(this.weights.skin, this.images.skin.length),
      face: pickIndexWithWeights(this.weights.face, this.images.face.length),
      face2: pickIndexWithWeights(this.weights.face2, this.images.face2.length),
      hair: pickIndexWithWeights(this.weights.hair, this.images.hair.length),
      hairHue: Math.floor(Math.random() * 12) * 30,
    };

    drawCharacter({
      ctx: this.ctx,
      images: this.images,
      current: this.currentCharacter,
    });

    this.score = computeRarityScore(this.resourceData, this.currentCharacter);
    const grade = scoreToGrade(this.score);

    const rarityEl = document.getElementById("rarity");
    if (rarityEl) {
      const gradeClass = `rank-${grade.toLowerCase()}`;
      rarityEl.innerHTML = `희귀도: <span class="${gradeClass}" style="font-weight: bold;">${grade}</span>`;
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

  downloadCharacter() {
    downloadCharacter({
      canvas: this.canvas,
      images: this.images,
      current: this.currentCharacter,
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new CharacterGenerator();
  app.init();
});
