// Byte Miner: Core Collapse - Storage System

class StorageManager {
    constructor() {
        this.saveKey = 'byteMinerSave';
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        this.defaultSave = this.createDefaultSave();
    }

    createDefaultSave() {
        return {
            version: '1.0.0',
            bytes: 0,
            totalBytes: 0,
            totalClicks: 0,
            coreFragments: 0,
            quantumKeys: 0,
            prestigeCount: 0,
            
            // Upgrade levels
            upgrades: {},
            
            // Achievement progress
            achievements: {},
            
            // Statistics
            stats: {
                startTime: Date.now(),
                totalTimePlayed: 0,
                lastSave: Date.now(),
                bytesEarned: 0,
                upgradesPurchased: 0,
                achievementsUnlocked: 0,
                offlineEarnings: 0
            },
            
            // Settings
            settings: {
                theme: 'terminal',
                notifications: true,
                autoSave: true,
                showAnimations: true,
                soundEnabled: true
            },
            
            // Unlocks
            unlocks: {
                tier2: false,
                tier3: false,
                tier4: false,
                tier5: false,
                quantumLab: false,
                aiAssistant: false,
                themes: ['terminal']
            },
            
            // AI Assistant state
            aiAssistant: {
                active: false,
                clickRate: 0,
                totalClicks: 0,
                unlocked: false
            }
        };
    }

    save(gameState) {
        try {
            // Update save timestamp
            gameState.stats.lastSave = Date.now();
            gameState.stats.totalTimePlayed += Date.now() - (gameState.stats.sessionStart || gameState.stats.startTime);
            gameState.stats.sessionStart = Date.now();
            
            // Validate data before saving
            if (!Utils.validateSaveData(gameState)) {
                console.error('Invalid save data detected');
                return false;
            }
            
            const saveData = Utils.encodeSave(gameState);
            localStorage.setItem(this.saveKey, saveData);
            
            if (gameState.settings.notifications) {
                Utils.createNotification('Game saved!', 'success', 1500);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            Utils.createNotification('Failed to save game!', 'error');
            return false;
        }
    }

    load() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            
            if (!saveData) {
                console.log('No save data found, creating new game');
                return this.createDefaultSave();
            }
            
            const decodedData = Utils.decodeSave(saveData);
            
            if (!decodedData || !Utils.validateSaveData(decodedData)) {
                console.error('Corrupted save data detected');
                Utils.createNotification('Save file corrupted! Starting fresh.', 'warning');
                return this.createDefaultSave();
            }
            
            // Merge with default save to handle new fields
            const mergedData = this.mergeSaveData(decodedData, this.createDefaultSave());
            
            // Calculate offline progress
            if (mergedData.stats.lastSave) {
                const offlineTime = Utils.calculateOfflineTime(mergedData.stats.lastSave);
                if (offlineTime > 60000) { // More than 1 minute offline
                    mergedData.offlineTime = offlineTime;
                }
            }
            
            mergedData.stats.sessionStart = Date.now();
            
            Utils.createNotification('Game loaded successfully!', 'success');
            return mergedData;
            
        } catch (error) {
            console.error('Failed to load game:', error);
            Utils.createNotification('Failed to load game! Starting fresh.', 'error');
            return this.createDefaultSave();
        }
    }

    mergeSaveData(loadedData, defaultData) {
        const merged = Utils.deepClone(defaultData);
        
        // Recursively merge objects
        function mergeObjects(target, source) {
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        if (!target[key] || typeof target[key] !== 'object') {
                            target[key] = {};
                        }
                        mergeObjects(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
        }
        
        mergeObjects(merged, loadedData);
        return merged;
    }

    exportSave(gameState) {
        try {
            const saveData = Utils.encodeSave(gameState);
            const blob = new Blob([saveData], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `ByteMiner_Save_${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Utils.createNotification('Save exported successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Failed to export save:', error);
            Utils.createNotification('Failed to export save!', 'error');
            return false;
        }
    }

    importSave(fileContent) {
        try {
            const decodedData = Utils.decodeSave(fileContent.trim());
            
            if (!decodedData || !Utils.validateSaveData(decodedData)) {
                Utils.createNotification('Invalid save file!', 'error');
                return null;
            }
            
            Utils.createNotification('Save imported successfully!', 'success');
            return decodedData;
        } catch (error) {
            console.error('Failed to import save:', error);
            Utils.createNotification('Invalid save file format!', 'error');
            return null;
        }
    }

    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            Utils.createNotification('Save deleted!', 'warning');
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            Utils.createNotification('Failed to delete save!', 'error');
            return false;
        }
    }

    startAutoSave(gameState) {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        if (gameState.settings.autoSave) {
            this.autoSaveTimer = setInterval(() => {
                this.save(gameState);
            }, this.autoSaveInterval);
        }
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // Backup save to prevent data loss
    createBackup(gameState) {
        try {
            const backupData = Utils.encodeSave(gameState);
            localStorage.setItem(this.saveKey + '_backup', backupData);
            return true;
        } catch (error) {
            console.error('Failed to create backup:', error);
            return false;
        }
    }

    restoreBackup() {
        try {
            const backupData = localStorage.getItem(this.saveKey + '_backup');
            
            if (!backupData) {
                Utils.createNotification('No backup found!', 'warning');
                return null;
            }
            
            const decodedData = Utils.decodeSave(backupData);
            
            if (!decodedData || !Utils.validateSaveData(decodedData)) {
                Utils.createNotification('Backup file corrupted!', 'error');
                return null;
            }
            
            Utils.createNotification('Backup restored!', 'success');
            return decodedData;
        } catch (error) {
            console.error('Failed to restore backup:', error);
            Utils.createNotification('Failed to restore backup!', 'error');
            return null;
        }
    }

    // Handle browser storage events
    handleStorageEvent(event) {
        if (event.key === this.saveKey && event.newValue) {
            // Game was saved in another tab
            Utils.createNotification('Game updated in another tab!', 'info');
        }
    }

    // Check storage availability
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Get storage usage info
    getStorageInfo() {
        if (!this.isStorageAvailable()) {
            return { available: false };
        }
        
        try {
            const saveData = localStorage.getItem(this.saveKey);
            const backupData = localStorage.getItem(this.saveKey + '_backup');
            
            return {
                available: true,
                saveSize: saveData ? saveData.length : 0,
                backupSize: backupData ? backupData.length : 0,
                lastSave: saveData ? 'Available' : 'None',
                lastBackup: backupData ? 'Available' : 'None'
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    // Clear all data (hard reset)
    clearAllData() {
        try {
            localStorage.removeItem(this.saveKey);
            localStorage.removeItem(this.saveKey + '_backup');
            this.stopAutoSave();
            Utils.createNotification('All data cleared!', 'warning');
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            Utils.createNotification('Failed to clear data!', 'error');
            return false;
        }
    }
}

// Initialize storage manager
const Storage = new StorageManager();

// Handle storage events from other tabs
window.addEventListener('storage', (event) => {
    Storage.handleStorageEvent(event);
});

// Handle page unload to save progress
window.addEventListener('beforeunload', () => {
    if (window.game && window.game.gameState) {
        Storage.save(window.game.gameState);
    }
});

// Export for other modules
window.Storage = Storage;