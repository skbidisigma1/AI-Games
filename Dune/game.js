class DuneGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'title'; // 'title', 'playing', 'gameOver', 'victory'
        
        // Player properties
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: 15,
            speed: 4,
            health: 100,
            maxHealth: 100,
            color: '#4ECDC4',
            angle: 0
        };
        
        // Game state
        this.score = 0;
        this.wave = 1;
        this.startTime = 0;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.healthPacks = [];
        this.particles = [];
        
        // Input handling
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false
        };
        
        // Game settings
        this.maxEnemies = 5;
        this.enemySpawnTimer = 0;
        this.healthPackSpawnTimer = 0;
        this.lastShot = 0;
        this.shootCooldown = 150; // milliseconds
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Start game button
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart game buttons
        document.getElementById('restartGame').addEventListener('click', () => {
            this.startGame();
        });
        
        // Back to menu buttons
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.backToMenu();
        });
        
        document.getElementById('backToMenuVictory').addEventListener('click', () => {
            this.backToMenu();
        });
        
        // Next wave button
        document.getElementById('nextWave').addEventListener('click', () => {
            this.nextWave();
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse input
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            
            // Calculate player angle based on mouse position
            if (this.gameState === 'playing') {
                const dx = this.mouse.x - this.player.x;
                const dy = this.mouse.y - this.player.y;
                this.player.angle = Math.atan2(dy, dx);
            }
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.mouse.isDown = true;
                if (this.gameState === 'playing') {
                    this.shoot();
                }
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.isDown = false;
            }
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.wave = 1;
        this.startTime = Date.now();
        
        // Reset player
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
        this.player.health = this.player.maxHealth;
        
        // Clear arrays
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.healthPacks = [];
        this.particles = [];
        
        // Reset timers
        this.enemySpawnTimer = 0;
        this.healthPackSpawnTimer = 0;
        this.lastShot = 0;
        
        // Spawn initial enemies
        this.spawnWave();
        
        // Update UI
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('victory').classList.add('hidden');
        
        this.updateHUD();
    }
    
    spawnWave() {
        const enemyCount = Math.min(this.maxEnemies + Math.floor(this.wave / 2), 10);
        
        for (let i = 0; i < enemyCount; i++) {
            this.spawnEnemy();
        }
    }
    
    spawnEnemy() {
        let x, y;
        const margin = 50;
        
        // Spawn enemies at the edges of the screen
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -margin : this.canvas.width + margin;
            y = Math.random() * this.canvas.height;
        } else {
            x = Math.random() * this.canvas.width;
            y = Math.random() < 0.5 ? -margin : this.canvas.height + margin;
        }
        
        const enemy = {
            x: x,
            y: y,
            size: 12,
            speed: 1 + Math.random() * 0.5, // Slow and inconsistent speed
            health: 50 + this.wave * 10,
            maxHealth: 50 + this.wave * 10,
            color: '#FF6B6B',
            angle: 0,
            lastShot: 0,
            shootCooldown: 2000 + Math.random() * 3000, // Very slow shooting
            confusionTimer: 0,
            targetX: this.player.x,
            targetY: this.player.y,
            updateTargetTimer: 0
        };
        
        this.enemies.push(enemy);
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.shootCooldown) return;
        
        this.lastShot = now;
        
        const bullet = {
            x: this.player.x,
            y: this.player.y,
            size: 4,
            speed: 8,
            angle: this.player.angle,
            life: 100,
            color: '#FFE66D'
        };
        
        this.bullets.push(bullet);
        this.playSound('shootSound');
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateEnemyBullets();
        this.updateHealthPacks();
        this.updateParticles();
        this.checkCollisions();
        this.spawnHealthPacks();
        
        // Check win/lose conditions
        if (this.player.health <= 0) {
            this.gameOver();
        } else if (this.enemies.length === 0) {
            this.waveComplete();
        }
        
        this.updateHUD();
    }
    
    updatePlayer() {
        // Handle WASD movement
        if (this.keys['w'] || this.keys['arrowup']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.player.y += this.player.speed;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.player.x += this.player.speed;
        }
        
        // Keep player in bounds
        this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x));
        this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y));
        
        // Continuous shooting when mouse is held down
        if (this.mouse.isDown) {
            this.shoot();
        }
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            bullet.life--;
            
            // Remove bullets that are off-screen or expired
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height || 
                bullet.life <= 0) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateEnemies() {
        const now = Date.now();
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Horrible AI: Update target position occasionally and inaccurately
            enemy.updateTargetTimer++;
            if (enemy.updateTargetTimer > 120) { // Update every 2 seconds
                enemy.updateTargetTimer = 0;
                // Add random inaccuracy to target
                enemy.targetX = this.player.x + (Math.random() - 0.5) * 200;
                enemy.targetY = this.player.y + (Math.random() - 0.5) * 200;
            }
            
            // Move towards (inaccurate) target position
            const dx = enemy.targetX - enemy.x;
            const dy = enemy.targetY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
            
            // Add confusion - sometimes move in wrong direction
            enemy.confusionTimer++;
            if (enemy.confusionTimer > 180 && Math.random() < 0.3) { // 30% chance every 3 seconds
                enemy.confusionTimer = 0;
                enemy.x += (Math.random() - 0.5) * 60; // Random movement
                enemy.y += (Math.random() - 0.5) * 60;
            }
            
            // Calculate angle for shooting (also inaccurate)
            const actualDx = this.player.x - enemy.x;
            const actualDy = this.player.y - enemy.y;
            enemy.angle = Math.atan2(actualDy, actualDx);
            
            // Horrible shooting - very infrequent and inaccurate
            if (now - enemy.lastShot > enemy.shootCooldown && distance < 250) {
                enemy.lastShot = now;
                enemy.shootCooldown = 2000 + Math.random() * 4000; // Random cooldown
                
                // Shoot with terrible accuracy
                const inaccuracy = (Math.random() - 0.5) * 1.5; // Large inaccuracy
                const bulletAngle = enemy.angle + inaccuracy;
                
                const enemyBullet = {
                    x: enemy.x,
                    y: enemy.y,
                    size: 3,
                    speed: 3, // Slow bullets
                    angle: bulletAngle,
                    life: 80,
                    color: '#FF8C42'
                };
                
                this.enemyBullets.push(enemyBullet);
            }
            
            // Keep enemies loosely in bounds
            if (enemy.x < -100 || enemy.x > this.canvas.width + 100 || 
                enemy.y < -100 || enemy.y > this.canvas.height + 100) {
                enemy.x = Math.max(-50, Math.min(this.canvas.width + 50, enemy.x));
                enemy.y = Math.max(-50, Math.min(this.canvas.height + 50, enemy.y));
            }
        }
    }
    
    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            bullet.life--;
            
            // Remove bullets that are off-screen or expired
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height || 
                bullet.life <= 0) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }
    
    updateHealthPacks() {
        for (let i = this.healthPacks.length - 1; i >= 0; i--) {
            const pack = this.healthPacks[i];
            pack.life--;
            
            // Pulse effect
            pack.pulse += 0.1;
            
            if (pack.life <= 0) {
                this.healthPacks.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.isColliding(bullet, enemy)) {
                    // Damage enemy
                    enemy.health -= 25;
                    this.createParticles(enemy.x, enemy.y, '#FF6B6B');
                    this.bullets.splice(i, 1);
                    this.playSound('hitSound');
                    
                    if (enemy.health <= 0) {
                        this.enemies.splice(j, 1);
                        this.score += 100;
                        this.createParticles(enemy.x, enemy.y, '#FFE66D');
                        this.playSound('enemyDeathSound');
                    }
                    break;
                }
            }
        }
        
        // Enemy bullets vs player
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            if (this.isColliding(bullet, this.player)) {
                this.player.health -= 15;
                this.createParticles(this.player.x, this.player.y, '#FF6B6B');
                this.enemyBullets.splice(i, 1);
                this.playSound('hitSound');
            }
        }
        
        // Player vs health packs
        for (let i = this.healthPacks.length - 1; i >= 0; i--) {
            const pack = this.healthPacks[i];
            
            if (this.isColliding(this.player, pack)) {
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
                this.healthPacks.splice(i, 1);
                this.createParticles(pack.x, pack.y, '#4ECDC4');
                this.playSound('healthPickupSound');
            }
        }
    }
    
    isColliding(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < obj1.size + obj2.size;
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                maxLife: 30,
                color: color,
                alpha: 1,
                size: 2 + Math.random() * 3
            });
        }
    }
    
    spawnHealthPacks() {
        this.healthPackSpawnTimer++;
        
        if (this.healthPackSpawnTimer > 600 && this.healthPacks.length < 2) { // Every 10 seconds
            this.healthPackSpawnTimer = 0;
            
            const pack = {
                x: 50 + Math.random() * (this.canvas.width - 100),
                y: 50 + Math.random() * (this.canvas.height - 100),
                size: 8,
                life: 600, // 10 seconds
                pulse: 0,
                color: '#4ECDC4'
            };
            
            this.healthPacks.push(pack);
        }
    }
    
    waveComplete() {
        this.gameState = 'victory';
        document.getElementById('victory').classList.remove('hidden');
        document.getElementById('waveScore').textContent = `Wave ${this.wave} Score: ${this.score}`;
    }
    
    nextWave() {
        this.wave++;
        this.gameState = 'playing';
        document.getElementById('victory').classList.add('hidden');
        this.spawnWave();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        const survivalTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
        document.getElementById('survivalTime').textContent = `Survival Time: ${survivalTime}s`;
    }
    
    backToMenu() {
        this.gameState = 'title';
        document.getElementById('titleScreen').classList.add('active');
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('victory').classList.add('hidden');
    }
    
    updateHUD() {
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthFill').style.width = healthPercent + '%';
        document.getElementById('healthText').textContent = Math.max(0, Math.floor(this.player.health));
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('enemyCount').textContent = this.enemies.length;
    }
    
    playSound(soundId) {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {}); // Ignore audio errors
        }
    }
    
    render() {
        // Clear canvas with desert background
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2
        );
        gradient.addColorStop(0, '#F5DEB3');
        gradient.addColorStop(1, '#DEB887');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sand texture
        this.ctx.fillStyle = 'rgba(222, 184, 135, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 31) % this.canvas.width;
            const y = (i * 17) % this.canvas.height;
            this.ctx.fillRect(x, y, 2, 2);
        }
        
        if (this.gameState === 'playing') {
            this.renderHealthPacks();
            this.renderEnemies();
            this.renderPlayer();
            this.renderBullets();
            this.renderEnemyBullets();
            this.renderParticles();
        }
    }
    
    renderPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);
        
        // Player body
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(-this.player.size, -this.player.size, this.player.size * 2, this.player.size * 2);
        
        // Player gun barrel
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.fillRect(this.player.size, -2, 15, 4);
        
        this.ctx.restore();
        
        // Health bar above player
        const barWidth = 30;
        const barHeight = 4;
        const healthPercent = this.player.health / this.player.maxHealth;
        
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillRect(this.player.x - barWidth/2, this.player.y - this.player.size - 10, barWidth, barHeight);
        
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillRect(this.player.x - barWidth/2, this.player.y - this.player.size - 10, barWidth * healthPercent, barHeight);
    }
    
    renderEnemies() {
        for (const enemy of this.enemies) {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            this.ctx.rotate(enemy.angle);
            
            // Enemy body
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(-enemy.size, -enemy.size, enemy.size * 2, enemy.size * 2);
            
            // Enemy gun barrel
            this.ctx.fillStyle = '#8B0000';
            this.ctx.fillRect(enemy.size, -1, 10, 2);
            
            this.ctx.restore();
            
            // Health bar above enemy
            const barWidth = 24;
            const barHeight = 3;
            const healthPercent = enemy.health / enemy.maxHealth;
            
            this.ctx.fillStyle = '#8B0000';
            this.ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 8, barWidth, barHeight);
            
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 8, barWidth * healthPercent, barHeight);
        }
    }
    
    renderBullets() {
        for (const bullet of this.bullets) {
            this.ctx.fillStyle = bullet.color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderEnemyBullets() {
        for (const bullet of this.enemyBullets) {
            this.ctx.fillStyle = bullet.color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderHealthPacks() {
        for (const pack of this.healthPacks) {
            const size = pack.size + Math.sin(pack.pulse) * 2;
            
            this.ctx.fillStyle = pack.color;
            this.ctx.fillRect(pack.x - size, pack.y - size, size * 2, size * 2);
            
            // Cross symbol
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(pack.x - 1, pack.y - size + 2, 2, size * 2 - 4);
            this.ctx.fillRect(pack.x - size + 2, pack.y - 1, size * 2 - 4, 2);
        }
    }
    
    renderParticles() {
        for (const particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
            this.ctx.restore();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new DuneGame();
});