import { loadResources } from "./resources.js";
import { loadAllImages } from "./images.js";
import { pickIndexWithWeights } from "./generator.js";
import { computeRarityScore, scoreToGrade } from "./rarity.js";
import { drawCharacter, downloadCharacter } from "./renderer.js";
import { setupUI } from "./ui.js";
import { createAudio } from "./audio.js";

export class CharacterGenerator {
  constructor() {
    this.canvas = document.getElementById("characterCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    this.sfx = {
      generate: createAudio("assets/audio/soundeffect.mp3"),
    };

    this.weights = {};
    this.images = { skin: [], face: [], face2: [], hair: [] };
    this.keys = { skin: [], face: [], face2: [], hair: [] };
    this.resourceData = null;

    this.currentCharacter = { skin: 0, face: 0, face2: 0, hair: 0, hairHue: 0 };
  }

  async init() {
    const { resourceData, weights, keys } = await loadResources();
    this.resourceData = resourceData;
    this.weights = weights;
    this.keys = keys;

    this.images = await loadAllImages(this.keys);

    setupUI({
      onGenerate: () => {
        this.generateCharacter();
        this.playSfx("generate");
      },
      onDownload: () => this.downloadCharacter(),
    });

    this.generateCharacter();
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

    const score = computeRarityScore(this.resourceData, this.currentCharacter);
    const grade = scoreToGrade(score);
    const rarityEl = document.getElementById("rarity");
    if (rarityEl) {
      const gradeClass = `rank-${grade.toLowerCase()}`;
      rarityEl.innerHTML = `희귀도: <span class="${gradeClass}" style="font-weight: bold;">${grade}</span>`;
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
