import Game from './core/Game.js';
import GameLoop from './core/GameLoop.js';
import { WEAPONS } from './weapons/WeaponsData.js';
import { ASSET_MANAGER } from './assets/AssetManager.js';
import { SPRITES } from './assets/Sprites.js';

/**
 * 游戏入口文件
 */
async function init() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 设置画布分辨率为固定 600x600
    canvas.width = 600;
    canvas.height = 600;

    try {
        await ASSET_MANAGER.loadImages(Object.values(SPRITES));
    } catch (e) {
        console.warn('Failed to preload sprites:', e);
    }

    const game = new Game(ctx, canvas.width, canvas.height);

    // 注入初始武器（普通弹珠）
    game.player.weaponSystem.addWeapon(WEAPONS.BASIC);

    // 初始化游戏循环
    const loop = new GameLoop(
        (dt) => game.update(dt),
        () => game.draw()
    );

    // 事件监听
    window.addEventListener('keydown', e => game.handleInput(e, true));
    window.addEventListener('keyup', e => game.handleInput(e, false));

    // 重新开始逻辑
    game.gameOverUI.onRestart(() => {
        if (game.enterBase) {
            game.enterBase();
        }
    });

    // 启动游戏
    loop.start();
}

// 确保 DOM 加载后运行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
