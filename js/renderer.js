function shiftHueOnImageData(imageData, hueDeltaDegrees) {
  const data = imageData.data;
  const hueDelta = ((hueDeltaDegrees % 360) + 360) % 360;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const l = (max + min) / 2;
    const d = max - min;
    let s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r:
          h = 60 * (((g - b) / d) % 6);
          break;
        case g:
          h = 60 * ((b - r) / d + 2);
          break;
        case b:
          h = 60 * ((r - g) / d + 4);
          break;
      }
    }
    if (h < 0) h += 360;
    h = (h + hueDelta) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r1 = 0,
      g1 = 0,
      b1 = 0;
    if (0 <= h && h < 60) {
      r1 = c;
      g1 = x;
      b1 = 0;
    } else if (60 <= h && h < 120) {
      r1 = x;
      g1 = c;
      b1 = 0;
    } else if (120 <= h && h < 180) {
      r1 = 0;
      g1 = c;
      b1 = x;
    } else if (180 <= h && h < 240) {
      r1 = 0;
      g1 = x;
      b1 = c;
    } else if (240 <= h && h < 300) {
      r1 = x;
      g1 = 0;
      b1 = c;
    } else {
      r1 = c;
      g1 = 0;
      b1 = x;
    }
    data[i] = Math.round((r1 + m) * 255);
    data[i + 1] = Math.round((g1 + m) * 255);
    data[i + 2] = Math.round((b1 + m) * 255);
  }
  return imageData;
}

function drawImageWithOutline(
  ctx,
  compositeCanvas,
  centerX,
  centerY,
  scaledSize
) {
  const x = centerX - scaledSize / 2;
  const y = centerY - scaledSize / 2;
  const tempCtx = compositeCanvas.getContext("2d");
  const imageData = tempCtx.getImageData(
    0,
    0,
    compositeCanvas.width,
    compositeCanvas.height
  );
  const data = imageData.data;
  const outlineData = new ImageData(
    compositeCanvas.width,
    compositeCanvas.height
  );
  const outlineArray = outlineData.data;
  for (let py = 0; py < compositeCanvas.height; py++) {
    for (let px = 0; px < compositeCanvas.width; px++) {
      const index = (py * compositeCanvas.width + px) * 4;
      const alpha = data[index + 3];
      if (alpha > 0) {
        const directions = [
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
        ];
        directions.forEach((dir) => {
          const nx = px + dir.dx;
          const ny = py + dir.dy;
          if (
            nx >= 0 &&
            nx < compositeCanvas.width &&
            ny >= 0 &&
            ny < compositeCanvas.height
          ) {
            const ni = (ny * compositeCanvas.width + nx) * 4;
            const na = data[ni + 3];
            if (na === 0 || outlineArray[ni + 3] === 0) {
              outlineArray[ni] = 0;
              outlineArray[ni + 1] = 0;
              outlineArray[ni + 2] = 0;
              outlineArray[ni + 3] = alpha;
            }
          }
        });
      }
    }
  }
  const outlineCanvas = document.createElement("canvas");
  outlineCanvas.width = compositeCanvas.width;
  outlineCanvas.height = compositeCanvas.height;
  const outlineCtx = outlineCanvas.getContext("2d");
  outlineCtx.imageSmoothingEnabled = false;
  outlineCtx.putImageData(outlineData, 0, 0);
  ctx.drawImage(outlineCanvas, x, y, scaledSize, scaledSize);
  ctx.drawImage(compositeCanvas, x, y, scaledSize, scaledSize);
}

