// Interactive CTA Banner with Mouse Tracking and Animations

class CTABanner {
    constructor() {
        this.banner = document.querySelector('.properties-cta-banner');
        this.inner = document.querySelector('.properties-cta-inner');
        this.button = document.querySelector('.properties-cta-button');
        
        if (!this.banner || !this.inner) return;
        
        this.init();
    }
    
    init() {
        // Continuous mouse tracking for interactive gradients
        this.banner.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        // Reset to center when mouse leaves, but keep animations running
        this.banner.addEventListener('mouseleave', () => {
            this.resetToCenter();
        });
        
        // Button hover ripple effect
        if (this.button) {
            this.button.addEventListener('mouseenter', (e) => {
                this.createRipple(e);
            });
        }
        
        // Create floating particles
        this.createParticles();
        
        // Add continuous subtle animation even without mouse
        this.startContinuousAnimation();
    }
    
    handleMouseMove(e) {
        const rect = this.banner.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const moveX = (x - centerX) / centerX;
        const moveY = (y - centerY) / centerY;
        
        // Subtle tilt effect
        const rotateX = moveY * 1;
        const rotateY = moveX * -1;
        
        // Parallax movement
        const translateX = moveX * 4;
        const translateY = moveY * 4;
        
        this.inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateX(${translateX}px) translateY(${translateY}px)`;
        
        // Update gradient position based on mouse
        const gradientX = (x / rect.width) * 100;
        const gradientY = (y / rect.height) * 100;
        
        this.banner.style.setProperty('--mouse-x', `${gradientX}%`);
        this.banner.style.setProperty('--mouse-y', `${gradientY}%`);
    }
    
    resetToCenter() {
        // Smoothly return to center position
        this.inner.style.transform = '';
        this.banner.style.setProperty('--mouse-x', '50%');
        this.banner.style.setProperty('--mouse-y', '50%');
    }
    
    startContinuousAnimation() {
        // Add a subtle continuous movement animation
        let time = 0;
        const animate = () => {
            time += 0.01;
            const x = 50 + Math.sin(time) * 10;
            const y = 50 + Math.cos(time * 0.7) * 10;
            
            // Only update if mouse is not over the banner
            if (!this.banner.matches(':hover')) {
                this.banner.style.setProperty('--mouse-x', `${x}%`);
                this.banner.style.setProperty('--mouse-y', `${y}%`);
            }
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    createRipple(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('cta-ripple');
        
        const rect = this.button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        this.button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    createParticles() {
        const particleCount = 8;
        const container = document.createElement('div');
        container.classList.add('cta-particles');
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('cta-particle');
            
            // Random position and delay
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 3}s`;
            particle.style.animationDuration = `${3 + Math.random() * 2}s`;
            
            container.appendChild(particle);
        }
        
        this.banner.appendChild(container);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CTABanner();
    });
} else {
    new CTABanner();
}

