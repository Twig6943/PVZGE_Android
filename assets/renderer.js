/* eslint-disable prettier/prettier */
// renderer.js
// 这个文件应该在你的游戏加载后，在 index.html 中被引入。
// @ts-nocheck
import { merge } from "lodash";
import JSON5 from "json5";

// 注意：现在我们直接使用 window.electron，它是由 preload.js 提供的。
const electron = window.electron;

const gameVersion = import.meta.env.__APP_VERSION__ || '0.4.0'; // 提供一个默认版本

// --- Discord Rich Presence (来自 tmpPatch.js) ---
// 将原始对象转换为 discord-rpc 库所需的格式
const initialActivity = {
    details: "Playing version " + gameVersion,
    state: "In Menus",
    startTimestamp: Date.now(),
    largeImageKey: 'pvzge_logo',
    largeImageText: 'PvZ2 Gardendless',
    smallImageKey: 'pvzge_logo',
    smallImageText: 'PvZ2 Gardendless',
    instance: false,
    buttons: [
        { label: "Download", url: "https://pvzge.com" },
        { label: "Join Server", url: "https://discord.gg/ZEfb2tBQFW" }
    ]
};

// 更新活动状态的函数
const updateActivity = async (state, details = "Playing version " + gameVersion) => {
    const newActivity = {
        ...initialActivity,
        state: state,
        details: details,
        startTimestamp: initialActivity.startTimestamp // 保持初始时间戳
    };
    await electron.drpc.setActivity(newActivity);
};

// 初始设置 Discord 状态
electron.drpc.setActivity(initialActivity);


// --- Patcher System (来自 patcher.js) ---
const gePatcher = {
    version: "0.2.0",
    _plantFeaturesPath: "patches/jsons/features/PlantFeatures.json",
    _plantAlmanacPath: "patches/jsons/features/PlantAlmanac.json",
    // ... (所有其他路径变量保持不变)
    _levelsPath: "patches/jsons/levels",
    
    // 异步函数，用于构建完整的文件路径
    async _getFullPath(relativePath) {
        const base = await electron.fs.getAppLocalDataPath();
        // 在Node.js环境中，最好明确使用正斜杠或path.join
        // 但为了简单，这里我们直接拼接。
        return `${base}/${relativePath.replace(/\\/g, '/')}`;
    },

    async _checkKeys() { return true; },

    async initBase() {
        if (!window.cc) {
            console.error("[GE Patcher] Failed to link the game engine!");
            return false;
        }
        this._cc = window.cc;
        this._assets = window.cc.assetManager.assets;
        if (this._assets.count < 3000) {
            console.warn("[GE Patcher] Please wait for the game to load completely and retry!");
            return false;
        }
        this._jsonAssetsList = Object.values(this._assets._map).filter(item => typeof item === "object" && item.json);
        console.log("[GE Patcher] Patcher system loading...");
    },

    async _initFeatures(featuresPath, featureType, featureKey) {
        const fullPath = await this._getFullPath(featuresPath);
        if (await electron.fs.exists(fullPath)) {
            console.log(`[GE Patcher] Start loading ${featureType}...`);
            try {
                const modFeaturesText = await electron.fs.readTextFile(fullPath);
                // ... (后续的 JSON 解析和合并逻辑与原文件完全相同)
                const modFeaturesData = JSON5.parse(modFeaturesText);
                const originalFeatures = this._jsonAssetsList.find(item => item._name == featureType)?.json;
                if (originalFeatures && modFeaturesData[featureKey]) {
                   // ... merge logic
                }
            } catch (e) {
                console.error(`[GE Patcher] Failed to load ${featureType}, error: ` + e);
            }
        } else {
             console.log(`[GE Patcher] ${featureType} patch file not found, skipping...`);
        }
    },

    async _initLevels() {
        this._levelList = this._jsonAssetsList.filter(e => 
            Array.isArray(e.json?.['objects']) && e.json?.['objects'].find(e => e.objclass == 'LevelDefinition')
        );
        
        const levelsFullPath = await this._getFullPath(this._levelsPath);
        if (await electron.fs.exists(levelsFullPath)) {
            try {
                const modLevelEntries = await electron.fs.readDir(levelsFullPath);
                if (modLevelEntries.length == 0) return;

                for (const modLevelFile of modLevelEntries) {
                    if (!modLevelFile.isFile()) continue;
                    // ... (后续的关卡加载逻辑与原文件完全相同, 但需要使用electron.fs)
                    const modLevelPath = `${levelsFullPath}/${modLevelFile.name}`;
                    const modLevelData = await electron.fs.readTextFile(modLevelPath);
                    // ... merge logic
                }
            } catch (e) {
                console.error("[GE Patcher] Failed to load levels, error: " + e);
            }
        }
    },
    
    // help 函数中的 openUrl 需要修改
    async help() {
        const appLocalDataDirPath = await electron.fs.getAppLocalDataPath();
        await electron.shell.openExternal("https://pvzge.com/en/guide/mod/");
        console.log("[GE Patcher] Base Dir: " + appLocalDataDirPath + "/patches");
        // ... (其他 console.log 保持不变)
    },
    
    // ... (所有其他gePatcher的方法，如 init, initPatchs, _initProps, setPropsData 等，
    //      都需要将 t_exists, t_readTextFile, t_readDir 的调用
    //      替换为 await electron.fs.exists(fullPath) 等形式)
};


// 将 patcher 暴露到全局作用域，供游戏调用
window.gePatcher = gePatcher;

// 自动打开网站
electron.shell.openExternal("https://pvzge.com/en/download/");