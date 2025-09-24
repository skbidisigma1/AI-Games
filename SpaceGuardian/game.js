class SpaceGuardianGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'title'; // 'title', 'help', 'playing', 'gameOver'
        
        // Game objects
        this.shield = { x: 400, y: 300, radius: 30, active: false };
        this.station = { x: 400, y: 300, radius: 50, health: 100, maxHealth: 100 };
        this.threats = [];
        this.particles = [];
        
        // Game stats
        this.score = 0;
        this.wave = 1;
        this.energy = 100;
        this.maxEnergy = 100;
        this.startTime = 0;
        
        // Game settings
        this.threatSpawnRate = 0.02;
        this.energyRegenRate = 0.5;
        this.energyUsage = 2;
        
        // Input
        this.mouse = { x: 400, y: 300, pressed: false };
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Button events
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('showHelp').addEventListener('click', () => this.showHelp());
        document.getElementById('startFromHelp').addEventListener('click', () => this.startGame());
        document.getElementById('backToTitle').addEventListener('click', () => this.showTitle());
        document.getElementById('restartGame').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenu').addEventListener('click', () => this.backToMenu());
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.mouse.pressed = true;
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.pressed = false;
            }
        });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.wave = 1;
        this.energy = this.maxEnergy;
        this.station.health = this.station.maxHealth;
        this.threats = [];
        this.particles = [];
        this.startTime = Date.now();
        
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('helpScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.updateHUD();
    }
    
    showHelp() {
        this.gameState = 'help';
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('helpScreen').classList.add('active');
    }
    
    showTitle() {
        this.gameState = 'title';
        document.getElementById('helpScreen').classList.remove('active');
        document.getElementById('titleScreen').classList.add('active');
    }
    
    backToMenu() {
        this.gameState = 'title';
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('titleScreen').classList.add('active');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.update();
            this.render();
        }
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update shield position
        this.shield.x = this.mouse.x;
        this.shield.y = this.mouse.y;
        
        // Handle shield boost
        if (this.mouse.pressed && this.energy > 0) {
            this.shield.active = true;
            this.energy -= this.energyUsage;
            if (this.energy < 0) this.energy = 0;
        } else {
            this.shield.active = false;
        }
        
        // Regenerate energy
        if (!this.shield.active) {
            this.energy += this.energyRegenRate;
            if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
        }
        
        // Spawn threats
        if (Math.random() < this.threatSpawnRate + (this.wave * 0.005)) {
            this.spawnThreat();
        }
        
        // Update threats
        this.updateThreats();
        
        // Update particles
        this.updateParticles();
        
        // Check wave progression
        if (this.threats.length === 0 && Math.random() < 0.01) {
            this.wave++;
            this.threatSpawnRate += 0.002;
        }
        
        // Update score (survival bonus)
        this.score += 0.1;
        
        // Update HUD
        this.updateHUD();
        
        // Check game over
        if (this.station.health <= 0) {
            this.gameOver();
        }
    }
    
    spawnThreat() {
        const side = Math.floor(Math.random() * 4);
        let x, y, vx, vy;
        
        switch (side) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -20;
                vx = (Math.random() - 0.5) * 2;
                vy = Math.random() * 2 + 1;
                break;
            case 1: // Right
                x = this.canvas.width + 20;
                y = Math.random() * this.canvas.height;
                vx = -(Math.random() * 2 + 1);
                vy = (Math.random() - 0.5) * 2;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 20;
                vx = (Math.random() - 0.5) * 2;
                vy = -(Math.random() * 2 + 1);
                break;
            case 3: // Left
                x = -20;
                y = Math.random() * this.canvas.height;
                vx = Math.random() * 2 + 1;
                vy = (Math.random() - 0.5) * 2;
                break;
        }
        
        const type = Math.random() < 0.7 ? 'asteroid' : 'enemy';
        const threat = {
            x, y, vx, vy,
            type,
            radius: type === 'asteroid' ? 8 + Math.random() * 6 : 6 + Math.random() * 4,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            color: type === 'asteroid' ? '#996633' : '#ff4444'
        };
        
        this.threats.push(threat);
    }
    
    updateThreats() {
        for (let i = this.threats.length - 1; i >= 0; i--) {
            const threat = this.threats[i];
            
            // Update position
            threat.x += threat.vx;
            threat.y += threat.vy;
            threat.rotation += threat.rotationSpeed;
            
            // Check collision with shield
            const dx = threat.x - this.shield.x;
            const dy = threat.y - this.shield.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < threat.radius + this.shield.radius) {
                // Deflect threat
                const angle = Math.atan2(dy, dx);
                const speed = Math.sqrt(threat.vx * threat.vx + threat.vy * threat.vy);
                threat.vx = Math.cos(angle) * speed * 1.5;
                threat.vy = Math.sin(angle) * speed * 1.5;
                
                // Add score
                this.score += threat.type === 'asteroid' ? 10 : 25;
                
                // Create particles
                this.createParticles(threat.x, threat.y, threat.color);
                
                // Remove threat after deflection
                this.threats.splice(i, 1);
                continue;
            }
            
            // Check collision with station
            const stationDx = threat.x - this.station.x;
            const stationDy = threat.y - this.station.y;
            const stationDistance = Math.sqrt(stationDx * stationDx + stationDy * stationDy);
            
            if (stationDistance < threat.radius + this.station.radius) {
                // Damage station
                this.station.health -= threat.type === 'asteroid' ? 10 : 20;
                if (this.station.health < 0) this.station.health = 0;
                
                // Create explosion particles
                this.createParticles(threat.x, threat.y, '#ff8844');
                
                this.threats.splice(i, 1);
                continue;
            }
            
            // Remove threats that are off screen
            if (threat.x < -50 || threat.x > this.canvas.width + 50 ||
                threat.y < -50 || threat.y > this.canvas.height + 50) {
                this.threats.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.opacity = particle.life;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                opacity: 1,
                color: color
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars background
        this.drawStars();
        
        // Draw station
        this.drawStation();
        
        // Draw threats
        this.drawThreats();
        
        // Draw particles
        this.drawParticles();
        
        // Draw shield
        this.drawShield();
    }
    
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 73) % this.canvas.height;
            this.ctx.globalAlpha = Math.random() * 0.5 + 0.5;
            this.ctx.fillRect(x, y, 1, 1);
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawStation() {
        const healthRatio = this.station.health / this.station.maxHealth;
        
        // Station glow
        const gradient = this.ctx.createRadialGradient(
            this.station.x, this.station.y, 0,
            this.station.x, this.station.y, this.station.radius + 20
        );
        gradient.addColorStop(0, `rgba(0, 255, 170, ${healthRatio * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 255, 170, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.station.x - this.station.radius - 20,
            this.station.y - this.station.radius - 20,
            (this.station.radius + 20) * 2,
            (this.station.radius + 20) * 2
        );
        
        // Station core
        this.ctx.beginPath();
        this.ctx.arc(this.station.x, this.station.y, this.station.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsl(${120 * healthRatio}, 70%, 50%)`;
        this.ctx.fill();
        
        // Station details
        this.ctx.strokeStyle = '#00ffaa';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw station cross
        this.ctx.beginPath();
        this.ctx.moveTo(this.station.x - 20, this.station.y);
        this.ctx.lineTo(this.station.x + 20, this.station.y);
        this.ctx.moveTo(this.station.x, this.station.y - 20);
        this.ctx.lineTo(this.station.x, this.station.y + 20);
        this.ctx.stroke();
    }
    
    drawThreats() {
        this.threats.forEach(threat => {
            this.ctx.save();
            this.ctx.translate(threat.x, threat.y);
            this.ctx.rotate(threat.rotation);
            
            if (threat.type === 'asteroid') {
                // Draw asteroid
                this.ctx.beginPath();
                this.ctx.arc(0, 0, threat.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = threat.color;
                this.ctx.fill();
                this.ctx.strokeStyle = '#cc8833';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                
                // Add some texture
                this.ctx.fillStyle = '#664422';
                this.ctx.fillRect(-threat.radius/3, -threat.radius/3, threat.radius/6, threat.radius/6);
                this.ctx.fillRect(threat.radius/4, threat.radius/4, threat.radius/8, threat.radius/8);
            } else {
                // Draw enemy
                this.ctx.beginPath();
                this.ctx.moveTo(-threat.radius, -threat.radius/2);
                this.ctx.lineTo(threat.radius, 0);
                this.ctx.lineTo(-threat.radius, threat.radius/2);
                this.ctx.closePath();
                this.ctx.fillStyle = threat.color;
                this.ctx.fill();
                this.ctx.strokeStyle = '#ff6666';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawShield() {
        const effectiveRadius = this.shield.active ? this.shield.radius * 1.2 : this.shield.radius;
        
        // Shield glow
        const gradient = this.ctx.createRadialGradient(
            this.shield.x, this.shield.y, 0,
            this.shield.x, this.shield.y, effectiveRadius + 10
        );
        gradient.addColorStop(0, 'rgba(0, 200, 255, 0.4)');
        gradient.addColorStop(0.7, 'rgba(0, 200, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 200, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.shield.x - effectiveRadius - 10,
            this.shield.y - effectiveRadius - 10,
            (effectiveRadius + 10) * 2,
            (effectiveRadius + 10) * 2
        );
        
        // Shield outline
        this.ctx.beginPath();
        this.ctx.arc(this.shield.x, this.shield.y, effectiveRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.shield.active ? '#00ccff' : '#0088cc';
        this.ctx.lineWidth = this.shield.active ? 3 : 2;
        this.ctx.stroke();
        
        // Energy indicator on shield
        if (this.shield.active) {
            this.ctx.beginPath();
            this.ctx.arc(this.shield.x, this.shield.y, effectiveRadius - 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }
    
    updateHUD() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('wave').textContent = this.wave;
        
        const healthPercentage = Math.max(0, (this.station.health / this.station.maxHealth) * 100);
        document.getElementById('healthFill').style.width = healthPercentage + '%';
        document.getElementById('healthText').textContent = Math.floor(healthPercentage) + '%';
        
        const energyPercentage = (this.energy / this.maxEnergy) * 100;
        document.getElementById('energyFill').style.width = energyPercentage + '%';
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        const survivalTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('survivalTime').textContent = survivalTime + 's';
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new SpaceGuardianGame();
});