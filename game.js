class SnakeGame {
    constructor() {
        this.boardSize = 20;
        this.tileSize = 30;
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.food = this.generateFood();
        this.score = 0;
        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.gameLoop = null;
        this.speed = 100;
        this.lastRenderTime = 0;

        this.gameMusic = document.getElementById('gameMusic');
        this.foodSound = document.getElementById('foodSound');
        this.gameOverSound = document.getElementById('gameOverSound');
        this.musicButton = document.getElementById('musicToggle');
        this.isMuted = false;
        
        this.isGameOver = false;
        
        this.foodEatenCount = 0;
        this.fireworksActive = false; 
        
        this.achievements = [
            { score: 30, message: "Excellent!", class: "achievement-excellent" },
            { score: 50, message: "Awesome!", class: "achievement-awesome" },
            { score: 80, message: "Amazing!", class: "achievement-amazing" },
            { score: 100, message: "Fantastic!", class: "achievement-fantastic" }
        ];
        this.lastAchievementIndex = 0;
        
        this.setupMusicSystem();
        this.setupEventListeners();
        this.start();

        this.backgroundEffects = new BackgroundEffects();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const key = e.key;
            const newDirections = {
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
                'ArrowRight': 'right'
            };

            if (key in newDirections) {
                e.preventDefault();
                const newDir = newDirections[key];
                const opposites = {
                    'up': 'down',
                    'down': 'up',
                    'left': 'right',
                    'right': 'left'
                };
                
                if (opposites[newDir] !== this.direction) {
                    this.nextDirection = newDir;
                }
            }
        });
    }

    setupMusicSystem() {
        this.gameMusic.load();
        this.foodSound.load();
        this.gameOverSound.load();

        this.gameMusic.volume = 0.3;
        this.foodSound.volume = 0.4;
        this.gameOverSound.volume = 0.5;


        this.musicButton.addEventListener('click', () => {
            if (this.isMuted) {
                this.gameMusic.play().catch(err => console.log('Müzik başlatılamadı:', err));
                this.musicButton.querySelector('.music-icon').textContent = '🔊';
                this.musicButton.classList.remove('muted');
            } else {
                this.gameMusic.pause();
                this.musicButton.querySelector('.music-icon').textContent = '🔈';
                this.musicButton.classList.add('muted');
            }
            this.isMuted = !this.isMuted;
        });

        const startMusic = () => {
            if (!this.isMuted) {
                this.gameMusic.play().catch(err => console.log('Müzik başlatılamadı:', err));
            }
            document.removeEventListener('click', startMusic);
            document.removeEventListener('keydown', startMusic);
        };

        document.addEventListener('click', startMusic);
        document.addEventListener('keydown', startMusic);
    }

    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
        } while (this.snake.some(segment => 
            segment.x === newFood.x && segment.y === newFood.y));
        return newFood;
    }

    update(currentTime) {
        if (this.isGameOver) return;

        window.requestAnimationFrame((time) => this.update(time));

        const secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
        if (secondsSinceLastRender < 1 / (1000 / this.speed)) return;

        this.lastRenderTime = currentTime;

        this.direction = this.nextDirection;
        const head = {...this.snake[0]};

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.scoreElement.textContent = this.score;
            this.food = this.generateFood();
            this.speed = Math.max(50, this.speed - 1);
            
            this.foodEatenCount++;

            this.checkAchievements();

            if (this.foodEatenCount % 3 === 0) {
                this.startFireworks();
            }

            if (!this.isMuted) {
                this.foodSound.currentTime = 0;
                this.foodSound.play();
            }
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    checkCollision(head) {
        if (head.x < 0 || head.x >= this.boardSize || 
            head.y < 0 || head.y >= this.boardSize) {
            return true;
        }

        return this.snake.some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }

    draw() {
        this.gameBoard.innerHTML = '';

        this.snake.forEach((segment, index) => {
            const element = document.createElement('div');
            element.className = `snake-segment ${index === 0 ? 'snake-head' : 'snake-body'}`;
            element.style.left = `${segment.x * this.tileSize}px`;
            element.style.top = `${segment.y * this.tileSize}px`;
            this.gameBoard.appendChild(element);
        });

        const foodElement = document.createElement('div');
        foodElement.className = 'food';
        foodElement.style.left = `${this.food.x * this.tileSize}px`;
        foodElement.style.top = `${this.food.y * this.tileSize}px`;
        this.gameBoard.appendChild(foodElement);
    }

    start() {
        window.requestAnimationFrame((time) => this.update(time));
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.startFireworks();
            }, i * 500);
        }

        if (!this.isMuted) {
            this.gameMusic.pause();
            this.gameOverSound.currentTime = 0;
            this.gameOverSound.play()
        }
        
        setTimeout(() => {
            alert(`Game Over!: ${this.score}`);
            location.reload();
        }, 2000); 
    }

    createFirework(x, y) {
        const colors = ['red', 'blue', 'green', 'purple', 'yellow'];
        const firework = document.createElement('div');
        firework.className = `firework firework-${colors[Math.floor(Math.random() * colors.length)]}`;
        firework.style.left = `${x}px`;
        firework.style.top = `${y}px`;
        document.body.appendChild(firework);
        setTimeout(() => {
            firework.remove();
        }, 1000);
    }

    startFireworks() {
        if (this.fireworksActive) return;
        this.fireworksActive = true;

        const createRandomFirework = () => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            this.createFirework(x, y);
        };

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                createRandomFirework();
            }, i * 200); 
        }

        setTimeout(() => {
            this.fireworksActive = false;
        }, 1500);
    }


    showAchievement(message, className) {
        const achievementDiv = document.createElement('div');
        achievementDiv.className = `achievement-message ${className}`;
        achievementDiv.textContent = message;
        document.body.appendChild(achievementDiv);

        setTimeout(() => {
            achievementDiv.remove();
        }, 3000);
    }

    checkAchievements() {
        for (let i = this.lastAchievementIndex; i < this.achievements.length; i++) {
            const achievement = this.achievements[i];
            if (this.score >= achievement.score) {
                this.showAchievement(achievement.message, achievement.class);
                this.lastAchievementIndex = i + 1;

                this.startFireworks();
            }
        }
    }
}

