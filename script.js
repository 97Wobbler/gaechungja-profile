class CharacterGenerator {
    constructor() {
        this.canvas = document.getElementById('characterCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 최근접 이웃 보간 방식으로 설정 (픽셀 아트 스타일)
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // 효과음 로딩 (사용자가 파일만 넣으면 동작)
        this.sfx = {
            generate: new Audio('assets/audio/soundeffect.mp3'),
        };
        Object.values(this.sfx).forEach(a => { a.preload = 'auto'; a.volume = 0.5; });
        
        this.weights = {};

        this.images = {
            skin: [],
            face: [],
            face2: [],
            hair: []
        };
        this.currentCharacter = {
            skin: 0,
            face: 0,
            face2: 0,
            hair: 0,
            hairHue: 0
        };
        
        this.init();
    }
    
    async init() {
        await this.loadResourcesFromJson();
        await this.loadImages();
        this.setupEventListeners();
        this.generateCharacter();
    }

    async loadResourcesFromJson() {
        try {
            const res = await fetch('assets/data/resources.json', { cache: 'no-cache' });
            const json = await res.json();
            const parts = json?.parts || {};
            
            // 전체 JSON 데이터 저장 (scoreFactor 접근용)
            this.resourceData = json;
            
            // weights를 JSON 기반으로 재설정 (존재 시에만)
            const toWeights = (arr) => Array.isArray(arr) ? arr.map(x => Number(x?.possibility ?? 1) || 0) : [];
            if (parts.skin) this.weights.skin = toWeights(parts.skin);
            if (parts.face) this.weights.face = toWeights(parts.face);
            if (parts.face2) this.weights.face2 = toWeights(parts.face2);
            if (parts.hair) this.weights.hair = toWeights(parts.hair);
            // 파일 키 목록 저장 (필요 시 경로 커스터마이즈 가능)
            this.keys = {
                skin: (parts.skin || []).map(x => x.key),
                face: (parts.face || []).map(x => x.key),
                face2: (parts.face2 || []).map(x => x.key),
                hair: (parts.hair || []).map(x => x.key),
            };
        } catch (_) {
            // 실패 시 기본 weights/keys 유지
            this.keys = this.keys || {};
        }
    }
    
    async loadImages() {
        // 스킨 이미지 로드 (JSON 키 우선, 없으면 개수 기반)
        const skinKeys = this.keys?.skin?.length ? this.keys.skin : Array.from({ length: 9 }, (_, i) => String(i).padStart(3, '0'));
        for (const skinKey of skinKeys) {
            const img = new Image();
            img.src = `src/skin/${skinKey}.png`;
            await this.loadImage(img);
            this.images.skin.push(img);
        }
        
        // 얼굴 이미지 로드
        const faceKeys = this.keys?.face?.length ? this.keys.face : Array.from({ length: 9 }, (_, i) => String(i).padStart(3, '0'));
        for (const faceKey of faceKeys) {
            const img = new Image();
            img.src = `src/face/${faceKey}.png`;
            await this.loadImage(img);
            this.images.face.push(img);
        }

        // 얼굴2 이미지 로드
        const face2Keys = this.keys?.face2?.length ? this.keys.face2 : Array.from({ length: 7 }, (_, i) => String(i).padStart(3, '0'));
        for (const face2Key of face2Keys) {
            const img = new Image();
            img.src = `src/face2/${face2Key}.png`;
            await this.loadImage(img);
            this.images.face2.push(img);
        }
        
        // 머리카락 이미지 로드
        const hairKeys = this.keys?.hair?.length ? this.keys.hair : Array.from({ length: 25 }, (_, i) => String(i).padStart(3, '0'));
        for (const hairKey of hairKeys) {
            const img = new Image();
            img.src = `src/hair/${hairKey}.png`;
            await this.loadImage(img);
            this.images.hair.push(img);
        }
    }
    
    loadImage(img) {
        return new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
        });
    }
    
    setupEventListeners() {
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateCharacter();
            this.playSfx('generate');
        });
        
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadCharacter();
        });
    }

    playSfx(name) {
        const audio = this.sfx?.[name];
        if (!audio) return;
        try {
            audio.currentTime = 0;
            audio.play();
        } catch (_) {}
    }
    

    // 레이어 이름과 길이를 받아 가중치 기반 인덱스 선택 (fallback: 균등)
    pickIndexWithWeights(layerName, length) {
        const layerWeights = this.weights?.[layerName];
        if (Array.isArray(layerWeights) && layerWeights.length === length) {
            // 가중치 기반 선택
            const total = layerWeights.reduce((sum, w) => sum + (Number.isFinite(w) ? Math.max(0, w) : 0), 0);
            if (total <= 0) return Math.floor(Math.random() * length);
            let r = Math.random() * total;
            for (let i = 0; i < layerWeights.length; i++) {
                const w = Number.isFinite(layerWeights[i]) ? Math.max(0, layerWeights[i]) : 0;
                r -= w;
                if (r < 0) return i;
            }
            return layerWeights.length - 1;
        }
        return Math.floor(Math.random() * length);
    }

    generateCharacter() {
        // 랜덤하게 캐릭터 생성
        this.currentCharacter = {
            skin: this.pickIndexWithWeights('skin', this.images.skin.length),
            face: this.pickIndexWithWeights('face', this.images.face.length),
            face2: this.pickIndexWithWeights('face2', this.images.face2.length),
            hair: this.pickIndexWithWeights('hair', this.images.hair.length),
            // 머리카락 Hue 무작위 (12단계: 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330)
            hairHue: Math.floor(Math.random() * 12) * 30
        };
        
        this.drawCharacter();
        this.updateRarity();
    }

    // ImageData의 Hue를 변경 (HSB/HSL에서 H만 회전)
    shiftHueOnImageData(imageData, hueDeltaDegrees) {
        const data = imageData.data;
        const hueDelta = ((hueDeltaDegrees % 360) + 360) % 360; // 0..359
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a === 0) continue; // 완전 투명은 스킵
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            // RGB -> HSL
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = 0;
            const l = (max + min) / 2;
            const d = max - min;
            let s = 0;
            if (d !== 0) {
                s = d / (1 - Math.abs(2 * l - 1));
                switch (max) {
                    case r: h = 60 * (((g - b) / d) % 6); break;
                    case g: h = 60 * (((b - r) / d) + 2); break;
                    case b: h = 60 * (((r - g) / d) + 4); break;
                }
            }
            if (h < 0) h += 360;
            // Hue 회전
            h = (h + hueDelta) % 360;
            // HSL -> RGB
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = l - c / 2;
            let r1 = 0, g1 = 0, b1 = 0;
            if (0 <= h && h < 60) { r1 = c; g1 = x; b1 = 0; }
            else if (60 <= h && h < 120) { r1 = x; g1 = c; b1 = 0; }
            else if (120 <= h && h < 180) { r1 = 0; g1 = c; b1 = x; }
            else if (180 <= h && h < 240) { r1 = 0; g1 = x; b1 = c; }
            else if (240 <= h && h < 300) { r1 = x; g1 = 0; b1 = c; }
            else { r1 = c; g1 = 0; b1 = x; }
            data[i]     = Math.round((r1 + m) * 255);
            data[i + 1] = Math.round((g1 + m) * 255);
            data[i + 2] = Math.round((b1 + m) * 255);
        }
        return imageData;
    }
    
    drawCharacter() {
        // 캔버스 초기화
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경색 설정 (미리보기용)
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 이미지들을 순서대로 그리기 (skin -> face -> hair)
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const scale = 10; // 32px -> 320px (10배 확대)
        const scaledSize = 32 * scale; // 160px
        
        // 임시 캔버스에 모든 레이어를 합성
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 32;
        tempCanvas.height = 32;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.imageSmoothingEnabled = false;
        
        // 스킨 그리기
        if (this.images.skin[this.currentCharacter.skin]) {
            tempCtx.drawImage(this.images.skin[this.currentCharacter.skin], 0, 0);
        }
        
        // 얼굴 그리기
        if (this.images.face[this.currentCharacter.face]) {
            tempCtx.drawImage(this.images.face[this.currentCharacter.face], 0, 0);
        }
        
        // 얼굴2 그리기 (face 위 레이어)
        if (this.images.face2[this.currentCharacter.face2]) {
            tempCtx.drawImage(this.images.face2[this.currentCharacter.face2], 0, 0);
        }
        
        // 머리카락 그리기
        if (this.images.hair[this.currentCharacter.hair]) {
            // 머리카락 Hue 변환 후 합성
            const hairImg = this.images.hair[this.currentCharacter.hair];
            const hairCanvas = document.createElement('canvas');
            hairCanvas.width = 32;
            hairCanvas.height = 32;
            const hairCtx = hairCanvas.getContext('2d');
            hairCtx.imageSmoothingEnabled = false;
            hairCtx.drawImage(hairImg, 0, 0);
            const hairData = hairCtx.getImageData(0, 0, 32, 32);
            this.shiftHueOnImageData(hairData, this.currentCharacter.hairHue);
            hairCtx.putImageData(hairData, 0, 0);
            tempCtx.drawImage(hairCanvas, 0, 0);
        }
        
        // 합성된 이미지에 아웃라인 적용
        this.drawImageWithOutline(tempCanvas, centerX, centerY, scaledSize);
    }
    
    drawImageWithOutline(compositeCanvas, centerX, centerY, scaledSize) {
        const x = centerX - scaledSize / 2;
        const y = centerY - scaledSize / 2;
        
        // 합성된 캔버스의 이미지 데이터 가져오기
        const tempCtx = compositeCanvas.getContext('2d');
        const imageData = tempCtx.getImageData(0, 0, compositeCanvas.width, compositeCanvas.height);
        const data = imageData.data;
        
        // 아웃라인용 이미지 데이터 생성
        const outlineData = new ImageData(compositeCanvas.width, compositeCanvas.height);
        const outlineArray = outlineData.data;
        
        // 원본 픽셀을 검사하여 아웃라인 생성
        for (let y = 0; y < compositeCanvas.height; y++) {
            for (let x = 0; x < compositeCanvas.width; x++) {
                const index = (y * compositeCanvas.width + x) * 4;
                const alpha = data[index + 3];
                
                if (alpha > 0) {
                    // 현재 픽셀이 투명하지 않으면, 주변 4방향에 아웃라인 추가
                    const directions = [
                        { dx: -1, dy: 0 },  // 왼쪽
                        { dx: 1, dy: 0 },   // 오른쪽
                        { dx: 0, dy: -1 },  // 위
                        { dx: 0, dy: 1 }    // 아래
                    ];
                    
                    directions.forEach(dir => {
                        const newX = x + dir.dx;
                        const newY = y + dir.dy;
                        
                        if (newX >= 0 && newX < compositeCanvas.width && newY >= 0 && newY < compositeCanvas.height) {
                            const newIndex = (newY * compositeCanvas.width + newX) * 4;
                            const newAlpha = data[newIndex + 3];
                            
                            // 주변 픽셀이 투명하거나 아웃라인이 아직 설정되지 않은 경우
                            if (newAlpha === 0 || outlineArray[newIndex + 3] === 0) {
                                outlineArray[newIndex] = 0;     // R
                                outlineArray[newIndex + 1] = 0; // G
                                outlineArray[newIndex + 2] = 0; // B
                                outlineArray[newIndex + 3] = alpha; // A (원본과 동일한 알파)
                            }
                        }
                    });
                }
            }
        }
        
        // 아웃라인을 임시 캔버스에 그리기
        const outlineCanvas = document.createElement('canvas');
        outlineCanvas.width = compositeCanvas.width;
        outlineCanvas.height = compositeCanvas.height;
        const outlineCtx = outlineCanvas.getContext('2d');
        outlineCtx.imageSmoothingEnabled = false;
        outlineCtx.putImageData(outlineData, 0, 0);
        
        // 아웃라인을 메인 캔버스에 그리기
        this.ctx.drawImage(outlineCanvas, x, y, scaledSize, scaledSize);
        
        // 원본 합성 이미지를 메인 캔버스에 그리기
        this.ctx.drawImage(compositeCanvas, x, y, scaledSize, scaledSize);
    }
    
    downloadCharacter() {
        // 다운로드용 캔버스 생성 (투명 배경)
        const downloadCanvas = document.createElement('canvas');
        downloadCanvas.width = this.canvas.width;
        downloadCanvas.height = this.canvas.height;
        const downloadCtx = downloadCanvas.getContext('2d');
        
        // 최근접 이웃 보간 방식 설정
        downloadCtx.imageSmoothingEnabled = false;
        downloadCtx.mozImageSmoothingEnabled = false;
        downloadCtx.webkitImageSmoothingEnabled = false;
        downloadCtx.msImageSmoothingEnabled = false;
        
        // 배경은 투명하게 두고 캐릭터만 그리기
        const centerX = downloadCanvas.width / 2;
        const centerY = downloadCanvas.height / 2;
        const scale = 10; // 32px -> 320px (10배 확대)
        const scaledSize = 32 * scale; // 320px
        
        // 임시 캔버스에 모든 레이어를 합성
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 32;
        tempCanvas.height = 32;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.imageSmoothingEnabled = false;
        
        // 스킨 그리기
        if (this.images.skin[this.currentCharacter.skin]) {
            tempCtx.drawImage(this.images.skin[this.currentCharacter.skin], 0, 0);
        }
        
        // 얼굴 그리기
        if (this.images.face[this.currentCharacter.face]) {
            tempCtx.drawImage(this.images.face[this.currentCharacter.face], 0, 0);
        }
        
        // 얼굴2 그리기 (face 위 레이어)
        if (this.images.face2[this.currentCharacter.face2]) {
            tempCtx.drawImage(this.images.face2[this.currentCharacter.face2], 0, 0);
        }
        
        // 머리카락 그리기 (다운로드용에도 동일 적용)
        if (this.images.hair[this.currentCharacter.hair]) {
            const hairImg = this.images.hair[this.currentCharacter.hair];
            const hairCanvas = document.createElement('canvas');
            hairCanvas.width = 32;
            hairCanvas.height = 32;
            const hairCtx = hairCanvas.getContext('2d');
            hairCtx.imageSmoothingEnabled = false;
            hairCtx.drawImage(hairImg, 0, 0);
            const hairData = hairCtx.getImageData(0, 0, 32, 32);
            this.shiftHueOnImageData(hairData, this.currentCharacter.hairHue);
            hairCtx.putImageData(hairData, 0, 0);
            tempCtx.drawImage(hairCanvas, 0, 0);
        }
        
        // 합성된 이미지에 아웃라인 적용 (투명 배경)
        this.drawImageWithOutlineForDownload(tempCanvas, downloadCtx, centerX, centerY, scaledSize);
        
        // 다운로드
        const link = document.createElement('a');
        link.download = `gaechungja.png`;
        link.href = downloadCanvas.toDataURL('image/png');
        link.click();
    }

    // scoreFactor 기반 희귀도 스코어 계산 (높을수록 희귀)
    computeRarityScore() {
        const getScoreFactor = (layerName, index) => {
            // this.keys는 키 배열이므로, 실제 파트 데이터를 찾아야 함
            if (!this.resourceData?.parts?.[layerName]) return 1.0;
            const parts = this.resourceData.parts[layerName];
            if (!parts.length || index >= parts.length) return 1.0;
            return Number.isFinite(parts[index]?.scoreFactor) ? parts[index].scoreFactor : 1.0;
        };
        
        const skinScore = getScoreFactor('skin', this.currentCharacter.skin);
        const faceScore = getScoreFactor('face', this.currentCharacter.face);
        const face2Score = getScoreFactor('face2', this.currentCharacter.face2);
        const hairScore = getScoreFactor('hair', this.currentCharacter.hair);
        
        // 각 레이어의 scoreFactor 합산 (높을수록 희귀)
        return skinScore + faceScore + face2Score + hairScore;
    }

    // 점수 기반 등급 계산
    scoreToGrade(score) {
        if (score >= 16) return 'SSSS';
        if (score >= 13) return 'SSS';
        if (score >= 10) return 'SS';
        if (score >= 7) return 'S';
        if (score >= 5) return 'A';
        if (score >= 4) return 'B';
        if (score >= 3) return 'C';
        return 'N';
    }

    // 희귀도 UI 업데이트
    updateRarity() {
        const el = document.getElementById('rarity');
        if (!el) return;
        const score = this.computeRarityScore();
        const grade = this.scoreToGrade(score);
        
        // 등급에 맞는 CSS 클래스 적용
        const gradeClass = `rank-${grade.toLowerCase()}`;
        el.innerHTML = `희귀도: <span class="${gradeClass}" style="font-weight: bold;">${grade}</span>`;
    }
    
    drawImageWithOutlineForDownload(compositeCanvas, ctx, centerX, centerY, scaledSize) {
        const x = centerX - scaledSize / 2;
        const y = centerY - scaledSize / 2;
        
        // 합성된 캔버스의 이미지 데이터 가져오기
        const tempCtx = compositeCanvas.getContext('2d');
        const imageData = tempCtx.getImageData(0, 0, compositeCanvas.width, compositeCanvas.height);
        const data = imageData.data;
        
        // 아웃라인용 이미지 데이터 생성
        const outlineData = new ImageData(compositeCanvas.width, compositeCanvas.height);
        const outlineArray = outlineData.data;
        
        // 원본 픽셀을 검사하여 아웃라인 생성
        for (let y = 0; y < compositeCanvas.height; y++) {
            for (let x = 0; x < compositeCanvas.width; x++) {
                const index = (y * compositeCanvas.width + x) * 4;
                const alpha = data[index + 3];
                
                if (alpha > 0) {
                    // 현재 픽셀이 투명하지 않으면, 주변 4방향에 아웃라인 추가
                    const directions = [
                        { dx: -1, dy: 0 },  // 왼쪽
                        { dx: 1, dy: 0 },   // 오른쪽
                        { dx: 0, dy: -1 },  // 위
                        { dx: 0, dy: 1 }    // 아래
                    ];
                    
                    directions.forEach(dir => {
                        const newX = x + dir.dx;
                        const newY = y + dir.dy;
                        
                        if (newX >= 0 && newX < compositeCanvas.width && newY >= 0 && newY < compositeCanvas.height) {
                            const newIndex = (newY * compositeCanvas.width + newX) * 4;
                            const newAlpha = data[newIndex + 3];
                            
                            // 주변 픽셀이 투명하거나 아웃라인이 아직 설정되지 않은 경우
                            if (newAlpha === 0 || outlineArray[newIndex + 3] === 0) {
                                outlineArray[newIndex] = 0;     // R
                                outlineArray[newIndex + 1] = 0; // G
                                outlineArray[newIndex + 2] = 0; // B
                                outlineArray[newIndex + 3] = alpha; // A (원본과 동일한 알파)
                            }
                        }
                    });
                }
            }
        }
        
        // 아웃라인을 임시 캔버스에 그리기
        const outlineCanvas = document.createElement('canvas');
        outlineCanvas.width = compositeCanvas.width;
        outlineCanvas.height = compositeCanvas.height;
        const outlineCtx = outlineCanvas.getContext('2d');
        outlineCtx.imageSmoothingEnabled = false;
        outlineCtx.putImageData(outlineData, 0, 0);
        
        // 아웃라인을 다운로드 캔버스에 그리기
        ctx.drawImage(outlineCanvas, x, y, scaledSize, scaledSize);
        
        // 원본 합성 이미지를 다운로드 캔버스에 그리기
        ctx.drawImage(compositeCanvas, x, y, scaledSize, scaledSize);
    }
}

// 페이지 로드 시 캐릭터 생성기 초기화
document.addEventListener('DOMContentLoaded', () => {
    new CharacterGenerator();
});
