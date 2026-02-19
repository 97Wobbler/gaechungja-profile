#!/usr/bin/env node

/**
 * 랜덤 캐릭터 개별 이미지 N개 생성기
 * 사용법: node scripts/batch.js <count> [--scale <n>] [--bg <hex>] [--transparent]
 * 예: node scripts/batch.js 10
 *     node scripts/batch.js 50 --scale 5
 *     node scripts/batch.js 20 --transparent
 *     node scripts/batch.js 30 --bg ff0000
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PROJECT_ROOT = path.join(__dirname, "..");
const RESOURCES_PATH = path.join(PROJECT_ROOT, "assets/data/resources.json");
const SRC_PATH = path.join(PROJECT_ROOT, "src");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "output");

const SPRITE_SIZE = 32;
const DEFAULT_SCALE = 10;

// resources.json 로드
function loadResources() {
  const data = JSON.parse(fs.readFileSync(RESOURCES_PATH, "utf-8"));
  const parts = data.parts || {};

  const toWeights = (arr) =>
    Array.isArray(arr) ? arr.map((x) => Number(x?.possibility ?? 1) || 0) : [];

  return {
    weights: {
      skin: toWeights(parts.skin),
      face: toWeights(parts.face),
      face2: toWeights(parts.face2),
      hair: toWeights(parts.hair),
    },
    keys: {
      skin: (parts.skin || []).map((x) => x.key),
      face: (parts.face || []).map((x) => x.key),
      face2: (parts.face2 || []).map((x) => x.key),
      hair: (parts.hair || []).map((x) => x.key),
    },
  };
}

// 가중치 기반 랜덤 선택
function pickIndexWithWeights(layerWeights, length) {
  if (Array.isArray(layerWeights) && layerWeights.length === length) {
    const total = layerWeights.reduce(
      (sum, w) => sum + (Number.isFinite(w) ? Math.max(0, w) : 0),
      0
    );
    if (total <= 0) return Math.floor(Math.random() * length);
    let r = Math.random() * total;
    for (let i = 0; i < layerWeights.length; i++) {
      const w = Number.isFinite(layerWeights[i])
        ? Math.max(0, layerWeights[i])
        : 0;
      r -= w;
      if (r < 0) return i;
    }
    return layerWeights.length - 1;
  }
  return Math.floor(Math.random() * length);
}

// Hue shift for raw pixel data
function shiftHue(r, g, b, hueDelta) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  let s = 0;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }

  if (h < 0) h += 360;
  h = (h + hueDelta) % 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;

  if (h < 60) { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

// 아웃라인 생성
function createOutlineData(data, width, height) {
  const outline = Buffer.alloc(width * height * 4);

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const idx = (py * width + px) * 4;
      const alpha = data[idx + 3];

      if (alpha > 0) {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dx, dy] of dirs) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const ni = (ny * width + nx) * 4;
            const na = data[ni + 3];
            if (na === 0 || outline[ni + 3] === 0) {
              outline[ni] = 0;
              outline[ni + 1] = 0;
              outline[ni + 2] = 0;
              outline[ni + 3] = alpha;
            }
          }
        }
      }
    }
  }

  return outline;
}

// 랜덤 캐릭터 생성
function generateCharacter(weights, keys) {
  return {
    skin: pickIndexWithWeights(weights.skin, keys.skin.length),
    face: pickIndexWithWeights(weights.face, keys.face.length),
    face2: pickIndexWithWeights(weights.face2, keys.face2.length),
    hair: pickIndexWithWeights(weights.hair, keys.hair.length),
    hairHue: Math.floor(Math.random() * 12) * 30,
  };
}

// 캐릭터 하나 렌더링
async function renderCharacter(character, keys, scale, bg) {
  const charSize = SPRITE_SIZE * scale;
  const skinKey = keys.skin[character.skin];
  const faceKey = keys.face[character.face];
  const face2Key = keys.face2[character.face2];
  const hairKey = keys.hair[character.hair];

  const skinPath = path.join(SRC_PATH, "skin", `${skinKey}.png`);
  const facePath = path.join(SRC_PATH, "face", `${faceKey}.png`);
  const face2Path = path.join(SRC_PATH, "face2", `${face2Key}.png`);
  const hairPath = path.join(SRC_PATH, "hair", `${hairKey}.png`);

  let composite = sharp({
    create: {
      width: SPRITE_SIZE,
      height: SPRITE_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  const layers = [
    { input: skinPath, top: 0, left: 0 },
    { input: facePath, top: 0, left: 0 },
    { input: face2Path, top: 0, left: 0 },
  ];

  // 머리카락 hue shift
  const hairBuffer = await sharp(hairPath).raw().toBuffer({ resolveWithObject: true });
  const { data: hairData, info: hairInfo } = hairBuffer;
  const shiftedHair = Buffer.alloc(hairData.length);

  for (let i = 0; i < hairData.length; i += 4) {
    const a = hairData[i + 3];
    if (a === 0) {
      shiftedHair[i] = 0;
      shiftedHair[i + 1] = 0;
      shiftedHair[i + 2] = 0;
      shiftedHair[i + 3] = 0;
    } else {
      const shifted = shiftHue(hairData[i], hairData[i + 1], hairData[i + 2], character.hairHue);
      shiftedHair[i] = shifted.r;
      shiftedHair[i + 1] = shifted.g;
      shiftedHair[i + 2] = shifted.b;
      shiftedHair[i + 3] = a;
    }
  }

  const hairShifted = await sharp(shiftedHair, {
    raw: { width: hairInfo.width, height: hairInfo.height, channels: 4 },
  }).png().toBuffer();

  layers.push({ input: hairShifted, top: 0, left: 0 });

  const composited = await composite.composite(layers).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = composited;

  // 아웃라인 생성
  const outlineData = createOutlineData(data, info.width, info.height);

  const outlinePng = await sharp(outlineData, { raw: { width: SPRITE_SIZE, height: SPRITE_SIZE, channels: 4 } }).png().toBuffer();
  const charPng = await sharp(data, { raw: { width: SPRITE_SIZE, height: SPRITE_SIZE, channels: 4 } }).png().toBuffer();

  const finalSprite = await sharp({
    create: {
      width: SPRITE_SIZE,
      height: SPRITE_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: outlinePng, top: 0, left: 0 },
      { input: charPng, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  // 스케일 확대 (nearest neighbor)
  const scaledChar = await sharp(finalSprite)
    .resize(charSize, charSize, { kernel: "nearest" })
    .png()
    .toBuffer();

  // 배경 추가
  return await sharp({
    create: {
      width: charSize,
      height: charSize,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: scaledChar, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function parseHexColor(hex) {
  const clean = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
    alpha: 255,
  };
}

function parseArgs(args) {
  const result = {
    count: null,
    scale: DEFAULT_SCALE,
    bg: { r: 248, g: 249, b: 250, alpha: 255 }, // #f8f9fa
  };
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scale" || args[i] === "-s") {
      const val = parseInt(args[i + 1], 10);
      if (!isNaN(val) && val >= 1) {
        result.scale = val;
        i++;
      }
    } else if (args[i] === "--bg") {
      const color = parseHexColor(args[i + 1] || "");
      if (color) {
        result.bg = color;
        i++;
      }
    } else if (args[i] === "--transparent" || args[i] === "-t") {
      result.bg = { r: 0, g: 0, b: 0, alpha: 0 };
    } else if (!args[i].startsWith("-")) {
      positional.push(args[i]);
    }
  }

  if (positional.length >= 1) {
    result.count = parseInt(positional[0], 10);
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const { count, scale, bg } = parseArgs(args);

  if (!count || isNaN(count) || count < 1) {
    console.log("사용법: node scripts/batch.js <count> [옵션]");
    console.log("예: node scripts/batch.js 10");
    console.log("    node scripts/batch.js 50 --scale 5");
    console.log("    node scripts/batch.js 20 --transparent");
    console.log("    node scripts/batch.js 30 --bg ff0000");
    console.log("");
    console.log("옵션:");
    console.log("  --scale, -s        확대 비율 (기본값: 10)");
    console.log("  --bg <hex>         배경색 hex (기본값: f8f9fa)");
    console.log("  --transparent, -t  투명 배경");
    process.exit(1);
  }

  const charSize = SPRITE_SIZE * scale;
  console.log(`${count}개 캐릭터 생성 중... (scale=${scale}, ${charSize}x${charSize}px)`);

  const { weights, keys } = loadResources();

  // 출력 서브디렉토리 생성
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const batchDir = path.join(OUTPUT_DIR, `batch_${count}_x${scale}_${timestamp}`);
  fs.mkdirSync(batchDir, { recursive: true });

  for (let i = 0; i < count; i++) {
    const character = generateCharacter(weights, keys);
    const buffer = await renderCharacter(character, keys, scale, bg);

    const filename = `${String(i + 1).padStart(String(count).length, "0")}.png`;
    fs.writeFileSync(path.join(batchDir, filename), buffer);

    process.stdout.write(`\r${i + 1}/${count} 렌더링 완료`);
  }

  console.log();
  console.log(`저장됨: ${batchDir}/`);
}

main().catch((err) => {
  console.error("오류:", err.message);
  process.exit(1);
});
