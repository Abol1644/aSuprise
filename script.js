// ===== PARTICLE SYSTEM =====
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 30 : 50;
        
        this.resize();
        this.init();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    update() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            particle.opacity += (Math.random() - 0.5) * 0.01;
            particle.opacity = Math.max(0.1, Math.min(0.7, particle.opacity));
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 212, 255, ${particle.opacity})`;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(0, 212, 255, 0.5)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    const opacity = (1 - distance / 150) * 0.2;
                    this.ctx.strokeStyle = `rgba(125, 211, 252, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            });
        });
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// ===== SCENE MANAGER =====
class SceneManager {
    constructor() {
        this.scenes = document.querySelectorAll('.scene');
        this.currentScene = 0;
        this.isTransitioning = false;
        this.blurOverlay = document.querySelector('.blur-overlay');
        
        this.scene4Timer = null;
        
        this.init();
    }
    
    init() {
        document.addEventListener('click', (e) => this.handleInteraction(e));
        document.addEventListener('touchstart', (e) => this.handleInteraction(e), { passive: true });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    handleInteraction(e) {
        if (this.isTransitioning) return;
        
        // Don't advance on Scene 5 (buttons scene)
        if (this.currentScene === 4) return;
        
        // Don't advance on success scene
        if (this.currentScene === 5) return;
        
        if (this.currentScene >= this.scenes.length - 2) return;
        
        this.nextScene();
    }
    
    nextScene() {
        if (this.currentScene >= this.scenes.length - 2) return;
        
        this.isTransitioning = true;
        
        // Activate blur overlay
        this.blurOverlay.classList.add('active');
        
        // Deactivate current scene
        this.scenes[this.currentScene].classList.remove('active');
        
        this.currentScene++;
        
        setTimeout(() => {
            this.scenes[this.currentScene].classList.add('active');
            
            // Remove blur overlay
            setTimeout(() => {
                this.blurOverlay.classList.remove('active');
            }, 300);
            
            this.isTransitioning = false;
            
            // Auto-advance from Scene 4
            if (this.currentScene === 3) {
                this.scene4Timer = setTimeout(() => {
                    this.nextScene();
                }, 4000);
            }
        }, 500);
    }
    
    goToSuccess() {
        this.isTransitioning = true;
        this.blurOverlay.classList.add('active');
        
        this.scenes[this.currentScene].classList.remove('active');
        this.currentScene = 5; // Success scene
        
        setTimeout(() => {
            this.scenes[this.currentScene].classList.add('active');
            setTimeout(() => {
                this.blurOverlay.classList.remove('active');
            }, 300);
            this.isTransitioning = false;
        }, 500);
    }
}

// ===== BUTTON INTERACTIONS =====
class ButtonController {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.yesBtn = document.getElementById('yesBtn');
        this.noBtn = document.getElementById('noBtn');
        this.noBtnPosition = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        // Yes button - go to success
        this.yesBtn.addEventListener('click', () => {
            this.sceneManager.goToSuccess();
        });
        
        // No button - run away from cursor/touch
        this.noBtn.addEventListener('mouseenter', (e) => this.moveNoButton(e));
        this.noBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.moveNoButton(e);
        });
        
        // Also move on click attempt
        this.noBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.moveNoButton(e);
        });
    }
    
    moveNoButton(e) {
        const btn = this.noBtn;
        const container = btn.parentElement;
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        
        // Get available space
        const maxX = window.innerWidth - btnRect.width - 40;
        const maxY = window.innerHeight - btnRect.height - 40;
        
        // Generate random position far from current position
        let newX = Math.random() * maxX;
        let newY = Math.random() * maxY;
        
        // Ensure it's far enough from current position
        const currentX = btnRect.left;
        const currentY = btnRect.top;
        const minDistance = 150;
        
        let attempts = 0;
        while (attempts < 10) {
            const distance = Math.sqrt(
                Math.pow(newX - currentX, 2) + Math.pow(newY - currentY, 2)
            );
            
            if (distance > minDistance) break;
            
            newX = Math.random() * maxX;
            newY = Math.random() * maxY;
            attempts++;
        }
        
        // Apply position with smooth transition
        btn.style.position = 'fixed';
        btn.style.left = `${newX}px`;
        btn.style.top = `${newY}px`;
        btn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Add a little rotation for fun
        const rotation = (Math.random() - 0.5) * 30;
        btn.style.transform = `rotate(${rotation}deg)`;
        
        // Reset transform after animation
        setTimeout(() => {
            btn.style.transform = 'rotate(0deg)';
        }, 300);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particle system
    const canvas = document.getElementById('particles');
    const particleSystem = new ParticleSystem(canvas);
    particleSystem.animate();
    
    // Initialize scene manager
    const sceneManager = new SceneManager();
    
    // Initialize button controller (waits for scene 5)
    const buttonController = new ButtonController(sceneManager);
    
    // Optimize for mobile performance
    if (window.innerWidth < 768) {
        document.body.style.willChange = 'transform';
    }
});

// ===== PERFORMANCE OPTIMIZATION =====
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Handle resize logic
    }, 250);
});

// Prevent scrolling
document.body.style.overflow = 'hidden';
document.documentElement.style.overflow = 'hidden';
document.documentElement.style.scrollBehavior = 'smooth';
