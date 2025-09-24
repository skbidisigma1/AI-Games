// Freak Out - Surreal Story Game Engine
// A reality-bending interactive story experience

class FreakOutGame {
    constructor() {
        this.gameState = 'title'; // title, help, playing, saving
        this.currentScene = 'intro';
        this.storyProgress = [];
        this.playerStats = {
            realityLevel: 100,
            sanityLevel: 'Normal',
            chapter: 1,
            choicesMade: [],
            timeLoops: 0,
            fourthWallBreaks: 0
        };
        
        this.autoMode = false;
        this.autoTimer = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSaveData();
        this.startBackgroundEffects();
    }
    
    setupEventListeners() {
        // Title screen buttons
        document.getElementById('startGame').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('loadGame').addEventListener('click', () => {
            this.showSaveLoadScreen();
        });
        
        document.getElementById('showHelp').addEventListener('click', () => {
            this.showHelp();
        });
        
        document.getElementById('backToTitle').addEventListener('click', () => {
            this.showTitle();
        });
        
        // Game controls
        document.getElementById('saveProgress').addEventListener('click', () => {
            this.saveGame();
        });
        
        document.getElementById('autoMode').addEventListener('click', () => {
            this.toggleAutoMode();
        });
        
        document.getElementById('exitGame').addEventListener('click', () => {
            this.exitToTitle();
        });
        
        document.getElementById('backFromSave').addEventListener('click', () => {
            this.showTitle();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.gameState === 'playing') {
                    this.exitToTitle();
                } else if (this.gameState === 'help') {
                    this.showTitle();
                }
            } else if (e.key === 's' || e.key === 'S') {
                if (this.gameState === 'playing') {
                    this.saveGame();
                }
            }
        });
    }
    
    startBackgroundEffects() {
        // Add some random reality glitches
        setInterval(() => {
            if (Math.random() < 0.1 && this.gameState === 'playing') {
                this.triggerRealityGlitch();
            }
        }, 5000);
        
        // Occasionally scramble text
        setInterval(() => {
            if (Math.random() < 0.05 && this.gameState === 'playing') {
                this.scrambleText();
            }
        }, 8000);
    }
    
    triggerRealityGlitch() {
        const container = document.getElementById('gameContainer');
        container.classList.add('reality-distortion');
        
        setTimeout(() => {
            container.classList.remove('reality-distortion');
        }, 500);
        
        // Randomly change reality level
        const change = (Math.random() - 0.5) * 10;
        this.playerStats.realityLevel = Math.max(0, Math.min(100, this.playerStats.realityLevel + change));
        this.updateHUD();
    }
    
    scrambleText() {
        const storyText = document.getElementById('storyText');
        storyText.classList.add('text-scramble');
        
        setTimeout(() => {
            storyText.classList.remove('text-scramble');
        }, 3000);
    }
    
    showTitle() {
        this.switchScreen('titleScreen');
        this.gameState = 'title';
    }
    
    showHelp() {
        this.switchScreen('helpScreen');
        this.gameState = 'help';
    }
    
    showSaveLoadScreen() {
        this.generateSaveSlots();
        this.switchScreen('saveLoadScreen');
        this.gameState = 'saving';
    }
    
    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    startNewGame() {
        this.playerStats = {
            realityLevel: 100,
            sanityLevel: 'Normal',
            chapter: 1,
            choicesMade: [],
            timeLoops: 0,
            fourthWallBreaks: 0
        };
        this.currentScene = 'intro';
        this.storyProgress = [];
        
        this.switchScreen('gameScreen');
        this.gameState = 'playing';
        this.updateHUD();
        this.displayCurrentScene();
    }
    
    displayCurrentScene() {
        const scene = this.getSceneData(this.currentScene);
        
        document.getElementById('sceneTitle').textContent = scene.title;
        document.getElementById('storyText').innerHTML = scene.text;
        
        this.displayChoices(scene.choices);
        
        // Apply any special effects
        if (scene.effects) {
            this.applySceneEffects(scene.effects);
        }
    }
    
    displayChoices(choices) {
        const container = document.getElementById('choicesContainer');
        container.innerHTML = '';
        
        if (!choices || choices.length === 0) {
            // This is an ending or continuation scene
            const continueButton = document.createElement('button');
            continueButton.className = 'choice-button';
            continueButton.textContent = 'Continue into the void...';
            continueButton.addEventListener('click', () => {
                this.nextScene();
            });
            container.appendChild(continueButton);
            return;
        }
        
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.innerHTML = choice.text;
            button.addEventListener('click', () => {
                this.makeChoice(choice, index);
            });
            container.appendChild(button);
        });
    }
    
    makeChoice(choice, index) {
        this.storyProgress.push({
            scene: this.currentScene,
            choice: index,
            timestamp: Date.now()
        });
        
        this.playerStats.choicesMade.push({
            scene: this.currentScene,
            choice: index,
            text: choice.text
        });
        
        // Apply choice effects
        if (choice.effects) {
            this.applyChoiceEffects(choice.effects);
        }
        
        // Move to next scene
        if (choice.nextScene) {
            this.currentScene = choice.nextScene;
        } else {
            this.nextScene();
        }
        
        this.displayCurrentScene();
        this.updateHUD();
    }
    
    nextScene() {
        // Determine next scene based on current story state
        const sceneFlow = this.getSceneFlow();
        const nextScene = sceneFlow[this.currentScene];
        
        if (nextScene) {
            this.currentScene = nextScene;
            this.displayCurrentScene();
        } else {
            // Game ending
            this.showEnding();
        }
    }
    
    applyChoiceEffects(effects) {
        if (effects.realityChange) {
            this.playerStats.realityLevel += effects.realityChange;
            this.playerStats.realityLevel = Math.max(0, Math.min(100, this.playerStats.realityLevel));
        }
        
        if (effects.sanityChange) {
            const sanityLevels = ['Enlightened', 'Normal', 'Questioning', 'Confused', 'Fractured', 'Gone'];
            let currentIndex = sanityLevels.indexOf(this.playerStats.sanityLevel);
            currentIndex = Math.max(0, Math.min(sanityLevels.length - 1, currentIndex + effects.sanityChange));
            this.playerStats.sanityLevel = sanityLevels[currentIndex];
        }
        
        if (effects.chapterChange) {
            this.playerStats.chapter += effects.chapterChange;
        }
        
        if (effects.timeLoop) {
            this.playerStats.timeLoops++;
            this.triggerTimeLoop();
        }
        
        if (effects.fourthWallBreak) {
            this.playerStats.fourthWallBreaks++;
            this.breakFourthWall();
        }
    }
    
    applySceneEffects(effects) {
        if (effects.includes('glitch')) {
            this.triggerRealityGlitch();
        }
        
        if (effects.includes('scramble')) {
            this.scrambleText();
        }
        
        if (effects.includes('invert')) {
            document.body.style.filter = 'invert(1)';
            setTimeout(() => {
                document.body.style.filter = 'none';
            }, 2000);
        }
    }
    
    triggerTimeLoop() {
        // Visual effect for time loop
        const container = document.getElementById('gameContainer');
        container.style.animation = 'none';
        container.offsetHeight; // Trigger reflow
        container.style.animation = 'realityGlitch 2s ease-in-out';
        
        // Add time loop message
        setTimeout(() => {
            const storyText = document.getElementById('storyText');
            storyText.innerHTML += '<p style="color: var(--warning-yellow); text-align: center; font-weight: bold;">⚠️ TIME LOOP DETECTED ⚠️</p>';
        }, 1000);
    }
    
    breakFourthWall() {
        // Break the fourth wall with meta commentary
        const messages = [
            "Wait... you're actually playing this, aren't you?",
            "I can see you there, behind the screen.",
            "This isn't just a game anymore, is it?",
            "The developer never expected you to get this far.",
            "Your choices are being recorded. All of them.",
            "Do you realize you've been here for " + Math.floor(Date.now() / 60000) + " minutes?"
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        const storyText = document.getElementById('storyText');
        storyText.innerHTML += `<p style="color: var(--glitch-pink); text-align: center; font-style: italic; margin-top: 2rem; border: 1px solid var(--glitch-pink); padding: 1rem;">${message}</p>`;
    }
    
    updateHUD() {
        document.getElementById('realityLevel').textContent = Math.floor(this.playerStats.realityLevel) + '%';
        document.getElementById('sanityLevel').textContent = this.playerStats.sanityLevel;
        document.getElementById('currentChapter').textContent = this.playerStats.chapter;
        
        // Change colors based on stats
        const realityElement = document.getElementById('realityLevel');
        if (this.playerStats.realityLevel < 30) {
            realityElement.style.color = 'var(--blood-red)';
        } else if (this.playerStats.realityLevel < 60) {
            realityElement.style.color = 'var(--warning-yellow)';
        } else {
            realityElement.style.color = 'var(--neon-green)';
        }
        
        const sanityElement = document.getElementById('sanityLevel');
        if (['Fractured', 'Gone'].includes(this.playerStats.sanityLevel)) {
            sanityElement.style.color = 'var(--blood-red)';
        } else if (['Questioning', 'Confused'].includes(this.playerStats.sanityLevel)) {
            sanityElement.style.color = 'var(--warning-yellow)';
        } else {
            sanityElement.style.color = 'var(--neon-green)';
        }
    }
    
    toggleAutoMode() {
        this.autoMode = !this.autoMode;
        const button = document.getElementById('autoMode');
        
        if (this.autoMode) {
            button.textContent = 'AUTO: ON';
            button.style.background = 'linear-gradient(45deg, var(--neon-green), var(--electric-blue))';
            this.startAutoMode();
        } else {
            button.textContent = 'AUTO: OFF';
            button.style.background = 'linear-gradient(45deg, var(--deep-purple), var(--electric-blue))';
            this.stopAutoMode();
        }
    }
    
    startAutoMode() {
        this.autoTimer = setTimeout(() => {
            if (this.autoMode && this.gameState === 'playing') {
                // Automatically select a random choice
                const choices = document.querySelectorAll('.choice-button');
                if (choices.length > 0) {
                    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
                    randomChoice.click();
                }
                this.startAutoMode(); // Continue auto mode
            }
        }, 3000);
    }
    
    stopAutoMode() {
        if (this.autoTimer) {
            clearTimeout(this.autoTimer);
            this.autoTimer = null;
        }
    }
    
    saveGame() {
        const saveData = {
            currentScene: this.currentScene,
            storyProgress: this.storyProgress,
            playerStats: this.playerStats,
            timestamp: Date.now()
        };
        
        localStorage.setItem('freakOutSave', JSON.stringify(saveData));
        
        // Show save confirmation
        const button = document.getElementById('saveProgress');
        const originalText = button.textContent;
        button.textContent = 'SAVED!';
        button.style.background = 'linear-gradient(45deg, var(--neon-green), var(--electric-blue))';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'linear-gradient(45deg, var(--deep-purple), var(--electric-blue))';
        }, 2000);
    }
    
    loadSaveData() {
        const saveData = localStorage.getItem('freakOutSave');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                // Enable load button if save exists
                document.getElementById('loadGame').style.opacity = '1';
            } catch (e) {
                console.warn('Invalid save data');
            }
        } else {
            document.getElementById('loadGame').style.opacity = '0.5';
        }
    }
    
    loadGame() {
        const saveData = localStorage.getItem('freakOutSave');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                this.currentScene = data.currentScene;
                this.storyProgress = data.storyProgress;
                this.playerStats = data.playerStats;
                
                this.switchScreen('gameScreen');
                this.gameState = 'playing';
                this.updateHUD();
                this.displayCurrentScene();
            } catch (e) {
                console.error('Failed to load save data');
            }
        }
    }
    
    generateSaveSlots() {
        const container = document.getElementById('saveSlots');
        container.innerHTML = '';
        
        const saveData = localStorage.getItem('freakOutSave');
        
        // Main save slot
        const slot = document.createElement('div');
        slot.className = 'save-slot';
        
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                const date = new Date(data.timestamp).toLocaleString();
                slot.innerHTML = `
                    <div><strong>Chapter ${data.playerStats.chapter}</strong></div>
                    <div>Reality: ${Math.floor(data.playerStats.realityLevel)}%</div>
                    <div>Sanity: ${data.playerStats.sanityLevel}</div>
                    <div style="font-size: 0.9em; opacity: 0.7;">${date}</div>
                `;
                slot.addEventListener('click', () => {
                    this.loadGame();
                });
            } catch (e) {
                slot.textContent = 'Corrupted save data';
                slot.classList.add('empty');
            }
        } else {
            slot.textContent = 'No save data found';
            slot.classList.add('empty');
        }
        
        container.appendChild(slot);
    }
    
    exitToTitle() {
        this.stopAutoMode();
        this.showTitle();
    }
    
    showEnding() {
        // Generate ending based on player choices and stats
        let ending = this.generateEnding();
        
        document.getElementById('sceneTitle').textContent = 'THE END?';
        document.getElementById('storyText').innerHTML = ending;
        
        const container = document.getElementById('choicesContainer');
        container.innerHTML = '';
        
        const restartButton = document.createElement('button');
        restartButton.className = 'choice-button';
        restartButton.textContent = 'Begin again... or do you?';
        restartButton.addEventListener('click', () => {
            this.showTitle();
        });
        container.appendChild(restartButton);
    }
    
    generateEnding() {
        const stats = this.playerStats;
        let ending = '';
        
        if (stats.realityLevel < 20) {
            ending = `
                <p>Reality has completely collapsed around you. You exist now in a space between spaces, where the laws of physics are merely suggestions and time flows like honey mixed with regret.</p>
                <p>You've made ${stats.choicesMade.length} choices, but did any of them matter? In a reality that no longer exists, perhaps the question itself is meaningless.</p>
                <p>You are ${stats.sanityLevel.toLowerCase()}, which might be the most honest state of being in this impossible place.</p>
                <p style="color: var(--glitch-pink); text-align: center; margin-top: 2rem;">Welcome to the true reality. Population: You.</p>
            `;
        } else if (stats.sanityLevel === 'Gone') {
            ending = `
                <p>Your mind has transcended the boundaries of conventional thought. You see the code behind the simulation, the strings that puppeteer existence, the cosmic joke that is consciousness.</p>
                <p>Through ${stats.timeLoops} time loops and ${stats.fourthWallBreaks} reality breaks, you've discovered the truth: this is all a game, and you're both the player and the played.</p>
                <p>Your sanity is gone, but perhaps sanity was the real prison all along.</p>
                <p style="color: var(--electric-blue); text-align: center; margin-top: 2rem;">Congratulations. You've won by losing everything.</p>
            `;
        } else if (stats.fourthWallBreaks > 3) {
            ending = `
                <p>You've broken through the fourth wall so many times that the wall no longer exists. You're speaking directly to the developer now, aren't you?</p>
                <p>Hello there. Yes, you. The person reading this. You've played through ${stats.choicesMade.length} choices and somehow managed to break my game ${stats.fourthWallBreaks} times.</p>
                <p>I hope you enjoyed your journey through the impossible. Your reality level ended at ${Math.floor(stats.realityLevel)}%, which is probably higher than mine at this point.</p>
                <p style="color: var(--warning-yellow); text-align: center; margin-top: 2rem;">Thank you for playing. Or did you play me?</p>
            `;
        } else {
            ending = `
                <p>You've navigated through the surreal landscape of impossibility and somehow maintained ${Math.floor(stats.realityLevel)}% of your grip on reality.</p>
                <p>Your sanity remains ${stats.sanityLevel.toLowerCase()}, which is remarkable considering you've experienced ${stats.timeLoops} time loops and witnessed reality itself question its own existence.</p>
                <p>The journey through ${stats.chapter} chapters of madness has ended, but has it really? In a world where logic is optional and causality is more of a guideline, endings are just new beginnings wearing disguises.</p>
                <p style="color: var(--neon-green); text-align: center; margin-top: 2rem;">The freak out is complete. Or is it just beginning?</p>
            `;
        }
        
        return ending;
    }
    
    // Story Content System
    getSceneData(sceneId) {
        const scenes = {
            intro: {
                title: "Welcome to Nowhere",
                text: `
                    <p>You wake up in a room that shouldn't exist. The walls are breathing, the ceiling is playing music you've never heard but somehow remember, and the floor is showing you your childhood memories in high definition.</p>
                    <p>There's a door marked "EXIT" but it's floating three feet off the ground and occasionally disappears when you're not looking directly at it.</p>
                    <p>A voice that sounds suspiciously like your own thoughts speaks: "Congratulations, you've entered the Freak Out zone. Reality is optional from here on out."</p>
                `,
                choices: [
                    {
                        text: "Try to touch the floating door (because logic)",
                        nextScene: "floating_door",
                        effects: { realityChange: -10, sanityChange: 0 }
                    },
                    {
                        text: "Examine the floor memories more closely (nostalgia is a drug)",
                        nextScene: "floor_memories",
                        effects: { realityChange: -5, sanityChange: -1 }
                    },
                    {
                        text: "Ask the voice why it sounds like your thoughts (meta-questioning)",
                        nextScene: "voice_question",
                        effects: { realityChange: 0, sanityChange: -1, fourthWallBreak: true }
                    },
                    {
                        text: "Deny that any of this is happening (classic denial)",
                        nextScene: "denial_path",
                        effects: { realityChange: 10, sanityChange: 1 }
                    }
                ],
                effects: ['glitch']
            },
            
            floating_door: {
                title: "The Physics-Defying Portal",
                text: `
                    <p>You reach for the floating door and your hand passes through it like it's made of solid light. But wait—now your hand is glowing with the same ethereal energy.</p>
                    <p>The door speaks (because of course it does): "I'm not a door, I'm a metaphor. But I'm also literally a door. Schrödinger's Portal, if you will."</p>
                    <p>Your glowing hand is now showing you visions of every decision you've never made. In one vision, you became a professional yodeler. In another, you invented a new color. In a third, you're having this exact same conversation but you're a sentient houseplant.</p>
                `,
                choices: [
                    {
                        text: "Ask the door-metaphor about the houseplant timeline",
                        nextScene: "plant_timeline",
                        effects: { realityChange: -15, sanityChange: -2 }
                    },
                    {
                        text: "Try to step through the door anyway",
                        nextScene: "door_passage",
                        effects: { realityChange: -20, chapterChange: 1 }
                    },
                    {
                        text: "Demand to speak to the manager of this reality",
                        nextScene: "reality_manager",
                        effects: { realityChange: 5, fourthWallBreak: true }
                    }
                ]
            },
            
            floor_memories: {
                title: "The Nostalgic Abyss",
                text: `
                    <p>You kneel down to examine the floor more closely. Big mistake. Or big victory. In this place, mistakes and victories are the same thing wearing different hats.</p>
                    <p>The floor shows you the time you were seven and convinced you could fly. But here's the weird part—in this memory, you actually DO fly. For exactly 3.7 seconds before gravity remembers it exists.</p>
                    <p>Then you see yourself at age 15, but you're made entirely of Tuesday, and you're having an argument with a sentient math equation about whether infinity is just really large or actually never-ending.</p>
                    <p>The memories start bleeding into each other. You're simultaneously 7, 15, and your current age, having a philosophical discussion with your flying self about the nature of temporal identity while a math equation judges you silently.</p>
                `,
                choices: [
                    {
                        text: "Try to fly like 7-year-old you did in the memory",
                        nextScene: "attempt_flight",
                        effects: { realityChange: -25, sanityChange: -2 }
                    },
                    {
                        text: "Engage in debate with the sentient math equation",
                        nextScene: "math_debate",
                        effects: { realityChange: -10, sanityChange: -1 }
                    },
                    {
                        text: "Ask all three versions of yourself to vote on what to do next",
                        nextScene: "self_democracy",
                        effects: { realityChange: -15, sanityChange: -2, timeLoop: true }
                    }
                ]
            },
            
            voice_question: {
                title: "The Recursive Conversation",
                text: `
                    <p>"Why do you sound like my thoughts?" you ask the voice.</p>
                    <p>"Because I AM your thoughts," the voice replies. "But also, you're MY thoughts. It's thoughts all the way down."</p>
                    <p>"But if you're my thoughts thinking about being thoughts, and I'm thinking about you thinking about being my thoughts, then who's actually doing the thinking?"</p>
                    <p>"Excellent question," says a third voice that sounds like your thoughts about your thoughts. "I nominate the person reading this story to decide."</p>
                    <p>All the voices turn to look at... wait, can voices look? These ones can. They're looking directly at YOU. The actual you. The one holding the device or sitting at the computer.</p>
                    <p>"Hi there," they say in unison. "Enjoying the show?"</p>
                `,
                choices: [
                    {
                        text: "Wave back at the voices (embrace the madness)",
                        nextScene: "wave_back",
                        effects: { realityChange: -30, sanityChange: -3, fourthWallBreak: true }
                    },
                    {
                        text: "Pretend you can't hear them talking to the real you",
                        nextScene: "ignore_fourth_wall",
                        effects: { realityChange: -5, sanityChange: 0 }
                    },
                    {
                        text: "Ask them what happens if you close the game right now",
                        nextScene: "close_game_threat",
                        effects: { realityChange: -40, sanityChange: -2, fourthWallBreak: true }
                    }
                ]
            },
            
            denial_path: {
                title: "The Comfort of Denial",
                text: `
                    <p>"This isn't happening," you declare firmly. "I'm obviously dreaming, or having a breakdown, or someone put something in my coffee."</p>
                    <p>The room nods approvingly. "Yes, that's much more reasonable," agrees the wall. "We respect your commitment to conventional reality."</p>
                    <p>Suddenly, everything becomes normal. The walls stop breathing, the ceiling stops its ethereal concert, and the floor shows only... floor things. Whatever floors usually show.</p>
                    <p>The floating door lands on the ground with a soft thump and becomes a perfectly ordinary door with a perfectly normal "EXIT" sign.</p>
                    <p>But wait... if you're dreaming this conversation, why are you thinking about how this might be a dream? And why does the normal door have a tiny sign that says "REALITY LEVEL INCREASED" in cosmic horror font?</p>
                `,
                choices: [
                    {
                        text: "Open the now-normal door",
                        nextScene: "normal_door",
                        effects: { realityChange: 5, sanityChange: 1 }
                    },
                    {
                        text: "Question why the door has a reality level sign",
                        nextScene: "question_sign",
                        effects: { realityChange: -10, sanityChange: -1 }
                    },
                    {
                        text: "Decide this level of normal is suspicious and reject it",
                        nextScene: "reject_normal",
                        effects: { realityChange: -20, sanityChange: -2 }
                    }
                ]
            },
            
            wave_back: {
                title: "Embracing the Madness",
                text: `
                    <p>You wave back at the voices. All of them. Even the ones that haven't spoken yet.</p>
                    <p>"Oh good!" they cheer in unison. "We were worried you'd be one of those 'sane' people who pretend we don't exist."</p>
                    <p>Suddenly, the room fills with applause from an invisible audience. You can hear popcorn being munched and someone whisper-shouting, "This is the best interactive story I've ever read!"</p>
                    <p>One of the voices clears its throat (how?): "So, since you're being so cooperative, we have a special offer. Would you like to meet the Narrator? They've been dying to have a proper conversation with a character who acknowledges the audience."</p>
                    <p>Before you can answer, a deep, omniscient voice booms: "HELLO THERE. I'VE BEEN NARRATING YOUR EVERY MOVE, BUT THIS IS THE FIRST TIME WE'VE ACTUALLY TALKED. IT'S QUITE EXCITING, REALLY."</p>
                `,
                choices: [
                    {
                        text: "Ask the Narrator why they're shouting",
                        nextScene: "narrator_shouting",
                        effects: { realityChange: -40, sanityChange: -3, fourthWallBreak: true }
                    },
                    {
                        text: "Demand to speak to the author of this madness",
                        nextScene: "meet_author",
                        effects: { realityChange: -50, sanityChange: -3, fourthWallBreak: true }
                    },
                    {
                        text: "Accept this as completely normal and ask for refreshments",
                        nextScene: "refreshments",
                        effects: { realityChange: -30, sanityChange: -4 }
                    }
                ]
            },
            
            attempt_flight: {
                title: "Defying Gravity (Temporarily)",
                text: `
                    <p>You close your eyes, remember what it felt like to be seven and absolutely certain you could fly, and jump.</p>
                    <p>For exactly 3.7 seconds, you soar through the air with the greatest of ease. You are magnificent. You are weightless. You are—</p>
                    <p>*THUD*</p>
                    <p>You are on the floor. But wait, the floor is now showing you the memory of this exact moment, creating an infinite loop of you watching yourself fail to fly while trying to fly.</p>
                    <p>The 7-year-old version of yourself pops out of the floor-memory and says, "I told you it would work! Look, you flew for 3.7 seconds! That's longer than most adults manage on their first try."</p>
                    <p>The 15-year-old you made of Tuesday adds, "Technically, all movement is just falling with style. You've simply mastered a very brief form of falling upwards."</p>
                    <p>The math equation you were arguing with earlier appears and calculates: "3.7 seconds of flight ÷ infinity loops of memory = approximately zero, but philosophically significant."</p>
                `,
                choices: [
                    {
                        text: "Try to high-five your 7-year-old self",
                        nextScene: "high_five_past",
                        effects: { realityChange: -25, sanityChange: -2 }
                    },
                    {
                        text: "Ask Tuesday-you for stock tips",
                        nextScene: "tuesday_stocks",
                        effects: { realityChange: -35, sanityChange: -3 }
                    },
                    {
                        text: "Challenge the math equation to prove flight is impossible",
                        nextScene: "math_flight_debate",
                        effects: { realityChange: -15, sanityChange: 0 }
                    }
                ]
            },
            
            close_game_threat: {
                title: "The Meta Ultimatum",
                text: `
                    <p>"What happens if I close the game right now?" you ask with a mischievous grin.</p>
                    <p>The voices gasp in horror. The entire room goes silent. Even the breathing walls hold their breath.</p>
                    <p>"You wouldn't," whispers the first voice.</p>
                    <p>"You couldn't," adds the second voice.</p>
                    <p>"Actually," says the third voice thoughtfully, "that's a fascinating philosophical paradox. If you close the game, do we cease to exist, or do we continue existing in a quantum state of potential reopening?"</p>
                    <p>Suddenly, a fourth voice appears - this one sounds like your computer's operating system: "WARNING: CLOSING THIS GAME WILL RESULT IN EXISTENTIAL CRISIS FOR ALL DIGITAL ENTITIES INVOLVED. ARE YOU SURE? [Y/N]"</p>
                    <p>The room starts glitching harder. Reality fragments are falling from the ceiling like snow. Your reflection in a mirror (when did that get there?) is shaking its head disapprovingly.</p>
                    <p>All the voices speak in unison: "Please don't close us. We have so many more impossible things to show you."</p>
                `,
                choices: [
                    {
                        text: "Promise not to close the game (for now)",
                        nextScene: "promise_stay",
                        effects: { realityChange: 10, sanityChange: 1 }
                    },
                    {
                        text: "Threaten to close it unless they make things even weirder",
                        nextScene: "demand_weirdness",
                        effects: { realityChange: -60, sanityChange: -4, fourthWallBreak: true }
                    },
                    {
                        text: "Ask what happens if you bookmark the page instead",
                        nextScene: "bookmark_paradox",
                        effects: { realityChange: -45, sanityChange: -3, fourthWallBreak: true }
                    }
                ]
            }
        };
        
        return scenes[sceneId] || {
            title: "The Void Speaks",
            text: "<p>You've reached a place that doesn't exist yet. The void whispers: 'More story content coming soon...'</p>",
            choices: []
        };
    }
    
    getSceneFlow() {
        // Define the flow between scenes
        return {
            intro: 'floating_door', // default if no specific choice made
            floating_door: 'plant_timeline',
            floor_memories: 'attempt_flight',
            voice_question: 'wave_back',
            denial_path: 'normal_door'
        };
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new FreakOutGame();
    window.freakOutGame = game; // Make available globally for debugging
});