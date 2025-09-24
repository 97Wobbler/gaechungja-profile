function loadImage(img) {
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
  });
}

export async function loadAllImages(keys) {
  const images = { skin: [], face: [], face2: [], hair: [] };

  const skinKeys = keys?.skin?.length
    ? keys.skin
    : Array.from({ length: 9 }, (_, i) => String(i).padStart(3, "0"));
  for (const key of skinKeys) {
    const img = new Image();
    img.src = `src/skin/${key}.png`;
    await loadImage(img);
    images.skin.push(img);
  }

  const faceKeys = keys?.face?.length
    ? keys.face
    : Array.from({ length: 9 }, (_, i) => String(i).padStart(3, "0"));
  for (const key of faceKeys) {
    const img = new Image();
    img.src = `src/face/${key}.png`;
    await loadImage(img);
    images.face.push(img);
  }

  const face2Keys = keys?.face2?.length
    ? keys.face2
    : Array.from({ length: 7 }, (_, i) => String(i).padStart(3, "0"));
  for (const key of face2Keys) {
    const img = new Image();
    img.src = `src/face2/${key}.png`;
    await loadImage(img);
    images.face2.push(img);
  }

  const hairKeys = keys?.hair?.length
    ? keys.hair
    : Array.from({ length: 25 }, (_, i) => String(i).padStart(3, "0"));
  for (const key of hairKeys) {
    const img = new Image();
    img.src = `src/hair/${key}.png`;
    await loadImage(img);
    images.hair.push(img);
  }

  return images;
}
