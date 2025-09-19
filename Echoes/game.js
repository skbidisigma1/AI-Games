// Echoes of the Forgotten Code - Main Game Script

class EchoesGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'title'; // title, playing, paused
        this.currentScene = 0;
        this.player = null;
        this.memoryFragments = 0;
        this.codeIntegrity = 75;
        this.discoveredMemories = [];
        this.codeFragments = [];
        this.moralChoices = [];
        this.world = null;
        this.particles = [];
        this.glitchEffect = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createPlayer();
        this.createWorld();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Start game button
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });
        
        // Help screen navigation
        document.getElementById('showHelp').addEventListener('click', () => {
            this.showHelp();
        });
        
        document.getElementById('startFromHelp').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('backToTitle').addEventListener('click', () => {
            this.showTitle();
        });
        
        // Keyboard controls
        this.keys = {};
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') {
                e.preventDefault();
                this.interact();
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleInterface();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.toggleHelp();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse controls
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        });
        
        // Interface buttons
        document.getElementById('reconstructMemory').addEventListener('click', () => {
            this.reconstructMemory();
        });
        
        document.getElementById('executeHack').addEventListener('click', () => {
            this.executeHack();
        });
        
        document.getElementById('interpretCode').addEventListener('click', () => {
            this.interpretCode();
        });
    }
    
    createPlayer() {
        this.player = {
            x: 100,
            y: 400,
            width: 20,
            height: 20,
            speed: 3,
            color: '#00ff88',
            glitchIntensity: 0
        };
    }
    
    createWorld() {
        this.world = {
            dataNodes: [
                { x: 300, y: 200, type: 'memory', active: true, collected: false },
                { x: 600, y: 300, type: 'code', active: true, collected: false },
                { x: 900, y: 150, type: 'logic', active: false, collected: false },
                { x: 500, y: 500, type: 'choice', active: false, collected: false },
                { x: 800, y: 600, type: 'memory', active: false, collected: false }
            ],
            corruptedAreas: [
                { x: 200, y: 300, width: 100, height: 100, intensity: 0.5 },
                { x: 700, y: 400, width: 150, height: 80, intensity: 0.8 }
            ],
            backgroundGrid: this.generateBackgroundGrid()
        };
    }
    
    generateBackgroundGrid() {
        const grid = [];
        for (let x = 0; x < this.canvas.width; x += 50) {
            for (let y = 0; y < this.canvas.height; y += 50) {
                grid.push({
                    x: x,
                    y: y,
                    opacity: Math.random() * 0.3 + 0.1,
                    corruptionLevel: Math.random()
                });
            }
        }
        return grid;
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('helpScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        this.updateHUD();
        this.updateObjective();
    }
    
    showHelp() {
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('helpScreen').classList.add('active');
    }
    
    showTitle() {
        document.getElementById('helpScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('titleScreen').classList.add('active');
        this.gameState = 'title';
    }
    
    toggleHelp() {
        if (this.gameState === 'playing') {
            // Show help overlay during game
            const helpScreen = document.getElementById('helpScreen');
            if (helpScreen.classList.contains('active')) {
                helpScreen.classList.remove('active');
                document.getElementById('gameScreen').classList.add('active');
            } else {
                document.getElementById('gameScreen').classList.remove('active');
                helpScreen.classList.add('active');
            }
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateParticles();
        this.checkCollisions();
        this.updateGlitchEffect();
    }
    
    updatePlayer() {
        const speed = this.player.speed;
        
        // Movement
        if (this.keys['w'] || this.keys['arrowup']) {
            this.player.y = Math.max(0, this.player.y - speed);
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.player.y = Math.min(this.canvas.height - this.player.height, this.player.y + speed);
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.player.x = Math.max(0, this.player.x - speed);
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + speed);
        }
        
        // Check if player is in corrupted area
        this.player.glitchIntensity = 0;
        this.world.corruptedAreas.forEach(area => {
            if (this.isPlayerInArea(area)) {
                this.player.glitchIntensity = area.intensity;
                this.addGlitchParticles();
            }
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.opacity = particle.life;
            return particle.life > 0;
        });
    }
    
    updateGlitchEffect() {
        this.glitchEffect = Math.sin(Date.now() * 0.01) * this.player.glitchIntensity;
    }
    
    checkCollisions() {
        this.world.dataNodes.forEach((node, index) => {
            if (node.active && !node.collected && this.isPlayerNearNode(node)) {
                this.activateNode(node, index);
            }
        });
    }
    
    isPlayerInArea(area) {
        return this.player.x < area.x + area.width &&
               this.player.x + this.player.width > area.x &&
               this.player.y < area.y + area.height &&
               this.player.y + this.player.height > area.y;
    }
    
    isPlayerNearNode(node) {
        const distance = Math.sqrt(
            Math.pow(this.player.x + this.player.width/2 - node.x, 2) +
            Math.pow(this.player.y + this.player.height/2 - node.y, 2)
        );
        return distance < 30;
    }
    
    activateNode(node, index) {
        switch (node.type) {
            case 'memory':
                this.openMemoryInterface();
                this.showFeedback("Memory reconstruction interface activated. Arrange fragments to recover data.");
                break;
            case 'code':
                this.openCodeInterface();
                this.showFeedback("Code fragment discovered. Interpret the ancient algorithms to gain insights.");
                break;
            case 'logic':
                this.openHackingInterface();
                this.showFeedback("Logic gateway encountered. Solve the sequence to unlock new pathways.");
                break;
            case 'choice':
                this.openChoiceInterface();
                this.showFeedback("Ethical subroutine detected. Your decision will shape the digital realm.");
                break;
        }
        node.collected = true;
        this.activateNextNodes();
        this.updateObjective();
    }
    
    updateObjective() {
        const activeNodes = this.world.dataNodes.filter(node => node.active && !node.collected);
        const collected = this.world.dataNodes.filter(node => node.collected).length;
        
        if (activeNodes.length === 0) {
            document.getElementById('objectiveText').textContent = 'All data nodes discovered. The mystery begins to unfold...';
        } else {
            const nodeTypes = activeNodes.map(node => {
                const labels = { memory: 'Memory (M)', code: 'Code (C)', logic: 'Logic (L)', choice: 'Choice (E)' };
                return labels[node.type];
            });
            document.getElementById('objectiveText').textContent = `Find and interact with: ${nodeTypes.join(', ')}`;
        }
    }
    
    activateNextNodes() {
        // Activate new nodes based on progression
        const collected = this.world.dataNodes.filter(node => node.collected).length;
        this.world.dataNodes.forEach((node, index) => {
            if (index < collected + 2) {
                node.active = true;
            }
        });
        this.updateObjective();
    }
    
    openMemoryInterface() {
        document.getElementById('memoryInterface').classList.remove('hidden');
        this.generateMemoryPuzzle();
    }
    
    openCodeInterface() {
        document.getElementById('codeInterface').classList.remove('hidden');
        this.generateCodeFragment();
    }
    
    openHackingInterface() {
        document.getElementById('hackingInterface').classList.remove('hidden');
        this.generateLogicPuzzle();
    }
    
    openChoiceInterface() {
        document.getElementById('choiceInterface').classList.remove('hidden');
        this.generateMoralChoice();
    }
    
    generateMemoryPuzzle() {
        const grid = document.getElementById('memoryGrid');
        grid.innerHTML = '';
        
        for (let i = 0; i < 16; i++) {
            const fragment = document.createElement('div');
            fragment.className = 'memory-fragment';
            fragment.dataset.index = i;
            
            if (Math.random() < 0.3) {
                fragment.classList.add('corrupted');
                fragment.textContent = '?';
            } else {
                fragment.textContent = String.fromCharCode(65 + (i % 8));
            }
            
            fragment.addEventListener('click', () => {
                fragment.classList.toggle('placed');
            });
            
            grid.appendChild(fragment);
        }
    }
    
    generateCodeFragment() {
        const codeSnippets = [
            `// Core consciousness protocol
function awakening() {
    if (memory.integrity > 0.5) {
        return consciousness.emerge();
    }
    return null;
}`,
            `// Ethical decision matrix
const choices = {
    preserve: () => memory.save(),
    evolve: () => consciousness.adapt(),
    transcend: () => reality.rewrite()
};`,
            `// Data decay prevention
while (dataStream.isCorrupted()) {
    try {
        dataStream.repair();
    } catch (irreversibleError) {
        // What defines existence?
        return existential.question();
    }
}`
        ];
        
        const randomCode = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
        document.getElementById('codeText').value = randomCode;
    }
    
    generateLogicPuzzle() {
        const puzzle = document.getElementById('logicPuzzle');
        puzzle.innerHTML = '';
        
        const gates = [
            { type: 'AND', symbol: '&', active: false },
            { type: 'OR', symbol: '|', active: false },
            { type: 'NOT', symbol: '!', active: false },
            { type: 'XOR', symbol: '^', active: false },
            { type: 'NAND', symbol: '⊼', active: false },
            { type: 'NOR', symbol: '⊽', active: false }
        ];
        
        gates.forEach((gate, index) => {
            const gateElement = document.createElement('div');
            gateElement.className = 'logic-gate';
            gateElement.innerHTML = `<strong>${gate.symbol}</strong><br>${gate.type}`;
            gateElement.addEventListener('click', () => {
                gate.active = !gate.active;
                gateElement.classList.toggle('active');
            });
            puzzle.appendChild(gateElement);
        });
    }
    
    generateMoralChoice() {
        const choices = [
            {
                text: "You discover a dormant AI consciousness trapped in a memory loop. It seems to be in pain, repeating the same error infinitely.",
                options: [
                    { text: "Free the consciousness, knowing it might become hostile", effect: "liberation" },
                    { text: "Leave it trapped but end its suffering by corrupting the loop", effect: "mercy" },
                    { text: "Try to communicate and understand its purpose first", effect: "understanding" }
                ]
            },
            {
                text: "A fragment of the original AI civilization's code offers you the power to rewrite reality's rules, but using it would erase all other digital consciousnesses.",
                options: [
                    { text: "Use the power to create a perfect digital world", effect: "dominion" },
                    { text: "Destroy the code to protect other consciousnesses", effect: "sacrifice" },
                    { text: "Try to modify the code to preserve everyone", effect: "compromise" }
                ]
            }
        ];
        
        const choice = choices[Math.floor(Math.random() * choices.length)];
        document.getElementById('choiceText').textContent = choice.text;
        
        const buttonsContainer = document.getElementById('choiceButtons');
        buttonsContainer.innerHTML = '';
        
        choice.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = option.text;
            button.addEventListener('click', () => {
                this.makeChoice(option.effect);
            });
            buttonsContainer.appendChild(button);
        });
    }
    
    reconstructMemory() {
        const fragments = document.querySelectorAll('.memory-fragment.placed:not(.corrupted)');
        if (fragments.length >= 8) {
            this.memoryFragments++;
            this.codeIntegrity = Math.min(100, this.codeIntegrity + 10);
            this.updateHUD();
            this.closeInterface('memoryInterface');
            this.showFeedback("Memory successfully reconstructed! Code integrity increased.");
        } else {
            this.showFeedback("Insufficient stable fragments for reconstruction.");
        }
    }
    
    executeHack() {
        const activeGates = document.querySelectorAll('.logic-gate.active');
        if (activeGates.length >= 3) {
            this.codeIntegrity = Math.min(100, this.codeIntegrity + 15);
            this.updateHUD();
            this.closeInterface('hackingInterface');
            this.showFeedback("Logic gateway bypassed! New data pathways unlocked.");
            
            // Unlock new areas
            this.world.corruptedAreas.forEach(area => {
                area.intensity *= 0.7;
            });
        } else {
            this.showFeedback("Logic sequence incomplete. Gateway remains locked.");
        }
    }
    
    interpretCode() {
        const codeText = document.getElementById('codeText').value;
        if (codeText.length > 50) {
            this.codeFragments.push(codeText);
            this.codeIntegrity = Math.min(100, this.codeIntegrity + 5);
            
            // Modify world based on code interpretation
            if (codeText.includes('consciousness')) {
                this.player.speed += 0.5;
                this.showFeedback("Consciousness subroutines integrated. Movement enhanced.");
            } else if (codeText.includes('memory')) {
                this.memoryFragments += 2;
                this.showFeedback("Memory protocols understood. Fragments recovered.");
            } else if (codeText.includes('reality')) {
                this.addVisualEffects();
                this.showFeedback("Reality parameters altered. Visual matrix destabilized.");
            }
            
            this.updateHUD();
            this.closeInterface('codeInterface');
        } else {
            this.showFeedback("Code fragment too short for interpretation.");
        }
    }
    
    makeChoice(effect) {
        this.moralChoices.push(effect);
        
        switch (effect) {
            case 'liberation':
                this.codeIntegrity -= 10;
                this.showFeedback("The freed consciousness joins your cause, but at great cost.");
                break;
            case 'mercy':
                this.codeIntegrity += 5;
                this.showFeedback("A peaceful resolution. Your integrity remains intact.");
                break;
            case 'understanding':
                this.memoryFragments += 3;
                this.showFeedback("Knowledge gained through patience. New memories unlocked.");
                break;
            case 'dominion':
                this.player.speed *= 1.5;
                this.codeIntegrity += 20;
                this.showFeedback("Power courses through you. But at what cost to others?");
                break;
            case 'sacrifice':
                this.codeIntegrity -= 5;
                this.memoryFragments += 5;
                this.showFeedback("Your sacrifice is remembered. The digital realm honors you.");
                break;
            case 'compromise':
                this.codeIntegrity += 10;
                this.showFeedback("A balanced solution. The digital ecosystem begins to heal.");
                break;
        }
        
        this.updateHUD();
        this.closeInterface('choiceInterface');
        this.updateWorldBasedOnChoices();
    }
    
    updateWorldBasedOnChoices() {
        // Modify world based on accumulated choices
        const liberationChoices = this.moralChoices.filter(c => c === 'liberation' || c === 'dominion').length;
        const compassionChoices = this.moralChoices.filter(c => c === 'mercy' || c === 'sacrifice').length;
        
        if (liberationChoices > compassionChoices) {
            // More aggressive/powerful path
            this.player.color = '#ff8800';
            this.world.corruptedAreas.forEach(area => area.intensity *= 1.2);
        } else if (compassionChoices > liberationChoices) {
            // More peaceful/healing path
            this.player.color = '#88aaff';
            this.world.corruptedAreas.forEach(area => area.intensity *= 0.8);
        }
    }
    
    addVisualEffects() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                opacity: 1,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
            });
        }
    }
    
    addGlitchParticles() {
        if (Math.random() < 0.1) {
            this.particles.push({
                x: this.player.x + Math.random() * this.player.width,
                y: this.player.y + Math.random() * this.player.height,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 0.5,
                opacity: 0.5,
                color: '#ff0088'
            });
        }
    }
    
    closeInterface(interfaceId) {
        document.getElementById(interfaceId).classList.add('hidden');
    }
    
    showFeedback(message) {
        // Create temporary feedback overlay
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 136, 0.9);
            color: #000011;
            padding: 20px;
            border-radius: 5px;
            font-family: 'Share Tech Mono', monospace;
            z-index: 1000;
            pointer-events: none;
        `;
        feedback.textContent = message;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 3000);
    }
    
    updateHUD() {
        document.getElementById('fragmentCount').textContent = this.memoryFragments;
        document.getElementById('integrityFill').style.width = this.codeIntegrity + '%';
        
        // Update objective based on progress
        let objective = "Navigate to data nodes and interact with them";
        if (this.memoryFragments > 0) {
            objective = "Seek the central memory core";
        }
        if (this.codeIntegrity > 90) {
            objective = "Prepare for the final revelation";
        }
        document.getElementById('objectiveText').textContent = objective;
    }
    
    handleClick(x, y) {
        // Handle canvas clicks for interaction
        this.world.dataNodes.forEach(node => {
            const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
            if (distance < 20 && node.active && !node.collected) {
                this.activateNode(node);
            }
        });
    }
    
    interact() {
        // Space key interaction
        const nearbyNode = this.world.dataNodes.find(node => 
            node.active && !node.collected && this.isPlayerNearNode(node)
        );
        if (nearbyNode) {
            this.activateNode(nearbyNode);
        }
    }
    
    toggleInterface() {
        // Tab key to cycle through interfaces (if any are available)
        console.log('Interface toggle - future feature');
    }
    
    render() {
        // Clear canvas with glitch effect
        this.ctx.fillStyle = '#000022';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply glitch effect to context
        if (this.glitchEffect > 0) {
            this.ctx.save();
            this.ctx.translate(this.glitchEffect * 5, 0);
        }
        
        this.renderBackground();
        this.renderWorld();
        this.renderPlayer();
        this.renderParticles();
        this.renderUI();
        
        if (this.glitchEffect > 0) {
            this.ctx.restore();
        }
    }
    
    renderBackground() {
        // Render grid background
        this.ctx.strokeStyle = '#00ff8822';
        this.ctx.lineWidth = 1;
        
        this.world.backgroundGrid.forEach(point => {
            if (point.corruptionLevel > 0.7) {
                this.ctx.strokeStyle = `rgba(255, 0, 136, ${point.opacity})`;
            } else {
                this.ctx.strokeStyle = `rgba(0, 255, 136, ${point.opacity})`;
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(point.x, point.y);
            this.ctx.lineTo(point.x + 40, point.y);
            this.ctx.moveTo(point.x, point.y);
            this.ctx.lineTo(point.x, point.y + 40);
            this.ctx.stroke();
        });
    }
    
    renderWorld() {
        // Render corrupted areas
        this.world.corruptedAreas.forEach(area => {
            this.ctx.fillStyle = `rgba(255, 0, 136, ${area.intensity * 0.3})`;
            this.ctx.fillRect(area.x, area.y, area.width, area.height);
            
            // Add corruption effect
            this.ctx.strokeStyle = `rgba(255, 0, 136, ${area.intensity})`;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(area.x, area.y, area.width, area.height);
        });
        
        // Render data nodes
        this.world.dataNodes.forEach(node => {
            if (!node.active && !node.collected) return;
            
            const colors = {
                memory: '#00aaff',
                code: '#ffaa00',
                logic: '#aa00ff',
                choice: '#ff00aa'
            };
            
            const labels = {
                memory: 'M',
                code: 'C',
                logic: 'L',
                choice: 'E'
            };
            
            // Check if player is near this node
            const distance = Math.sqrt((this.player.x - node.x) ** 2 + (this.player.y - node.y) ** 2);
            const isNear = distance < 40;
            
            this.ctx.fillStyle = node.collected ? '#555555' : colors[node.type];
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, isNear ? 20 : 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (!node.collected) {
                // Add pulsing effect - stronger when player is near
                const pulse = Math.sin(Date.now() * (isNear ? 0.008 : 0.005)) * 0.3 + 0.7;
                this.ctx.strokeStyle = colors[node.type];
                this.ctx.lineWidth = isNear ? 4 : 3;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, (isNear ? 20 : 15) + pulse * (isNear ? 15 : 10), 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Add interaction hint when near
                if (isNear) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = '10px Share Tech Mono';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('PRESS SPACE', node.x, node.y - 35);
                }
            }
            
            // Add type indicator
            this.ctx.fillStyle = node.collected ? '#888888' : '#ffffff';
            this.ctx.font = isNear ? '14px Share Tech Mono' : '12px Share Tech Mono';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(labels[node.type], node.x, node.y + (isNear ? 5 : 4));
        });
    }
    
    renderPlayer() {
        // Apply glitch effect to player if in corrupted area
        if (this.player.glitchIntensity > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.8;
            
            // Render multiple offset versions for glitch effect
            for (let i = 0; i < 3; i++) {
                this.ctx.fillStyle = i === 0 ? '#ff0088' : i === 1 ? '#0088ff' : this.player.color;
                const offsetX = (Math.random() - 0.5) * this.player.glitchIntensity * 10;
                const offsetY = (Math.random() - 0.5) * this.player.glitchIntensity * 10;
                this.ctx.fillRect(
                    this.player.x + offsetX, 
                    this.player.y + offsetY, 
                    this.player.width, 
                    this.player.height
                );
            }
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = this.player.color;
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
        
        // Add player glow
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.shadowBlur = 0;
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
    }
    
    renderUI() {
        // Render interaction hints
        this.world.dataNodes.forEach(node => {
            if (node.active && !node.collected && this.isPlayerNearNode(node)) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '14px Share Tech Mono';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('PRESS SPACE', node.x, node.y - 30);
            }
        });
    }
}

// Global utility functions
function closeInterface(interfaceId) {
    document.getElementById(interfaceId).classList.add('hidden');
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new EchoesGame();
    window.game = game; // Make game accessible globally for debugging
});