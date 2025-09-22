class CharacterGenerator {
    constructor() {
        this.canvas = document.getElementById('characterCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 최근접 이웃 보간 방식으로 설정 (픽셀 아트 스타일)
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        this.images = {
            skin: [],
            face: [],
            hair: []
        };
        this.currentCharacter = {
            skin: 0,
            face: 0,
            hair: 0
        };
        
        this.init();
    }
    
    async init() {
        await this.loadImages();
        this.setupEventListeners();
        this.generateCharacter();
    }
    
    async loadImages() {
        // 스킨 이미지 로드
        for (let i = 0; i < 1; i++) {
            const img = new Image();
            img.src = `src/skin/${String(i).padStart(3, '0')}.png`;
            await this.loadImage(img);
            this.images.skin.push(img);
        }
        
        // 얼굴 이미지 로드
        for (let i = 0; i < 4; i++) {
            const img = new Image();
            img.src = `src/face/${String(i).padStart(3, '0')}.png`;
            await this.loadImage(img);
            this.images.face.push(img);
        }
        
        // 머리카락 이미지 로드
        for (let i = 0; i < 11; i++) {
            const img = new Image();
            img.src = `src/hair/${String(i).padStart(3, '0')}.png`;
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
        });
        
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadCharacter();
        });
    }
    
    generateCharacter() {
        // 랜덤하게 캐릭터 생성
        this.currentCharacter = {
            skin: Math.floor(Math.random() * this.images.skin.length),
            face: Math.floor(Math.random() * this.images.face.length),
            hair: Math.floor(Math.random() * this.images.hair.length)
        };
        
        this.drawCharacter();
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
        
        // 머리카락 그리기
        if (this.images.hair[this.currentCharacter.hair]) {
            tempCtx.drawImage(this.images.hair[this.currentCharacter.hair], 0, 0);
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
        
        // 머리카락 그리기
        if (this.images.hair[this.currentCharacter.hair]) {
            tempCtx.drawImage(this.images.hair[this.currentCharacter.hair], 0, 0);
        }
        
        // 합성된 이미지에 아웃라인 적용 (투명 배경)
        this.drawImageWithOutlineForDownload(tempCanvas, downloadCtx, centerX, centerY, scaledSize);
        
        // 다운로드
        const link = document.createElement('a');
        link.download = `gaechungja.png`;
        link.href = downloadCanvas.toDataURL('image/png');
        link.click();
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