export function drawCharacter({ ctx, images, current }) {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const scale = 10;
  const scaledSize = 32 * scale;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 32;
  tempCanvas.height = 32;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.imageSmoothingEnabled = false;

  if (images.skin[current.skin])
    tempCtx.drawImage(images.skin[current.skin], 0, 0);
  if (images.face[current.face])
    tempCtx.drawImage(images.face[current.face], 0, 0);
  if (images.face2[current.face2])
    tempCtx.drawImage(images.face2[current.face2], 0, 0);
  if (images.hair[current.hair]) {
    const hairImg = images.hair[current.hair];
    const hairCanvas = document.createElement("canvas");
    hairCanvas.width = 32;
    hairCanvas.height = 32;
    const hairCtx = hairCanvas.getContext("2d");
    hairCtx.imageSmoothingEnabled = false;
    hairCtx.drawImage(hairImg, 0, 0);
    const hairData = hairCtx.getImageData(0, 0, 32, 32);
    shiftHueOnImageData(hairData, current.hairHue);
    hairCtx.putImageData(hairData, 0, 0);
    tempCtx.drawImage(hairCanvas, 0, 0);
  }

  drawImageWithOutline(ctx, tempCanvas, centerX, centerY, scaledSize);
}

export function downloadCharacter({ canvas, images, current }) {
  const downloadCanvas = document.createElement("canvas");
  downloadCanvas.width = canvas.width;
  downloadCanvas.height = canvas.height;
  const ctx = downloadCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const centerX = downloadCanvas.width / 2;
  const centerY = downloadCanvas.height / 2;
  const scale = 10;
  const scaledSize = 32 * scale;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 32;
  tempCanvas.height = 32;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.imageSmoothingEnabled = false;
  if (images.skin[current.skin])
    tempCtx.drawImage(images.skin[current.skin], 0, 0);
  if (images.face[current.face])
    tempCtx.drawImage(images.face[current.face], 0, 0);
  if (images.face2[current.face2])
    tempCtx.drawImage(images.face2[current.face2], 0, 0);
  if (images.hair[current.hair]) {
    const hairImg = images.hair[current.hair];
    const hairCanvas = document.createElement("canvas");
    hairCanvas.width = 32;
    hairCanvas.height = 32;
    const hairCtx = hairCanvas.getContext("2d");
    hairCtx.imageSmoothingEnabled = false;
    hairCtx.drawImage(hairImg, 0, 0);
    const hairData = hairCtx.getImageData(0, 0, 32, 32);
    shiftHueOnImageData(hairData, current.hairHue);
    hairCtx.putImageData(hairData, 0, 0);
    tempCtx.drawImage(hairCanvas, 0, 0);
  }

  // draw with outline
  const x = centerX - scaledSize / 2;
  const y = centerY - scaledSize / 2;
  const tmpCtx2 = tempCanvas.getContext("2d");
  const imageData = tmpCtx2.getImageData(
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );
  const data = imageData.data;
  const outlineData = new ImageData(tempCanvas.width, tempCanvas.height);
  const outlineArray = outlineData.data;
  for (let py = 0; py < tempCanvas.height; py++) {
    for (let px = 0; px < tempCanvas.width; px++) {
      const index = (py * tempCanvas.width + px) * 4;
      const alpha = data[index + 3];
      if (alpha > 0) {
        const dirs = [
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
        ];
        dirs.forEach((dir) => {
          const nx = px + dir.dx;
          const ny = py + dir.dy;
          if (
            nx >= 0 &&
            nx < tempCanvas.width &&
            ny >= 0 &&
            ny < tempCanvas.height
          ) {
            const ni = (ny * tempCanvas.width + nx) * 4;
            const na = data[ni + 3];
            if (na === 0 || outlineArray[ni + 3] === 0) {
              outlineArray[ni] = 0;
              outlineArray[ni + 1] = 0;
              outlineArray[ni + 2] = 0;
              outlineArray[ni + 3] = alpha;
            }
          }
        });
      }
    }
  }
  const outlineCanvas = document.createElement("canvas");
  outlineCanvas.width = tempCanvas.width;
  outlineCanvas.height = tempCanvas.height;
  const octx = outlineCanvas.getContext("2d");
  octx.imageSmoothingEnabled = false;
  octx.putImageData(outlineData, 0, 0);
  ctx.drawImage(outlineCanvas, x, y, scaledSize, scaledSize);
  ctx.drawImage(tempCanvas, x, y, scaledSize, scaledSize);

  const link = document.createElement("a");
  link.download = "gaechungja.png";
  link.href = downloadCanvas.toDataURL("image/png");
  link.click();
}