class BackgroundEffects {
    constructor() {
        this.canvas = document.getElementById('backgroundCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.rings = [];
        
        this.resizeCanvas();
        this.createParticles();
        this.createRings();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: Math.random() * 2 - 1,
                speedY: Math.random() * 2 - 1,
                hue: Math.random() * 60 - 30 
            });
        }
    }

    createRings() {
        for (let i = 0; i < 5; i++) {
            const ring = document.createElement('div');
            ring.className = 'light-ring';
            ring.style.left = `${Math.random() * 100}%`;
            ring.style.top = `${Math.random() * 100}%`;
            ring.style.width = `${100 + i * 50}px`;
            ring.style.height = `${100 + i * 50}px`;
            ring.style.borderColor = `hsla(${Math.random() * 360}, 50%, 50%, 0.1)`;
            ring.style.animationDuration = `${10 + i * 5}s`;
            document.body.appendChild(ring);
            this.rings.push(ring);
        }
    }

    drawParticle(particle) {
        this.ctx.beginPath();
        const gradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, `hsla(${180 + particle.hue}, 50%, 50%, 0.8)`);
        gradient.addColorStop(1, `hsla(${180 + particle.hue}, 50%, 50%, 0)`);
        this.ctx.fillStyle = gradient;
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    updateParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            if (particle.x < 0 || particle.x > this.canvas.width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.speedY *= -1;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateParticles();
        this.particles.forEach(particle => this.drawParticle(particle));
        requestAnimationFrame(() => this.animate());
    }
}

window.onload = () => new SnakeGame(); 