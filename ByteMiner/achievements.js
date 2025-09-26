// Byte Miner: Core Collapse - Achievements System

class AchievementManager {
    constructor() {
        this.achievements = this.initializeAchievements();
    }

    initializeAchievements() {
        return {
            firstByte: {
                name: 'First Byte',
                description: 'Mine 1 Byte',
                reward: '+10 Bytes',
                flavor: 'The journey begins.',
                type: 'bytes',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            clickFrenzy: {
                name: 'Click Frenzy',
                description: '1,000 clicks',
                reward: 'Unlock Turbo Clicker',
                flavor: 'Your fingers are legends.',
                type: 'clicks',
                target: 1000,
                unlocked: false,
                rewardApplied: false
            },
            coreBreach: {
                name: 'Core Breach',
                description: 'First Prestige',
                reward: '+1 Core Fragment',
                flavor: 'You cracked the core.',
                type: 'prestige',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            quantumLeap: {
                name: 'Quantum Leap',
                description: 'Earn 1 Quantum Key',
                reward: 'Unlock Quantum Forge',
                flavor: 'You bent reality.',
                type: 'quantumKeys',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            upgradeHoarder: {
                name: 'Upgrade Hoarder',
                description: 'Own 25 upgrades',
                reward: '+5% income',
                flavor: 'You like shiny buttons.',
                type: 'upgradeCount',
                target: 25,
                unlocked: false,
                rewardApplied: false
            },
            idleMaster: {
                name: 'Idle Master',
                description: 'Earn 1M Bytes offline',
                reward: '+1 Fragment',
                flavor: 'You mined in your sleep.',
                type: 'offlineBytes',
                target: 1000000,
                unlocked: false,
                rewardApplied: false
            },
            byteBillionaire: {
                name: 'Byte Billionaire',
                description: 'Reach 1B Bytes',
                reward: 'Unlock Byte Singularity',
                flavor: 'You broke the simulation.',
                type: 'bytes',
                target: 1000000000,
                unlocked: false,
                rewardApplied: false
            },
            glitchHunter: {
                name: 'Glitch Hunter',
                description: 'Find hidden upgrade',
                reward: 'Cosmetic glitch skin',
                flavor: 'You saw through the code.',
                type: 'special',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            fragmentTycoon: {
                name: 'Fragment Tycoon',
                description: 'Earn 100 Core Fragments',
                reward: '+10% income',
                flavor: 'You own the collapse.',
                type: 'fragments',
                target: 100,
                unlocked: false,
                rewardApplied: false
            },
            quantumCollector: {
                name: 'Quantum Collector',
                description: 'Own 10 Quantum Keys',
                reward: 'Unlock Entropy Shield',
                flavor: 'Reality bends to your will.',
                type: 'quantumKeys',
                target: 10,
                unlocked: false,
                rewardApplied: false
            },
            themeWeaver: {
                name: 'Theme Weaver',
                description: 'Unlock all visual themes',
                reward: 'Cosmetic bonus',
                flavor: 'You styled the Byteverse.',
                type: 'themes',
                target: 6,
                unlocked: false,
                rewardApplied: false
            },
            loreSeeker: {
                name: 'Lore Seeker',
                description: 'Discover 5 lore entries',
                reward: '+1 Quantum Key',
                flavor: 'The truth is encrypted.',
                type: 'lore',
                target: 5,
                unlocked: false,
                rewardApplied: false
            },
            dailyGrinder: {
                name: 'Daily Grinder',
                description: 'Complete 7 Daily Byte Goals',
                reward: '+5% passive gain',
                flavor: 'Routine is power.',
                type: 'dailyGoals',
                target: 7,
                unlocked: false,
                rewardApplied: false
            },
            megabyteMilestone: {
                name: 'Megabyte Milestone',
                description: 'Reach 1 Megabyte',
                reward: '+1 Fragment',
                flavor: 'Your bytes are stacking.',
                type: 'bytes',
                target: 1000000,
                unlocked: false,
                rewardApplied: false
            },
            petabytePioneer: {
                name: 'Petabyte Pioneer',
                description: 'Reach 1 Petabyte',
                reward: 'Unlock Exotic Tech Tier',
                flavor: 'You mine beyond measure.',
                type: 'bytes',
                target: 1000000000000000,
                unlocked: false,
                rewardApplied: false
            },
            aiWhisperer: {
                name: 'AI Whisperer',
                description: 'Unlock AI Assistant',
                reward: '+10% click power',
                flavor: 'It listens. It clicks.',
                type: 'special',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            collapseVeteran: {
                name: 'Collapse Veteran',
                description: 'Prestige 20 times',
                reward: '+20% all gains',
                flavor: 'You thrive in resets.',
                type: 'prestige',
                target: 20,
                unlocked: false,
                rewardApplied: false
            },
            byteverseExplorer: {
                name: 'Byteverse Explorer',
                description: 'Unlock all zones',
                reward: 'Cosmetic map skin',
                flavor: 'You mapped the digital frontier.',
                type: 'zones',
                target: 5,
                unlocked: false,
                rewardApplied: false
            },
            bugSquasher: {
                name: 'Bug Squasher',
                description: 'Report a bug',
                reward: '+1 Quantum Key',
                flavor: 'You debugged the Byteverse.',
                type: 'special',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            speedMiner: {
                name: 'Speed Miner',
                description: 'Reach 1M Bytes in under 10 mins',
                reward: '+10% click speed',
                flavor: 'Fast fingers, faster bytes.',
                type: 'speed',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            coreCollector: {
                name: 'Core Collector',
                description: 'Own 10 Core Fragments',
                reward: '+5% income',
                flavor: 'You gather the collapse.',
                type: 'fragments',
                target: 10,
                unlocked: false,
                rewardApplied: false
            },
            quantumEngineer: {
                name: 'Quantum Engineer',
                description: 'Use 5 Quantum Keys',
                reward: 'Unlock Temporal Loop',
                flavor: 'You engineered time itself.',
                type: 'quantumKeysSpent',
                target: 5,
                unlocked: false,
                rewardApplied: false
            },
            byteArchitect: {
                name: 'Byte Architect',
                description: 'Build 50 upgrades',
                reward: '+10% passive gain',
                flavor: 'You designed the future.',
                type: 'upgradesPurchased',
                target: 50,
                unlocked: false,
                rewardApplied: false
            },
            entropySurfer: {
                name: 'Entropy Surfer',
                description: 'Avoid softcaps for 30 mins',
                reward: 'Cosmetic effect',
                flavor: 'You ride the edge.',
                type: 'special',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            chronoChampion: {
                name: 'Chrono Champion',
                description: 'Play for 24 hours total',
                reward: '+1 Quantum Key',
                flavor: 'Time bows to you.',
                type: 'timePlayed',
                target: 86400000, // 24 hours in milliseconds
                unlocked: false,
                rewardApplied: false
            },
            fragmentFarmer: {
                name: 'Fragment Farmer',
                description: 'Earn 10 Fragments in one run',
                reward: '+10% Fragment gain',
                flavor: 'You reap the collapse.',
                type: 'fragmentsInRun',
                target: 10,
                unlocked: false,
                rewardApplied: false
            },
            quantumHoarder: {
                name: 'Quantum Hoarder',
                description: 'Own 25 Quantum Keys',
                reward: 'Unlock AI Awakening',
                flavor: 'You hoard reality.',
                type: 'quantumKeys',
                target: 25,
                unlocked: false,
                rewardApplied: false
            },
            byteTycoon: {
                name: 'Byte Tycoon',
                description: 'Reach 10B Bytes',
                reward: '+10% all gains',
                flavor: 'You dominate the simulation.',
                type: 'bytes',
                target: 10000000000,
                unlocked: false,
                rewardApplied: false
            },
            upgradeManiac: {
                name: 'Upgrade Maniac',
                description: 'Own every upgrade',
                reward: 'Cosmetic upgrade skin',
                flavor: 'You maxed the machine.',
                type: 'allUpgrades',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            themeCollector: {
                name: 'Theme Collector',
                description: 'Unlock 5 themes',
                reward: '+5% click power',
                flavor: 'You curated the Byteverse.',
                type: 'themes',
                target: 5,
                unlocked: false,
                rewardApplied: false
            },
            loreMaster: {
                name: 'Lore Master',
                description: 'Discover all lore entries',
                reward: 'Unlock secret upgrade',
                flavor: 'You decrypted the truth.',
                type: 'allLore',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            dailyDevotee: {
                name: 'Daily Devotee',
                description: 'Complete 30 Daily Byte Goals',
                reward: '+10% passive gain',
                flavor: 'You live the grind.',
                type: 'dailyGoals',
                target: 30,
                unlocked: false,
                rewardApplied: false
            },
            megabyteMogul: {
                name: 'Megabyte Mogul',
                description: 'Reach 10 Megabytes',
                reward: '+2 Fragments',
                flavor: 'Your bytes overflow.',
                type: 'bytes',
                target: 10000000,
                unlocked: false,
                rewardApplied: false
            },
            petabytePrince: {
                name: 'Petabyte Prince',
                description: 'Reach 10 Petabytes',
                reward: 'Unlock Prestige Tier 3',
                flavor: 'You rule the data realm.',
                type: 'bytes',
                target: 10000000000000000,
                unlocked: false,
                rewardApplied: false
            },
            aiCommander: {
                name: 'AI Commander',
                description: 'Use AI Assistant for 1 hour',
                reward: '+10% click speed',
                flavor: 'You command the mind.',
                type: 'aiTime',
                target: 3600000, // 1 hour in milliseconds
                unlocked: false,
                rewardApplied: false
            },
            collapseConqueror: {
                name: 'Collapse Conqueror',
                description: 'Prestige 50 times',
                reward: '+50% all gains',
                flavor: 'You mastered the reset.',
                type: 'prestige',
                target: 50,
                unlocked: false,
                rewardApplied: false
            },
            byteversemaster: {
                name: 'Byteverse Master',
                description: 'Unlock every zone',
                reward: 'Unlock final cosmetic',
                flavor: 'You own the frontier.',
                type: 'allZones',
                target: 1,
                unlocked: false,
                rewardApplied: false
            },
            bugBounty: {
                name: 'Bug Bounty',
                description: 'Report 5 bugs',
                reward: '+5 Quantum Keys',
                flavor: 'You hunted the glitches.',
                type: 'bugsReported',
                target: 5,
                unlocked: false,
                rewardApplied: false
            },
            speedDemon: {
                name: 'Speed Demon',
                description: 'Reach 10M Bytes in under 5 mins',
                reward: '+20% click speed',
                flavor: 'You are the byte storm.',
                type: 'speed',
                target: 2,
                unlocked: false,
                rewardApplied: false
            }
        };
    }

    checkAchievements(gameState) {
        const unlockedCount = Object.values(gameState.achievements).filter(unlocked => unlocked).length;
        
        for (const achievementId in this.achievements) {
            const achievement = this.achievements[achievementId];
            
            // Skip if already unlocked
            if (gameState.achievements[achievementId]) continue;
            
            let progress = this.getAchievementProgress(achievementId, gameState);
            
            if (progress >= achievement.target) {
                this.unlockAchievement(achievementId, gameState);
            }
        }
    }

    getAchievementProgress(achievementId, gameState) {
        const achievement = this.achievements[achievementId];
        
        switch (achievement.type) {
            case 'bytes':
                return Math.max(gameState.bytes, gameState.totalBytes);
            case 'clicks':
                return gameState.totalClicks;
            case 'prestige':
                return gameState.prestigeCount;
            case 'quantumKeys':
                return gameState.quantumKeys;
            case 'fragments':
                return gameState.coreFragments;
            case 'upgradeCount':
                return Upgrades.getOwnedUpgradeCount(gameState);
            case 'upgradesPurchased':
                return gameState.stats.upgradesPurchased;
            case 'offlineBytes':
                return gameState.stats.offlineEarnings;
            case 'timePlayed':
                return gameState.stats.totalTimePlayed;
            case 'themes':
                return gameState.unlocks.themes?.length || 1;
            case 'dailyGoals':
                return gameState.stats.dailyGoalsCompleted || 0;
            case 'quantumKeysSpent':
                return gameState.stats.quantumKeysSpent || 0;
            case 'fragmentsInRun':
                return gameState.stats.fragmentsThisRun || 0;
            case 'allUpgrades':
                const totalUpgrades = Object.keys(Upgrades.getAllUpgrades()).length;
                const ownedUpgrades = Upgrades.getOwnedUpgradeCount(gameState);
                return ownedUpgrades >= totalUpgrades ? 1 : 0;
            case 'aiTime':
                return gameState.stats.aiActiveTime || 0;
            case 'bugsReported':
                return gameState.stats.bugsReported || 0;
            case 'lore':
                return gameState.stats.loreDiscovered || 0;
            case 'allLore':
                const totalLore = 10; // Total lore entries
                const discoveredLore = gameState.stats.loreDiscovered || 0;
                return discoveredLore >= totalLore ? 1 : 0;
            case 'zones':
                return gameState.stats.zonesUnlocked || 0;
            case 'allZones':
                const totalZones = 5; // Total zones
                const unlockedZones = gameState.stats.zonesUnlocked || 0;
                return unlockedZones >= totalZones ? 1 : 0;
            case 'speed':
                // Special handling for speed achievements
                if (achievementId === 'speedMiner') {
                    return gameState.stats.speedMiner1M || 0;
                } else if (achievementId === 'speedDemon') {
                    return gameState.stats.speedDemon10M || 0;
                }
                return 0;
            case 'special':
                // Special achievements handled elsewhere
                return gameState.stats[achievementId] || 0;
            default:
                return 0;
        }
    }

    unlockAchievement(achievementId, gameState) {
        if (gameState.achievements[achievementId]) return;
        
        gameState.achievements[achievementId] = true;
        gameState.stats.achievementsUnlocked++;
        
        const achievement = this.achievements[achievementId];
        
        // Apply reward
        if (!achievement.rewardApplied) {
            this.applyAchievementReward(achievementId, gameState);
            achievement.rewardApplied = true;
        }
        
        // Show notification
        Utils.createNotification(
            `Achievement Unlocked: ${achievement.name}!`,
            'success',
            4000
        );
        
        // Create achievement popup
        this.createAchievementPopup(achievement);
        
        // Play achievement sound effect
        this.playAchievementSound();
        
        console.log(`Achievement unlocked: ${achievement.name}`);
    }

    applyAchievementReward(achievementId, gameState) {
        const achievement = this.achievements[achievementId];
        const reward = achievement.reward;
        
        if (reward.includes('Bytes')) {
            const amount = parseInt(reward.match(/\d+/)[0]);
            gameState.bytes += amount;
        } else if (reward.includes('Fragment')) {
            const amount = parseInt(reward.match(/\d+/)[0]) || 1;
            gameState.coreFragments += amount;
        } else if (reward.includes('Quantum Key')) {
            const amount = parseInt(reward.match(/\d+/)[0]) || 1;
            gameState.quantumKeys += amount;
        } else if (reward.includes('Unlock')) {
            this.handleUnlockReward(achievementId, gameState);
        }
        
        // Permanent stat bonuses are handled in game calculations
    }

    handleUnlockReward(achievementId, gameState) {
        switch (achievementId) {
            case 'clickFrenzy':
                Upgrades.upgrades.tier1.turboClicker.unlocked = true;
                break;
            case 'quantumLeap':
                Upgrades.upgrades.tier5.quantumForge.unlocked = true;
                break;
            case 'byteBillionaire':
                Upgrades.upgrades.tier3.byteSingularity.unlocked = true;
                break;
            case 'quantumCollector':
                Upgrades.upgrades.tier5.entropyShield.unlocked = true;
                break;
            case 'petabytePioneer':
                gameState.unlocks.tier3 = true;
                break;
            case 'quantumEngineer':
                Upgrades.upgrades.tier5.temporalLoop.unlocked = true;
                break;
            case 'quantumHoarder':
                Upgrades.upgrades.tier5.aiAwakening.unlocked = true;
                break;
            case 'petabytePrince':
                gameState.unlocks.prestigeTier3 = true;
                break;
            case 'loreMaster':
                // Unlock secret upgrade
                gameState.unlocks.secretUpgrade = true;
                break;
        }
    }

    createAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
                <small>${achievement.flavor}</small>
                <div class="achievement-reward">Reward: ${achievement.reward}</div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Animate in
        setTimeout(() => popup.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => document.body.removeChild(popup), 500);
        }, 5000);
    }

    playAchievementSound() {
        // Create audio context for achievement sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Fallback for browsers without Web Audio API
            console.log('Achievement unlocked sound');
        }
    }

    getAchievementBonus(type, gameState) {
        let bonus = 0;
        
        for (const achievementId in this.achievements) {
            if (!gameState.achievements[achievementId]) continue;
            
            const achievement = this.achievements[achievementId];
            const reward = achievement.reward;
            
            if (type === 'income' && reward.includes('% income')) {
                bonus += parseInt(reward.match(/\d+/)[0]);
            } else if (type === 'click' && reward.includes('% click')) {
                bonus += parseInt(reward.match(/\d+/)[0]);
            } else if (type === 'passive' && reward.includes('% passive')) {
                bonus += parseInt(reward.match(/\d+/)[0]);
            } else if (type === 'all' && reward.includes('% all gains')) {
                bonus += parseInt(reward.match(/\d+/)[0]);
            } else if (type === 'fragments' && reward.includes('% Fragment')) {
                bonus += parseInt(reward.match(/\d+/)[0]);
            }
        }
        
        return bonus / 100; // Convert percentage to multiplier
    }

    getUnlockedAchievements(gameState) {
        return Object.keys(gameState.achievements).filter(id => gameState.achievements[id]);
    }

    getAchievementCount() {
        return Object.keys(this.achievements).length;
    }

    getUnlockedCount(gameState) {
        return this.getUnlockedAchievements(gameState).length;
    }

    getProgressPercentage(gameState) {
        const total = this.getAchievementCount();
        const unlocked = this.getUnlockedCount(gameState);
        return Math.round((unlocked / total) * 100);
    }
}

// Initialize achievement manager
const Achievements = new AchievementManager();

// Export for other modules
window.Achievements = Achievements;