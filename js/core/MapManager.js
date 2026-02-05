import { GAME_CONFIG, TILE } from '../config.js';

/**
 * MapManager - 地图管理器
 * 处理地图块的生成、循环和滚动逻辑
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
     * 初始化地图
     */
    initMap() {
        this.mapChunks = [];
        this.lastChunkY = -this.chunkSize;
        // 预生成 3 个块
        for (let i = 0; i < 3; i++) {
            this.generateNewChunk();
        }
    }

    /**
     * 生成一个新的地图块
     */
    generateNewChunk() {
        this.lastChunkY += this.chunkSize;
        const tiles = [];
        for (let y = 0; y < this.chunkSize; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // 边界必定是墙
                if (x === 0 || x === this.mapWidth - 1) {
                    row.push(TILE.WALL);
                } else {
                    // 10% 概率生成随机墙壁
                    row.push(Math.random() < 0.1 ? TILE.WALL : TILE.FLOOR);
                }
            }
            tiles.push(row);
        }

        this.mapChunks.push({
            y: this.lastChunkY,
            tiles: tiles
        });
    }

    /**
     * 更新地图（生成新块，清理旧块）
     * @param {number} scrollY - 当前滚动位置
     * @param {number} canvasHeight - 画布高度
     */
    update(scrollY, canvasHeight) {
        // 检查是否需要生成新块
        // 当屏幕底部接近最后一个块的末尾时，生成新块
        if (scrollY + canvasHeight > (this.lastChunkY + this.chunkSize) * this.tileSize) {
            this.generateNewChunk();
        }

        // 清理旧块 (在屏幕上方太远的块)
        const viewTopTileY = Math.floor(scrollY / this.tileSize);
        this.mapChunks = this.mapChunks.filter(chunk => {
            return chunk.y + this.chunkSize >= viewTopTileY - this.chunkSize;
        });
    }

    /**
     * 获取特定坐标的瓦片类型
     */
    getTileAt(tileX, tileY) {
        // 找到包含该 Y 坐标的块
        const chunk = this.mapChunks.find(c => tileY >= c.y && tileY < c.y + this.chunkSize);
        if (chunk) {
            const localY = tileY - chunk.y;
            if (tileX >= 0 && tileX < this.mapWidth) {
                return chunk.tiles[localY][tileX];
            }
        }
        return TILE.WALL; // 默认返回墙壁
    }

    /**
     * 绘制地图
     */
    draw(ctx, scrollY, canvasWidth, canvasHeight) {
        this.mapChunks.forEach(chunk => {
            // 检查块是否在视野内
            const chunkPixelY = chunk.y * this.tileSize;
            const chunkPixelHeight = this.chunkSize * this.tileSize;

            if (chunkPixelY + chunkPixelHeight >= scrollY && chunkPixelY <= scrollY + canvasHeight) {
                for (let ty = 0; ty < this.chunkSize; ty++) {
                    for (let tx = 0; tx < this.mapWidth; tx++) {
                        const worldY = (chunk.y + ty) * this.tileSize;
                        const screenY = worldY - scrollY;

                        // 只绘制屏幕可见范围内的瓦片
                        if (screenY > -this.tileSize && screenY < canvasHeight) {
                            const tileType = chunk.tiles[ty][tx];
                            ctx.fillStyle = tileType === TILE.WALL ? '#333' : '#2a2a2a';
                            ctx.fillRect(tx * this.tileSize, screenY, this.tileSize, this.tileSize);

                            if (tileType === TILE.WALL) {
                                ctx.strokeStyle = '#555';
                                ctx.strokeRect(tx * this.tileSize, screenY, this.tileSize, this.tileSize);
                            }
                        }
                    }
                }
            }
        });
    }
}
