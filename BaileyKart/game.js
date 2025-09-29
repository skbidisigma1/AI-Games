// Bailey Kart Season 2 - Complete 2D Racing Game
// Modular architecture for extensibility and maintainability

/**
 * Main Game Class - Orchestrates all game systems
 */
class BaileyKartGame {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        // Game state
        this.gameState = 'title'; // 'title', 'trackSelection', 'racing', 'paused', 'complete'
        this.selectedTrack = 'classic';
        this.selectedKartDesign = 'classic'; // Add custom kart design selection
        this.currentLap = 1;
        this.totalLaps = 3;
        this.raceTime = 0;
        this.bestLapTime = Infinity;
        this.lapTimes = [];
        
        // Game systems
        this.renderer = new RenderingEngine(this.ctx, this.minimapCtx);
        this.inputHandler = new InputHandler();
        this.physics = new PhysicsEngine();
        this.aiSystem = new AISystem();
        this.powerUpSystem = new PowerUpSystem();
        this.gameStateManager = new GameStateManager();
        
        // Game objects
        this.track = null;
        this.playerKart = null;
        this.aiKarts = [];
        this.powerUps = [];
        this.particles = [];
        
        // Camera with zoom scale for closer view
        this.camera = { x: 0, y: 0, scale: 1.5 };
        
