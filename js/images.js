// 이미지 캐시
const imageCache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * 온디맨드 이미지 로딩 - 캐시 사용
 * @param {string} layer - 레이어 이름 (skin, face, face2, hair)
 * @param {number} index - 이미지 인덱스
 * @param {object} keys - 레이어별 키 배열
 * @returns {Promise<HTMLImageElement>}
 */
export async function getImage(layer, index, keys) {
  const cacheKey = `${layer}:${index}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }
  const key = keys?.[layer]?.[index] ?? String(index).padStart(3, "0");
  const src = `src/${layer}/${key}.png`;
  const img = await loadImage(src);
  imageCache.set(cacheKey, img);
  return img;
}

/**
 * 캐릭터 생성에 필요한 4장의 이미지를 병렬로 로드
 * @param {object} current - 현재 캐릭터 인덱스 (skin, face, face2, hair)
 * @param {object} keys - 레이어별 키 배열
 * @returns {Promise<{skin: HTMLImageElement[], face: HTMLImageElement[], face2: HTMLImageElement[], hair: HTMLImageElement[]}>}
 */
export async function getImagesForCharacter(current, keys) {
  const [skin, face, face2, hair] = await Promise.all([
    getImage("skin", current.skin, keys),
    getImage("face", current.face, keys),
    getImage("face2", current.face2, keys),
    getImage("hair", current.hair, keys),
  ]);
  return { skin: [skin], face: [face], face2: [face2], hair: [hair] };
}

/**
 * @deprecated 하위 호환성을 위해 유지. 온디맨드 방식 권장.
 * 모든 이미지를 한꺼번에 로드
 */
export async function loadAllImages(keys) {
  const images = { skin: [], face: [], face2: [], hair: [] };

  const skinKeys = keys?.skin?.length
    ? keys.skin
    : Array.from({ length: 9 }, (_, i) => String(i).padStart(3, "0"));
  for (const key of skinKeys) {
    const img = await loadImage(`src/skin/${key}.png`);
    images.skin.push(img);
  }

  const faceKeys = keys?.face?.length
    ? keys.face
    : Array.from({ length: 9 }, (_, i) => String(i).padStart(3, "0"));
  for (const key of faceKeys) {
    const img = await loadImage(`src/face/${key}.png`);
    images.face.push(img);
  }

  const face2Keys = keys?.face2?.length
    ? keys.face2
    : Array.from({ length: 12 }, (_, i) => String(i).padStart(3, "0"));
  for (const key of face2Keys) {
    const img = await loadImage(`src/face2/${key}.png`);
    images.face2.push(img);
  }

  const hairKeys = keys?.hair?.length
    ? keys.hair
    : Array.from({ length: 26 }, (_, i) => String(i).padStart(3, "0"));
  for (const key of hairKeys) {
    const img = await loadImage(`src/hair/${key}.png`);
    images.hair.push(img);
  }

  return images;
}
