import { GAME_CONFIG, TILE } from '../config.js';
import { wrapDeltaX, wrapX } from '../utils.js';

/**
 * MapManager - 鍦板浘绠＄悊鍣?
 * 澶勭悊鍦板浘鍧楃殑鐢熸垚銆佸惊鐜拰婊氬姩閫昏緫
 */
export default class MapManager {
    constructor() {
        this.mapChunks = [];
        this.lastChunkY = -GAME_CONFIG.CHUNK_SIZE;
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.chunkSize = GAME_CONFIG.CHUNK_SIZE;
        this.mapWidth = GAME_CONFIG.MAP_WIDTH;
    }

    /**
     * 鍒濆鍖栧湴鍥?
     */
    initMap() {
        this.mapChunks = [];
        this.lastChunkY = -this.chunkSize;
        // 棰勭敓鎴?3 涓潡
        for (let i = 0; i < 3; i++) {
            this.generateNewChunk();
        }
    }

    /**
     * 鐢熸垚涓€涓柊鐨勫湴鍥惧潡
     */
    generateNewChunk() {
        this.lastChunkY += this.chunkSize;
        const tiles = [];
        for (let y = 0; y < this.chunkSize; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // 10% 姒傜巼鐢熸垚闅忔満澧欏
                row.push(Math.random() < 0.1 ? TILE.WALL : TILE.FLOOR);
            }
            tiles.push(row);
        }

        this.mapChunks.push({
            y: this.lastChunkY,
            tiles: tiles
        });
    }

    /**
     * 鏇存柊鍦板浘锛堢敓鎴愭柊鍧楋紝娓呯悊鏃у潡锛?
     * @param {number} scrollY - 褰撳墠婊氬姩浣嶇疆
     * @param {number} canvasHeight - 鐢诲竷楂樺害
     */
    update(scrollY, canvasHeight) {
        // 妫€鏌ユ槸鍚﹂渶瑕佺敓鎴愭柊鍧?
        // 褰撳睆骞曞簳閮ㄦ帴杩戞渶鍚庝竴涓潡鐨勬湯灏炬椂锛岀敓鎴愭柊鍧?
        if (scrollY + canvasHeight > (this.lastChunkY + this.chunkSize) * this.tileSize) {
            this.generateNewChunk();
        }

        // 娓呯悊鏃у潡 (鍦ㄥ睆骞曚笂鏂瑰お杩滅殑鍧?
        const viewTopTileY = Math.floor(scrollY / this.tileSize);
        this.mapChunks = this.mapChunks.filter(chunk => {
            return chunk.y + this.chunkSize >= viewTopTileY - this.chunkSize;
        });
    }

    /**
     * 鑾峰彇鐗瑰畾鍧愭爣鐨勭摝鐗囩被鍨?
     */
    getTileAt(tileX, tileY) {
        // 鎵惧埌鍖呭惈璇?Y 鍧愭爣鐨勫潡
        const chunk = this.mapChunks.find(c => tileY >= c.y && tileY < c.y + this.chunkSize);
        if (chunk) {
            const localY = tileY - chunk.y;
            const wrappedX = Number.isFinite(tileX) ? wrapX(tileX, this.mapWidth) : tileX;
            if (wrappedX >= 0 && wrappedX < this.mapWidth) {
                return chunk.tiles[localY][wrappedX];
            }
        }
        return TILE.WALL; // 榛樿杩斿洖澧欏
    }

    /**
     * 缁樺埗鍦板浘
     */
        draw(ctx, view) {
        if (!view) return;
        const scrollY = view.scrollY || 0;
        const viewWidth = view.width || 0;
        const viewHeight = view.height || 0;
        const cameraX = Number.isFinite(view.cameraX) ? view.cameraX : (view.scrollX || 0) + viewWidth / 2;
        const worldWidth = Number.isFinite(view.worldWidth) ? view.worldWidth : viewWidth;        const baseWorldWidth = this.mapWidth * this.tileSize;
        const showWalls = GAME_CONFIG.BACKGROUND && GAME_CONFIG.BACKGROUND.SHOW_WALL_TILES === true;
        const repeatCount = Math.max(1, Math.ceil(worldWidth / baseWorldWidth));

        this.mapChunks.forEach(chunk => {
            // 检查块是否在视野内
            const chunkPixelY = chunk.y * this.tileSize;
            const chunkPixelHeight = this.chunkSize * this.tileSize;

            if (chunkPixelY + chunkPixelHeight >= scrollY && chunkPixelY <= scrollY + viewHeight) {
                for (let ty = 0; ty < this.chunkSize; ty++) {
                    for (let tx = 0; tx < this.mapWidth; tx++) {
                        const worldY = (chunk.y + ty) * this.tileSize;
                        const screenY = worldY - scrollY;

                        // 只绘制屏幕可见范围内的砖块
                        if (screenY > -this.tileSize && screenY < viewHeight) {
                            const tileType = chunk.tiles[ty][tx];

                            for (let repeat = 0; repeat < repeatCount; repeat++) {
                                const worldX = tx * this.tileSize + repeat * baseWorldWidth;
                                if (worldX >= worldWidth) continue;

                                const screenX = wrapDeltaX(worldX - cameraX, worldWidth) + viewWidth / 2;
                                if (screenX <= -this.tileSize || screenX >= viewWidth) continue;

                                                                                                if (!showWalls) {
                                    continue;
                                }

                                if (tileType === TILE.WALL) {
                                    ctx.fillStyle = '#333';
                                    ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                                    ctx.strokeStyle = '#555';
                                    ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                                }}
                        }
                    }
                }
            }
        });
    }
}