        this.init();
    }
    
    /**
     * Initialize game systems and setup
     */
    init() {
        this.setupEventListeners();
        this.createTrack();
        this.createKarts();
        this.gameLoop();
    }
    
    /**
     * Setup all event listeners for UI and controls
     */
    setupEventListeners() {
        // Start race button (now opens track selection)
        document.getElementById('startRace').addEventListener('click', () => {
            this.showTrackSelection();
        });
        
        // Story mode button
        document.getElementById('storyMode').addEventListener('click', () => {
            this.showStoryMode();
        });
        
        // Kart customization button
        document.getElementById('kartCustomization').addEventListener('click', () => {
            this.showKartCustomization();
        });
        
        // Back to title button
        document.getElementById('backToTitle').addEventListener('click', () => {
            this.backToTitle();
        });
        
        // Back to title from story mode
        document.getElementById('backToTitleFromStory').addEventListener('click', () => {
            this.backToTitle();
        });
        
        // Back to title from customization
        document.getElementById('backToTitleFromCustomization').addEventListener('click', () => {
            this.backToTitle();
        });
        
        // Track selection buttons
        document.querySelectorAll('.track-button').forEach((button, index) => {
            button.addEventListener('click', () => {
                const trackOption = button.closest('.track-option');
                const trackType = trackOption.getAttribute('data-track');
                this.selectTrack(trackType);
            });
        });
        
        // Restart race button
        document.getElementById('restartRace').addEventListener('click', () => {
            this.restartRace();
        });
        
        // Back to menu button
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.backToMenu();
        });
        
        // Input handling
        this.inputHandler.setupEventListeners();
        
        // Initialize track previews
        this.initializeTrackPreviews();
        
        // Initialize kart customization
        this.initializeKartCustomization();
    }
    
    /**
     * Create the racing track with checkpoints and visual elements
     */
    createTrack() {
        this.track = new RacingTrack(this.selectedTrack);
    }
    
    /**
     * Show track selection screen
     */
    showTrackSelection() {
        this.gameState = 'trackSelection';
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('trackSelection').classList.add('active');
    }
    
    /**
     * Go back to title screen
     */
    backToTitle() {
        this.gameState = 'title';
        document.getElementById('trackSelection').classList.remove('active');
        document.getElementById('storyModeScreen').classList.remove('active');
        document.getElementById('kartCustomizationScreen').classList.remove('active');
        document.getElementById('titleScreen').classList.add('active');
    }
    
    /**
     * Show story mode screen
     */
    showStoryMode() {
        this.gameState = 'storyMode';
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('storyModeScreen').classList.add('active');
        this.updateStoryProgress();
    }
    
    /**
     * Show kart customization screen
     */
    showKartCustomization() {
        this.gameState = 'kartCustomization';
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('kartCustomizationScreen').classList.add('active');
        this.updateKartPreviews();
    }
    
    /**
     * Update story progress and unlock races
     */
    updateStoryProgress() {
        const completedRaces = parseInt(localStorage.getItem('baileyKartStoryProgress') || '0');
        
        document.querySelectorAll('.story-race').forEach((raceEl, index) => {
            const raceNum = index + 1;
            const button = raceEl.querySelector('.story-race-button');
            
            if (raceNum <= completedRaces + 1) {
                raceEl.classList.remove('locked');
                button.textContent = 'START RACE';
                button.onclick = () => this.startStoryRace(raceNum);
            } else {
                raceEl.classList.add('locked');
                button.textContent = 'LOCKED';
                button.onclick = null;
            }
        });
    }
    
    /**
     * Start a story mode race
     */
    startStoryRace(raceNumber) {
        this.currentStoryRace = raceNumber;
        this.showStoryDialog(raceNumber);
    }
    
    /**
     * Show story dialog before race
     */
    showStoryDialog(raceNumber) {
        const storyData = this.getStoryData(raceNumber);
        
        document.getElementById('storyDialogTitle').textContent = storyData.title;
        document.getElementById('storyDialogText').innerHTML = storyData.preRaceText;
        document.getElementById('storyDialog').classList.remove('hidden');
        
        document.getElementById('continueStory').onclick = () => {
            document.getElementById('storyDialog').classList.add('hidden');
            this.selectedTrack = storyData.track;
            this.createTrack();
            this.createKarts();
            this.startRace();
        };
        
        document.getElementById('skipStory').onclick = () => {
            document.getElementById('storyDialog').classList.add('hidden');
            this.selectedTrack = storyData.track;
            this.createTrack();
            this.createKarts();
            this.startRace();
        };
    }
    
    /**
     * Get story data for each race
     */
    getStoryData(raceNumber) {
        const stories = {
            1: {
                title: "Race 1: The Return",
                track: "classic",
                preRaceText: `
                    <p><strong>Stewart's Return</strong></p>
                    <p>Stewart arrives at the racing circuit after a long break, expecting to find the familiar faces and fair competition he left behind. 
                    Instead, he discovers the atmosphere has changed completely - the once-welcoming community now seems tense and divided.</p>
                    <p>"Things aren't the same around here," warns Marcus, an old racing friend. "Some new racer named Juliette showed up a few months ago. 
                    She's been... changing things. Winning races through tactics that push the boundaries of fair play."</p>
                    <p>Stewart grips his steering wheel tighter. He built his reputation on integrity and skill, values that seem under threat. 
                    As he prepares for his first race back, he's determined to show that honorable racing can still prevail.</p>
                    <p>"Time to remind everyone what true sportsmanship looks like," Stewart mutters, firing up his engine.</p>
                `,
                postRaceText: `
                    <p>Stewart's driving was flawless - demonstrating the precision and honor that made him a champion. 
                    His clean overtakes and respectful racing style drew cheers from longtime fans who remembered the golden days.</p>
                    <p>As he exits his kart, a slow clap echoes across the track. A figure in a sleek black and purple racing suit approaches - 
                    Juliette, with an enigmatic smile that doesn't reach her calculating eyes.</p>
                    <p>"Impressive, Stewart. I've heard so much about the legendary 'honorable champion.' 
                    We should race together sometime... I have so much to teach you about modern racing."</p>
                    <p>Stewart feels a chill run down his spine. This was just the beginning.</p>
                `
            },
            2: {
                title: "Race 2: Love Letters and Fast Cars",
                track: "figure8",
                preRaceText: `
                    <p><strong>Secret Admirer</strong></p>
                    <p>Luke can barely concentrate on anything but the memory of Hadlee's smile from yesterday. 
                    He's been writing and rewriting a love letter all night, crumpling draft after draft.</p>
                    <p>This morning, he found a note tucked under his helmet: "Your driving yesterday was absolutely mesmerizing. 
                    I'd love to get to know the man behind the wheel better. - A Secret Admirer ♥"</p>
                    <p>The Figure-8 track's crossing paths seem like a perfect metaphor for fate bringing people together. 
                    Luke's heart races as he wonders who his mysterious admirer could be.</p>
                    <p>Before the race, Hadlee approaches him with a playful grin. "Someone's popular," she teases, 
                    having noticed the pink envelope. "Any idea who your secret admirer is?"</p>
                    <p>Luke blushes deeply, his heart skipping. Could it be...?</p>
                `,
                postRaceText: `
                    <p>Luke's driving was inspired, weaving through the crossing section with balletic precision. 
                    Each turn felt like a dance, smooth and passionate, as if his feelings were flowing through the kart itself.</p>
                    <p>After the race, he finds another note in his locker: "The way you handle those curves is absolutely divine. 
                    Meet me at the sunset overlook after tomorrow's race? - Your not-so-secret admirer anymore ♥"</p>
                    <p>Luke's hands tremble as he reads it, butterflies erupting in his stomach. Tomorrow can't come soon enough...</p>
                `
            },
            3: {
                title: "Race 3: Mountain Top Romance",
                track: "mountain",
                preRaceText: `
                    <p><strong>Sunset Rendezvous</strong></p>
                    <p>Luke's nerves are electric with anticipation. All day he's been wondering who will meet him 
                    at the mountain overlook tonight. His secret admirer's notes have become increasingly flirtatious and sweet.</p>
                    <p>Today's message was accompanied by a single red rose: "I love watching you race - 
                    the passion in your eyes, the way you make the impossible look effortless. You're absolutely captivating."</p>
                    <p>The mountain track's winding curves and breathtaking vistas seem perfect for romance. 
                    Luke finds himself driving not just to win, but to impress someone special.</p>
                    <p>As he warms up his kart, Hadlee walks by and whispers, "Good luck, Luke. 
                    I have a feeling tonight's going to be very special for you." Her knowing smile makes his heart flutter.</p>
                `,
                postRaceText: `
                    <p>Luke's performance was breathtaking - literally taking the mountain curves like a lovesick poet, 
                    each turn executed with passionate precision. The sunset painted the track in golden hues as he crossed the finish line.</p>
                    <p>Hours later, at the overlook, Luke's heart nearly stops when he sees a familiar silhouette against the sunset. 
                    Hadlee turns to face him, her cheeks pink with nervous excitement.</p>
                    <p>"Surprise," she says softly. "I hope you don't mind that your secret admirer... is me."</p>
                `
            },
            4: {
                title: "Race 4: First Kiss Under City Lights",
                track: "city",
                preRaceText: `
                    <p><strong>City of Love</strong></p>
                    <p>After their magical sunset confession, Luke and Hadlee have been inseparable. 
                    Their late-night phone calls last until dawn, filled with laughter, dreams, and whispered sweet nothings.</p>
                    <p>Tonight's city race takes on special meaning - Hadlee suggested they make it interesting: 
                    "If you can beat me tonight, I'll let you take me to that fancy rooftop restaurant downtown," she teased, 
                    her eyes sparkling with mischief.</p>
                    <p>The city streets are lit up like a romantic movie set, neon lights reflecting off wet pavement. 
                    Luke's heart pounds not from nerves, but from pure excitement. Win or lose, he knows he's already won her heart.</p>
                    <p>As they line up at the starting line, Hadlee blows him a kiss. "May the best racer win, handsome," 
                    she calls out, making Luke blush adorably.</p>
                `,
                postRaceText: `
                    <p>The race was intense - both Luke and Hadlee pushed their karts to the limit, 
                    trading positions throughout the course. Their competitive spirits only made them more attractive to each other.</p>
                    <p>As they cross the finish line together in a photo-finish, they can't help but laugh. 
                    "I guess we both won," Hadlee says breathlessly, pulling off her helmet to reveal tousled hair that makes Luke's heart skip.</p>
                    <p>Under the city lights, with adrenaline still coursing through their veins, 
                    Luke finally finds the courage to cup her face gently and lean in for their first kiss. 
                    Time stops as their lips meet, the cheering crowd fading into background noise.</p>
                `
            },
            5: {
                title: "Race 5: Desert Heat and Passion",
                track: "desert",
                preRaceText: `
                    <p><strong>Weekend Getaway</strong></p>
                    <p>Luke and Hadlee have planned a romantic weekend getaway to the desert racing circuit. 
                    They've been dating for a few weeks now, and the chemistry between them is absolutely electric.</p>
                    <p>Last night at their cozy desert hotel, they spent hours stargazing from the hot tub, 
                    Hadlee nestled against Luke's chest as he traced gentle patterns on her bare shoulders. 
                    "I never knew I could feel this way," she whispered against his neck, sending shivers down his spine.</p>
                    <p>Today's race is more playful than competitive - they've agreed that whoever loses 
                    has to give the winner a full body massage tonight. Hadlee's teasing smile as she suggested this 
                    made Luke's temperature rise even more than the desert sun.</p>
                    <p>"Ready to lose, handsome?" she purrs, adjusting her racing suit in a way that makes Luke completely forget how to breathe.</p>
                `,
                postRaceText: `
                    <p>The desert race was scorching hot in more ways than one - both racers pushed hard, 
                    but they kept stealing glances at each other, causing more than one amusing near-miss with cacti.</p>
                    <p>Afterward, as they cool down with ice-cold drinks, Hadlee slides closer to Luke on their picnic blanket. 
                    "I may have lost the race," she says with a sultry smile, "but I think we're both about to win tonight."</p>
                    <p>As the desert sunset paints them in golden light, Luke pulls her close for a passionate kiss. 
                    The massage oils they packed are definitely going to come in handy...</p>
                `
            },
            6: {
                title: "Race 6: Forest of Love",
                track: "forest",
                preRaceText: `
                    <p><strong>Into the Enchanted Woods</strong></p>
                    <p>Luke and Hadlee have been officially dating for two months now, and their relationship has deepened 
                    into something beautiful and mature. They've started talking about the future, about dreams they want to share.</p>
                    <p>The forest track holds special meaning - it was here that Luke first realized he was falling in love. 
                    Today, Hadlee seems extra radiant, with a secret smile that makes Luke's heart flutter with curiosity.</p>
                    <p>Before the race, she pulls him aside to a secluded grove. "Luke," she says, her voice soft with emotion, 
                    "racing brought us together, but what we have now... it's so much more than I ever dreamed possible."</p>
                    <p>She presses a small velvet box into his hands. "I know it's unconventional, but... 
                    will you accept this promise ring? I want the whole world to know you're mine."</p>
                `,
                postRaceText: `
                    <p>Luke races with tears of joy in his eyes, the promise ring gleaming on his finger. 
                    Every turn through the dappled forest light feels like a celebration of their love.</p>
                    <p>After crossing the finish line, he sweeps Hadlee into his arms, spinning her around as she laughs with pure joy. 
                    "Yes, yes, a thousand times yes!" he whispers against her ear.</p>
                    <p>As they kiss under the ancient trees, other racers and spectators applaud. 
                    Their love story has become the talk of the racing circuit - proof that sometimes fairy tales do come true.</p>
                `
            },
            7: {
                title: "Race 7: The Big Proposal",
                track: "speedway",
                preRaceText: `
                    <p><strong>Championship Dreams</strong></p>
                    <p>Six months have passed, and Luke and Hadlee have become the golden couple of the racing world. 
                    Their love story has inspired countless fans, and tonight's championship race feels like destiny.</p>
                    <p>Luke has been planning something special for weeks. Hidden in his racing suit pocket is a ring - 
                    not just any ring, but his grandmother's vintage engagement ring, perfectly restored and sparkling.</p>
                    <p>Hadlee doesn't know, but Luke has arranged for the entire race to be broadcast live. 
                    If he wins tonight's championship, he plans to propose right there on the track, 
                    in front of millions of viewers and the woman he adores.</p>
                    <p>"Whatever happens tonight," Hadlee says, kissing him tenderly before they get in their karts, 
                    "I just want you to know that you've already made me the happiest woman alive."</p>
                `,
                postRaceText: `
                    <p>Luke's performance is legendary - he races not just with skill, but with the power of true love driving him forward. 
                    When he crosses the finish line as champion, the crowd erupts in thunderous applause.</p>
                    <p>Without even removing his helmet, Luke runs to Hadlee's kart. In front of the cheering crowd and rolling cameras, 
                    he drops to one knee and pulls out the ring.</p>
                    <p>"Hadlee, my love, my everything," his voice carries across the speedway, "will you marry me?"</p>
                    <p>Her "YES!" echoes through the stadium as confetti cannons explode and the crowd goes wild. 
                    Their kiss is captured by every camera, destined to become one of the most romantic moments in sports history.</p>
                `
            },
            8: {
                title: "Race 8: Honeymoon Grand Prix",
                track: "twisted",
                preRaceText: `
                    <p><strong>Wedding Bells and Racing Thrills</strong></p>
                    <p>Luke and Hadlee's wedding was a fairytale come true - a beautiful ceremony at sunset 
                    followed by a reception where half the racing world celebrated their union.</p>
                    <p>Now, on their honeymoon in Monaco, they couldn't resist entering one last race together - 
                    the prestigious Monaco Grand Prix for couples. Racing side by side as newlyweds feels like the perfect adventure.</p>
                    <p>"Ready to show the world what Team Hadlee-Luke can do?" she asks, her new wedding ring catching the Mediterranean sunlight. 
                    The way she says their combined name makes Luke's heart soar.</p>
                    <p>The twisted street circuit is challenging, but they've never felt more in sync. 
                    Their love has made them both better racers, better people, better partners in every sense of the word.</p>
                    <p>"Win or lose," Luke says, pulling her close for one last pre-race kiss, "I'm already living my dream with you."</p>
                `,
                postRaceText: `
                    <p><strong>EPILOGUE: Happily Ever After</strong></p>
                    <p>Luke and Hadlee cross the finish line together, hands reaching across the gap between their karts to touch. 
                    They've both won in the truest sense, not just the race, but life itself.</p>
                    <p>Years later, they'll be known as the greatest love story in racing history. 
                    Their racing school for young couples becomes legendary, built on the foundation that love makes everything better.</p>
                    <p>They have three beautiful children who inherit both their parents' need for speed and their deep capacity for love. 
                    The racing circuit echoes with laughter as the next generation of their family learns to race.</p>
                    <p>Luke still writes Hadlee love letters, slipping them under her pillow or into her racing gloves. 
                    And Hadlee still gets butterflies every time she sees him smile.</p>
                    <p>Some fairy tales are real, and theirs is just beginning.</p>
                    <p><strong>THE END ♥</strong></p>
                `
            }
        };
        
        return stories[raceNumber] || stories[1];
    }
    
    /**
     * Select a track and start the race
     */
    selectTrack(trackType) {
        this.selectedTrack = trackType;
        this.createTrack();
        this.createKarts();
        this.startRace();
    }
    
    /**
     * Initialize track preview canvases
     */
    initializeTrackPreviews() {
        const trackTypes = ['classic', 'figure8', 'mountain', 'city', 'desert', 'forest', 'speedway', 'twisted'];
        
        trackTypes.forEach(trackType => {
            const canvas = document.querySelector(`[data-track="${trackType}"] .track-canvas`);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                
                // Create a mini track for preview
                const previewTrack = new RacingTrack(trackType);
                this.renderTrackPreview(ctx, previewTrack, canvas.width, canvas.height);
            }
        });
    }
    
    /**
     * Render a small preview of the track
     */
    renderTrackPreview(ctx, track, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        // Calculate scale to fit track in canvas
        const scaleX = width / track.width;
        const scaleY = height / track.height;
        const scale = Math.min(scaleX, scaleY) * 0.8;
        
        const offsetX = (width - track.width * scale) / 2;
        const offsetY = (height - track.height * scale) / 2;
        
        // Draw track background
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, width, height);
        
        // Draw track path
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 8 * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        track.trackPoints.forEach((point, index) => {
            const x = point.x * scale + offsetX;
            const y = point.y * scale + offsetY;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.stroke();
        
        // Draw start/finish line
        if (track.trackPoints.length > 0) {
            const start = track.trackPoints[0];
            const next = track.trackPoints[1];
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            
            const angle = Math.atan2(next.y - start.y, next.x - start.x) + Math.PI/2;
            const lineLength = 20 * scale;
            
            const startX = start.x * scale + offsetX;
            const startY = start.y * scale + offsetY;
            
            ctx.beginPath();
            ctx.moveTo(
                startX - Math.cos(angle) * lineLength,
                startY - Math.sin(angle) * lineLength
            );
            ctx.lineTo(
                startX + Math.cos(angle) * lineLength,
                startY + Math.sin(angle) * lineLength
            );
            ctx.stroke();
        }
    }
    
    /**
     * Initialize kart customization system
     */
    initializeKartCustomization() {
        // Set up design selection buttons
        document.querySelectorAll('.design-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const kartDesign = e.target.closest('.kart-design');
                const design = kartDesign.dataset.design;
                this.selectKartDesign(design);
            });
        });
        
        // Load saved design preference
        const savedDesign = localStorage.getItem('baileyKartDesign') || 'classic';
        this.selectKartDesign(savedDesign);
    }
    
    /**
     * Select a kart design
     */
    selectKartDesign(design) {
        this.selectedKartDesign = design;
        localStorage.setItem('baileyKartDesign', design);
        
        // Update UI
        document.querySelectorAll('.kart-design').forEach(el => {
            el.classList.remove('selected');
            const button = el.querySelector('.design-button');
            button.textContent = 'SELECT';
        });
        
        const selectedDesign = document.querySelector(`[data-design="${design}"]`);
        if (selectedDesign) {
            selectedDesign.classList.add('selected');
            const button = selectedDesign.querySelector('.design-button');
            button.textContent = 'SELECTED';
        }
    }
    
    /**
     * Update kart design previews
     */
    updateKartPreviews() {
        const designs = ['classic', 'furry', 'anime', 'cyberpunk', 'magical'];
        
        designs.forEach(design => {
            const canvas = document.querySelector(`[data-design="${design}"] .kart-canvas`);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                this.renderKartPreview(ctx, design, canvas.width, canvas.height);
            }
        });
    }
    
    /**
     * Render a small preview of the kart design
     */
    renderKartPreview(ctx, design, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        // Create a mini kart for preview
        const previewKart = {
            radius: 12,
            color: '#e74c3c',
            design: design,
            isPlayer: true
        };
        
        ctx.save();
        ctx.translate(width / 2, height / 2);
        
        // Draw preview based on design using renderer
        if (design === 'classic') {
            this.renderer.renderStandardKart(ctx, previewKart);
        } else {
            this.renderer.renderCustomKart(ctx, previewKart);
        }
        
        ctx.restore();
    }
    
    /**
     * Create player kart and 7 AI karts
     */
    createKarts() {
        // Create player kart
        const startPos = this.track.getStartPosition(0);
        this.playerKart = new Kart(startPos.x, startPos.y, '#e74c3c', true);
        this.playerKart.design = this.selectedKartDesign; // Assign custom design
        
        // Create AI karts
        this.aiKarts = [];
        const kartColors = ['#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
        
        for (let i = 0; i < 7; i++) {
            const pos = this.track.getStartPosition(i + 1);
            const aiKart = new Kart(pos.x, pos.y, kartColors[i], false);
            aiKart.aiPersonality = this.aiSystem.generatePersonality();
            this.aiKarts.push(aiKart);
        }
    }
    
    /**
     * Start the race
     */
    startRace() {
        this.gameState = 'racing';
        this.raceTime = 0;
        this.currentLap = 1;
        
        // Reset all karts
        this.playerKart.reset();
        this.aiKarts.forEach(kart => kart.reset());
        
        // Generate initial power-ups
        this.powerUpSystem.generatePowerUps(this.track);
        
        // Switch UI from any screen to game screen
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('trackSelection').classList.remove('active');
        document.getElementById('storyModeScreen').classList.remove('active');
        document.getElementById('kartCustomizationScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        
        // Reset camera position
        this.camera.x = 0;
        this.camera.y = 0;
        
        this.updateHUD();
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update all game systems
     */
    update() {
        if (this.gameState !== 'racing') return;
        
        const deltaTime = 1 / 60; // Assuming 60 FPS
        this.raceTime += deltaTime;
        
        // Update player kart
        this.updatePlayerKart(deltaTime);
        
        // Update AI karts
        this.updateAIKarts(deltaTime);
        
        // Update power-ups
        this.powerUpSystem.update(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update camera
        this.updateCamera();
        
        // Check lap completion
        this.checkLapCompletion();
        
        // Update HUD
        this.updateHUD();
    }
    
    /**
     * Update player kart based on input
     */
    updatePlayerKart(deltaTime) {
        const input = this.inputHandler.getInputState();
        this.physics.updateKart(this.playerKart, input, deltaTime);
        
        // Handle power-up usage
        if (input.usePowerUp && this.playerKart.powerUp) {
            this.powerUpSystem.usePowerUp(this.playerKart, this.getAllKarts());
        }
    }
    
    /**
     * Update all AI karts
     */
    updateAIKarts(deltaTime) {
        this.aiKarts.forEach(kart => {
            const aiInput = this.aiSystem.getAIInput(kart, this.track, this.getAllKarts());
            this.physics.updateKart(kart, aiInput, deltaTime);
            
            // AI power-up usage
            if (kart.powerUp && Math.random() < 0.02) { // 2% chance per frame
                this.powerUpSystem.usePowerUp(kart, this.getAllKarts());
            }
        });
    }
    
    /**
     * Update particle effects
     */
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return !particle.isDead();
        });
    }
    
    /**
     * Check all types of collisions
     */
    checkCollisions() {
        const allKarts = this.getAllKarts();
        
        // Kart-to-kart collisions
        for (let i = 0; i < allKarts.length; i++) {
            for (let j = i + 1; j < allKarts.length; j++) {
                if (this.physics.checkKartCollision(allKarts[i], allKarts[j])) {
                    this.physics.resolveKartCollision(allKarts[i], allKarts[j]);
                    this.createCollisionParticles(allKarts[i], allKarts[j]);
                }
            }
        }
        
        // Kart-to-track collisions
        allKarts.forEach(kart => {
            if (this.track.checkCollision(kart)) {
                this.physics.resolveTrackCollision(kart, this.track);
            }
        });
        
        // Power-up collisions
        this.powerUpSystem.checkCollisions(allKarts, this.track);
        
        // Oil slick collisions
        if (window.oilSlicks) {
            window.oilSlicks = window.oilSlicks.filter(oilSlick => {
                if (!oilSlick.active) return false;
                
                // Update oil slick
                oilSlick.update(1/60);
                
                // Check collision with all karts
                allKarts.forEach(kart => {
                    if (oilSlick.checkCollision(kart)) {
                        this.createCollisionParticles(kart, { x: oilSlick.x, y: oilSlick.y });
                    }
                });
                
                return oilSlick.active;
            });
        }
    }
    
    /**
     * Update camera to follow player
     */
    updateCamera() {
        // Calculate viewport size based on zoom
        const viewportWidth = this.canvas.width / this.camera.scale;
        const viewportHeight = this.canvas.height / this.camera.scale;
        
        const targetX = this.playerKart.x - viewportWidth / 2;
        const targetY = this.playerKart.y - viewportHeight / 2;
        
        // More responsive camera following for better control feel
        this.camera.x += (targetX - this.camera.x) * 0.15;
        this.camera.y += (targetY - this.camera.y) * 0.15;
        
        // Keep camera within track bounds considering zoom
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.track.width - viewportWidth));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.track.height - viewportHeight));
    }
    
    /**
     * Check if any kart has completed a lap
     */
    checkLapCompletion() {
        const allKarts = this.getAllKarts();
        
        allKarts.forEach(kart => {
            if (this.track.checkLapCompletion(kart)) {
                const lapTime = kart.raceTime - (kart.lastLapTime || 0);
                kart.completeLap();
                kart.lastLapTime = kart.raceTime;
                
                if (kart.isPlayer) {
                    this.currentLap = kart.lapsCompleted + 1;
                    
                    // Show lap notification for player
                    this.showLapNotification(lapTime);
                    
                    // Update best lap time
                    if (lapTime < this.bestLapTime) {
                        this.bestLapTime = lapTime;
                    }
                    
                    if (kart.lapsCompleted >= this.totalLaps) {
                        this.completeRace();
                    }
                }
            }
        });
    }
    
    /**
     * Show lap completion notification
     */
    showLapNotification(lapTime) {
        const notification = document.getElementById('lapNotification');
        const timeElement = document.getElementById('lapNotificationTime');
        
        timeElement.textContent = `Lap Time: ${this.formatTime(lapTime)}`;
        
        notification.classList.remove('hidden');
        
        // Hide after animation completes
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
    
    /**
     * Complete the race
     */
    completeRace() {
        this.gameState = 'complete';
        
        // Calculate final position
        const allKarts = this.getAllKarts();
        allKarts.sort((a, b) => {
            if (b.lapsCompleted !== a.lapsCompleted) {
                return b.lapsCompleted - a.lapsCompleted;
            }
            return a.raceTime - b.raceTime;
        });
        
        const finalPosition = allKarts.findIndex(kart => kart.isPlayer) + 1;
        
        // Handle story mode progression
        if (this.currentStoryRace) {
            // Story mode - show story completion dialog
            this.completeStoryRace(finalPosition);
        } else {
            // Regular race - show normal completion dialog
            document.getElementById('finalPosition').textContent = this.getOrdinalNumber(finalPosition);
            document.getElementById('bestLapTime').textContent = this.formatTime(this.bestLapTime);
            document.getElementById('raceComplete').classList.remove('hidden');
        }
    }
    
    /**
     * Complete a story mode race
     */
    completeStoryRace(position) {
        const storyData = this.getStoryData(this.currentStoryRace);
        const completedRaces = parseInt(localStorage.getItem('baileyKartStoryProgress') || '0');
        
        // Update progress if this is a new completion
        if (this.currentStoryRace > completedRaces) {
            localStorage.setItem('baileyKartStoryProgress', this.currentStoryRace.toString());
        }
        
        // Show story completion dialog
        document.getElementById('storyDialogTitle').textContent = `${storyData.title} - Complete!`;
        document.getElementById('storyDialogText').innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h3>Race Result: ${this.getOrdinalNumber(position)} Place</h3>
                <p>Best Lap: ${this.formatTime(this.bestLapTime)}</p>
            </div>
            ${storyData.postRaceText}
        `;
        
        document.getElementById('continueStory').textContent = 'CONTINUE';
        document.getElementById('skipStory').style.display = 'none';
        
        document.getElementById('continueStory').onclick = () => {
            document.getElementById('storyDialog').classList.add('hidden');
            document.getElementById('skipStory').style.display = 'inline-block';
            
            // Return to story mode screen
            this.gameState = 'storyMode';
            document.getElementById('gameScreen').classList.remove('active');
            document.getElementById('storyModeScreen').classList.add('active');
            this.updateStoryProgress();
            this.currentStoryRace = null;
        };
        
        document.getElementById('storyDialog').classList.remove('hidden');
    }
    
    /**
     * Render all game elements
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.minimapCtx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Set camera transform with zoom
        this.ctx.save();
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render game elements
        this.renderer.renderTrack(this.track);
        this.renderer.renderPowerUps(this.powerUpSystem.powerUps);
        this.renderer.renderOilSlicks(window.oilSlicks || []);
        this.renderer.renderKarts(this.getAllKarts());
        this.renderer.renderParticles(this.particles);
        
        this.ctx.restore();
        
        // Render minimap
        this.renderer.renderMinimap(this.track, this.getAllKarts(), this.camera);
    }
    
    /**
     * Update HUD elements
     */
    updateHUD() {
        if (this.gameState !== 'racing') return;
        
        // Update position
        const allKarts = this.getAllKarts();
        const sortedKarts = [...allKarts].sort((a, b) => {
            if (b.lapsCompleted !== a.lapsCompleted) {
                return b.lapsCompleted - a.lapsCompleted;
            }
            return this.track.getDistanceAlongTrack(b) - this.track.getDistanceAlongTrack(a);
        });
        
        const position = sortedKarts.findIndex(kart => kart.isPlayer) + 1;
        document.getElementById('currentPosition').textContent = position;
        
        // Update lap
        document.getElementById('currentLap').textContent = this.currentLap;
        
        // Update speed (convert to mph for display)
        const speed = Math.round(this.playerKart.speed * 10);
        document.getElementById('currentSpeed').textContent = speed;
        
        // Update power-up display
        const powerUpIcon = document.getElementById('powerUpIcon');
        if (this.playerKart.powerUp) {
            powerUpIcon.textContent = this.playerKart.powerUp.name;
            powerUpIcon.className = `powerup-${this.playerKart.powerUp.type}`;
        } else {
            powerUpIcon.textContent = 'NONE';
            powerUpIcon.className = 'powerup-empty';
        }
    }
    
    /**
     * Create collision particles between two karts
     */
    createCollisionParticles(kart1, kart2) {
        const midX = (kart1.x + kart2.x) / 2;
        const midY = (kart1.y + kart2.y) / 2;
        
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(
                midX, midY,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                '#ff6b6b', 1.0
            ));
        }
    }
    
    /**
     * Get all karts (player + AI)
     */
    getAllKarts() {
        return [this.playerKart, ...this.aiKarts];
    }
    
    /**
     * Restart the race
     */
    restartRace() {
        document.getElementById('raceComplete').classList.add('hidden');
        this.startRace();
    }
    
    /**
     * Go back to main menu
     */
    backToMenu() {
        this.gameState = 'title';
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('titleScreen').classList.add('active');
        document.getElementById('raceComplete').classList.add('hidden');
    }
    
    /**
     * Utility function to get ordinal numbers (1st, 2nd, 3rd, etc.)
     */
    getOrdinalNumber(num) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const value = num % 100;
        return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
    }
    
    /**
     * Format time in MM:SS.ms format
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
}

/**
 * Input Handler - Manages keyboard input for player controls
 */
class InputHandler {
    constructor() {
        this.keys = {};
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    getInputState() {
        return {
            accelerate: this.keys['w'] || this.keys['arrowup'],
            brake: this.keys['s'] || this.keys['arrowdown'],
            turnLeft: this.keys['a'] || this.keys['arrowleft'],
            turnRight: this.keys['d'] || this.keys['arrowright'],
            drift: this.keys['shift'],
            usePowerUp: this.keys[' '] // spacebar
        };
    }
}

/**
 * Physics Engine - Handles all physics calculations for karts
 */
class PhysicsEngine {
    constructor() {
        this.maxSpeed = 5; // Reduced from 8 for better control
        this.acceleration = 0.25; // Reduced from 0.3 for smoother acceleration
        this.deceleration = 0.95;
        this.turnSpeed = 0.08;
        this.driftFactor = 0.85;
    }
    
    updateKart(kart, input, deltaTime) {
        // Handle acceleration and braking
        if (input.accelerate) {
            kart.speed += this.acceleration * deltaTime * 60;
        } else if (input.brake) {
            kart.speed -= this.acceleration * 1.5 * deltaTime * 60;
        } else {
            kart.speed *= this.deceleration;
        }
        
        // Clamp speed
        kart.speed = Math.max(-this.maxSpeed * 0.5, Math.min(this.maxSpeed, kart.speed));
        
        // Handle turning (only when moving)
        if (Math.abs(kart.speed) > 0.1) {
            if (input.turnLeft) {
                kart.angle -= this.turnSpeed * (kart.speed / this.maxSpeed);
            }
            if (input.turnRight) {
                kart.angle += this.turnSpeed * (kart.speed / this.maxSpeed);
            }
        }
        
        // Handle drifting
        if (input.drift && Math.abs(kart.speed) > 2) {
            kart.isDrifting = true;
            kart.driftAngle += (input.turnLeft ? -1 : input.turnRight ? 1 : 0) * 0.05;
            kart.driftAngle *= this.driftFactor;
        } else {
            kart.isDrifting = false;
            kart.driftAngle *= 0.9; // Gradually reduce drift
        }
        
        // Calculate movement
        const moveAngle = kart.angle + kart.driftAngle;
        kart.vx = Math.cos(moveAngle) * kart.speed;
        kart.vy = Math.sin(moveAngle) * kart.speed;
        
        // Update position
        kart.x += kart.vx * deltaTime * 60;
        kart.y += kart.vy * deltaTime * 60;
        
        // Update kart state
        kart.raceTime += deltaTime;
    }
    
    checkKartCollision(kart1, kart2) {
        const dx = kart1.x - kart2.x;
        const dy = kart1.y - kart2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (kart1.radius + kart2.radius);
    }
    
    resolveKartCollision(kart1, kart2) {
        const dx = kart1.x - kart2.x;
        const dy = kart1.y - kart2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // Prevent division by zero
        
        // Normalize collision vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Separate karts
        const overlap = (kart1.radius + kart2.radius) - distance;
        kart1.x += nx * overlap * 0.5;
        kart1.y += ny * overlap * 0.5;
        kart2.x -= nx * overlap * 0.5;
        kart2.y -= ny * overlap * 0.5;
        
        // Exchange some velocity
        const relativeVelocity = (kart1.vx - kart2.vx) * nx + (kart1.vy - kart2.vy) * ny;
        if (relativeVelocity > 0) return; // Objects moving apart
        
        const impulse = 2 * relativeVelocity / 2; // Assuming equal mass
        kart1.vx -= impulse * nx;
        kart1.vy -= impulse * ny;
        kart2.vx += impulse * nx;
        kart2.vy += impulse * ny;
        
        // Reduce speed on collision
        kart1.speed *= 0.8;
        kart2.speed *= 0.8;
    }
    
    resolveTrackCollision(kart, track) {
        // Enhanced collision resolution with stronger penalties
        const margin = 30;
        
        // Harsher boundary enforcement
        if (kart.x < margin) {
            kart.x = margin;
            kart.vx = Math.abs(kart.vx);
            kart.speed *= 0.2; // Much harsher speed penalty
            kart.angle += (Math.random() - 0.5) * 0.3; // Add some random spin
        }
        if (kart.x > track.width - margin) {
            kart.x = track.width - margin;
            kart.vx = -Math.abs(kart.vx);
            kart.speed *= 0.2;
            kart.angle += (Math.random() - 0.5) * 0.3;
        }
        if (kart.y < margin) {
            kart.y = margin;
            kart.vy = Math.abs(kart.vy);
            kart.speed *= 0.2;
            kart.angle += (Math.random() - 0.5) * 0.3;
        }
        if (kart.y > track.height - margin) {
            kart.y = track.height - margin;
            kart.vy = -Math.abs(kart.vy);
            kart.speed *= 0.2;
            kart.angle += (Math.random() - 0.5) * 0.3;
        }
        
        // If too far from track, push back towards nearest track point
        if (track.trackPoints.length > 0) {
            let closestPoint = track.trackPoints[0];
            let minDistance = Infinity;
            
            for (const point of track.trackPoints) {
                const dx = kart.x - point.x;
                const dy = kart.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = point;
                }
            }
            
            if (minDistance > 120) {
                // Push kart back towards track
                const pushX = (closestPoint.x - kart.x) * 0.1;
                const pushY = (closestPoint.y - kart.y) * 0.1;
                kart.x += pushX;
                kart.y += pushY;
                kart.speed *= 0.1; // Very harsh penalty for being off-track
            }
        }
    }
}

/**
 * Kart Class - Represents a racing kart (player or AI)
 */
class Kart {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isPlayer = isPlayer;
        
        // Physics properties
        this.speed = 0;
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 12;
        
        // Drift properties
        this.isDrifting = false;
        this.driftAngle = 0;
        
        // Race properties
        this.lapsCompleted = 0;
        this.raceTime = 0;
        this.lastCheckpoint = 0;
        
        // Power-up
        this.powerUp = null;
        
        // AI properties
        this.aiPersonality = null;
        
        // Store initial position for reset
        this.initialX = x;
        this.initialY = y;
    }
    
    reset() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.speed = 0;
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
        this.isDrifting = false;
        this.driftAngle = 0;
        this.lapsCompleted = 0;
        this.raceTime = 0;
        this.lastCheckpoint = 0;
        this.powerUp = null;
    }
    
    completeLap() {
        this.lapsCompleted++;
        this.lastCheckpoint = 0;
    }
}

/**
 * Racing Track Class - Defines the track layout and collision detection
 */
class RacingTrack {
    constructor(trackType = 'classic') {
        this.trackType = trackType;
        this.width = 2000;
        this.height = 1400;
        
        // Track path points based on selected type
        this.trackPoints = this.generateTrackPoints(trackType);
        this.trackWidth = 120;
        
        // Checkpoints for lap detection
        this.checkpoints = this.generateCheckpoints();
        
        // Start positions
        this.startPositions = this.generateStartPositions();
    }
    
    generateTrackPoints(trackType = 'classic') {
        const points = [];
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        switch (trackType) {
            case 'classic':
                return this.generateClassicOval(centerX, centerY);
            case 'figure8':
                return this.generateFigure8(centerX, centerY);
            case 'mountain':
                return this.generateMountainCircuit(centerX, centerY);
            case 'city':
                return this.generateCityStreets(centerX, centerY);
            case 'desert':
                return this.generateDesertDunes(centerX, centerY);
            case 'forest':
                return this.generateForestTrail(centerX, centerY);
            case 'speedway':
                return this.generateSpeedSpeedway(centerX, centerY);
            case 'twisted':
                return this.generateTwistedCircuit(centerX, centerY);
            default:
                return this.generateClassicOval(centerX, centerY);
        }
    }
    
    generateClassicOval(centerX, centerY) {
        const points = [];
        const radiusX = 600;
        const radiusY = 400;
        
        // Create an oval track with some interesting curves
        for (let i = 0; i < 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            let x = centerX + Math.cos(angle) * radiusX;
            let y = centerY + Math.sin(angle) * radiusY;
            
            // Add some variation to make it more interesting
            if (i >= 16 && i <= 24) { // Top right curve
                x += Math.sin(angle * 3) * 50;
            } else if (i >= 40 && i <= 48) { // Bottom left curve
                y += Math.cos(angle * 2) * 40;
            }
            
            points.push({ x, y });
        }
        
        return points;
    }
    
    generateFigure8(centerX, centerY) {
        const points = [];
        const radius = 350;
        
        // First loop (top)
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY - 200 + Math.sin(angle) * radius * 0.7;
            points.push({ x, y });
        }
        
        // Second loop (bottom)
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const x = centerX - Math.cos(angle) * radius;
            const y = centerY + 200 + Math.sin(angle) * radius * 0.7;
            points.push({ x, y });
        }
        
        return points;
    }
    
    generateMountainCircuit(centerX, centerY) {
        const points = [];
        const segments = [
            // Straight section
            { type: 'straight', startX: centerX - 400, startY: centerY + 300, endX: centerX + 400, endY: centerY + 300, points: 16 },
            // Tight hairpin
            { type: 'hairpin', centerX: centerX + 400, centerY: centerY + 150, radius: 150, points: 20 },
            // Mountain climb
            { type: 'spiral', centerX: centerX + 200, centerY: centerY - 100, radius: 200, points: 16 },
            // Fast descent
            { type: 'curve', centerX: centerX - 200, centerY: centerY - 200, radius: 250, points: 12 }
        ];
        
        segments.forEach(segment => {
            for (let i = 0; i < segment.points; i++) {
                const t = i / segment.points;
                let x, y;
                
                switch (segment.type) {
                    case 'straight':
                        x = segment.startX + (segment.endX - segment.startX) * t;
                        y = segment.startY + (segment.endY - segment.startY) * t;
                        break;
                    case 'hairpin':
                        const angle = Math.PI * (1 + t);
                        x = segment.centerX + Math.cos(angle) * segment.radius;
                        y = segment.centerY + Math.sin(angle) * segment.radius;
                        break;
                    case 'spiral':
                        const spiralAngle = t * Math.PI * 1.5;
                        x = segment.centerX + Math.cos(spiralAngle) * (segment.radius * (1 - t * 0.3));
                        y = segment.centerY + Math.sin(spiralAngle) * (segment.radius * (1 - t * 0.3));
                        break;
                    case 'curve':
                        const curveAngle = t * Math.PI;
                        x = segment.centerX + Math.cos(curveAngle) * segment.radius;
                        y = segment.centerY + Math.sin(curveAngle) * segment.radius;
                        break;
                }
                
                points.push({ x, y });
            }
        });
        
        return points;
    }
    
    generateCityStreets(centerX, centerY) {
        const points = [];
        const blockSize = 200;
        
        // Create a street circuit through city blocks
        const waypoints = [
            { x: centerX - blockSize * 2, y: centerY + blockSize },
            { x: centerX + blockSize * 2, y: centerY + blockSize },
            { x: centerX + blockSize * 2, y: centerY - blockSize * 0.5 },
            { x: centerX + blockSize, y: centerY - blockSize * 0.5 },
            { x: centerX + blockSize, y: centerY - blockSize * 1.5 },
            { x: centerX - blockSize, y: centerY - blockSize * 1.5 },
            { x: centerX - blockSize, y: centerY },
            { x: centerX - blockSize * 2, y: centerY }
        ];
        
        // Connect waypoints with smooth curves
        for (let i = 0; i < waypoints.length; i++) {
            const start = waypoints[i];
            const end = waypoints[(i + 1) % waypoints.length];
            
            // Add intermediate points for smooth curves
            for (let j = 0; j < 8; j++) {
                const t = j / 8;
                const x = start.x + (end.x - start.x) * t;
                const y = start.y + (end.y - start.y) * t;
                
                // Add some curve to corners
                if (j < 4) {
                    const curve = Math.sin(t * Math.PI) * 30;
                    points.push({ x: x + curve, y: y + curve });
                } else {
                    points.push({ x, y });
                }
            }
        }
        
        return points;
    }
    
    generateDesertDunes(centerX, centerY) {
        const points = [];
        const numPoints = 80;
        const baseRadius = 500;
        
        // Create a wavy desert track with dune-like curves
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            let radius = baseRadius;
            
            // Add dune-like variations
            radius += Math.sin(angle * 3) * 100; // Large dunes
            radius += Math.sin(angle * 8) * 30;  // Smaller ripples
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * (radius * 0.7); // Slightly oval
            
            points.push({ x, y });
        }
        
        return points;
    }
    
    generateForestTrail(centerX, centerY) {
        const points = [];
        const numPoints = 72;
        
        // Create a winding forest path
        for (let i = 0; i < numPoints; i++) {
            const t = i / numPoints;
            const angle = t * Math.PI * 2;
            
            // Base circular path
            let x = centerX + Math.cos(angle) * 400;
            let y = centerY + Math.sin(angle) * 350;
            
            // Add forest-like winding
            x += Math.sin(angle * 5) * 80;  // Quick zigzags
            y += Math.cos(angle * 3) * 60;  // Gentle curves
            
            // Add some random variation for natural feel
            x += (Math.random() - 0.5) * 20;
            y += (Math.random() - 0.5) * 20;
            
            points.push({ x, y });
        }
        
        return points;
    }
    
    generateSpeedSpeedway(centerX, centerY) {
        const points = [];
        const numPoints = 40; // Fewer points for smoother high-speed turns
        const radiusX = 700;
        const radiusY = 300;
        
        // Create a simple high-speed oval with banked turns
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radiusX;
            const y = centerY + Math.sin(angle) * radiusY;
            
            points.push({ x, y });
        }
        
        return points;
    }
    
    generateTwistedCircuit(centerX, centerY) {
        const points = [];
        const numPoints = 96;
        
        // Create a complex track with multiple loops and twists
        for (let i = 0; i < numPoints; i++) {
            const t = i / numPoints;
            const angle = t * Math.PI * 2;
            
            // Base path
            let x = centerX + Math.cos(angle) * 450;
            let y = centerY + Math.sin(angle) * 400;
            
            // Add primary twist
            x += Math.cos(angle * 3) * 150;
            y += Math.sin(angle * 2) * 100;
            
            // Add secondary complexity
            x += Math.sin(angle * 7) * 40;
            y += Math.cos(angle * 5) * 50;
            
            // Add some chicanes
            if (t > 0.2 && t < 0.3) {
                x += Math.sin(t * 50) * 30;
            }
            if (t > 0.6 && t < 0.7) {
                y += Math.cos(t * 40) * 35;
            }
            
            points.push({ x, y });
        }
        
        return points;
    }
    
    generateCheckpoints() {
        const checkpoints = [];
        const numCheckpoints = 8;
        
        for (let i = 0; i < numCheckpoints; i++) {
            const pointIndex = Math.floor((i / numCheckpoints) * this.trackPoints.length);
            const point = this.trackPoints[pointIndex];
            checkpoints.push({
                x: point.x,
                y: point.y,
                radius: 80,
                id: i
            });
        }
        
        return checkpoints;
    }
    
    generateStartPositions() {
        const positions = [];
        const startPoint = this.trackPoints[0];
        const angle = Math.atan2(
            this.trackPoints[1].y - startPoint.y,
            this.trackPoints[1].x - startPoint.x
        );
        
        // Arrange karts in a grid formation
        for (let i = 0; i < 8; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            
            const offsetX = Math.cos(angle - Math.PI / 2) * (col * 40 - 20);
            const offsetY = Math.sin(angle - Math.PI / 2) * (col * 40 - 20);
            const backOffset = row * 50;
            
            positions.push({
                x: startPoint.x + offsetX - Math.cos(angle) * backOffset,
                y: startPoint.y + offsetY - Math.sin(angle) * backOffset
            });
        }
        
        return positions;
    }
    
    getStartPosition(kartIndex) {
        return this.startPositions[kartIndex] || this.startPositions[0];
    }
    
    checkCollision(kart) {
        // Enhanced track boundary collision with stronger barriers
        const margin = 30; // Smaller margin means stricter boundaries
        let collision = false;
        
        // Check basic canvas boundaries first
        if (kart.x < margin || kart.x > this.width - margin || 
            kart.y < margin || kart.y > this.height - margin) {
            collision = true;
        }
        
        // Additional check: prevent escaping by ensuring kart stays near track
        if (!collision && this.trackPoints.length > 0) {
            let minDistanceToTrack = Infinity;
            
            // Find closest track point
            for (const point of this.trackPoints) {
                const dx = kart.x - point.x;
                const dy = kart.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                minDistanceToTrack = Math.min(minDistanceToTrack, distance);
            }
            
            // If too far from track, consider it a collision
            if (minDistanceToTrack > 120) { // Track width allowance
                collision = true;
            }
        }
        
        return collision;
    }
    
    checkLapCompletion(kart) {
        // Check if kart has passed through all checkpoints in order
        const nextCheckpoint = kart.lastCheckpoint;
        const checkpoint = this.checkpoints[nextCheckpoint];
        
        if (checkpoint) {
            const dx = kart.x - checkpoint.x;
            const dy = kart.y - checkpoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < checkpoint.radius) {
                kart.lastCheckpoint = (nextCheckpoint + 1) % this.checkpoints.length;
                
                // If completed all checkpoints, lap is complete
                return kart.lastCheckpoint === 0 && nextCheckpoint === this.checkpoints.length - 1;
            }
        }
        
        return false;
    }
    
    getDistanceAlongTrack(kart) {
        // Calculate how far along the track the kart is (for position calculation)
        const checkpointProgress = kart.lastCheckpoint / this.checkpoints.length;
        return kart.lapsCompleted + checkpointProgress;
    }
}

/**
 * AI System - Controls AI kart behavior and pathfinding
 */
class AISystem {
    constructor() {
        this.personalityTypes = [
            { aggression: 0.9, skill: 0.95, riskTaking: 0.8, name: 'Aggressive' },
            { aggression: 0.6, skill: 0.92, riskTaking: 0.5, name: 'Cautious' },
            { aggression: 0.8, skill: 0.98, riskTaking: 0.7, name: 'Skilled' },
            { aggression: 0.85, skill: 0.88, riskTaking: 0.9, name: 'Risky' },
            { aggression: 0.7, skill: 0.9, riskTaking: 0.4, name: 'Defensive' },
            { aggression: 0.95, skill: 0.85, riskTaking: 0.95, name: 'Reckless' },
            { aggression: 0.75, skill: 0.94, riskTaking: 0.7, name: 'Balanced' }
        ];
    }
    
    generatePersonality() {
        return this.personalityTypes[Math.floor(Math.random() * this.personalityTypes.length)];
    }
    
    getAIInput(kart, track, allKarts) {
        const input = {
            accelerate: false,
            brake: false,
            turnLeft: false,
            turnRight: false,
            drift: false,
            usePowerUp: false
        };
        
        // Find target point on track
        const targetPoint = this.getTargetPoint(kart, track);
        
        // Calculate angle to target
        const dx = targetPoint.x - kart.x;
        const dy = targetPoint.y - kart.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Calculate angle difference
        let angleDiff = targetAngle - kart.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Steering logic
        const turnThreshold = 0.1 * kart.aiPersonality.skill;
        if (angleDiff > turnThreshold) {
            input.turnRight = true;
        } else if (angleDiff < -turnThreshold) {
            input.turnLeft = true;
        }
        
        // Speed control
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
        const shouldBrake = Math.abs(angleDiff) > 0.5 || this.checkForObstacles(kart, allKarts);
        
        if (shouldBrake) {
            input.brake = true;
        } else {
            input.accelerate = true;
        }
        
        // Drifting (based on personality)
        if (Math.abs(angleDiff) > 0.3 && kart.speed > 3 && Math.random() < kart.aiPersonality.riskTaking * 0.1) {
            input.drift = true;
        }
        
        return input;
    }
    
    getTargetPoint(kart, track) {
        // Get next checkpoint as target
        const nextCheckpoint = track.checkpoints[kart.lastCheckpoint];
        if (nextCheckpoint) {
            return { x: nextCheckpoint.x, y: nextCheckpoint.y };
        }
        
        // Fallback to first checkpoint
        return { x: track.checkpoints[0].x, y: track.checkpoints[0].y };
    }
    
    checkForObstacles(kart, allKarts) {
        // Check if there's another kart too close ahead
        const lookaheadDistance = 80;
        const futureX = kart.x + Math.cos(kart.angle) * lookaheadDistance;
        const futureY = kart.y + Math.sin(kart.angle) * lookaheadDistance;
        
        for (const otherKart of allKarts) {
            if (otherKart === kart) continue;
            
            const dx = otherKart.x - futureX;
            const dy = otherKart.y - futureY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 40) {
                return true;
            }
        }
        
        return false;
    }
}

/**
 * Power-Up System - Manages all power-ups in the game
 */
class PowerUpSystem {
    constructor() {
        this.powerUps = [];
        this.maxPowerUps = 15; // Limit max power-ups on track
        this.powerUpTypes = [
            { type: 'mushroom', name: '🍄', spawnRate: 0.25 },
            { type: 'banana', name: '🍌', spawnRate: 0.20 },
            { type: 'shell', name: '🔴', spawnRate: 0.15 },
            { type: 'lightning', name: '⚡', spawnRate: 0.05 },
            { type: 'oil', name: '🛢️', spawnRate: 0.15 },
            { type: 'shield', name: '🛡️', spawnRate: 0.10 },
            { type: 'teleporter', name: '🌀', spawnRate: 0.05 },
            { type: 'star', name: '⭐', spawnRate: 0.05 }
        ];
    }
    
    generatePowerUps(track) {
        this.powerUps = [];
        
        // Generate fewer initial power-ups
        for (let i = 0; i < 8; i++) {
            const randomPoint = track.trackPoints[Math.floor(Math.random() * track.trackPoints.length)];
            const powerUpType = this.getRandomPowerUpType();
            
            this.powerUps.push(new PowerUp(
                randomPoint.x + (Math.random() - 0.5) * 100,
                randomPoint.y + (Math.random() - 0.5) * 100,
                powerUpType
            ));
        }
    }
    
    getRandomPowerUpType() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const type of this.powerUpTypes) {
            cumulative += type.spawnRate;
            if (rand < cumulative) {
                return type;
            }
        }
        
        return this.powerUpTypes[0]; // Fallback
    }
    
    update(deltaTime) {
        this.powerUps.forEach(powerUp => {
            powerUp.update(deltaTime);
        });
    }
    
    checkCollisions(allKarts, track) {
        allKarts.forEach(kart => {
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const powerUp = this.powerUps[i];
                
                if (powerUp.active && this.checkKartPowerUpCollision(kart, powerUp)) {
                    if (!kart.powerUp) { // Only pick up if no power-up held
                        kart.powerUp = powerUp.type;
                        this.powerUps.splice(i, 1);
                        
                        // Respawn power-up elsewhere after much longer delay (1/10 frequency)
                        setTimeout(() => {
                            this.respawnPowerUp(track);
                        }, 50000 + Math.random() * 50000); // 50-100 seconds instead of 5-10
                    }
                }
            }
        });
    }
    
    checkKartPowerUpCollision(kart, powerUp) {
        const dx = kart.x - powerUp.x;
        const dy = kart.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (kart.radius + powerUp.radius);
    }
    
    usePowerUp(kart, allKarts) {
        if (!kart.powerUp) return;
        
        const powerUpType = kart.powerUp.type;
        kart.powerUp = null;
        
        switch (powerUpType) {
            case 'mushroom':
                this.applySpeedBoost(kart);
                break;
            case 'banana':
                this.deployBanana(kart);
                break;
            case 'shell':
                this.fireHomingShell(kart, allKarts);
                break;
            case 'lightning':
                this.castLightning(kart, allKarts);
                break;
            case 'oil':
                this.deployOilSlick(kart);
                break;
            case 'shield':
                this.activateShield(kart);
                break;
            case 'teleporter':
                this.teleportAhead(kart, allKarts);
                break;
            case 'star':
                this.activateSuperStar(kart);
                break;
        }
    }
    
    applySpeedBoost(kart) {
        kart.speed *= 1.5;
        // Speed boost lasts for 2 seconds
        setTimeout(() => {
            if (kart.speed > 8) kart.speed = Math.min(kart.speed, 8);
        }, 2000);
    }
    
    deployBanana(kart) {
        // Create banana peel behind the kart
        const bananaX = kart.x - Math.cos(kart.angle) * 30;
        const bananaY = kart.y - Math.sin(kart.angle) * 30;
        
        this.powerUps.push(new BananaPeel(bananaX, bananaY));
    }
    
    fireHomingShell(kart, allKarts) {
        // Find nearest opponent
        let nearestKart = null;
        let nearestDistance = Infinity;
        
        allKarts.forEach(otherKart => {
            if (otherKart !== kart) {
                const dx = otherKart.x - kart.x;
                const dy = otherKart.y - kart.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestKart = otherKart;
                }
            }
        });
        
        if (nearestKart) {
            // Create homing shell
            this.powerUps.push(new HomingShell(kart.x, kart.y, nearestKart));
        }
    }
    
    castLightning(caster, allKarts) {
        // Create lightning flash effect
        const flash = document.createElement('div');
        flash.className = 'lightning-flash';
        document.body.appendChild(flash);
        
        setTimeout(() => {
            document.body.removeChild(flash);
        }, 300);
        
        // Affect all other karts
        allKarts.forEach(kart => {
            if (kart !== caster) {
                kart.speed *= 0.3; // Slow down significantly
                // Effect lasts 3 seconds
                setTimeout(() => {
                    // Recovery is gradual
                }, 3000);
            }
        });
    }
    
    deployOilSlick(kart) {
        // Create oil slick behind the kart
        const oilSlick = new OilSlick(
            kart.x - Math.cos(kart.angle) * 30,
            kart.y - Math.sin(kart.angle) * 30
        );
        
        // Add to a global oil slicks array that would be checked for collisions
        if (!window.oilSlicks) window.oilSlicks = [];
        window.oilSlicks.push(oilSlick);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            const index = window.oilSlicks.indexOf(oilSlick);
            if (index > -1) window.oilSlicks.splice(index, 1);
        }, 15000);
    }
    
    activateShield(kart) {
        kart.hasShield = true;
        kart.shieldTime = 8000; // 8 seconds of protection
        
        // Remove shield after duration
        setTimeout(() => {
            kart.hasShield = false;
            kart.shieldTime = 0;
        }, 8000);
    }
    
    teleportAhead(kart, allKarts) {
        // Find kart ahead of current kart
        const sortedKarts = [...allKarts].sort((a, b) => {
            const aProgress = a.lapsCompleted + (a.lastCheckpoint / 8);
            const bProgress = b.lapsCompleted + (b.lastCheckpoint / 8);
            return bProgress - aProgress;
        });
        
        const currentIndex = sortedKarts.indexOf(kart);
        if (currentIndex > 0) {
            const targetKart = sortedKarts[currentIndex - 1];
            // Teleport slightly behind the target kart
            kart.x = targetKart.x - Math.cos(targetKart.angle) * 50;
            kart.y = targetKart.y - Math.sin(targetKart.angle) * 50;
        }
    }
    
    activateSuperStar(kart) {
        kart.superStar = true;
        kart.originalMaxSpeed = kart.speed;
        kart.speed *= 2; // Double speed
        kart.invulnerable = true; // Can't be affected by other power-ups
        
        // Effect lasts 5 seconds
        setTimeout(() => {
            kart.superStar = false;
            kart.invulnerable = false;
            kart.speed = Math.min(kart.speed, kart.originalMaxSpeed || 5);
        }, 5000);
    }
    
    respawnPowerUp(track) {
        // Only respawn if under the limit
        if (this.powerUps.length >= this.maxPowerUps) {
            return;
        }
        
        const randomPoint = track.trackPoints[Math.floor(Math.random() * track.trackPoints.length)];
        const powerUpType = this.getRandomPowerUpType();
        
        this.powerUps.push(new PowerUp(
            randomPoint.x + (Math.random() - 0.5) * 100,
            randomPoint.y + (Math.random() - 0.5) * 100,
            powerUpType
        ));
    }
}

/**
 * Power-Up Base Class
 */
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 15;
        this.active = true;
        this.animationTime = 0;
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
    }
}

/**
 * Banana Peel Class - Special power-up that causes skidding
 */
class BananaPeel extends PowerUp {
    constructor(x, y) {
        super(x, y, { type: 'banana', name: '🍌' });
        this.lifetime = 10; // Disappears after 10 seconds
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }
}

/**
 * Homing Shell Class - Projectile that targets opponents
 */
class HomingShell extends PowerUp {
    constructor(x, y, target) {
        super(x, y, { type: 'shell', name: '🔴' });
        this.target = target;
        this.speed = 6;
        this.vx = 0;
        this.vy = 0;
        this.lifetime = 8; // Disappears after 8 seconds
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.target && this.active) {
            // Home in on target
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.vx = (dx / distance) * this.speed;
                this.vy = (dy / distance) * this.speed;
                
                this.x += this.vx * deltaTime * 60;
                this.y += this.vy * deltaTime * 60;
                
                // Check collision with target
                if (distance < this.radius + this.target.radius) {
                    this.hitTarget();
                }
            }
        }
        
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }
    
    hitTarget() {
        if (this.target) {
        }
    }
}

/**
 * Oil Slick Class - Causes karts to skid and lose control
 */
class OilSlick {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.active = true;
        this.lifetime = 15000; // 15 seconds
        this.animationTime = 0;
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.lifetime -= deltaTime * 1000;
        
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }
    
    checkCollision(kart) {
        if (!this.active || kart.hasShield || kart.invulnerable) return false;
        
        const dx = kart.x - this.x;
        const dy = kart.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.radius + kart.radius) {
            // Apply slippery effect
            kart.speed *= 0.5;
            kart.angle += (Math.random() - 0.5) * 0.5; // Random skid
            return true;
        }
        return false;
    }
}

/**
 * Particle Class - For visual effects
 */
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.alpha = 1;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        this.alpha = this.life / this.maxLife;
        
        // Add gravity
        this.vy += 200 * deltaTime;
        
        // Air resistance
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    isDead() {
        return this.life <= 0;
    }
}

/**
 * Rendering Engine - Handles all visual rendering
 */
class RenderingEngine {
    constructor(ctx, minimapCtx) {
        this.ctx = ctx;
        this.minimapCtx = minimapCtx;
    }
    
    // Helper function to lighten a color
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const B = (num >> 8 & 0x00FF) + amt;
        const G = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
    }
    
    // Helper function to darken a color
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const B = (num >> 8 & 0x00FF) - amt;
        const G = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R>255?255:R<0?0:R)*0x10000 + (B>255?255:B<0?0:B)*0x100 + (G>255?255:G<0?0:G)).toString(16).slice(1);
    }
    
    renderTrack(track) {
        const ctx = this.ctx;
        
        // Draw track surface with gradient
        const gradient = ctx.createRadialGradient(
            track.width/2, track.height/2, 0,
            track.width/2, track.height/2, Math.max(track.width, track.height)/2
        );
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#1a252f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, track.width, track.height);
        
        // Draw track outer border
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = track.trackWidth + 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        track.trackPoints.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.closePath();
        ctx.stroke();
        
        // Draw track path with enhanced styling
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = track.trackWidth;
        ctx.stroke();
        
        // Draw track inner surface with gradient
        const trackGradient = ctx.createLinearGradient(0, 0, track.width, track.height);
        trackGradient.addColorStop(0, '#95a5a6');
        trackGradient.addColorStop(0.5, '#bdc3c7');
        trackGradient.addColorStop(1, '#95a5a6');
        ctx.strokeStyle = trackGradient;
        ctx.lineWidth = track.trackWidth - 20;
        ctx.stroke();
        
        // Draw lane markings with improved style
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([30, 30]);
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
        
        // Draw checkpoints with glow effect
        track.checkpoints.forEach((checkpoint, index) => {
            // Glow effect
            ctx.shadowColor = index === 0 ? '#e74c3c' : '#f39c12';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(checkpoint.x, checkpoint.y, checkpoint.radius, 0, Math.PI * 2);
            ctx.strokeStyle = index === 0 ? '#e74c3c' : '#f39c12';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.shadowBlur = 0;
        });
        
        // Draw enhanced start/finish line
        const startPoint = track.trackPoints[0];
        const nextPoint = track.trackPoints[1];
        const angle = Math.atan2(nextPoint.y - startPoint.y, nextPoint.x - startPoint.x) + Math.PI/2;
        
        // Create checkered pattern
        ctx.save();
        ctx.translate(startPoint.x, startPoint.y);
        ctx.rotate(angle);
        
        const lineWidth = 100;
        const checkSize = 10;
        
        for (let i = -lineWidth/2; i < lineWidth/2; i += checkSize) {
            for (let j = -5; j < 5; j += checkSize) {
                const isWhite = Math.floor(i/checkSize) % 2 === Math.floor(j/checkSize) % 2;
                ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
                ctx.fillRect(i, j, checkSize, checkSize);
            }
        }
        
        ctx.restore();
    }
    
    renderKarts(karts) {
        const ctx = this.ctx;
        
        karts.forEach(kart => {
            ctx.save();
            ctx.translate(kart.x, kart.y);
            ctx.rotate(kart.angle);
            
            // Draw kart shadow with blur effect
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(-kart.radius + 2, -kart.radius/2 + 2, kart.radius * 2, kart.radius);
            ctx.restore();
            
            // Render custom kart design based on type
            if (kart.isPlayer && kart.design) {
                this.renderCustomKart(ctx, kart);
            } else {
                this.renderStandardKart(ctx, kart);
            }
            
            ctx.restore();
            
            // Draw shield effect (after restore to avoid rotation)
            if (kart.hasShield) {
                ctx.save();
                ctx.translate(kart.x, kart.y);
                
                const time = Date.now() * 0.01;
                ctx.strokeStyle = `rgba(52, 152, 219, ${0.7 + Math.sin(time) * 0.3})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, kart.radius + 8, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.restore();
            }
            
            // Draw super star effect
            if (kart.superStar) {
                ctx.save();
                ctx.translate(kart.x, kart.y);
                
                const time = Date.now() * 0.02;
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2 + time;
                    const x = Math.cos(angle) * (kart.radius + 15);
                    const y = Math.sin(angle) * (kart.radius + 15);
                    
                    ctx.fillStyle = `rgba(241, 196, 15, ${0.8 + Math.sin(time + i) * 0.2})`;
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('⭐', x, y);
                }
                
                ctx.restore();
            }
        });
    }
    
    renderStandardKart(ctx, kart) {
        // Draw kart body with gradient
        const gradient = ctx.createLinearGradient(-kart.radius, -kart.radius/2, kart.radius, kart.radius/2);
        gradient.addColorStop(0, kart.color);
        gradient.addColorStop(0.5, this.lightenColor(kart.color, 20));
        gradient.addColorStop(1, this.darkenColor(kart.color, 20));
        ctx.fillStyle = gradient;
        ctx.fillRect(-kart.radius, -kart.radius/2, kart.radius * 2, kart.radius);
        
        // Draw kart outline
        ctx.strokeStyle = this.darkenColor(kart.color, 40);
        ctx.lineWidth = 2;
        ctx.strokeRect(-kart.radius, -kart.radius/2, kart.radius * 2, kart.radius);
        
        // Draw kart details (spoiler)
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(kart.radius - 4, -kart.radius/3, 6, kart.radius/1.5);
        
        // Draw windshield
        ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
        ctx.fillRect(-kart.radius/3, -kart.radius/3, kart.radius/1.5, kart.radius/1.5);
        
        // Draw wheels
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-kart.radius + 2, -kart.radius/2 - 3, 4, 6);
        ctx.fillRect(-kart.radius + 2, kart.radius/2 - 3, 4, 6);
        ctx.fillRect(kart.radius - 6, -kart.radius/2 - 3, 4, 6);
        ctx.fillRect(kart.radius - 6, kart.radius/2 - 3, 4, 6);
        
        this.renderKartEffects(ctx, kart);
    }
    
    renderCustomKart(ctx, kart) {
        switch(kart.design) {
            case 'furry':
                this.renderFurryKart(ctx, kart);
                break;
            case 'anime':
                this.renderAnimeKart(ctx, kart);
                break;
            case 'cyberpunk':
                this.renderCyberpunkKart(ctx, kart);
                break;
            case 'magical':
                this.renderMagicalKart(ctx, kart);
                break;
            default:
                this.renderStandardKart(ctx, kart);
        }
    }
    
    renderFurryKart(ctx, kart) {
        // Furry-themed kart with ears and tail
        const gradient = ctx.createLinearGradient(-kart.radius, -kart.radius/2, kart.radius, kart.radius/2);
        gradient.addColorStop(0, '#d4a574'); // Sandy fur color
        gradient.addColorStop(0.5, '#f4d5a7');
        gradient.addColorStop(1, '#b8956a');
        ctx.fillStyle = gradient;
        ctx.fillRect(-kart.radius, -kart.radius/2, kart.radius * 2, kart.radius);
        
        // Draw fur texture
        ctx.fillStyle = 'rgba(180, 149, 106, 0.3)';
        for (let i = 0; i < 8; i++) {
            const x = -kart.radius + (Math.random() * kart.radius * 2);
            const y = -kart.radius/2 + (Math.random() * kart.radius);
            ctx.fillRect(x, y, 2, 1);
        }
        
        // Draw ears
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.ellipse(-kart.radius/2, -kart.radius/2 - 5, 4, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(kart.radius/2, -kart.radius/2 - 5, 4, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tail
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.ellipse(kart.radius + 5, 0, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw cute eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(-kart.radius/3, -kart.radius/4, 3, 3);
        ctx.fillRect(kart.radius/3 - 3, -kart.radius/4, 3, 3);
        
        // Draw nose
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.arc(0, -kart.radius/6, 2, 0, Math.PI * 2);
        ctx.fill();
        
        this.renderKartEffects(ctx, kart);
    }
    
    renderAnimeKart(ctx, kart) {
        // Anime-themed kart with kawaii elements
        const gradient = ctx.createLinearGradient(-kart.radius, -kart.radius/2, kart.radius, kart.radius/2);
        gradient.addColorStop(0, '#ffb3d9'); // Pink anime color
        gradient.addColorStop(0.5, '#ffccf0');
        gradient.addColorStop(1, '#ff99cc');
        ctx.fillStyle = gradient;
        ctx.fillRect(-kart.radius, -kart.radius/2, kart.radius * 2, kart.radius);
        
        // Draw anime-style decoration
        ctx.strokeStyle = '#ff1493';
        ctx.lineWidth = 2;
        ctx.strokeRect(-kart.radius, -kart.radius/2, kart.radius * 2, kart.radius);
        
        // Draw large anime eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-kart.radius/3, -kart.radius/4, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(kart.radius/3, -kart.radius/4, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-kart.radius/3, -kart.radius/4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(kart.radius/3, -kart.radius/4, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw shine in eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-kart.radius/3 - 1, -kart.radius/4 - 2, 2, 2);
        ctx.fillRect(kart.radius/3 - 1, -kart.radius/4 - 2, 2, 2);
        
        // Draw cat-like mouth
        ctx.strokeStyle = '#ff1493';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, kart.radius/6, 3, 0, Math.PI);
        ctx.stroke();
        
        // Draw heart decorations
        ctx.fillStyle = '#ff69b4';
        this.drawHeart(ctx, -kart.radius + 5, kart.radius/3, 3);
        this.drawHeart(ctx, kart.radius - 5, kart.radius/3, 3);
        
        this.renderKartEffects(ctx, kart);
    }
    
    renderCyberpunkKart(ctx, kart) {
        // Cyberpunk-themed kart with neon effects
        const gradient = ctx.createLinearGradient(-kart.radius, -kart.radius/2, kart.radius, kart.radius/2);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(0.5, '#34495e');
        gradient.addColorStop(1, '#1a252f');
        ctx.fillStyle = gradient;
        ctx.fillRect(-kart.radius, -kart.radius/2, kart.radius * 2, kart.radius);
        
        // Draw neon trim
        const time = Date.now() * 0.005;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.8 + Math.sin(time) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(-kart.radius, -kart.radius/2, kart.radius * 2, kart.radius);
        
        // Draw circuit patterns
        ctx.strokeStyle = `rgba(57, 255, 20, ${0.6 + Math.sin(time * 1.5) * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-kart.radius + 5, -kart.radius/4);
        ctx.lineTo(kart.radius - 5, -kart.radius/4);
        ctx.moveTo(-kart.radius + 5, kart.radius/4);
        ctx.lineTo(kart.radius - 5, kart.radius/4);
        ctx.stroke();
        
        // Draw glowing core
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
        coreGradient.addColorStop(0, `rgba(255, 0, 255, ${0.8 + Math.sin(time * 2) * 0.2})`);
        coreGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        this.renderKartEffects(ctx, kart);
    }
    
    renderMagicalKart(ctx, kart) {
        // Magical-themed kart with sparkles
        const gradient = ctx.createLinearGradient(-kart.radius, -kart.radius/2, kart.radius, kart.radius/2);
        gradient.addColorStop(0, '#9b59b6');
        gradient.addColorStop(0.5, '#e74c3c');
        gradient.addColorStop(1, '#f39c12');
        ctx.fillStyle = gradient;
        ctx.fillRect(-kart.radius, -kart.radius/2, kart.radius * 2, kart.radius);
        
        // Draw magical outline
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.strokeRect(-kart.radius, -kart.radius/2, kart.radius * 2, kart.radius);
        
        // Draw sparkles
        const time = Date.now() * 0.003;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time;
            const distance = kart.radius * 0.7;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance * 0.5;
            const alpha = 0.5 + Math.sin(time * 3 + i) * 0.3;
            
            ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
            this.drawStar(ctx, x, y, 4, 3, 1.5);
        }
        
        // Draw magical runes
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, kart.radius * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        this.renderKartEffects(ctx, kart);
    }
    
    renderKartEffects(ctx, kart) {
        // Draw enhanced drift smoke
        if (kart.isDrifting && kart.speed > 2) {
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = `rgba(200, 200, 200, ${0.4 - i * 0.08})`;
                ctx.beginPath();
                ctx.arc(-kart.radius - i * 6, (Math.random() - 0.5) * 10, 3 + i * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Speed lines effect when going fast
        if (kart.speed > 8) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${(kart.speed - 8) * 0.1})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-kart.radius - 20 - i * 5, (i - 1) * 3);
                ctx.lineTo(-kart.radius - 30 - i * 5, (i - 1) * 3);
                ctx.stroke();
            }
        }
    }
    
    drawHeart(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 10, size / 10);
        ctx.beginPath();
        ctx.moveTo(0, 3);
        ctx.bezierCurveTo(-5, -2, -10, 1, -10, 5);
        ctx.bezierCurveTo(-10, 9, -5, 13, 0, 15);
        ctx.bezierCurveTo(5, 13, 10, 9, 10, 5);
        ctx.bezierCurveTo(10, 1, 5, -2, 0, 3);
        ctx.fill();
        ctx.restore();
    }
    
    drawStar(ctx, x, y, spikes, outerRadius, innerRadius) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        
        ctx.moveTo(0, -outerRadius);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
            rot += step;
        }
        ctx.lineTo(0, -outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    renderPowerUps(powerUps) {
        const ctx = this.ctx;
        
        powerUps.forEach(powerUp => {
            if (!powerUp.active) return;
            
            ctx.save();
            ctx.translate(powerUp.x, powerUp.y);
            
            // Floating animation
            const floatOffset = Math.sin(powerUp.animationTime * 3) * 5;
            ctx.translate(0, floatOffset);
            
            // Draw power-up background
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, powerUp.radius + 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw power-up icon
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUp.type.name, 0, 0);
            
            ctx.restore();
        });
    }
    
    renderOilSlicks(oilSlicks) {
        const ctx = this.ctx;
        
        oilSlicks.forEach(oilSlick => {
            if (!oilSlick.active) return;
            
            ctx.save();
            ctx.translate(oilSlick.x, oilSlick.y);
            
            // Draw oil slick with gradient
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, oilSlick.radius);
            gradient.addColorStop(0, 'rgba(44, 62, 80, 0.8)');
            gradient.addColorStop(0.7, 'rgba(44, 62, 80, 0.4)');
            gradient.addColorStop(1, 'rgba(44, 62, 80, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, oilSlick.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some shine effect
            const time = oilSlick.animationTime * 2;
            ctx.fillStyle = `rgba(127, 140, 141, ${0.3 + Math.sin(time) * 0.2})`;
            ctx.beginPath();
            ctx.arc(-5, -5, oilSlick.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    renderParticles(particles) {
        const ctx = this.ctx;
        
        particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    renderMinimap(track, karts, camera) {
        const ctx = this.minimapCtx;
        const scale = 0.08;
        
        // Clear minimap
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw track outline
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        track.trackPoints.forEach((point, index) => {
            const x = point.x * scale;
            const y = point.y * scale;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.stroke();
        
        // Draw karts
        karts.forEach(kart => {
            const x = kart.x * scale;
            const y = kart.y * scale;
            
            ctx.fillStyle = kart.isPlayer ? '#e74c3c' : kart.color;
            ctx.beginPath();
            ctx.arc(x, y, kart.isPlayer ? 3 : 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw camera viewport
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            camera.x * scale,
            camera.y * scale,
            150 * scale,
            105 * scale
        );
    }
}

/**
 * Game State Manager - Handles game state transitions and persistence
 */
class GameStateManager {
    constructor() {
        this.state = 'title';
        this.previousState = null;
    }
    
    setState(newState) {
        this.previousState = this.state;
        this.state = newState;
    }
    
    getPreviousState() {
        return this.previousState;
    }
    
    getCurrentState() {
        return this.state;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new BaileyKartGame();
    window.game = game; // Make game accessible for debugging
});